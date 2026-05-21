import "dotenv/config";
import {
  createPublicClient,
  getAddress,
  http,
  parseAbiItem,
  type Address,
} from "viem";
import { baseSepolia, sepolia } from "viem/chains";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServiceClient } from "@/lib/supabase/server.js";
import {
  createSupabaseIndexerRepository,
  getCollectionSourceKeys,
  normalizeAddress,
} from "@/lib/supabase/indexerRepository.js";
import { getIndexerNetworkConfig } from "./config.js";
import { readDeploymentRecord } from "./storage.js";
import type { CollectionKey, IndexerNetworkConfig } from "./types.js";

const TRANSFER_EVENT = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
);

type TransferLog = {
  args: {
    from?: Address;
    to?: Address;
    tokenId?: bigint;
  };
  transactionHash: `0x${string}` | null;
  logIndex: number;
  blockNumber: bigint;
};

type BlockCacheValue = {
  hash: `0x${string}` | null;
  timestampIso: string;
};

type IndexerPublicClient = {
  getBlockNumber: () => Promise<bigint>;
  getBlock: (args: { blockNumber: bigint }) => Promise<{
    hash: `0x${string}` | null;
    timestamp: bigint;
  }>;
  getLogs: (args: {
    address: Address;
    event: typeof TRANSFER_EVENT;
    fromBlock: bigint;
    toBlock: bigint;
  }) => Promise<TransferLog[]>;
};

type TransferEventRow = {
  event_key: string;
  chain_key: string;
  chain_id: number;
  collection_key: CollectionKey;
  collection_address: string;
  token_id: string;
  from_address: string;
  to_address: string;
  tx_hash: string;
  log_index: number;
  block_number: number;
  block_timestamp: string;
};

type BlockTimestampRow = {
  chain_key: string;
  block_number: number;
  block_hash: string | null;
  block_timestamp: string;
};

function getViemChain(chainId: number) {
  if (chainId === baseSepolia.id) {
    return baseSepolia;
  }

  if (chainId === sepolia.id) {
    return sepolia;
  }

  throw new Error(`Unsupported chainId for DB transfer sync: ${chainId}`);
}

function parsePositiveInteger(value: string | undefined, fallback: number) {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

function getRequestDelayMs() {
  return parsePositiveInteger(process.env.INDEXER_REQUEST_DELAY_MS, 250);
}

function getConfirmationDelay() {
  return BigInt(
    parsePositiveInteger(process.env.INDEXER_CONFIRMATION_DELAY, 20),
  );
}

function getIndexerToBlockEnv(config: IndexerNetworkConfig) {
  if (config.key === "baseSepolia") {
    return process.env.BASE_SEPOLIA_INDEXER_TO_BLOCK;
  }

  if (config.key === "ethereumSepolia") {
    return process.env.ETHEREUM_SEPOLIA_INDEXER_TO_BLOCK;
  }

  return undefined;
}

function getRequestedToBlock({
  config,
  latestSafeBlock,
}: {
  config: IndexerNetworkConfig;
  latestSafeBlock: bigint;
}) {
  const explicitToBlock = getIndexerToBlockEnv(config);

  if (explicitToBlock && explicitToBlock.trim() !== "") {
    if (!/^\d+$/.test(explicitToBlock.trim())) {
      throw new Error(`${config.key} to block must be a positive integer.`);
    }

    const parsed = BigInt(explicitToBlock.trim());

    return parsed > latestSafeBlock ? latestSafeBlock : parsed;
  }

  return latestSafeBlock;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function eventKey({
  chainKey,
  txHash,
  logIndex,
}: {
  chainKey: string;
  txHash: string;
  logIndex: number;
}) {
  return `${chainKey}:${txHash.toLowerCase()}:${logIndex}`;
}

function getCollectionAddress({
  deployment,
  collectionKey,
}: {
  deployment: ReturnType<typeof readDeploymentRecord>;
  collectionKey: CollectionKey;
}) {
  const address = deployment.contracts[collectionKey];

  if (!address) {
    throw new Error(`Missing collection address for ${collectionKey}`);
  }

  return getAddress(address);
}

function toNumber(value: unknown, label: string) {
  if (typeof value === "number" && Number.isSafeInteger(value)) {
    return value;
  }

  if (typeof value === "bigint") {
    const asNumber = Number(value);

    if (Number.isSafeInteger(asNumber)) {
      return asNumber;
    }
  }

  if (typeof value === "string" && /^\d+$/.test(value)) {
    const asNumber = Number(value);

    if (Number.isSafeInteger(asNumber)) {
      return asNumber;
    }
  }

  throw new Error(`Invalid numeric value for ${label}: ${String(value)}`);
}

async function getBlockCacheValue({
  client,
  blockNumber,
  cache,
}: {
  client: IndexerPublicClient;
  blockNumber: bigint;
  cache: Map<string, BlockCacheValue>;
}) {
  const cacheKey = blockNumber.toString();
  const cached = cache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const block = await client.getBlock({ blockNumber });
  const value = {
    hash: block.hash,
    timestampIso: new Date(Number(block.timestamp) * 1000).toISOString(),
  };

  cache.set(cacheKey, value);

  return value;
}

function decodeTransferLog({
  config,
  collectionKey,
  collectionAddress,
  log,
  blockTimestamp,
}: {
  config: IndexerNetworkConfig;
  collectionKey: CollectionKey;
  collectionAddress: Address;
  log: TransferLog;
  blockTimestamp: string;
}): TransferEventRow {
  const { from, to, tokenId } = log.args;

  if (!from || !to || tokenId === undefined || !log.transactionHash) {
    throw new Error(`Malformed Transfer log at block ${log.blockNumber}`);
  }

  const txHash = log.transactionHash;

  return {
    event_key: eventKey({
      chainKey: config.key,
      txHash,
      logIndex: log.logIndex,
    }),
    chain_key: config.key,
    chain_id: config.chainId,
    collection_key: collectionKey,
    collection_address: normalizeAddress(collectionAddress),
    token_id: tokenId.toString(),
    from_address: normalizeAddress(from),
    to_address: normalizeAddress(to),
    tx_hash: txHash.toLowerCase(),
    log_index: log.logIndex,
    block_number: Number(log.blockNumber),
    block_timestamp: blockTimestamp,
  };
}

async function upsertRows({
  supabase,
  table,
  rows,
  onConflict,
}: {
  supabase: SupabaseClient;
  table: string;
  rows: Record<string, unknown>[];
  onConflict: string;
}) {
  if (rows.length === 0) {
    return;
  }

  const { error } = await supabase.from(table).upsert(rows, {
    onConflict,
  });

  if (error) {
    throw new Error(`Failed to upsert ${table}: ${error.message}`);
  }
}

async function updateCheckpoint({
  supabase,
  chainKey,
  sourceKey,
  updates,
}: {
  supabase: SupabaseClient;
  chainKey: string;
  sourceKey: string;
  updates: Record<string, unknown>;
}) {
  const { error } = await supabase
    .from("indexer_checkpoints")
    .update(updates)
    .eq("chain_key", chainKey)
    .eq("source_key", sourceKey);

  if (error) {
    throw new Error(
      `Failed to update checkpoint ${chainKey}:${sourceKey}: ${error.message}`,
    );
  }
}

async function syncCollectionTransfers({
  supabase,
  client,
  config,
  collectionKey,
  collectionAddress,
  fromBlock,
  toBlock,
  blockRangeSize,
  blockTimestampCache,
}: {
  supabase: SupabaseClient;
  client: IndexerPublicClient;
  config: IndexerNetworkConfig;
  collectionKey: CollectionKey;
  collectionAddress: Address;
  fromBlock: bigint;
  toBlock: bigint;
  blockRangeSize: bigint;
  blockTimestampCache: Map<string, BlockCacheValue>;
}) {
  const delayMs = getRequestDelayMs();
  let cursor = fromBlock;
  let insertedOrUpdatedTransfers = 0;
  let scannedRanges = 0;

  console.log(`${collectionKey}: syncing Transfer events to Supabase...`, {
    address: collectionAddress,
    fromBlock: fromBlock.toString(),
    toBlock: toBlock.toString(),
    blockRangeSize: blockRangeSize.toString(),
  });

  await updateCheckpoint({
    supabase,
    chainKey: config.key,
    sourceKey: collectionKey,
    updates: {
      status: "syncing",
      latest_safe_block: Number(toBlock),
      block_range_size: Number(blockRangeSize),
    },
  });

  while (cursor <= toBlock) {
    const rangeTo =
      cursor + blockRangeSize - 1n > toBlock
        ? toBlock
        : cursor + blockRangeSize - 1n;

    const logs = await client.getLogs({
      address: collectionAddress,
      event: TRANSFER_EVENT,
      fromBlock: cursor,
      toBlock: rangeTo,
    });

    const blockRowsByNumber = new Map<number, BlockTimestampRow>();
    const transferRows: TransferEventRow[] = [];

    for (const log of logs) {
      const block = await getBlockCacheValue({
        client,
        blockNumber: log.blockNumber,
        cache: blockTimestampCache,
      });

      const blockNumber = Number(log.blockNumber);

      blockRowsByNumber.set(blockNumber, {
        chain_key: config.key,
        block_number: blockNumber,
        block_hash: block.hash?.toLowerCase() ?? null,
        block_timestamp: block.timestampIso,
      });

      transferRows.push(
        decodeTransferLog({
          config,
          collectionKey,
          collectionAddress,
          log,
          blockTimestamp: block.timestampIso,
        }),
      );
    }

    await upsertRows({
      supabase,
      table: "block_timestamps",
      rows: [...blockRowsByNumber.values()],
      onConflict: "chain_key,block_number",
    });

    await upsertRows({
      supabase,
      table: "nft_transfer_events",
      rows: transferRows,
      onConflict: "event_key",
    });

    await updateCheckpoint({
      supabase,
      chainKey: config.key,
      sourceKey: collectionKey,
      updates: {
        last_synced_block: Number(rangeTo),
        latest_safe_block: Number(toBlock),
        block_range_size: Number(blockRangeSize),
        status: "syncing",
      },
    });

    insertedOrUpdatedTransfers += transferRows.length;
    scannedRanges += 1;

    console.log(`${collectionKey}: range synced to Supabase.`, {
      fromBlock: cursor.toString(),
      toBlock: rangeTo.toString(),
      logs: logs.length,
    });

    if (delayMs > 0) {
      await sleep(delayMs);
    }

    cursor = rangeTo + 1n;
  }

  await updateCheckpoint({
    supabase,
    chainKey: config.key,
    sourceKey: collectionKey,
    updates: {
      last_synced_block: Number(toBlock),
      latest_safe_block: Number(toBlock),
      block_range_size: Number(blockRangeSize),
      status: "success",
    },
  });

  return {
    collectionKey,
    fromBlock: fromBlock.toString(),
    toBlock: toBlock.toString(),
    scannedRanges,
    transfers: insertedOrUpdatedTransfers,
  };
}

async function main() {
  const config = getIndexerNetworkConfig(process.argv[2]);
  const deployment = readDeploymentRecord(config);
  const supabase = createSupabaseServiceClient();
  const repository = createSupabaseIndexerRepository(supabase);

  const rpcUrl = process.env[config.rpcEnv];

  if (!rpcUrl) {
    throw new Error(`Missing RPC env for DB transfer sync: ${config.rpcEnv}`);
  }

  const client = createPublicClient({
    chain: getViemChain(config.chainId),
    transport: http(rpcUrl),
  }) as IndexerPublicClient;

  const latestBlock = await client.getBlockNumber();
  const confirmationDelay = getConfirmationDelay();
  const latestSafeBlock =
    latestBlock > confirmationDelay
      ? latestBlock - confirmationDelay
      : latestBlock;

  const requestedToBlock = getRequestedToBlock({
    config,
    latestSafeBlock,
  });

  const blockRangeSize = BigInt(
    parsePositiveInteger(process.env.INDEXER_BLOCK_RANGE, 10),
  );

  console.log("Running DB Transfer sync...");
  console.log({
    network: config.key,
    chainId: config.chainId,
    label: config.label,
    latestBlock: latestBlock.toString(),
    latestSafeBlock: latestSafeBlock.toString(),
    requestedToBlock: requestedToBlock.toString(),
    blockRangeSize: blockRangeSize.toString(),
  });

  const run = await repository.startRun({
    chainKey: config.key,
    runKind: "sync",
    metadata: {
      stage: "transfer-event-sync-to-supabase-v1",
      command: "indexer:sync-transfers",
      network: config.key,
      latestBlock: latestBlock.toString(),
      latestSafeBlock: latestSafeBlock.toString(),
      requestedToBlock: requestedToBlock.toString(),
    },
  });

  const results: unknown[] = [];

  try {
    await repository.assertContractsMatchDeployment({
      config,
      deployment,
    });

    const blockTimestampCache = new Map<string, BlockCacheValue>();

    for (const collectionKey of getCollectionSourceKeys()) {
      const checkpoint = await repository.upsertCheckpoint({
        config,
        deployment,
        sourceKey: collectionKey,
        blockRangeSize: Number(blockRangeSize),
        latestSafeBlock: Number(requestedToBlock),
      });

      const fromBlockNumber =
        checkpoint.last_synced_block !== null &&
        checkpoint.last_synced_block !== undefined
          ? toNumber(checkpoint.last_synced_block, "last_synced_block") + 1
          : toNumber(checkpoint.from_block, "from_block");

      const toBlockNumber = Number(requestedToBlock);

      if (fromBlockNumber > toBlockNumber) {
        console.log(`${collectionKey}: already synced.`, {
          fromBlock: fromBlockNumber,
          requestedToBlock: toBlockNumber,
        });

        results.push({
          collectionKey,
          skipped: true,
          reason: "already_synced",
          fromBlock: fromBlockNumber,
          toBlock: toBlockNumber,
        });

        continue;
      }

      const collectionAddress = getCollectionAddress({
        deployment,
        collectionKey,
      });

      const result = await syncCollectionTransfers({
        supabase,
        client,
        config,
        collectionKey,
        collectionAddress,
        fromBlock: BigInt(fromBlockNumber),
        toBlock: BigInt(toBlockNumber),
        blockRangeSize,
        blockTimestampCache,
      });

      results.push(result);
    }

    await repository.finishRun({
      runId: run.id,
      status: "success",
      metadata: {
        ...run.metadata,
        results,
      },
    });

    console.log("DB Transfer sync complete.");
    console.log({
      runId: run.id,
      results,
    });
  } catch (error) {
    for (const collectionKey of getCollectionSourceKeys()) {
      await updateCheckpoint({
        supabase,
        chainKey: config.key,
        sourceKey: collectionKey,
        updates: {
          status: "failed",
        },
      }).catch(() => undefined);
    }

    await repository.finishRun({
      runId: run.id,
      status: "failed",
      errorMessage: error instanceof Error ? error.message : String(error),
      metadata: {
        ...run.metadata,
        failedAt: new Date().toISOString(),
        results,
      },
    });

    throw error;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
