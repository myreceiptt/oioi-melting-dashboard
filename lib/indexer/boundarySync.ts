import type { SupabaseClient } from "@supabase/supabase-js";
import { parseUnits } from "viem";

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

function targetSort(a: SyncTargetRow, b: SyncTargetRow) {
  if (a.chain_key !== b.chain_key) {
    return a.chain_key.localeCompare(b.chain_key);
  }
  return TASK_ORDER[a.task_key] - TASK_ORDER[b.task_key];
}

function isSyncTask(taskKey: BoundaryTaskKey) {
  return SYNC_TASKS.includes(taskKey);
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
