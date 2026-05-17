import "dotenv/config";
import {
  createPublicClient,
  getAddress,
  http,
  parseAbiItem,
  type Address,
} from "viem";
import { baseSepolia, sepolia } from "viem/chains";
import { getIndexerNetworkConfig } from "./config.js";
import {
  initializeEmptyDataFiles,
  readDeploymentRecord,
  readOrCreateCheckpoints,
  readOutputJson,
  writeCheckpoints,
  writeMetadata,
  writeOutputJson,
} from "./storage.js";
import type {
  CollectionKey,
  IndexerCheckpoints,
  IndexerEventRecord,
  IndexerNetworkConfig,
  IndexerSourceKey,
  TransferRecord,
} from "./types.js";
import { buildCurrentOwners } from "./calculators/ownership.js";

const TRANSFER_EVENT = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
);

const COLLECTION_SOURCE_KEYS = ["roty", "melting", "amanda"] as const;

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

type IndexerPublicClient = {
  getBlockNumber: () => Promise<bigint>;
  getBlock: (args: { blockNumber: bigint }) => Promise<{
    timestamp: bigint;
  }>;
  getLogs: (args: {
    address: Address;
    event: typeof TRANSFER_EVENT;
    fromBlock: bigint;
    toBlock: bigint;
  }) => Promise<TransferLog[]>;
};

function getViemChain(chainId: number) {
  if (chainId === baseSepolia.id) {
    return baseSepolia;
  }

  if (chainId === sepolia.id) {
    return sepolia;
  }

  throw new Error(`Unsupported chainId for indexer sync: ${chainId}`);
}

function getIndexerFromBlockEnv(config: IndexerNetworkConfig) {
  if (config.key === "baseSepolia") {
    return process.env.BASE_SEPOLIA_INDEXER_FROM_BLOCK;
  }

  if (config.key === "ethereumSepolia") {
    return process.env.ETHEREUM_SEPOLIA_INDEXER_FROM_BLOCK;
  }

  return undefined;
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
    const parsed = BigInt(explicitToBlock);

    if (parsed < 0n) {
      throw new Error(`${config.key} to block cannot be negative.`);
    }

    return parsed > latestSafeBlock ? latestSafeBlock : parsed;
  }

  return latestSafeBlock;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getRequestDelayMs() {
  return parsePositiveInteger(process.env.INDEXER_REQUEST_DELAY_MS, 250);
}

function parsePositiveInteger(value: string | undefined, fallback: number) {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 0) {
    return fallback;
  }

  return parsed;
}

function getFirstSyncFromBlock({
  config,
  latestSafeBlock,
}: {
  config: IndexerNetworkConfig;
  latestSafeBlock: bigint;
}) {
  const explicitFromBlock = getIndexerFromBlockEnv(config);

  if (explicitFromBlock && explicitFromBlock.trim() !== "") {
    const parsed = BigInt(explicitFromBlock);

    if (parsed < 0n) {
      throw new Error(`${config.key} from block cannot be negative.`);
    }

    return parsed;
  }

  const lookback = BigInt(
    parsePositiveInteger(process.env.INDEXER_LOOKBACK_BLOCKS, 100_000),
  );

  if (latestSafeBlock <= lookback) {
    return 0n;
  }

  return latestSafeBlock - lookback;
}

function getBlockRangeSize() {
  return BigInt(parsePositiveInteger(process.env.INDEXER_BLOCK_RANGE, 5_000));
}

function eventKey({
  chainId,
  txHash,
  logIndex,
}: {
  chainId: number;
  txHash: string;
  logIndex: number;
}) {
  return `${chainId}:${txHash.toLowerCase()}:${logIndex}`;
}

function dedupeByEventKey<
  T extends {
    chainId: number;
    txHash: `0x${string}`;
    logIndex: number;
    blockNumber: number;
  },
>(records: T[]) {
  const map = new Map<string, T>();

  for (const record of records) {
    map.set(
      eventKey({
        chainId: record.chainId,
        txHash: record.txHash,
        logIndex: record.logIndex,
      }),
      record,
    );
  }

  return [...map.values()].sort((a, b) => {
    if (a.blockNumber !== b.blockNumber) {
      return a.blockNumber - b.blockNumber;
    }

    return a.logIndex - b.logIndex;
  });
}

async function getBlockTimestamp({
  client,
  blockNumber,
  cache,
}: {
  client: IndexerPublicClient;
  blockNumber: bigint;
  cache: Map<bigint, number>;
}) {
  const cached = cache.get(blockNumber);

  if (cached !== undefined) {
    return cached;
  }

  const block = await client.getBlock({ blockNumber });
  const timestamp = Number(block.timestamp);
  cache.set(blockNumber, timestamp);

  return timestamp;
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
  blockTimestamp: number;
}): TransferRecord {
  const { from, to, tokenId } = log.args;

  if (!from || !to || tokenId === undefined || !log.transactionHash) {
    throw new Error(`Malformed Transfer log at block ${log.blockNumber}`);
  }

  return {
    chainId: config.chainId,
    network: config.key,
    collectionKey,
    collectionAddress,
    tokenId: tokenId.toString(),
    from: getAddress(from),
    to: getAddress(to),
    txHash: log.transactionHash,
    logIndex: log.logIndex,
    blockNumber: Number(log.blockNumber),
    blockTimestamp,
  };
}

function toIndexerEventRecord(transfer: TransferRecord): IndexerEventRecord {
  return {
    chainId: transfer.chainId,
    network: transfer.network,
    sourceKey: transfer.collectionKey,
    contractAddress: transfer.collectionAddress,
    eventName: "Transfer",
    txHash: transfer.txHash,
    logIndex: transfer.logIndex,
    blockNumber: transfer.blockNumber,
    blockTimestamp: transfer.blockTimestamp,
    payload: {
      collectionKey: transfer.collectionKey,
      tokenId: transfer.tokenId,
      from: transfer.from,
      to: transfer.to,
    },
  };
}

async function syncCollectionTransfers({
  config,
  client,
  checkpoints,
  collectionKey,
  collectionAddress,
  latestSafeBlock,
  blockTimestampCache,
}: {
  config: IndexerNetworkConfig;
  client: IndexerPublicClient;
  checkpoints: IndexerCheckpoints;
  collectionKey: CollectionKey;
  collectionAddress: Address;
  latestSafeBlock: bigint;
  blockTimestampCache: Map<bigint, number>;
}) {
  const sourceCheckpoint = checkpoints.sources[collectionKey];

  const fromBlock =
    sourceCheckpoint.lastSyncedBlock > 0
      ? BigInt(sourceCheckpoint.lastSyncedBlock + 1)
      : getFirstSyncFromBlock({ config, latestSafeBlock });

  if (fromBlock > latestSafeBlock) {
    console.log(`${collectionKey}: already synced.`, {
      lastSyncedBlock: sourceCheckpoint.lastSyncedBlock,
      latestSafeBlock: latestSafeBlock.toString(),
    });

    return {
      transfers: [] as TransferRecord[],
      latestSyncedBlock: sourceCheckpoint.lastSyncedBlock,
    };
  }

  const blockRangeSize = getBlockRangeSize();
  const transfers: TransferRecord[] = [];

  console.log(`${collectionKey}: syncing Transfer events...`, {
    address: collectionAddress,
    fromBlock: fromBlock.toString(),
    toBlock: latestSafeBlock.toString(),
    blockRangeSize: blockRangeSize.toString(),
  });

  let cursor = fromBlock;

  while (cursor <= latestSafeBlock) {
    const toBlock =
      cursor + blockRangeSize - 1n > latestSafeBlock
        ? latestSafeBlock
        : cursor + blockRangeSize - 1n;

    const logs = await client.getLogs({
      address: collectionAddress,
      event: TRANSFER_EVENT,
      fromBlock: cursor,
      toBlock,
    });

    for (const log of logs) {
      const blockTimestamp = await getBlockTimestamp({
        client,
        blockNumber: log.blockNumber,
        cache: blockTimestampCache,
      });

      transfers.push(
        decodeTransferLog({
          config,
          collectionKey,
          collectionAddress,
          log,
          blockTimestamp,
        }),
      );
    }

    console.log(`${collectionKey}: range synced.`, {
      fromBlock: cursor.toString(),
      toBlock: toBlock.toString(),
      logs: logs.length,
    });

    const delayMs = getRequestDelayMs();

    if (delayMs > 0) {
      await sleep(delayMs);
    }

    cursor = toBlock + 1n;
  }

  return {
    transfers,
    latestSyncedBlock: Number(latestSafeBlock),
  };
}

async function main() {
  const networkKey = process.argv[2];
  const config = getIndexerNetworkConfig(networkKey);
  const deployment = readDeploymentRecord(config);

  writeMetadata({ config });
  initializeEmptyDataFiles(config);

  const checkpoints = readOrCreateCheckpoints({
    config,
    deployment,
  });

  const rpcUrl = process.env[config.rpcEnv];

  if (!rpcUrl) {
    throw new Error(`Missing RPC env for indexer sync: ${config.rpcEnv}`);
  }

  const client = createPublicClient({
    chain: getViemChain(config.chainId),
    transport: http(rpcUrl),
  }) as IndexerPublicClient;

  const latestBlock = await client.getBlockNumber();
  const confirmationDelay = 20n;
  const latestSafeBlock =
    latestBlock > confirmationDelay
      ? latestBlock - confirmationDelay
      : latestBlock;

  const requestedToBlock = getRequestedToBlock({
    config,
    latestSafeBlock,
  });

  const existingTransfers = readOutputJson<TransferRecord[]>(
    config,
    "transfers.json",
    [],
  );

  const existingEvents = readOutputJson<IndexerEventRecord[]>(
    config,
    "events.json",
    [],
  );

  const allNewTransfers: TransferRecord[] = [];
  const updatedCheckpoints: IndexerCheckpoints = {
    ...checkpoints,
    sources: {
      ...checkpoints.sources,
    },
  };

  const blockTimestampCache = new Map<bigint, number>();

  for (const collectionKey of COLLECTION_SOURCE_KEYS) {
    const collectionAddress = getCollectionAddress({
      deployment,
      collectionKey,
    });

    const result = await syncCollectionTransfers({
      config,
      client,
      checkpoints,
      collectionKey,
      collectionAddress,
      latestSafeBlock: requestedToBlock,
      blockTimestampCache,
    });

    allNewTransfers.push(...result.transfers);

    updatedCheckpoints.sources[collectionKey] = {
      address: collectionAddress,
      lastSyncedBlock: result.latestSyncedBlock,
    };
  }

  const mergedTransfers = dedupeByEventKey([
    ...existingTransfers,
    ...allNewTransfers,
  ]);

  const transferEvents = mergedTransfers.map(toIndexerEventRecord);

  const mergedEvents = dedupeByEventKey([...existingEvents, ...transferEvents]);

  const currentOwners = buildCurrentOwners(mergedTransfers);

  writeOutputJson(config, "transfers.json", mergedTransfers);
  writeOutputJson(config, "events.json", mergedEvents);
  writeOutputJson(config, "current-owners.json", currentOwners);
  writeCheckpoints(config, updatedCheckpoints);

  console.log("Transfer sync complete.");
  console.log({
    network: config.key,
    latestBlock: latestBlock.toString(),
    latestSafeBlock: latestSafeBlock.toString(),
    requestedToBlock: requestedToBlock.toString(),
    newTransfers: allNewTransfers.length,
    totalTransfers: mergedTransfers.length,
    currentOwners: currentOwners.length,
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
