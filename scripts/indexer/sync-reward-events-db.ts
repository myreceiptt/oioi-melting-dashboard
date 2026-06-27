import "dotenv/config";
import {
  createPublicClient,
  getAddress,
  http,
  parseAbiItem,
  type Address,
} from "viem";
import { base, baseSepolia, mainnet, sepolia } from "viem/chains";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServiceClient } from "@/lib/supabase/server.js";
import {
  createSupabaseIndexerRepository,
  normalizeAddress,
} from "@/lib/supabase/indexerRepository.js";
import { getIndexerNetworkConfig } from "./config.js";
import { readDeploymentRecord } from "./storage.js";
import type { IndexerNetworkConfig } from "./types.js";

const REWARD_ROUND_CREATED_EVENT = parseAbiItem(
  "event RewardRoundCreated(uint256 indexed roundId, uint64 periodStart, uint64 periodEnd, uint256 rewardAmount, bytes32 indexed merkleRoot)",
);

const REWARD_ROUND_FUNDED_EVENT = parseAbiItem(
  "event RewardRoundFunded(uint256 indexed roundId, address indexed funder, uint256 amount, uint256 fundedAmount)",
);

const MERKLE_ROOT_UPDATED_EVENT = parseAbiItem(
  "event MerkleRootUpdated(uint256 indexed roundId, bytes32 indexed oldMerkleRoot, bytes32 indexed newMerkleRoot)",
);

const CLAIM_PAUSED_UPDATED_EVENT = parseAbiItem(
  "event ClaimPausedUpdated(uint256 indexed roundId, bool paused)",
);

const CLAIMED_EVENT = parseAbiItem(
  "event Claimed(uint256 indexed roundId, address indexed account, uint256 amount)",
);

type RewardEventType =
  | "reward_round_created"
  | "reward_round_funded"
  | "merkle_root_updated"
  | "claim_paused_updated"
  | "claimed";

type RewardLog = {
  args: Record<string, unknown>;
  transactionHash: `0x${string}` | null;
  logIndex: number;
  blockNumber: bigint;
};

type TaggedRewardLog = {
  eventType: RewardEventType;
  log: RewardLog;
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
    event:
      | typeof REWARD_ROUND_CREATED_EVENT
      | typeof REWARD_ROUND_FUNDED_EVENT
      | typeof MERKLE_ROOT_UPDATED_EVENT
      | typeof CLAIM_PAUSED_UPDATED_EVENT
      | typeof CLAIMED_EVENT;
    fromBlock: bigint;
    toBlock: bigint;
  }) => Promise<RewardLog[]>;
};

type BlockTimestampRow = {
  chain_key: string;
  block_number: number;
  block_hash: string | null;
  block_timestamp: string;
};

type RewardRoundEventRow = {
  event_key: string;
  chain_key: string;
  chain_id: number;
  event_type: RewardEventType;
  reward_distributor_address: string;
  round_id: string | null;
  account_address: string | null;
  funder_address: string | null;
  amount_wei: string | null;
  funded_amount_wei: string | null;
  period_start_unix: string | null;
  period_end_unix: string | null;
  old_merkle_root: string | null;
  new_merkle_root: string | null;
  merkle_root: string | null;
  claim_paused: boolean | null;
  tx_hash: string;
  log_index: number;
  block_number: number;
  block_timestamp: string;
  payload: Record<string, unknown>;
};

type RewardRoundState = {
  chain_key: string;
  round_id: string;
  status: "created" | "funded" | "claim_paused" | "closed";
  period_start: string;
  period_end: string;
  period_start_unix: string;
  period_end_unix: string;
  reward_amount_wei: string;
  funded_amount_wei: string;
  claimed_amount_wei: string;
  merkle_root: string | null;
  claim_paused: boolean;
  created_tx_hash: string | null;
  funded_tx_hash: string | null;
  metadata: Record<string, unknown>;
};

type RewardClaimRow = {
  event_key: string;
  chain_key: string;
  round_id: string;
  account_address: string;
  amount_wei: string;
  tx_hash: string;
  log_index: number;
  block_number: number;
  block_timestamp: string;
};

function getViemChain(chainId: number) {
  if (chainId === baseSepolia.id) return baseSepolia;
  if (chainId === sepolia.id) return sepolia;
  if (chainId === base.id) return base;
  if (chainId === mainnet.id) return mainnet;

  throw new Error(`Unsupported chainId for DB reward sync: ${chainId}`);
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
  const envByNetwork = {
    baseSepolia: process.env.BASE_SEPOLIA_INDEXER_TO_BLOCK,
    ethereumSepolia: process.env.ETHEREUM_SEPOLIA_INDEXER_TO_BLOCK,
    baseMainnet: process.env.BASE_MAINNET_INDEXER_TO_BLOCK,
    ethereumMainnet: process.env.ETHEREUM_MAINNET_INDEXER_TO_BLOCK,
  } satisfies Record<IndexerNetworkConfig["key"], string | undefined>;

  return envByNetwork[config.key];
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

function compareTaggedLogs(a: TaggedRewardLog, b: TaggedRewardLog) {
  if (a.log.blockNumber !== b.log.blockNumber) {
    return a.log.blockNumber < b.log.blockNumber ? -1 : 1;
  }

  return a.log.logIndex - b.log.logIndex;
}

function compareRewardEvents(a: RewardRoundEventRow, b: RewardRoundEventRow) {
  if (a.block_number !== b.block_number) {
    return a.block_number - b.block_number;
  }

  return a.log_index - b.log_index;
}

function toBigIntString(value: unknown, label: string) {
  if (typeof value === "bigint") {
    return value.toString();
  }

  if (typeof value === "number" && Number.isSafeInteger(value)) {
    return BigInt(value).toString();
  }

  if (typeof value === "string" && /^\d+$/.test(value)) {
    return BigInt(value).toString();
  }

  throw new Error(`Invalid bigint-like value for ${label}: ${String(value)}`);
}

function toAddressString(value: unknown, label: string) {
  if (typeof value !== "string" || !/^0x[0-9a-fA-F]{40}$/.test(value)) {
    throw new Error(`Invalid address for ${label}: ${String(value)}`);
  }

  return normalizeAddress(value);
}

function toBytes32String(value: unknown, label: string) {
  if (typeof value !== "string" || !/^0x[0-9a-fA-F]{64}$/.test(value)) {
    throw new Error(`Invalid bytes32 for ${label}: ${String(value)}`);
  }

  return value.toLowerCase();
}

function toBoolean(value: unknown, label: string) {
  if (typeof value !== "boolean") {
    throw new Error(`Invalid boolean for ${label}: ${String(value)}`);
  }

  return value;
}

function unixToIso(unix: string) {
  return new Date(Number(unix) * 1000).toISOString();
}

function addNumericStrings(a: string, b: string) {
  return (BigInt(a) + BigInt(b)).toString();
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

function decodeRewardLog({
  config,
  rewardDistributorAddress,
  eventType,
  log,
  blockTimestamp,
}: {
  config: IndexerNetworkConfig;
  rewardDistributorAddress: Address;
  eventType: RewardEventType;
  log: RewardLog;
  blockTimestamp: string;
}): RewardRoundEventRow {
  if (!log.transactionHash) {
    throw new Error(`Malformed ${eventType} log at block ${log.blockNumber}`);
  }

  const txHash = log.transactionHash;
  const base = {
    event_key: eventKey({
      chainKey: config.key,
      txHash,
      logIndex: log.logIndex,
    }),
    chain_key: config.key,
    chain_id: config.chainId,
    event_type: eventType,
    reward_distributor_address: normalizeAddress(rewardDistributorAddress),
    round_id: null,
    account_address: null,
    funder_address: null,
    amount_wei: null,
    funded_amount_wei: null,
    period_start_unix: null,
    period_end_unix: null,
    old_merkle_root: null,
    new_merkle_root: null,
    merkle_root: null,
    claim_paused: null,
    tx_hash: txHash.toLowerCase(),
    log_index: log.logIndex,
    block_number: Number(log.blockNumber),
    block_timestamp: blockTimestamp,
    payload: {},
  } satisfies RewardRoundEventRow;

  if (eventType === "reward_round_created") {
    const roundId = toBigIntString(log.args.roundId, "roundId");
    const periodStart = toBigIntString(log.args.periodStart, "periodStart");
    const periodEnd = toBigIntString(log.args.periodEnd, "periodEnd");
    const rewardAmount = toBigIntString(log.args.rewardAmount, "rewardAmount");
    const merkleRoot = toBytes32String(log.args.merkleRoot, "merkleRoot");

    return {
      ...base,
      round_id: roundId,
      period_start_unix: periodStart,
      period_end_unix: periodEnd,
      amount_wei: rewardAmount,
      merkle_root: merkleRoot,
      payload: {
        roundId,
        periodStart,
        periodEnd,
        rewardAmount,
        merkleRoot,
      },
    };
  }

  if (eventType === "reward_round_funded") {
    const roundId = toBigIntString(log.args.roundId, "roundId");
    const funder = toAddressString(log.args.funder, "funder");
    const amount = toBigIntString(log.args.amount, "amount");
    const fundedAmount = toBigIntString(log.args.fundedAmount, "fundedAmount");

    return {
      ...base,
      round_id: roundId,
      funder_address: funder,
      amount_wei: amount,
      funded_amount_wei: fundedAmount,
      payload: {
        roundId,
        funder,
        amount,
        fundedAmount,
      },
    };
  }

  if (eventType === "merkle_root_updated") {
    const roundId = toBigIntString(log.args.roundId, "roundId");
    const oldMerkleRoot = toBytes32String(
      log.args.oldMerkleRoot,
      "oldMerkleRoot",
    );
    const newMerkleRoot = toBytes32String(
      log.args.newMerkleRoot,
      "newMerkleRoot",
    );

    return {
      ...base,
      round_id: roundId,
      old_merkle_root: oldMerkleRoot,
      new_merkle_root: newMerkleRoot,
      merkle_root: newMerkleRoot,
      payload: {
        roundId,
        oldMerkleRoot,
        newMerkleRoot,
      },
    };
  }

  if (eventType === "claim_paused_updated") {
    const roundId = toBigIntString(log.args.roundId, "roundId");
    const paused = toBoolean(log.args.paused, "paused");

    return {
      ...base,
      round_id: roundId,
      claim_paused: paused,
      payload: {
        roundId,
        paused,
      },
    };
  }

  if (eventType === "claimed") {
    const roundId = toBigIntString(log.args.roundId, "roundId");
    const account = toAddressString(log.args.account, "account");
    const amount = toBigIntString(log.args.amount, "amount");

    return {
      ...base,
      round_id: roundId,
      account_address: account,
      amount_wei: amount,
      payload: {
        roundId,
        account,
        amount,
      },
    };
  }

  return base;
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

async function syncRewardEvents({
  supabase,
  client,
  config,
  rewardDistributorAddress,
  fromBlock,
  toBlock,
  blockRangeSize,
  blockTimestampCache,
}: {
  supabase: SupabaseClient;
  client: IndexerPublicClient;
  config: IndexerNetworkConfig;
  rewardDistributorAddress: Address;
  fromBlock: bigint;
  toBlock: bigint;
  blockRangeSize: bigint;
  blockTimestampCache: Map<string, BlockCacheValue>;
}) {
  const delayMs = getRequestDelayMs();
  let cursor = fromBlock;
  let insertedOrUpdatedEvents = 0;
  let scannedRanges = 0;

  console.log("rewardDistributor: syncing reward events to Supabase...", {
    address: rewardDistributorAddress,
    fromBlock: fromBlock.toString(),
    toBlock: toBlock.toString(),
    blockRangeSize: blockRangeSize.toString(),
  });

  await updateCheckpoint({
    supabase,
    chainKey: config.key,
    sourceKey: "rewardDistributor",
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

    const [
      createdLogs,
      fundedLogs,
      merkleUpdatedLogs,
      claimPausedLogs,
      claimedLogs,
    ] = await Promise.all([
      client.getLogs({
        address: rewardDistributorAddress,
        event: REWARD_ROUND_CREATED_EVENT,
        fromBlock: cursor,
        toBlock: rangeTo,
      }),
      client.getLogs({
        address: rewardDistributorAddress,
        event: REWARD_ROUND_FUNDED_EVENT,
        fromBlock: cursor,
        toBlock: rangeTo,
      }),
      client.getLogs({
        address: rewardDistributorAddress,
        event: MERKLE_ROOT_UPDATED_EVENT,
        fromBlock: cursor,
        toBlock: rangeTo,
      }),
      client.getLogs({
        address: rewardDistributorAddress,
        event: CLAIM_PAUSED_UPDATED_EVENT,
        fromBlock: cursor,
        toBlock: rangeTo,
      }),
      client.getLogs({
        address: rewardDistributorAddress,
        event: CLAIMED_EVENT,
        fromBlock: cursor,
        toBlock: rangeTo,
      }),
    ]);

    const taggedLogs: TaggedRewardLog[] = [
      ...createdLogs.map((log) => ({
        eventType: "reward_round_created" as const,
        log,
      })),
      ...fundedLogs.map((log) => ({
        eventType: "reward_round_funded" as const,
        log,
      })),
      ...merkleUpdatedLogs.map((log) => ({
        eventType: "merkle_root_updated" as const,
        log,
      })),
      ...claimPausedLogs.map((log) => ({
        eventType: "claim_paused_updated" as const,
        log,
      })),
      ...claimedLogs.map((log) => ({
        eventType: "claimed" as const,
        log,
      })),
    ].sort(compareTaggedLogs);

    const blockRowsByNumber = new Map<number, BlockTimestampRow>();
    const rewardRows: RewardRoundEventRow[] = [];

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

      rewardRows.push(
        decodeRewardLog({
          config,
          rewardDistributorAddress,
          eventType,
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
      table: "reward_round_events",
      rows: rewardRows,
      onConflict: "event_key",
    });

    await updateCheckpoint({
      supabase,
      chainKey: config.key,
      sourceKey: "rewardDistributor",
      updates: {
        last_synced_block: Number(rangeTo),
        latest_safe_block: Number(toBlock),
        block_range_size: Number(blockRangeSize),
        status: "syncing",
      },
    });

    insertedOrUpdatedEvents += rewardRows.length;
    scannedRanges += 1;

    console.log("rewardDistributor: range synced to Supabase.", {
      fromBlock: cursor.toString(),
      toBlock: rangeTo.toString(),
      createdLogs: createdLogs.length,
      fundedLogs: fundedLogs.length,
      merkleUpdatedLogs: merkleUpdatedLogs.length,
      claimPausedLogs: claimPausedLogs.length,
      claimedLogs: claimedLogs.length,
      totalLogs: rewardRows.length,
    });

    if (delayMs > 0) {
      await sleep(delayMs);
    }

    cursor = rangeTo + 1n;
  }

  await updateCheckpoint({
    supabase,
    chainKey: config.key,
    sourceKey: "rewardDistributor",
    updates: {
      last_synced_block: Number(toBlock),
      latest_safe_block: Number(toBlock),
      block_range_size: Number(blockRangeSize),
      status: "success",
    },
  });

  return {
    sourceKey: "rewardDistributor",
    fromBlock: fromBlock.toString(),
    toBlock: toBlock.toString(),
    scannedRanges,
    rewardEvents: insertedOrUpdatedEvents,
  };
}

async function fetchAllRewardEvents({
  supabase,
  chainKey,
}: {
  supabase: SupabaseClient;
  chainKey: string;
}) {
  const pageSize = 1000;
  let from = 0;
  const rows: RewardRoundEventRow[] = [];

  while (true) {
    const to = from + pageSize - 1;

    const { data, error } = await supabase
      .from("reward_round_events")
      .select("*")
      .eq("chain_key", chainKey)
      .order("block_number", { ascending: true })
      .order("log_index", { ascending: true })
      .range(from, to);

    if (error) {
      throw new Error(`Failed to fetch reward_round_events: ${error.message}`);
    }

    const batch = (data ?? []) as RewardRoundEventRow[];
    rows.push(...batch);

    if (batch.length < pageSize) {
      break;
    }

    from += pageSize;
  }

  return rows;
}

function rebuildRewardRoundRows(events: RewardRoundEventRow[]) {
  const rounds = new Map<string, RewardRoundState>();
  const claims: RewardClaimRow[] = [];

  for (const event of [...events].sort(compareRewardEvents)) {
    if (!event.round_id) {
      continue;
    }

    const key = `${event.chain_key}:${event.round_id}`;
    const existing = rounds.get(key);

    if (event.event_type === "reward_round_created") {
      if (
        !event.period_start_unix ||
        !event.period_end_unix ||
        !event.amount_wei
      ) {
        throw new Error(
          `Malformed RewardRoundCreated event: ${event.event_key}`,
        );
      }

      rounds.set(key, {
        chain_key: event.chain_key,
        round_id: event.round_id,
        status: "created",
        period_start: unixToIso(event.period_start_unix),
        period_end: unixToIso(event.period_end_unix),
        period_start_unix: event.period_start_unix,
        period_end_unix: event.period_end_unix,
        reward_amount_wei: event.amount_wei,
        funded_amount_wei: "0",
        claimed_amount_wei: "0",
        merkle_root: event.merkle_root,
        claim_paused: false,
        created_tx_hash: event.tx_hash,
        funded_tx_hash: null,
        metadata: {
          source: "reward-events-rebuild-v1",
          createdBlockNumber: event.block_number,
          createdEventKey: event.event_key,
        },
      });

      continue;
    }

    if (!existing) {
      continue;
    }

    if (event.event_type === "reward_round_funded") {
      if (!event.funded_amount_wei) {
        throw new Error(
          `Malformed RewardRoundFunded event: ${event.event_key}`,
        );
      }

      existing.funded_amount_wei = event.funded_amount_wei;
      existing.funded_tx_hash = event.tx_hash;
      existing.status =
        BigInt(existing.funded_amount_wei) >= BigInt(existing.reward_amount_wei)
          ? "funded"
          : "created";
    }

    if (event.event_type === "merkle_root_updated") {
      existing.merkle_root = event.new_merkle_root ?? event.merkle_root;
    }

    if (event.event_type === "claim_paused_updated") {
      existing.claim_paused = event.claim_paused === true;
      existing.status = existing.claim_paused
        ? "claim_paused"
        : existing.status;
    }

    if (event.event_type === "claimed") {
      if (!event.account_address || !event.amount_wei) {
        throw new Error(`Malformed Claimed event: ${event.event_key}`);
      }

      existing.claimed_amount_wei = addNumericStrings(
        existing.claimed_amount_wei,
        event.amount_wei,
      );

      if (
        BigInt(existing.claimed_amount_wei) >=
        BigInt(existing.reward_amount_wei)
      ) {
        existing.status = "closed";
      }

      claims.push({
        event_key: event.event_key,
        chain_key: event.chain_key,
        round_id: event.round_id,
        account_address: event.account_address,
        amount_wei: event.amount_wei,
        tx_hash: event.tx_hash,
        log_index: event.log_index,
        block_number: event.block_number,
        block_timestamp: event.block_timestamp,
      });
    }

    rounds.set(key, existing);
  }

  return {
    rounds: [...rounds.values()],
    claims,
  };
}

async function clearRewardClaimsForChain({
  supabase,
  chainKey,
}: {
  supabase: SupabaseClient;
  chainKey: string;
}) {
  const { error } = await supabase
    .from("reward_claims")
    .delete()
    .eq("chain_key", chainKey);

  if (error) {
    throw new Error(`Failed to clear reward_claims: ${error.message}`);
  }
}

async function rebuildRewardState({
  supabase,
  chainKey,
}: {
  supabase: SupabaseClient;
  chainKey: string;
}) {
  const events = await fetchAllRewardEvents({
    supabase,
    chainKey,
  });

  const { rounds, claims } = rebuildRewardRoundRows(events);

  await upsertRows({
    supabase,
    table: "reward_rounds",
    rows: rounds,
    onConflict: "chain_key,round_id",
  });

  await clearRewardClaimsForChain({
    supabase,
    chainKey,
  });

  await upsertRows({
    supabase,
    table: "reward_claims",
    rows: claims,
    onConflict: "event_key",
  });

  return {
    rewardEventCount: events.length,
    rewardRoundCount: rounds.length,
    rewardClaimCount: claims.length,
  };
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

async function main() {
  const config = getIndexerNetworkConfig(process.argv[2]);
  const deployment = readDeploymentRecord(config);
  const supabase = createSupabaseServiceClient();
  const repository = createSupabaseIndexerRepository(supabase);

  const rpcUrl = process.env[config.rpcEnv];

  if (!rpcUrl) {
    throw new Error(`Missing RPC env for DB reward sync: ${config.rpcEnv}`);
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

  const rewardDistributorAddress = getAddress(
    deployment.contracts.rewardDistributor!,
  );

  console.log("Running DB Reward event sync...");
  console.log({
    network: config.key,
    chainId: config.chainId,
    label: config.label,
    rewardDistributorAddress,
    latestBlock: latestBlock.toString(),
    latestSafeBlock: latestSafeBlock.toString(),
    requestedToBlock: requestedToBlock.toString(),
    blockRangeSize: blockRangeSize.toString(),
  });

  const run = await repository.startRun({
    chainKey: config.key,
    runKind: "sync",
    metadata: {
      stage: "reward-event-sync-to-supabase-v1",
      command: "indexer:sync-rewards",
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
      sourceKey: "rewardDistributor",
      blockRangeSize: Number(blockRangeSize),
      latestSafeBlock: Number(requestedToBlock),
    });

    const fromBlockNumber =
      checkpoint.last_synced_block !== null &&
      checkpoint.last_synced_block !== undefined
        ? toNumber(checkpoint.last_synced_block, "last_synced_block") + 1
        : toNumber(checkpoint.from_block, "from_block");

    const toBlockNumber = Number(requestedToBlock);

    let syncResult: unknown;

    if (fromBlockNumber > toBlockNumber) {
      console.log("rewardDistributor: already synced.", {
        fromBlock: fromBlockNumber,
        requestedToBlock: toBlockNumber,
      });

      syncResult = {
        sourceKey: "rewardDistributor",
        skipped: true,
        reason: "already_synced",
        fromBlock: fromBlockNumber,
        toBlock: toBlockNumber,
      };
    } else {
      const blockTimestampCache = new Map<string, BlockCacheValue>();

      syncResult = await syncRewardEvents({
        supabase,
        client,
        config,
        rewardDistributorAddress,
        fromBlock: BigInt(fromBlockNumber),
        toBlock: BigInt(toBlockNumber),
        blockRangeSize,
        blockTimestampCache,
      });
    }

    const rebuildResult = await rebuildRewardState({
      supabase,
      chainKey: config.key,
    });

    await repository.finishRun({
      runId: run.id,
      status: "success",
      metadata: {
        ...run.metadata,
        syncResult,
        rebuildResult,
      },
    });

    console.log("DB Reward event sync complete.");
    console.log({
      runId: run.id,
      syncResult,
      rebuildResult,
    });
  } catch (error) {
    await updateCheckpoint({
      supabase,
      chainKey: config.key,
      sourceKey: "rewardDistributor",
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
