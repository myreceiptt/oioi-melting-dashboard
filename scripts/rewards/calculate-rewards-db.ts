import "dotenv/config";
import type { SupabaseClient } from "@supabase/supabase-js";
import { parseUnits } from "viem";
import { createSupabaseServiceClient } from "@/lib/supabase/server.js";
import { createSupabaseIndexerRepository } from "@/lib/supabase/indexerRepository.js";
import { getIndexerNetworkConfig } from "@/scripts/indexer/config.js";

type CollectionKey = "roty" | "melting" | "amanda";

type ValidStakeIntervalRow = {
  chain_key: string;
  staker_address: string;
  collection_key: CollectionKey;
  collection_address: string;
  token_id: string;
  interval_start: string;
  interval_end: string;
  interval_start_unix: string;
  interval_end_unix: string;
  duration_seconds: number;
  valid: boolean;
};

type AccountScore = {
  account_address: string;
  raw_score: bigint;
  duration_seconds: bigint;
  collection_breakdown: Record<
    CollectionKey,
    {
      duration_seconds: string;
      weighted_score: string;
      interval_count: number;
    }
  >;
};

type RewardCalculationRow = {
  id: string;
  chain_key: string;
  period_start: string;
  period_end: string;
  period_start_unix: string;
  period_end_unix: string;
  total_reward_amount_wei: string;
  total_valid_duration_seconds: number;
  collection_weights: Record<string, unknown>;
  status: string;
  notes: string | null;
};

type RewardAllocationRow = {
  chain_key: string;
  round_id: string;
  account_address: string;
  amount_wei: string;
  proof: string[];
  raw_score: string;
  duration_seconds: number;
  collection_breakdown: Record<string, unknown>;
  claimed: boolean;
};

const COLLECTION_WEIGHTS: Record<CollectionKey, bigint> = {
  roty: 217_491n,
  melting: 362_900n,
  amanda: 419_609n,
};

const WEIGHT_DENOMINATOR = 1_000_000n;
const OIOI_DECIMALS = 18;

function parseUnixEnv(name: string) {
  const value = process.env[name];

  if (!value || value.trim() === "") {
    return null;
  }

  if (!/^\d+$/.test(value.trim())) {
    throw new Error(`${name} must be a Unix timestamp in seconds.`);
  }

  return BigInt(value.trim());
}

function parseRewardAmountWei() {
  const value = process.env.REWARD_CALCULATION_AMOUNT_OIOI;

  if (!value || value.trim() === "") {
    throw new Error(
      "Missing REWARD_CALCULATION_AMOUNT_OIOI. Example: REWARD_CALCULATION_AMOUNT_OIOI=1.11",
    );
  }

  if (!/^\d+(\.\d+)?$/.test(value.trim())) {
    throw new Error(
      "REWARD_CALCULATION_AMOUNT_OIOI must be a positive decimal.",
    );
  }

  const amount = parseUnits(value.trim(), OIOI_DECIMALS);

  if (amount <= 0n) {
    throw new Error("REWARD_CALCULATION_AMOUNT_OIOI must be greater than 0.");
  }

  return amount;
}

function isoFromUnix(unix: bigint) {
  return new Date(Number(unix) * 1000).toISOString();
}

function normalizeAddress(address: string) {
  return address.toLowerCase();
}

function createEmptyBreakdown(): AccountScore["collection_breakdown"] {
  return {
    roty: {
      duration_seconds: "0",
      weighted_score: "0",
      interval_count: 0,
    },
    melting: {
      duration_seconds: "0",
      weighted_score: "0",
      interval_count: 0,
    },
    amanda: {
      duration_seconds: "0",
      weighted_score: "0",
      interval_count: 0,
    },
  };
}

function inferPeriodFromRows(rows: ValidStakeIntervalRow[]) {
  if (rows.length === 0) {
    throw new Error(
      "Cannot infer reward calculation period: no valid intervals.",
    );
  }

  const minStart = rows
    .map((row) => BigInt(row.interval_start_unix))
    .reduce((min, value) => (value < min ? value : min));

  const maxEnd = rows
    .map((row) => BigInt(row.interval_end_unix))
    .reduce((max, value) => (value > max ? value : max));

  if (maxEnd <= minStart) {
    throw new Error("Invalid inferred reward calculation period.");
  }

  return {
    periodStartUnix: minStart,
    periodEndUnix: maxEnd,
    periodSource: "inferred_from_valid_stake_intervals",
  };
}

function resolveCalculationPeriod(rows: ValidStakeIntervalRow[]) {
  const envStart = parseUnixEnv("REWARD_PERIOD_START_UNIX");
  const envEnd = parseUnixEnv("REWARD_PERIOD_END_UNIX");

  if ((envStart === null) !== (envEnd === null)) {
    throw new Error(
      "REWARD_PERIOD_START_UNIX and REWARD_PERIOD_END_UNIX must be set together.",
    );
  }

  if (envStart !== null && envEnd !== null) {
    if (envEnd <= envStart) {
      throw new Error("REWARD_PERIOD_END_UNIX must be greater than start.");
    }

    return {
      periodStartUnix: envStart,
      periodEndUnix: envEnd,
      periodSource: "env",
    };
  }

  return inferPeriodFromRows(rows);
}

async function fetchValidIntervals({
  supabase,
  chainKey,
}: {
  supabase: SupabaseClient;
  chainKey: string;
}) {
  const pageSize = 1000;
  let from = 0;
  const rows: ValidStakeIntervalRow[] = [];

  while (true) {
    const to = from + pageSize - 1;

    const { data, error } = await supabase
      .from("valid_stake_intervals")
      .select(
        "chain_key, staker_address, collection_key, collection_address, token_id, interval_start, interval_end, interval_start_unix, interval_end_unix, duration_seconds, valid",
      )
      .eq("chain_key", chainKey)
      .eq("valid", true)
      .order("interval_start_unix", { ascending: true })
      .range(from, to);

    if (error) {
      throw new Error(
        `Failed to fetch valid_stake_intervals: ${error.message}`,
      );
    }

    const batch = (data ?? []) as ValidStakeIntervalRow[];
    rows.push(...batch);

    if (batch.length < pageSize) {
      break;
    }

    from += pageSize;
  }

  return rows;
}

function filterRowsByPeriod({
  rows,
  periodStartUnix,
  periodEndUnix,
}: {
  rows: ValidStakeIntervalRow[];
  periodStartUnix: bigint;
  periodEndUnix: bigint;
}) {
  return rows.filter((row) => {
    const start = BigInt(row.interval_start_unix);
    const end = BigInt(row.interval_end_unix);

    return start >= periodStartUnix && end <= periodEndUnix && end > start;
  });
}

function buildScores(rows: ValidStakeIntervalRow[]) {
  const scores = new Map<string, AccountScore>();

  for (const row of rows) {
    const accountAddress = normalizeAddress(row.staker_address);
    const durationSeconds = BigInt(row.duration_seconds);
    const weight = COLLECTION_WEIGHTS[row.collection_key];
    const weightedScore = durationSeconds * weight;

    const existing =
      scores.get(accountAddress) ??
      ({
        account_address: accountAddress,
        raw_score: 0n,
        duration_seconds: 0n,
        collection_breakdown: createEmptyBreakdown(),
      } satisfies AccountScore);

    existing.raw_score += weightedScore;
    existing.duration_seconds += durationSeconds;

    const breakdown = existing.collection_breakdown[row.collection_key];
    breakdown.duration_seconds = (
      BigInt(breakdown.duration_seconds) + durationSeconds
    ).toString();
    breakdown.weighted_score = (
      BigInt(breakdown.weighted_score) + weightedScore
    ).toString();
    breakdown.interval_count += 1;

    scores.set(accountAddress, existing);
  }

  return [...scores.values()].sort((a, b) =>
    a.account_address.localeCompare(b.account_address),
  );
}

function buildAllocations({
  chainKey,
  roundId,
  scores,
  totalRewardAmountWei,
}: {
  chainKey: string;
  roundId: string;
  scores: AccountScore[];
  totalRewardAmountWei: bigint;
}) {
  const totalScore = scores.reduce((sum, score) => sum + score.raw_score, 0n);

  if (totalScore <= 0n) {
    throw new Error("Total reward score is zero. Cannot allocate rewards.");
  }

  const allocations: RewardAllocationRow[] = [];
  let allocatedSoFar = 0n;

  for (let index = 0; index < scores.length; index += 1) {
    const score = scores[index];
    const isLast = index === scores.length - 1;

    const amountWei = isLast
      ? totalRewardAmountWei - allocatedSoFar
      : (totalRewardAmountWei * score.raw_score) / totalScore;

    allocatedSoFar += amountWei;

    allocations.push({
      chain_key: chainKey,
      round_id: roundId,
      account_address: score.account_address,
      amount_wei: amountWei.toString(),
      proof: [],
      raw_score: score.raw_score.toString(),
      duration_seconds: Number(score.duration_seconds),
      collection_breakdown: score.collection_breakdown,
      claimed: false,
    });
  }

  return {
    totalScore,
    allocatedSoFar,
    allocations,
  };
}

async function insertRewardCalculation({
  supabase,
  chainKey,
  periodStartUnix,
  periodEndUnix,
  totalRewardAmountWei,
  totalValidDurationSeconds,
  periodSource,
  intervalCount,
  accountCount,
}: {
  supabase: SupabaseClient;
  chainKey: string;
  periodStartUnix: bigint;
  periodEndUnix: bigint;
  totalRewardAmountWei: bigint;
  totalValidDurationSeconds: bigint;
  periodSource: string;
  intervalCount: number;
  accountCount: number;
}) {
  const { data, error } = await supabase
    .from("reward_calculations")
    .insert({
      chain_key: chainKey,
      period_start: isoFromUnix(periodStartUnix),
      period_end: isoFromUnix(periodEndUnix),
      period_start_unix: periodStartUnix.toString(),
      period_end_unix: periodEndUnix.toString(),
      total_reward_amount_wei: totalRewardAmountWei.toString(),
      total_valid_duration_seconds: Number(totalValidDurationSeconds),
      collection_weights: {
        roty: COLLECTION_WEIGHTS.roty.toString(),
        melting: COLLECTION_WEIGHTS.melting.toString(),
        amanda: COLLECTION_WEIGHTS.amanda.toString(),
        denominator: WEIGHT_DENOMINATOR.toString(),
      },
      status: "draft",
      notes: [
        "Reward Calculator v1 draft.",
        `periodSource=${periodSource}`,
        `intervalCount=${intervalCount}`,
        `accountCount=${accountCount}`,
        "Merkle proof not generated yet.",
      ].join(" "),
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to insert reward_calculations: ${error.message}`);
  }

  return data as RewardCalculationRow;
}

async function upsertRewardRound({
  supabase,
  chainKey,
  roundId,
  calculationId,
  periodStartUnix,
  periodEndUnix,
  totalRewardAmountWei,
}: {
  supabase: SupabaseClient;
  chainKey: string;
  roundId: string;
  calculationId: string;
  periodStartUnix: bigint;
  periodEndUnix: bigint;
  totalRewardAmountWei: bigint;
}) {
  const { error } = await supabase.from("reward_rounds").upsert(
    {
      chain_key: chainKey,
      round_id: roundId,
      status: "calculated",
      period_start: isoFromUnix(periodStartUnix),
      period_end: isoFromUnix(periodEndUnix),
      period_start_unix: periodStartUnix.toString(),
      period_end_unix: periodEndUnix.toString(),
      reward_amount_wei: totalRewardAmountWei.toString(),
      funded_amount_wei: "0",
      claimed_amount_wei: "0",
      merkle_root: null,
      claim_paused: false,
      calculation_id: calculationId,
      created_tx_hash: null,
      funded_tx_hash: null,
      metadata: {
        source: "reward-calculator-v1",
        roundIdRule: "roundId = periodEndUnix",
        merkleProofStatus: "pending",
      },
    },
    {
      onConflict: "chain_key,round_id",
    },
  );

  if (error) {
    throw new Error(`Failed to upsert reward_rounds: ${error.message}`);
  }
}

async function replaceRewardAllocations({
  supabase,
  chainKey,
  roundId,
  allocations,
}: {
  supabase: SupabaseClient;
  chainKey: string;
  roundId: string;
  allocations: RewardAllocationRow[];
}) {
  const deleteResult = await supabase
    .from("reward_allocations")
    .delete()
    .eq("chain_key", chainKey)
    .eq("round_id", roundId);

  if (deleteResult.error) {
    throw new Error(
      `Failed to clear reward_allocations: ${deleteResult.error.message}`,
    );
  }

  if (allocations.length === 0) {
    return;
  }

  const pageSize = 500;

  for (let start = 0; start < allocations.length; start += pageSize) {
    const batch = allocations.slice(start, start + pageSize);

    const { error } = await supabase.from("reward_allocations").insert(batch);

    if (error) {
      throw new Error(`Failed to insert reward_allocations: ${error.message}`);
    }
  }
}

async function main() {
  const config = getIndexerNetworkConfig(process.argv[2]);
  const supabase = createSupabaseServiceClient();
  const repository = createSupabaseIndexerRepository(supabase);

  const totalRewardAmountWei = parseRewardAmountWei();

  console.log("Calculating reward allocations...");
  console.log({
    network: config.key,
    chainId: config.chainId,
    label: config.label,
    totalRewardAmountWei: totalRewardAmountWei.toString(),
    totalRewardAmountOiOi: process.env.REWARD_CALCULATION_AMOUNT_OIOI,
  });

  const run = await repository.startRun({
    chainKey: config.key,
    runKind: "reward_calculation",
    metadata: {
      stage: "reward-calculator-v1",
      command: "rewards:calculate",
      network: config.key,
      totalRewardAmountWei: totalRewardAmountWei.toString(),
    },
  });

  try {
    const allValidIntervals = await fetchValidIntervals({
      supabase,
      chainKey: config.key,
    });

    const { periodStartUnix, periodEndUnix, periodSource } =
      resolveCalculationPeriod(allValidIntervals);

    const validIntervals = filterRowsByPeriod({
      rows: allValidIntervals,
      periodStartUnix,
      periodEndUnix,
    });

    if (validIntervals.length === 0) {
      throw new Error("No valid stake intervals found for reward period.");
    }

    const scores = buildScores(validIntervals);

    if (scores.length === 0) {
      throw new Error("No rewardable accounts found.");
    }

    const roundId = periodEndUnix.toString();

    const totalValidDurationSeconds = validIntervals.reduce(
      (sum, row) => sum + BigInt(row.duration_seconds),
      0n,
    );

    const { totalScore, allocatedSoFar, allocations } = buildAllocations({
      chainKey: config.key,
      roundId,
      scores,
      totalRewardAmountWei,
    });

    if (allocatedSoFar !== totalRewardAmountWei) {
      throw new Error("Internal allocation mismatch.");
    }

    const calculation = await insertRewardCalculation({
      supabase,
      chainKey: config.key,
      periodStartUnix,
      periodEndUnix,
      totalRewardAmountWei,
      totalValidDurationSeconds,
      periodSource,
      intervalCount: validIntervals.length,
      accountCount: scores.length,
    });

    await upsertRewardRound({
      supabase,
      chainKey: config.key,
      roundId,
      calculationId: calculation.id,
      periodStartUnix,
      periodEndUnix,
      totalRewardAmountWei,
    });

    await replaceRewardAllocations({
      supabase,
      chainKey: config.key,
      roundId,
      allocations,
    });

    const summary = {
      calculationId: calculation.id,
      roundId,
      periodSource,
      periodStartUnix: periodStartUnix.toString(),
      periodStart: isoFromUnix(periodStartUnix),
      periodEndUnix: periodEndUnix.toString(),
      periodEnd: isoFromUnix(periodEndUnix),
      intervalCount: validIntervals.length,
      accountCount: scores.length,
      totalScore: totalScore.toString(),
      totalValidDurationSeconds: totalValidDurationSeconds.toString(),
      totalRewardAmountWei: totalRewardAmountWei.toString(),
      allocatedAmountWei: allocatedSoFar.toString(),
      allocations: allocations.map((allocation) => ({
        account: allocation.account_address,
        amountWei: allocation.amount_wei,
        rawScore: allocation.raw_score,
        durationSeconds: allocation.duration_seconds,
      })),
    };

    await repository.finishRun({
      runId: run.id,
      status: "success",
      metadata: {
        ...run.metadata,
        summary,
      },
    });

    console.log("Reward calculation complete.");
    console.log({
      runId: run.id,
      ...summary,
    });
  } catch (error) {
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
