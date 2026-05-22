import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createPublicClient, formatUnits, http, parseUnits } from "viem";
import { baseSepolia, sepolia } from "viem/chains";

export type BoundaryChainKey = "baseSepolia" | "ethereumSepolia";

type SyncJobStatus =
  | "queued"
  | "running"
  | "paused"
  | "success"
  | "failed"
  | "cancelled";

type TargetStatus =
  | "queued"
  | "running"
  | "paused"
  | "success"
  | "failed"
  | "cancelled"
  | "skipped";

type BoundaryTaskKey =
  | "roty"
  | "melting"
  | "amanda"
  | "staking"
  | "rewardDistributor"
  | "rebuildOwnership"
  | "rebuildStakePositions"
  | "calculateValidIntervals"
  | "calculateRewards"
  | "generateMerkle";

type SyncJobRow = {
  id: string;
  job_kind: "reward_boundary_sync";
  status: SyncJobStatus;
  reward_amount_wei: string | null;
  requested_by: string | null;
  started_at: string | null;
  finished_at: string | null;
  error_message: string | null;
  request_payload: Record<string, unknown>;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

type SyncTargetRow = {
  id: string;
  job_id: string;
  chain_key: BoundaryChainKey;
  task_key: BoundaryTaskKey;
  status: TargetStatus;
  from_block: number | null;
  target_block: number | null;
  last_processed_block: number | null;
  block_range_size: number | null;
  attempts: number;
  next_attempt_at: string | null;
  started_at: string | null;
  finished_at: string | null;
  error_message: string | null;
  metadata: Record<string, unknown>;
};

type CheckpointRow = {
  chain_key: BoundaryChainKey;
  source_key: string;
  from_block: number;
  last_synced_block: number | null;
};

type ContractRow = {
  chain_key: BoundaryChainKey;
  contract_key: string;
  deployment_block: number | null;
  indexer_from_block: number | null;
};

type BoundarySnapshotRow = {
  id: string;
  sync_job_id: string;
  chain_key: BoundaryChainKey;
  status: string;
  from_block: number;
  to_block: number;
  from_block_timestamp: string | null;
  to_block_timestamp: string | null;
  reward_amount_wei: string | null;
  metadata: Record<string, unknown>;
};

type WorkerResult =
  | {
      ok: true;
      action: "no_active_job" | "locked" | "target_completed" | "job_completed";
      jobId?: string;
      targetId?: string;
      details?: Record<string, unknown>;
    }
  | {
      ok: false;
      action: "target_failed";
      jobId: string;
      targetId: string;
      error: string;
    };

const CHAIN_KEYS: BoundaryChainKey[] = ["baseSepolia", "ethereumSepolia"];

const SYNC_TASKS: BoundaryTaskKey[] = [
  "roty",
  "melting",
  "amanda",
  "staking",
  "rewardDistributor",
];

const REBUILD_TASKS: BoundaryTaskKey[] = [
  "rebuildOwnership",
  "rebuildStakePositions",
  "calculateValidIntervals",
  "calculateRewards",
  "generateMerkle",
];

const ALL_TASKS: BoundaryTaskKey[] = [...SYNC_TASKS, ...REBUILD_TASKS];

const TASK_ORDER: Record<BoundaryTaskKey, number> = {
  roty: 10,
  melting: 11,
  amanda: 12,
  staking: 20,
  rewardDistributor: 30,
  rebuildOwnership: 40,
  rebuildStakePositions: 50,
  calculateValidIntervals: 60,
  calculateRewards: 70,
  generateMerkle: 80,
};

const CONTRACT_KEY_BY_TASK: Partial<Record<BoundaryTaskKey, string>> = {
  roty: "roty",
  melting: "melting",
  amanda: "amanda",
  staking: "staking",
  rewardDistributor: "rewardDistributor",
};

const FROM_BLOCK_ENV_BY_CHAIN: Record<BoundaryChainKey, string> = {
  baseSepolia: "BASE_SEPOLIA_INDEXER_FROM_BLOCK",
  ethereumSepolia: "ETHEREUM_SEPOLIA_INDEXER_FROM_BLOCK",
};

const TO_BLOCK_ENV_BY_CHAIN: Record<BoundaryChainKey, string> = {
  baseSepolia: "BASE_SEPOLIA_INDEXER_TO_BLOCK",
  ethereumSepolia: "ETHEREUM_SEPOLIA_INDEXER_TO_BLOCK",
};

const RPC_ENV_BY_CHAIN: Record<BoundaryChainKey, string> = {
  baseSepolia: "BASE_SEPOLIA_RPC_URL",
  ethereumSepolia: "ETHEREUM_SEPOLIA_RPC_URL",
};

const CHAIN_ALIAS: Record<string, BoundaryChainKey> = {
  base: "baseSepolia",
  baseSepolia: "baseSepolia",
  ethereum: "ethereumSepolia",
  ethereumSepolia: "ethereumSepolia",
};

function parsePositiveInt(value: string | undefined, fallback: number) {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function parseBlock(value: unknown, label: string) {
  if (typeof value === "number" && Number.isSafeInteger(value) && value > 0) {
    return value;
  }

  if (typeof value === "string" && /^\d+$/.test(value.trim())) {
    const parsed = Number(value.trim());
    if (Number.isSafeInteger(parsed) && parsed > 0) return parsed;
  }

  throw new Error(`${label} must be a positive integer block number.`);
}

function parseRewardAmountWei(value: unknown) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error("rewardAmountOiOi is required.");
  }

  if (!/^\d+(\.\d+)?$/.test(value.trim())) {
    throw new Error("rewardAmountOiOi must be a positive decimal string.");
  }

  const amount = parseUnits(value.trim(), 18);
  if (amount <= 0n) {
    throw new Error("rewardAmountOiOi must be greater than zero.");
  }

  return amount.toString();
}

function normalizeChainKey(value: string) {
  const chainKey = CHAIN_ALIAS[value];
  if (!chainKey) {
    throw new Error(`Unsupported chain "${value}".`);
  }
  return chainKey;
}

function getBlockRangeSize() {
  return parsePositiveInt(process.env.INDEXER_BLOCK_RANGE, 10);
}

function getWorkerBlockSpan() {
  return parsePositiveInt(process.env.INDEXER_WORKER_BLOCK_SPAN, 100);
}

function getCommandTimeoutMs() {
  return parsePositiveInt(
    process.env.INDEXER_WORKER_COMMAND_TIMEOUT_MS,
    55_000,
  );
}

function getLockTtlSeconds() {
  return parsePositiveInt(process.env.INDEXER_WORKER_LOCK_TTL_SECONDS, 120);
}

function getRetryDelaySeconds(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("429") || message.toLowerCase().includes("rate")) {
    return parsePositiveInt(
      process.env.INDEXER_WORKER_RATE_LIMIT_DELAY_SECONDS,
      300,
    );
  }

  return parsePositiveInt(process.env.INDEXER_WORKER_RETRY_DELAY_SECONDS, 60);
}

function requireCronSecret(requestSecret: string | null) {
  const expected = process.env.INDEXER_CRON_SECRET;
  if (!expected) return;
  if (requestSecret !== expected) {
    throw new Error("Invalid INDEXER_CRON_SECRET.");
  }
}

function targetSort(a: SyncTargetRow, b: SyncTargetRow) {
  if (a.chain_key !== b.chain_key) {
    return a.chain_key.localeCompare(b.chain_key);
  }
  return TASK_ORDER[a.task_key] - TASK_ORDER[b.task_key];
}

function isSyncTask(taskKey: BoundaryTaskKey) {
  return SYNC_TASKS.includes(taskKey);
}

function isCollectionTask(taskKey: BoundaryTaskKey) {
  return taskKey === "roty" || taskKey === "melting" || taskKey === "amanda";
}

function commandForTask(taskKey: BoundaryTaskKey) {
  if (isCollectionTask(taskKey)) return "indexer:sync-transfers";
  if (taskKey === "staking") return "indexer:sync-staking";
  if (taskKey === "rewardDistributor") return "indexer:sync-rewards";
  if (taskKey === "rebuildOwnership") return "indexer:rebuild-ownership";
  if (taskKey === "rebuildStakePositions")
    return "indexer:rebuild-stake-positions";
  if (taskKey === "calculateValidIntervals") {
    return "indexer:calculate-valid-intervals";
  }
  if (taskKey === "calculateRewards") return "rewards:calculate";
  if (taskKey === "generateMerkle") return "rewards:merkle-db";
  throw new Error(`Unsupported boundary task: ${taskKey}`);
}

function getRpcUrl(chainKey: BoundaryChainKey) {
  const envName = RPC_ENV_BY_CHAIN[chainKey];
  const value = process.env[envName];

  if (!value || value.trim() === "") {
    throw new Error(`Missing ${envName} for boundary snapshot timestamps.`);
  }

  return value.trim();
}

function getViemChain(chainKey: BoundaryChainKey) {
  return chainKey === "baseSepolia" ? baseSepolia : sepolia;
}

function unixFromIso(value: string) {
  const timestampMs = Date.parse(value);

  if (!Number.isFinite(timestampMs)) {
    throw new Error(`Invalid timestamp: ${value}`);
  }

  return Math.floor(timestampMs / 1000).toString();
}

async function fetchBlockTimestamp({
  chainKey,
  blockNumber,
}: {
  chainKey: BoundaryChainKey;
  blockNumber: number;
}) {
  const client = createPublicClient({
    chain: getViemChain(chainKey),
    transport: http(getRpcUrl(chainKey)),
  });

  const block = await client.getBlock({
    blockNumber: BigInt(blockNumber),
  });

  return new Date(Number(block.timestamp) * 1000).toISOString();
}

async function updateSnapshotTimestamps({
  supabase,
  snapshot,
}: {
  supabase: SupabaseClient;
  snapshot: BoundarySnapshotRow;
}) {
  if (snapshot.from_block_timestamp && snapshot.to_block_timestamp) {
    return snapshot;
  }

  const [fromBlockTimestamp, toBlockTimestamp] = await Promise.all([
    snapshot.from_block_timestamp
      ? Promise.resolve(snapshot.from_block_timestamp)
      : fetchBlockTimestamp({
          chainKey: snapshot.chain_key,
          blockNumber: snapshot.from_block,
        }),
    snapshot.to_block_timestamp
      ? Promise.resolve(snapshot.to_block_timestamp)
      : fetchBlockTimestamp({
          chainKey: snapshot.chain_key,
          blockNumber: snapshot.to_block,
        }),
  ]);

  const { data, error } = await supabase
    .from("reward_boundary_snapshots")
    .update({
      from_block_timestamp: fromBlockTimestamp,
      to_block_timestamp: toBlockTimestamp,
      metadata: {
        ...snapshot.metadata,
        timestampSource: "rpc_getBlock",
        timestampUpdatedAt: new Date().toISOString(),
      },
    })
    .eq("id", snapshot.id)
    .select("*")
    .single();

  if (error) {
    throw new Error(
      `Failed to update boundary snapshot timestamps: ${error.message}`,
    );
  }

  return data as BoundarySnapshotRow;
}

async function fetchBoundarySnapshotContext({
  supabase,
  target,
}: {
  supabase: SupabaseClient;
  target: SyncTargetRow;
}) {
  const { data, error } = await supabase
    .from("reward_boundary_snapshots")
    .select("*")
    .eq("sync_job_id", target.job_id)
    .eq("chain_key", target.chain_key)
    .single();

  if (error) {
    throw new Error(`Failed to read boundary snapshot: ${error.message}`);
  }

  const snapshot = await updateSnapshotTimestamps({
    supabase,
    snapshot: data as BoundarySnapshotRow,
  });

  if (!snapshot.from_block_timestamp || !snapshot.to_block_timestamp) {
    throw new Error("Boundary snapshot timestamps are incomplete.");
  }

  if (
    !snapshot.reward_amount_wei ||
    !/^\d+$/.test(snapshot.reward_amount_wei)
  ) {
    throw new Error("Boundary snapshot reward_amount_wei is missing.");
  }

  const periodStartUnix = unixFromIso(snapshot.from_block_timestamp);
  const periodEndUnix = unixFromIso(snapshot.to_block_timestamp);

  if (BigInt(periodEndUnix) <= BigInt(periodStartUnix)) {
    throw new Error("Boundary snapshot period end must be after period start.");
  }

  return {
    snapshot,
    periodStartUnix,
    periodEndUnix,
    rewardAmountOiOi: formatUnits(BigInt(snapshot.reward_amount_wei), 18),
  };
}

async function attachBoundarySnapshotToRewardOutputs({
  supabase,
  context,
}: {
  supabase: SupabaseClient;
  context: Awaited<ReturnType<typeof fetchBoundarySnapshotContext>>;
}) {
  const patch = {
    boundary_snapshot_id: context.snapshot.id,
    boundary_from_block: context.snapshot.from_block,
    boundary_to_block: context.snapshot.to_block,
    boundary_from_block_timestamp: context.snapshot.from_block_timestamp,
    boundary_to_block_timestamp: context.snapshot.to_block_timestamp,
  };

  const calculationUpdate = await supabase
    .from("reward_calculations")
    .update(patch)
    .eq("chain_key", context.snapshot.chain_key)
    .eq("period_start_unix", context.periodStartUnix)
    .eq("period_end_unix", context.periodEndUnix);

  if (calculationUpdate.error) {
    throw new Error(
      `Failed to attach boundary snapshot to calculations: ${calculationUpdate.error.message}`,
    );
  }

  const roundUpdate = await supabase
    .from("reward_rounds")
    .update(patch)
    .eq("chain_key", context.snapshot.chain_key)
    .eq("round_id", context.periodEndUnix);

  if (roundUpdate.error) {
    throw new Error(
      `Failed to attach boundary snapshot to reward round: ${roundUpdate.error.message}`,
    );
  }
}

async function fetchCheckpoints(
  supabase: SupabaseClient,
  chainKey: BoundaryChainKey,
) {
  const { data, error } = await supabase
    .from("indexer_checkpoints")
    .select("chain_key, source_key, from_block, last_synced_block")
    .eq("chain_key", chainKey);

  if (error) throw new Error(`Failed to read checkpoints: ${error.message}`);

  return new Map(
    ((data ?? []) as CheckpointRow[]).map((row) => [row.source_key, row]),
  );
}

async function fetchContracts(
  supabase: SupabaseClient,
  chainKey: BoundaryChainKey,
) {
  const { data, error } = await supabase
    .from("contracts")
    .select("chain_key, contract_key, deployment_block, indexer_from_block")
    .eq("chain_key", chainKey);

  if (error) throw new Error(`Failed to read contracts: ${error.message}`);

  return new Map(
    ((data ?? []) as ContractRow[]).map((row) => [row.contract_key, row]),
  );
}

async function resolveFromBlock({
  supabase,
  chainKey,
  taskKey,
}: {
  supabase: SupabaseClient;
  chainKey: BoundaryChainKey;
  taskKey: BoundaryTaskKey;
}) {
  if (!isSyncTask(taskKey)) return null;

  const checkpoints = await fetchCheckpoints(supabase, chainKey);
  const checkpoint = checkpoints.get(taskKey);
  if (
    checkpoint?.last_synced_block !== null &&
    checkpoint?.last_synced_block !== undefined
  ) {
    return Number(checkpoint.last_synced_block) + 1;
  }
  if (checkpoint?.from_block !== null && checkpoint?.from_block !== undefined) {
    return Number(checkpoint.from_block);
  }

  const contractKey = CONTRACT_KEY_BY_TASK[taskKey];
  if (contractKey) {
    const contracts = await fetchContracts(supabase, chainKey);
    const contract = contracts.get(contractKey);

    if (
      contract?.indexer_from_block !== null &&
      contract?.indexer_from_block !== undefined
    ) {
      return Number(contract.indexer_from_block);
    }
    if (
      contract?.deployment_block !== null &&
      contract?.deployment_block !== undefined
    ) {
      return Number(contract.deployment_block);
    }
  }

  const envValue = process.env[FROM_BLOCK_ENV_BY_CHAIN[chainKey]];
  if (envValue && /^\d+$/.test(envValue)) {
    return Number(envValue);
  }

  throw new Error(`Missing from block for ${chainKey}:${taskKey}.`);
}

async function fetchLatestBoundaryForChain({
  supabase,
  chainKey,
}: {
  supabase: SupabaseClient;
  chainKey: BoundaryChainKey;
}) {
  const { data, error } = await supabase
    .from("reward_boundary_snapshots")
    .select("to_block")
    .eq("chain_key", chainKey)
    .eq("status", "success")
    .order("to_block", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to read boundary snapshots: ${error.message}`);
  }

  return data?.to_block !== undefined && data?.to_block !== null
    ? Number(data.to_block)
    : null;
}

async function insertTargets({
  supabase,
  jobId,
  chainKey,
  targetBlock,
}: {
  supabase: SupabaseClient;
  jobId: string;
  chainKey: BoundaryChainKey;
  targetBlock: number;
}) {
  const rows = [];
  const previousBoundary = await fetchLatestBoundaryForChain({
    supabase,
    chainKey,
  });

  for (const taskKey of ALL_TASKS) {
    const fromBlock =
      isSyncTask(taskKey) && previousBoundary !== null
        ? previousBoundary + 1
        : await resolveFromBlock({ supabase, chainKey, taskKey });
    const alreadySynced =
      isSyncTask(taskKey) && fromBlock !== null && fromBlock > targetBlock;

    rows.push({
      job_id: jobId,
      chain_key: chainKey,
      task_key: taskKey,
      status: alreadySynced ? "success" : "queued",
      from_block: alreadySynced ? targetBlock : fromBlock,
      target_block: isSyncTask(taskKey) ? targetBlock : null,
      last_processed_block:
        isSyncTask(taskKey) && fromBlock !== null
          ? alreadySynced
            ? targetBlock
            : fromBlock - 1
          : null,
      block_range_size: getBlockRangeSize(),
      finished_at: alreadySynced ? new Date().toISOString() : null,
      metadata: {
        resolvedFromBlock: fromBlock,
        previousBoundaryBlock: previousBoundary,
        alreadySynced,
      },
    });
  }

  const { error } = await supabase
    .from("indexer_sync_job_targets")
    .insert(rows);
  if (error)
    throw new Error(`Failed to insert sync job targets: ${error.message}`);
}

async function insertBoundarySnapshot({
  supabase,
  jobId,
  chainKey,
  targetBlock,
  rewardAmountWei,
}: {
  supabase: SupabaseClient;
  jobId: string;
  chainKey: BoundaryChainKey;
  targetBlock: number;
  rewardAmountWei: string;
}) {
  const previousBoundary = await fetchLatestBoundaryForChain({
    supabase,
    chainKey,
  });

  const fromBlock =
    previousBoundary !== null
      ? previousBoundary + 1
      : await resolveFromBlock({ supabase, chainKey, taskKey: "staking" });

  const { error } = await supabase.from("reward_boundary_snapshots").insert({
    sync_job_id: jobId,
    chain_key: chainKey,
    status: "pending",
    from_block: fromBlock,
    to_block: targetBlock,
    reward_amount_wei: rewardAmountWei,
    metadata: {
      previousBoundaryBlock: previousBoundary,
    },
  });

  if (error) {
    throw new Error(`Failed to insert boundary snapshot: ${error.message}`);
  }
}

export async function createBoundarySyncJob({
  supabase,
  payload,
  requestedBy,
}: {
  supabase: SupabaseClient;
  payload: Record<string, unknown>;
  requestedBy?: string | null;
}) {
  const chainsPayload = payload.chains;
  if (
    !chainsPayload ||
    typeof chainsPayload !== "object" ||
    Array.isArray(chainsPayload)
  ) {
    throw new Error("chains object is required.");
  }

  const rewardAmountWei = parseRewardAmountWei(payload.rewardAmountOiOi);
  const chainTargets = new Map<BoundaryChainKey, number>();

  for (const [key, value] of Object.entries(chainsPayload)) {
    const chainKey = normalizeChainKey(key);
    chainTargets.set(chainKey, parseBlock(value, `${chainKey} target block`));
  }

  for (const chainKey of CHAIN_KEYS) {
    if (!chainTargets.has(chainKey)) {
      throw new Error(`Missing target block for ${chainKey}.`);
    }
  }

  const { data: activeJob, error: activeError } = await supabase
    .from("indexer_sync_jobs")
    .select("id, status")
    .eq("job_kind", "reward_boundary_sync")
    .in("status", ["queued", "running", "paused"])
    .limit(1)
    .maybeSingle();

  if (activeError) {
    throw new Error(`Failed to check active sync job: ${activeError.message}`);
  }

  if (activeJob) {
    throw new Error(
      `A reward boundary sync job is already active: ${activeJob.id}`,
    );
  }

  const { data: job, error } = await supabase
    .from("indexer_sync_jobs")
    .insert({
      job_kind: "reward_boundary_sync",
      status: "queued",
      reward_amount_wei: rewardAmountWei,
      requested_by: requestedBy ?? null,
      request_payload: {
        chains: Object.fromEntries(chainTargets),
        rewardAmountOiOi: payload.rewardAmountOiOi,
      },
      metadata: {
        createdBy: "admin-boundary-sync-api-v1",
      },
    })
    .select("*")
    .single();

  if (error)
    throw new Error(`Failed to create boundary sync job: ${error.message}`);

  const syncJob = job as SyncJobRow;

  for (const chainKey of CHAIN_KEYS) {
    const targetBlock = chainTargets.get(chainKey)!;
    await insertTargets({ supabase, jobId: syncJob.id, chainKey, targetBlock });
    await insertBoundarySnapshot({
      supabase,
      jobId: syncJob.id,
      chainKey,
      targetBlock,
      rewardAmountWei,
    });
  }

  return fetchBoundarySyncJob({ supabase, jobId: syncJob.id });
}

export async function fetchBoundarySyncJob({
  supabase,
  jobId,
}: {
  supabase: SupabaseClient;
  jobId?: string | null;
}) {
  let jobQuery = supabase
    .from("indexer_sync_jobs")
    .select("*")
    .eq("job_kind", "reward_boundary_sync")
    .order("created_at", { ascending: false });

  if (jobId) {
    jobQuery = jobQuery.eq("id", jobId);
  }

  const { data: jobs, error } = await jobQuery.limit(jobId ? 1 : 10);
  if (error) throw new Error(`Failed to read sync jobs: ${error.message}`);

  const jobRows = (jobs ?? []) as SyncJobRow[];
  const jobIds = jobRows.map((job) => job.id);

  if (jobIds.length === 0) {
    return { jobs: [] };
  }

  const { data: targets, error: targetsError } = await supabase
    .from("indexer_sync_job_targets")
    .select("*")
    .in("job_id", jobIds);

  if (targetsError) {
    throw new Error(`Failed to read sync job targets: ${targetsError.message}`);
  }

  const { data: snapshots, error: snapshotsError } = await supabase
    .from("reward_boundary_snapshots")
    .select("*")
    .in("sync_job_id", jobIds);

  if (snapshotsError) {
    throw new Error(
      `Failed to read boundary snapshots: ${snapshotsError.message}`,
    );
  }

  return {
    jobs: jobRows.map((job) => ({
      ...job,
      targets: ((targets ?? []) as SyncTargetRow[])
        .filter((target) => target.job_id === job.id)
        .sort(targetSort),
      snapshots: (snapshots ?? []).filter(
        (snapshot) => snapshot.sync_job_id === job.id,
      ),
    })),
  };
}

async function acquireLock({
  supabase,
  lockKey,
  holderId,
  chainKey,
  taskKey,
}: {
  supabase: SupabaseClient;
  lockKey: string;
  holderId: string;
  chainKey: BoundaryChainKey;
  taskKey: BoundaryTaskKey;
}) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + getLockTtlSeconds() * 1000);

  await supabase
    .from("indexer_locks")
    .delete()
    .lt("expires_at", now.toISOString());

  const { error } = await supabase.from("indexer_locks").insert({
    lock_key: lockKey,
    holder_id: holderId,
    chain_key: chainKey,
    task_key: taskKey,
    acquired_at: now.toISOString(),
    expires_at: expiresAt.toISOString(),
    metadata: {
      worker: "boundary-sync-worker-v1",
    },
  });

  return !error;
}

async function releaseLock({
  supabase,
  lockKey,
  holderId,
}: {
  supabase: SupabaseClient;
  lockKey: string;
  holderId: string;
}) {
  await supabase
    .from("indexer_locks")
    .delete()
    .eq("lock_key", lockKey)
    .eq("holder_id", holderId);
}

async function updateTarget(
  supabase: SupabaseClient,
  targetId: string,
  patch: Record<string, unknown>,
) {
  const { error } = await supabase
    .from("indexer_sync_job_targets")
    .update(patch)
    .eq("id", targetId);

  if (error) throw new Error(`Failed to update job target: ${error.message}`);
}

async function updateJob(
  supabase: SupabaseClient,
  jobId: string,
  patch: Record<string, unknown>,
) {
  const { error } = await supabase
    .from("indexer_sync_jobs")
    .update(patch)
    .eq("id", jobId);

  if (error) throw new Error(`Failed to update sync job: ${error.message}`);
}

async function markSnapshots({
  supabase,
  jobId,
  status,
}: {
  supabase: SupabaseClient;
  jobId: string;
  status: "running" | "success" | "failed";
}) {
  const patch: Record<string, unknown> = { status };
  if (status === "success") {
    patch.completed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("reward_boundary_snapshots")
    .update(patch)
    .eq("sync_job_id", jobId);

  if (error) {
    throw new Error(`Failed to update boundary snapshots: ${error.message}`);
  }
}

async function refreshTargetProgress({
  supabase,
  target,
}: {
  supabase: SupabaseClient;
  target: SyncTargetRow;
}) {
  if (!isSyncTask(target.task_key)) {
    return target;
  }

  const checkpoints = await fetchCheckpoints(supabase, target.chain_key);
  const checkpoint = checkpoints.get(target.task_key);
  const lastProcessedBlock =
    checkpoint?.last_synced_block ?? target.last_processed_block;

  const status =
    target.target_block !== null &&
    lastProcessedBlock !== null &&
    lastProcessedBlock >= target.target_block
      ? "success"
      : "queued";

  await updateTarget(supabase, target.id, {
    status,
    last_processed_block: lastProcessedBlock,
    finished_at: status === "success" ? new Date().toISOString() : null,
    error_message: null,
  });

  return { ...target, status, last_processed_block: lastProcessedBlock };
}

async function runNpmScript({
  script,
  chainKey,
  env,
}: {
  script: string;
  chainKey: BoundaryChainKey;
  env: Record<string, string>;
}) {
  const { execFile } = await import("node:child_process");
  const { promisify } = await import("node:util");
  const execFileAsync = promisify(execFile);
  const timeout = getCommandTimeoutMs();

  await execFileAsync("npm", ["run", script, "--", chainKey], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      ...env,
    },
    timeout,
    maxBuffer: 1024 * 1024 * 8,
  });
}

async function processSyncTarget({
  supabase,
  target,
}: {
  supabase: SupabaseClient;
  target: SyncTargetRow;
}) {
  const targetBlock = target.target_block;
  if (targetBlock === null) {
    throw new Error(`Sync target ${target.task_key} is missing target_block.`);
  }

  const lastProcessedBlock =
    target.last_processed_block ??
    (target.from_block !== null ? target.from_block - 1 : null);

  if (lastProcessedBlock !== null && lastProcessedBlock >= targetBlock) {
    await updateTarget(supabase, target.id, {
      status: "success",
      finished_at: new Date().toISOString(),
    });
    return;
  }

  const fromBlock =
    lastProcessedBlock !== null
      ? lastProcessedBlock + 1
      : await resolveFromBlock({
          supabase,
          chainKey: target.chain_key,
          taskKey: target.task_key,
        });

  if (fromBlock === null) {
    throw new Error(`Sync target ${target.task_key} is missing from_block.`);
  }

  const batchToBlock = Math.min(
    targetBlock,
    Math.max(fromBlock, fromBlock + getWorkerBlockSpan() - 1),
  );

  await updateTarget(supabase, target.id, {
    status: "running",
    started_at: target.started_at ?? new Date().toISOString(),
    attempts: target.attempts + 1,
    error_message: null,
  });

  await runNpmScript({
    script: commandForTask(target.task_key),
    chainKey: target.chain_key,
    env: {
      [TO_BLOCK_ENV_BY_CHAIN[target.chain_key]]: batchToBlock.toString(),
    },
  });

  await refreshTargetProgress({ supabase, target });
}

async function processRebuildTarget({
  supabase,
  target,
}: {
  supabase: SupabaseClient;
  target: SyncTargetRow;
}) {
  const boundaryContext =
    target.task_key === "calculateValidIntervals" ||
    target.task_key === "calculateRewards" ||
    target.task_key === "generateMerkle"
      ? await fetchBoundarySnapshotContext({ supabase, target })
      : null;

  const env: Record<string, string> = {};

  if (target.task_key === "calculateValidIntervals" && boundaryContext) {
    env.VALID_INTERVAL_PERIOD_START_UNIX = boundaryContext.periodStartUnix;
    env.VALID_INTERVAL_PERIOD_END_UNIX = boundaryContext.periodEndUnix;
  }

  if (target.task_key === "calculateRewards" && boundaryContext) {
    env.REWARD_CALCULATION_AMOUNT_OIOI = boundaryContext.rewardAmountOiOi;
    env.REWARD_PERIOD_START_UNIX = boundaryContext.periodStartUnix;
    env.REWARD_PERIOD_END_UNIX = boundaryContext.periodEndUnix;
  }

  if (target.task_key === "generateMerkle" && boundaryContext) {
    env.REWARD_ROUND_ID = boundaryContext.periodEndUnix;
  }

  await updateTarget(supabase, target.id, {
    status: "running",
    started_at: target.started_at ?? new Date().toISOString(),
    attempts: target.attempts + 1,
    error_message: null,
  });

  await runNpmScript({
    script: commandForTask(target.task_key),
    chainKey: target.chain_key,
    env,
  });

  if (
    boundaryContext &&
    (target.task_key === "calculateRewards" ||
      target.task_key === "generateMerkle")
  ) {
    await attachBoundarySnapshotToRewardOutputs({
      supabase,
      context: boundaryContext,
    });
  }

  await updateTarget(supabase, target.id, {
    status: "success",
    finished_at: new Date().toISOString(),
    last_processed_block: target.target_block,
  });
}

function dependenciesSatisfied({
  target,
  targets,
}: {
  target: SyncTargetRow;
  targets: SyncTargetRow[];
}) {
  const sameChain = targets.filter(
    (item) => item.chain_key === target.chain_key,
  );

  if (isSyncTask(target.task_key)) return true;

  if (target.task_key === "rebuildOwnership") {
    return sameChain
      .filter((item) => isCollectionTask(item.task_key))
      .every((item) => item.status === "success");
  }

  if (target.task_key === "rebuildStakePositions") {
    return (
      sameChain.find((item) => item.task_key === "staking")?.status ===
        "success" &&
      sameChain.find((item) => item.task_key === "rebuildOwnership")?.status ===
        "success"
    );
  }

  if (target.task_key === "calculateValidIntervals") {
    return (
      sameChain.find((item) => item.task_key === "rebuildStakePositions")
        ?.status === "success"
    );
  }

  if (target.task_key === "calculateRewards") {
    return (
      sameChain.find((item) => item.task_key === "calculateValidIntervals")
        ?.status === "success"
    );
  }

  if (target.task_key === "generateMerkle") {
    return (
      sameChain.find((item) => item.task_key === "calculateRewards")?.status ===
      "success"
    );
  }

  return false;
}

async function findNextTarget({
  supabase,
  job,
}: {
  supabase: SupabaseClient;
  job: SyncJobRow;
}) {
  const { data, error } = await supabase
    .from("indexer_sync_job_targets")
    .select("*")
    .eq("job_id", job.id);

  if (error) throw new Error(`Failed to read job targets: ${error.message}`);

  const targets = ((data ?? []) as SyncTargetRow[]).sort(targetSort);

  for (const target of targets) {
    if (
      target.status === "success" ||
      target.status === "cancelled" ||
      target.status === "skipped"
    ) {
      continue;
    }

    if (
      target.next_attempt_at &&
      new Date(target.next_attempt_at) > new Date()
    ) {
      continue;
    }

    if (dependenciesSatisfied({ target, targets })) {
      return { target, targets };
    }
  }

  return { target: null, targets };
}

async function completeJobIfReady({
  supabase,
  job,
}: {
  supabase: SupabaseClient;
  job: SyncJobRow;
}) {
  const { data, error } = await supabase
    .from("indexer_sync_job_targets")
    .select("status")
    .eq("job_id", job.id);

  if (error)
    throw new Error(`Failed to check job completion: ${error.message}`);

  const rows = (data ?? []) as Array<{ status: TargetStatus }>;
  const allDone =
    rows.length > 0 && rows.every((row) => row.status === "success");

  if (!allDone) return false;

  await updateJob(supabase, job.id, {
    status: "success",
    finished_at: new Date().toISOString(),
    error_message: null,
  });
  await markSnapshots({ supabase, jobId: job.id, status: "success" });

  return true;
}

export async function processBoundarySyncBatch({
  supabase,
  requestSecret,
}: {
  supabase: SupabaseClient;
  requestSecret?: string | null;
}): Promise<WorkerResult> {
  requireCronSecret(requestSecret ?? null);

  const { data: jobData, error } = await supabase
    .from("indexer_sync_jobs")
    .select("*")
    .eq("job_kind", "reward_boundary_sync")
    .in("status", ["queued", "running", "paused"])
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error)
    throw new Error(`Failed to read active sync job: ${error.message}`);

  if (!jobData) {
    return { ok: true, action: "no_active_job" };
  }

  const job = jobData as SyncJobRow;

  if (job.status !== "running") {
    await updateJob(supabase, job.id, {
      status: "running",
      started_at: job.started_at ?? new Date().toISOString(),
      error_message: null,
    });
    await markSnapshots({ supabase, jobId: job.id, status: "running" });
  }

  const { target } = await findNextTarget({ supabase, job });
  if (!target) {
    const completed = await completeJobIfReady({ supabase, job });
    return {
      ok: true,
      action: completed ? "job_completed" : "no_active_job",
      jobId: job.id,
    };
  }

  const lockKey = `boundary-sync:${target.chain_key}:${target.task_key}`;
  const holderId = randomUUID();
  const locked = await acquireLock({
    supabase,
    lockKey,
    holderId,
    chainKey: target.chain_key,
    taskKey: target.task_key,
  });

  if (!locked) {
    return {
      ok: true,
      action: "locked",
      jobId: job.id,
      targetId: target.id,
    };
  }

  try {
    if (isSyncTask(target.task_key)) {
      await processSyncTarget({ supabase, target });
    } else {
      await processRebuildTarget({ supabase, target });
    }

    const completed = await completeJobIfReady({ supabase, job });
    return {
      ok: true,
      action: completed ? "job_completed" : "target_completed",
      jobId: job.id,
      targetId: target.id,
      details: {
        chainKey: target.chain_key,
        taskKey: target.task_key,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const retryDelaySeconds = getRetryDelaySeconds(error);
    const nextAttemptAt = new Date(
      Date.now() + retryDelaySeconds * 1000,
    ).toISOString();

    await updateTarget(supabase, target.id, {
      status: "paused",
      error_message: message,
      next_attempt_at: nextAttemptAt,
    }).catch(() => undefined);

    await updateJob(supabase, job.id, {
      status: "paused",
      error_message: message,
    }).catch(() => undefined);

    return {
      ok: false,
      action: "target_failed",
      jobId: job.id,
      targetId: target.id,
      error: message,
    };
  } finally {
    await releaseLock({ supabase, lockKey, holderId });
  }
}
