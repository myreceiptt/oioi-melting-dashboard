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
import { createSupabaseServiceClient } from "../../lib/supabase/server.js";
import {
  createSupabaseIndexerRepository,
  normalizeAddress,
} from "../../lib/supabase/indexerRepository.js";
import { getIndexerNetworkConfig } from "./config.js";
import { readDeploymentRecord } from "./storage.js";
import type { CollectionKey, IndexerNetworkConfig } from "./types.js";

const STAKED_EVENT = parseAbiItem(
  "event Staked(address indexed staker, address indexed collection, uint256 indexed tokenId, uint256 timestamp)",
);

const UNSTAKED_EVENT = parseAbiItem(
  "event Unstaked(address indexed staker, address indexed collection, uint256 indexed tokenId, uint256 timestamp)",
);

type StakingEventType = "staked" | "unstaked";

type StakingLog = {
  args: {
    staker?: Address;
    collection?: Address;
    tokenId?: bigint;
    timestamp?: bigint;
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
    event: typeof STAKED_EVENT | typeof UNSTAKED_EVENT;
    fromBlock: bigint;
    toBlock: bigint;
  }) => Promise<StakingLog[]>;
};

type StakingEventRow = {
  event_key: string;
  chain_key: string;
  chain_id: number;
  event_type: StakingEventType;
  staking_contract_address: string;
  staker_address: string;
  collection_key: CollectionKey;
  collection_address: string;
  token_id: string;
  staking_timestamp_unix: string;
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

  throw new Error(`Unsupported chainId for DB staking sync: ${chainId}`);
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

function compareLogs(a: StakingLog, b: StakingLog) {
  if (a.blockNumber !== b.blockNumber) {
    return a.blockNumber < b.blockNumber ? -1 : 1;
  }

  return a.logIndex - b.logIndex;
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

function getCollectionMap(deployment: ReturnType<typeof readDeploymentRecord>) {
  return new Map<string, CollectionKey>([
    [normalizeAddress(deployment.contracts.roty!), "roty"],
    [normalizeAddress(deployment.contracts.melting!), "melting"],
    [normalizeAddress(deployment.contracts.amanda!), "amanda"],
  ]);
}

function getCollectionKey({
  collectionAddress,
  collectionMap,
}: {
  collectionAddress: Address;
  collectionMap: Map<string, CollectionKey>;
}) {
  const collectionKey = collectionMap.get(normalizeAddress(collectionAddress));

  if (!collectionKey) {
    throw new Error(`Unknown staking collection address: ${collectionAddress}`);
  }

  return collectionKey;
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

function decodeStakingLog({
  config,
  stakingAddress,
  eventType,
  log,
  blockTimestamp,
  collectionMap,
}: {
  config: IndexerNetworkConfig;
  stakingAddress: Address;
  eventType: StakingEventType;
  log: StakingLog;
  blockTimestamp: string;
  collectionMap: Map<string, CollectionKey>;
}): StakingEventRow {
  const { staker, collection, tokenId, timestamp } = log.args;

  if (
    !staker ||
    !collection ||
    tokenId === undefined ||
    timestamp === undefined ||
    !log.transactionHash
  ) {
    throw new Error(`Malformed ${eventType} log at block ${log.blockNumber}`);
  }

  const txHash = log.transactionHash;
  const collectionKey = getCollectionKey({
    collectionAddress: collection,
    collectionMap,
  });

  return {
    event_key: eventKey({
      chainKey: config.key,
      txHash,
      logIndex: log.logIndex,
    }),
    chain_key: config.key,
    chain_id: config.chainId,
    event_type: eventType,
    staking_contract_address: normalizeAddress(stakingAddress),
    staker_address: normalizeAddress(staker),
    collection_key: collectionKey,
    collection_address: normalizeAddress(collection),
    token_id: tokenId.toString(),
    staking_timestamp_unix: timestamp.toString(),
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

async function syncStakingEvents({
  supabase,
  client,
  config,
  stakingAddress,
  collectionMap,
  fromBlock,
  toBlock,
  blockRangeSize,
  blockTimestampCache,
}: {
  supabase: SupabaseClient;
  client: IndexerPublicClient;
  config: IndexerNetworkConfig;
  stakingAddress: Address;
  collectionMap: Map<string, CollectionKey>;
  fromBlock: bigint;
  toBlock: bigint;
  blockRangeSize: bigint;
  blockTimestampCache: Map<string, BlockCacheValue>;
}) {
  const delayMs = getRequestDelayMs();
  let cursor = fromBlock;
  let insertedOrUpdatedEvents = 0;
  let scannedRanges = 0;

  console.log("staking: syncing Staked/Unstaked events to Supabase...", {
    address: stakingAddress,
    fromBlock: fromBlock.toString(),
    toBlock: toBlock.toString(),
    blockRangeSize: blockRangeSize.toString(),
  });

  await updateCheckpoint({
    supabase,
    chainKey: config.key,
    sourceKey: "staking",
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

    const [stakedLogs, unstakedLogs] = await Promise.all([
      client.getLogs({
        address: stakingAddress,
        event: STAKED_EVENT,
        fromBlock: cursor,
        toBlock: rangeTo,
      }),
      client.getLogs({
        address: stakingAddress,
        event: UNSTAKED_EVENT,
        fromBlock: cursor,
        toBlock: rangeTo,
      }),
    ]);

    const taggedLogs = [
      ...stakedLogs.map((log) => ({ eventType: "staked" as const, log })),
      ...unstakedLogs.map((log) => ({ eventType: "unstaked" as const, log })),
    ].sort((a, b) => compareLogs(a.log, b.log));

    const blockRowsByNumber = new Map<number, BlockTimestampRow>();
    const stakingRows: StakingEventRow[] = [];

    for (const { eventType, log } of taggedLogs) {
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

      stakingRows.push(
        decodeStakingLog({
          config,
          stakingAddress,
          eventType,
          log,
          blockTimestamp: block.timestampIso,
          collectionMap,
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
      table: "staking_events",
      rows: stakingRows,
      onConflict: "event_key",
    });

    await updateCheckpoint({
      supabase,
      chainKey: config.key,
      sourceKey: "staking",
      updates: {
        last_synced_block: Number(rangeTo),
        latest_safe_block: Number(toBlock),
        block_range_size: Number(blockRangeSize),
        status: "syncing",
      },
    });

    insertedOrUpdatedEvents += stakingRows.length;
    scannedRanges += 1;

    console.log("staking: range synced to Supabase.", {
      fromBlock: cursor.toString(),
      toBlock: rangeTo.toString(),
      stakedLogs: stakedLogs.length,
      unstakedLogs: unstakedLogs.length,
      totalLogs: stakingRows.length,
    });

    if (delayMs > 0) {
      await sleep(delayMs);
    }

    cursor = rangeTo + 1n;
  }

  await updateCheckpoint({
    supabase,
    chainKey: config.key,
    sourceKey: "staking",
    updates: {
      last_synced_block: Number(toBlock),
      latest_safe_block: Number(toBlock),
      block_range_size: Number(blockRangeSize),
      status: "success",
    },
  });

  return {
    sourceKey: "staking",
    fromBlock: fromBlock.toString(),
    toBlock: toBlock.toString(),
    scannedRanges,
    stakingEvents: insertedOrUpdatedEvents,
  };
}

async function main() {
  const config = getIndexerNetworkConfig(process.argv[2]);
  const deployment = readDeploymentRecord(config);
  const supabase = createSupabaseServiceClient();
  const repository = createSupabaseIndexerRepository(supabase);

  const rpcUrl = process.env[config.rpcEnv];

  if (!rpcUrl) {
    throw new Error(`Missing RPC env for DB staking sync: ${config.rpcEnv}`);
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

  const stakingAddress = getAddress(deployment.contracts.staking!);
  const collectionMap = getCollectionMap(deployment);

  console.log("Running DB Staking event sync...");
  console.log({
    network: config.key,
    chainId: config.chainId,
    label: config.label,
    stakingAddress,
    latestBlock: latestBlock.toString(),
    latestSafeBlock: latestSafeBlock.toString(),
    requestedToBlock: requestedToBlock.toString(),
    blockRangeSize: blockRangeSize.toString(),
  });

  const run = await repository.startRun({
    chainKey: config.key,
    runKind: "sync",
    metadata: {
      stage: "staking-event-sync-to-supabase-v1",
      command: "indexer:sync-staking",
      network: config.key,
      latestBlock: latestBlock.toString(),
      latestSafeBlock: latestSafeBlock.toString(),
      requestedToBlock: requestedToBlock.toString(),
    },
  });

  try {
    await repository.assertContractsMatchDeployment({
      config,
      deployment,
    });

    const checkpoint = await repository.upsertCheckpoint({
      config,
      deployment,
      sourceKey: "staking",
      blockRangeSize: Number(blockRangeSize),
      latestSafeBlock: Number(requestedToBlock),
    });

    const fromBlockNumber =
      checkpoint.last_synced_block !== null &&
      checkpoint.last_synced_block !== undefined
        ? toNumber(checkpoint.last_synced_block, "last_synced_block") + 1
        : toNumber(checkpoint.from_block, "from_block");

    const toBlockNumber = Number(requestedToBlock);

    let result: unknown;

    if (fromBlockNumber > toBlockNumber) {
      console.log("staking: already synced.", {
        fromBlock: fromBlockNumber,
        requestedToBlock: toBlockNumber,
      });

      result = {
        sourceKey: "staking",
        skipped: true,
        reason: "already_synced",
        fromBlock: fromBlockNumber,
        toBlock: toBlockNumber,
      };
    } else {
      const blockTimestampCache = new Map<string, BlockCacheValue>();

      result = await syncStakingEvents({
        supabase,
        client,
        config,
        stakingAddress,
        collectionMap,
        fromBlock: BigInt(fromBlockNumber),
        toBlock: BigInt(toBlockNumber),
        blockRangeSize,
        blockTimestampCache,
      });
    }

    await repository.finishRun({
      runId: run.id,
      status: "success",
      metadata: {
        ...run.metadata,
        result,
      },
    });

    console.log("DB Staking event sync complete.");
    console.log({
      runId: run.id,
      result,
    });
  } catch (error) {
    await updateCheckpoint({
      supabase,
      chainKey: config.key,
      sourceKey: "staking",
      updates: {
        status: "failed",
      },
    }).catch(() => undefined);

    await repository.finishRun({
      runId: run.id,
      status: "failed",
      errorMessage: error instanceof Error ? error.message : String(error),
      metadata: {
        ...run.metadata,
        failedAt: new Date().toISOString(),
      },
    });

    throw error;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
