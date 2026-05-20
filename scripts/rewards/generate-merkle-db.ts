import "dotenv/config";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import { getAddress, isAddress } from "viem";
import { createSupabaseServiceClient } from "../../lib/supabase/server.js";
import { createSupabaseIndexerRepository } from "../../lib/supabase/indexerRepository.js";
import { getIndexerNetworkConfig } from "../indexer/config.js";

type RewardRoundRow = {
  chain_key: string;
  round_id: string;
  status: string;
  period_start_unix: string;
  period_end_unix: string;
  reward_amount_wei: string;
  merkle_root: string | null;
  calculation_id: string | null;
  metadata: Record<string, unknown> | null;
};

type RewardAllocationRow = {
  chain_key: string;
  round_id: string;
  account_address: string;
  amount_wei: string;
  proof: string[];
  raw_score: string | null;
  duration_seconds: number;
  collection_breakdown: Record<string, unknown>;
  claimed: boolean;
};

type ProofResult = {
  account_address: string;
  amount_wei: string;
  proof: `0x${string}`[];
};

function normalizeRoundId(value: unknown) {
  if (typeof value === "bigint") {
    return value.toString();
  }

  if (typeof value === "number" && Number.isSafeInteger(value)) {
    return BigInt(value).toString();
  }

  if (typeof value === "string" && /^\d+$/.test(value)) {
    return BigInt(value).toString();
  }

  throw new Error(`Invalid round_id: ${String(value)}`);
}

function normalizeAmount(value: unknown, label: string) {
  if (typeof value === "bigint") {
    return value;
  }

  if (typeof value === "number" && Number.isSafeInteger(value)) {
    return BigInt(value);
  }

  if (typeof value === "string" && /^\d+$/.test(value)) {
    return BigInt(value);
  }

  throw new Error(`Invalid ${label}: ${String(value)}`);
}

function normalizeMetadata(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function getRequestedRoundId() {
  const value = process.env.REWARD_ROUND_ID;

  if (!value || value.trim() === "") {
    return null;
  }

  return normalizeRoundId(value.trim());
}

async function fetchRewardRound({
  chainKey,
  requestedRoundId,
}: {
  chainKey: string;
  requestedRoundId: string | null;
}) {
  const supabase = createSupabaseServiceClient();

  let query = supabase
    .from("reward_rounds")
    .select(
      "chain_key, round_id, status, period_start_unix, period_end_unix, reward_amount_wei, merkle_root, calculation_id, metadata",
    )
    .eq("chain_key", chainKey);

  if (requestedRoundId) {
    query = query.eq("round_id", requestedRoundId);
  } else {
    query = query.eq("status", "calculated").order("updated_at", {
      ascending: false,
    });
  }

  const { data, error } = await query.limit(1).maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch reward_rounds: ${error.message}`);
  }

  if (!data) {
    throw new Error(
      requestedRoundId
        ? `Reward round not found: ${chainKey}:${requestedRoundId}`
        : `No calculated reward round found for ${chainKey}. Set REWARD_ROUND_ID if needed.`,
    );
  }

  return {
    ...data,
    round_id: normalizeRoundId(data.round_id),
    reward_amount_wei: normalizeAmount(
      data.reward_amount_wei,
      "reward_amount_wei",
    ).toString(),
    period_start_unix: normalizeRoundId(data.period_start_unix),
    period_end_unix: normalizeRoundId(data.period_end_unix),
    metadata: normalizeMetadata(data.metadata),
  } as RewardRoundRow;
}

async function fetchRewardAllocations({
  chainKey,
  roundId,
}: {
  chainKey: string;
  roundId: string;
}) {
  const supabase = createSupabaseServiceClient();
  const pageSize = 1000;
  let from = 0;
  const rows: RewardAllocationRow[] = [];

  while (true) {
    const to = from + pageSize - 1;

    const { data, error } = await supabase
      .from("reward_allocations")
      .select(
        "chain_key, round_id, account_address, amount_wei, proof, raw_score, duration_seconds, collection_breakdown, claimed",
      )
      .eq("chain_key", chainKey)
      .eq("round_id", roundId)
      .order("account_address", { ascending: true })
      .range(from, to);

    if (error) {
      throw new Error(`Failed to fetch reward_allocations: ${error.message}`);
    }

    const batch = (data ?? []).map((row) => ({
      ...row,
      round_id: normalizeRoundId(row.round_id),
      amount_wei: normalizeAmount(row.amount_wei, "amount_wei").toString(),
      account_address: String(row.account_address).toLowerCase(),
      proof: Array.isArray(row.proof) ? row.proof : [],
      collection_breakdown:
        row.collection_breakdown &&
        typeof row.collection_breakdown === "object" &&
        !Array.isArray(row.collection_breakdown)
          ? (row.collection_breakdown as Record<string, unknown>)
          : {},
    })) as RewardAllocationRow[];

    rows.push(...batch);

    if (batch.length < pageSize) {
      break;
    }

    from += pageSize;
  }

  return rows;
}

function validateAllocations({
  round,
  allocations,
}: {
  round: RewardRoundRow;
  allocations: RewardAllocationRow[];
}) {
  if (allocations.length === 0) {
    throw new Error(`No reward allocations found for round ${round.round_id}`);
  }

  const seen = new Set<string>();
  let totalAllocated = 0n;

  for (const allocation of allocations) {
    if (!isAddress(allocation.account_address)) {
      throw new Error(
        `Invalid allocation account: ${allocation.account_address}`,
      );
    }

    const account = getAddress(allocation.account_address).toLowerCase();

    if (seen.has(account)) {
      throw new Error(`Duplicate allocation account: ${account}`);
    }

    seen.add(account);

    const amount = normalizeAmount(allocation.amount_wei, "amount_wei");

    if (amount < 0n) {
      throw new Error(`Negative allocation amount for ${account}`);
    }

    totalAllocated += amount;
  }

  const rewardAmount = normalizeAmount(
    round.reward_amount_wei,
    "reward_amount_wei",
  );

  if (totalAllocated !== rewardAmount) {
    throw new Error(
      `Allocation total mismatch. allocated=${totalAllocated.toString()} reward=${rewardAmount.toString()}`,
    );
  }

  return {
    totalAllocated,
    rewardAmount,
  };
}

function generateProofs({
  round,
  allocations,
}: {
  round: RewardRoundRow;
  allocations: RewardAllocationRow[];
}) {
  const positiveAllocations = allocations
    .filter(
      (allocation) => normalizeAmount(allocation.amount_wei, "amount_wei") > 0n,
    )
    .map((allocation) => ({
      account: getAddress(allocation.account_address),
      amountWei: normalizeAmount(allocation.amount_wei, "amount_wei"),
    }))
    .sort((a, b) =>
      a.account.toLowerCase().localeCompare(b.account.toLowerCase()),
    );

  if (positiveAllocations.length === 0) {
    throw new Error("No positive reward allocations found.");
  }

  const values = positiveAllocations.map((allocation) => [
    BigInt(round.round_id),
    allocation.account,
    allocation.amountWei,
  ]);

  const tree = StandardMerkleTree.of(values, ["uint256", "address", "uint256"]);

  const proofsByAccount = new Map<string, ProofResult>();

  for (const [index, value] of tree.entries()) {
    const [, account, amountWei] = value as [bigint, `0x${string}`, bigint];

    proofsByAccount.set(account.toLowerCase(), {
      account_address: account.toLowerCase(),
      amount_wei: amountWei.toString(),
      proof: tree.getProof(index) as `0x${string}`[],
    });
  }

  return {
    merkleRoot: tree.root as `0x${string}`,
    positiveAllocationCount: positiveAllocations.length,
    proofsByAccount,
  };
}

async function updateAllocationProofs({
  chainKey,
  roundId,
  allocations,
  proofsByAccount,
}: {
  chainKey: string;
  roundId: string;
  allocations: RewardAllocationRow[];
  proofsByAccount: Map<string, ProofResult>;
}) {
  const supabase = createSupabaseServiceClient();

  for (const allocation of allocations) {
    const account = getAddress(allocation.account_address).toLowerCase();
    const amount = normalizeAmount(allocation.amount_wei, "amount_wei");
    const proofResult = proofsByAccount.get(account);

    const proof = amount > 0n ? (proofResult?.proof ?? []) : [];

    if (amount > 0n && !proofResult) {
      throw new Error(`Missing generated proof for ${account}`);
    }

    const { error } = await supabase
      .from("reward_allocations")
      .update({
        proof,
      })
      .eq("chain_key", chainKey)
      .eq("round_id", roundId)
      .eq("account_address", account);

    if (error) {
      throw new Error(
        `Failed to update proof for ${account}: ${error.message}`,
      );
    }
  }
}

async function updateRewardRoundMerkleRoot({
  round,
  merkleRoot,
  positiveAllocationCount,
  totalAllocationCount,
}: {
  round: RewardRoundRow;
  merkleRoot: string;
  positiveAllocationCount: number;
  totalAllocationCount: number;
}) {
  const supabase = createSupabaseServiceClient();

  const metadata = {
    ...normalizeMetadata(round.metadata),
    merkleProofStatus: "generated",
    merkleRoot,
    positiveAllocationCount,
    totalAllocationCount,
    merkleGeneratedAt: new Date().toISOString(),
    merkleLeafTypes: ["uint256", "address", "uint256"],
    merkleLeafValues: ["roundId", "account", "amount"],
    merkleStandard: "OpenZeppelin StandardMerkleTree",
  };

  const { error } = await supabase
    .from("reward_rounds")
    .update({
      merkle_root: merkleRoot,
      metadata,
    })
    .eq("chain_key", round.chain_key)
    .eq("round_id", round.round_id);

  if (error) {
    throw new Error(`Failed to update reward_rounds: ${error.message}`);
  }
}

async function finalizeRewardCalculation(round: RewardRoundRow) {
  if (!round.calculation_id) {
    return;
  }

  const supabase = createSupabaseServiceClient();

  const { error } = await supabase
    .from("reward_calculations")
    .update({
      status: "finalized",
    })
    .eq("id", round.calculation_id);

  if (error) {
    throw new Error(`Failed to finalize reward_calculations: ${error.message}`);
  }
}

async function main() {
  const config = getIndexerNetworkConfig(process.argv[2]);
  const supabase = createSupabaseServiceClient();
  const repository = createSupabaseIndexerRepository(supabase);
  const requestedRoundId = getRequestedRoundId();

  console.log("Generating Merkle proofs from DB reward allocations...");
  console.log({
    network: config.key,
    chainId: config.chainId,
    label: config.label,
    requestedRoundId,
  });

  const run = await repository.startRun({
    chainKey: config.key,
    runKind: "proof_generation",
    metadata: {
      stage: "merkle-allocation-proof-pipeline-v1",
      command: "rewards:merkle-db",
      network: config.key,
      requestedRoundId,
    },
  });

  try {
    const round = await fetchRewardRound({
      chainKey: config.key,
      requestedRoundId,
    });

    const allocations = await fetchRewardAllocations({
      chainKey: config.key,
      roundId: round.round_id,
    });

    const { totalAllocated, rewardAmount } = validateAllocations({
      round,
      allocations,
    });

    const { merkleRoot, positiveAllocationCount, proofsByAccount } =
      generateProofs({
        round,
        allocations,
      });

    await updateAllocationProofs({
      chainKey: config.key,
      roundId: round.round_id,
      allocations,
      proofsByAccount,
    });

    await updateRewardRoundMerkleRoot({
      round,
      merkleRoot,
      positiveAllocationCount,
      totalAllocationCount: allocations.length,
    });

    await finalizeRewardCalculation(round);

    const summary = {
      roundId: round.round_id,
      periodStartUnix: round.period_start_unix,
      periodEndUnix: round.period_end_unix,
      rewardAmountWei: rewardAmount.toString(),
      totalAllocatedWei: totalAllocated.toString(),
      allocationCount: allocations.length,
      positiveAllocationCount,
      merkleRoot,
    };

    await repository.finishRun({
      runId: run.id,
      status: "success",
      metadata: {
        ...run.metadata,
        summary,
      },
    });

    console.log("Merkle proof generation complete.");
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
