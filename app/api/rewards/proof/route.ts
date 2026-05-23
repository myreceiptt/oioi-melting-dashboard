import { NextRequest, NextResponse } from "next/server";
import { getAddress, isAddress } from "viem";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ChainParam = "base" | "ethereum";
type ChainKey = "baseSepolia" | "ethereumSepolia";

type RewardRoundRow = {
  chain_key: ChainKey;
  round_id: string;
  status: string;
  period_start: string;
  period_end: string;
  period_start_unix: string;
  period_end_unix: string;
  reward_amount_wei: string;
  funded_amount_wei: string;
  claimed_amount_wei: string;
  merkle_root: string | null;
  claim_paused: boolean;
  calculation_id: string | null;
  metadata: Record<string, unknown> | null;
};

type RewardAllocationRow = {
  chain_key: ChainKey;
  round_id: string;
  account_address: string;
  amount_wei: string;
  proof: string[];
  raw_score: string | null;
  duration_seconds: number;
  collection_breakdown: Record<string, unknown> | null;
  claimed: boolean;
};

type RewardClaimRow = {
  chain_key: ChainKey;
  round_id: string;
  account_address: string;
  amount_wei: string;
  tx_hash: string;
  block_number: number;
  block_timestamp: string;
};

function getChainKey(chain: string | null): ChainKey | null {
  if (chain === "base") {
    return "baseSepolia";
  }

  if (chain === "ethereum") {
    return "ethereumSepolia";
  }

  return null;
}

function normalizeRoundId(value: string | null) {
  if (!value || value.trim() === "") {
    return null;
  }

  if (!/^\d+$/.test(value.trim())) {
    return null;
  }

  return BigInt(value.trim()).toString();
}

function jsonResponse(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

async function fetchRewardRound({
  chainKey,
  roundId,
}: {
  chainKey: ChainKey;
  roundId: string | null;
}) {
  const supabase = createSupabaseServiceClient();

  let query = supabase
    .from("reward_rounds")
    .select(
      "chain_key, round_id, status, period_start, period_end, period_start_unix, period_end_unix, reward_amount_wei, funded_amount_wei, claimed_amount_wei, merkle_root, claim_paused, calculation_id, metadata",
    )
    .eq("chain_key", chainKey);

  if (roundId) {
    query = query.eq("round_id", roundId);
  } else {
    query = query
      .not("merkle_root", "is", null)
      .in("status", ["funded", "claim_paused", "closed"])
      .order("updated_at", { ascending: false });
  }

  const { data, error } = await query.limit(1).maybeSingle();

  if (error) {
    throw new Error(`Failed to read reward_rounds: ${error.message}`);
  }

  return data as RewardRoundRow | null;
}

async function fetchAllocation({
  chainKey,
  roundId,
  account,
}: {
  chainKey: ChainKey;
  roundId: string;
  account: string;
}) {
  const supabase = createSupabaseServiceClient();

  const { data, error } = await supabase
    .from("reward_allocations")
    .select(
      "chain_key, round_id, account_address, amount_wei, proof, raw_score, duration_seconds, collection_breakdown, claimed",
    )
    .eq("chain_key", chainKey)
    .eq("round_id", roundId)
    .eq("account_address", account)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to read reward_allocations: ${error.message}`);
  }

  return data as RewardAllocationRow | null;
}

async function fetchClaim({
  chainKey,
  roundId,
  account,
}: {
  chainKey: ChainKey;
  roundId: string;
  account: string;
}) {
  const supabase = createSupabaseServiceClient();

  const { data, error } = await supabase
    .from("reward_claims")
    .select(
      "chain_key, round_id, account_address, amount_wei, tx_hash, block_number, block_timestamp",
    )
    .eq("chain_key", chainKey)
    .eq("round_id", roundId)
    .eq("account_address", account)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to read reward_claims: ${error.message}`);
  }

  return data as RewardClaimRow | null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const chain = searchParams.get("chain") as ChainParam | null;
    const accountParam = searchParams.get("account");
    const requestedRoundId = normalizeRoundId(searchParams.get("roundId"));

    const chainKey = getChainKey(chain);

    if (!chainKey) {
      return jsonResponse(
        {
          ok: false,
          error: "Invalid chain. Use chain=base or chain=ethereum.",
        },
        400,
      );
    }

    if (!accountParam || !isAddress(accountParam)) {
      return jsonResponse(
        {
          ok: false,
          error: "Invalid account address.",
        },
        400,
      );
    }

    const account = getAddress(accountParam).toLowerCase();

    const round = await fetchRewardRound({
      chainKey,
      roundId: requestedRoundId,
    });

    if (!round) {
      return jsonResponse(
        {
          ok: false,
          error: requestedRoundId
            ? "Reward round not found."
            : "No reward round with generated Merkle root found.",
          chain,
          chainKey,
          account,
          roundId: requestedRoundId,
        },
        404,
      );
    }

    if (!round.merkle_root) {
      return jsonResponse(
        {
          ok: false,
          error: "Reward round does not have a Merkle root yet.",
          chain,
          chainKey,
          account,
          roundId: round.round_id,
          round,
        },
        409,
      );
    }

    const allocation = await fetchAllocation({
      chainKey,
      roundId: round.round_id,
      account,
    });

    const claim = await fetchClaim({
      chainKey,
      roundId: round.round_id,
      account,
    });

    if (!allocation) {
      return jsonResponse({
        ok: true,
        eligible: false,
        chain,
        chainKey,
        account,
        round: {
          roundId: round.round_id,
          status: round.status,
          periodStart: round.period_start,
          periodEnd: round.period_end,
          periodStartUnix: round.period_start_unix,
          periodEndUnix: round.period_end_unix,
          rewardAmountWei: round.reward_amount_wei,
          fundedAmountWei: round.funded_amount_wei,
          claimedAmountWei: round.claimed_amount_wei,
          merkleRoot: round.merkle_root,
          claimPaused: round.claim_paused,
          metadata: round.metadata ?? {},
        },
        allocation: null,
        claim: claim
          ? {
              claimed: true,
              amountWei: claim.amount_wei,
              txHash: claim.tx_hash,
              blockNumber: claim.block_number,
              blockTimestamp: claim.block_timestamp,
            }
          : null,
      });
    }

    const proof = Array.isArray(allocation.proof) ? allocation.proof : [];
    const claimed = Boolean(allocation.claimed || claim);

    return jsonResponse({
      ok: true,
      eligible: BigInt(allocation.amount_wei) > 0n,
      chain,
      chainKey,
      account,
      round: {
        roundId: round.round_id,
        status: round.status,
        periodStart: round.period_start,
        periodEnd: round.period_end,
        periodStartUnix: round.period_start_unix,
        periodEndUnix: round.period_end_unix,
        rewardAmountWei: round.reward_amount_wei,
        fundedAmountWei: round.funded_amount_wei,
        claimedAmountWei: round.claimed_amount_wei,
        merkleRoot: round.merkle_root,
        claimPaused: round.claim_paused,
        metadata: round.metadata ?? {},
      },
      allocation: {
        account: allocation.account_address,
        amountWei: allocation.amount_wei,
        proof,
        rawScore: allocation.raw_score,
        durationSeconds: allocation.duration_seconds,
        collectionBreakdown: allocation.collection_breakdown ?? {},
        claimed,
      },
      claim: claim
        ? {
            claimed: true,
            amountWei: claim.amount_wei,
            txHash: claim.tx_hash,
            blockNumber: claim.block_number,
            blockTimestamp: claim.block_timestamp,
          }
        : null,
    });
  } catch (error) {
    console.error(error);

    return jsonResponse(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unexpected reward proof API error.",
      },
      500,
    );
  }
}
