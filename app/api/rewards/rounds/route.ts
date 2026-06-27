import { NextRequest, NextResponse } from "next/server";
import { formatUnits } from "viem";
import {
  getRewardChainKey,
  type RewardChainKey,
} from "@/lib/rewards/environment";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ChainKey = RewardChainKey;

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
  updated_at: string;
};

function jsonResponse(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function isProofReadyRound(round: RewardRoundRow) {
  return Boolean(round.merkle_root) && BigInt(round.reward_amount_wei) > 0n;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chain = searchParams.get("chain");
    const chainKey = getRewardChainKey(chain);

    if (!chainKey) {
      return jsonResponse(
        {
          ok: false,
          error: "Invalid chain. Use chain=base or chain=ethereum.",
        },
        400,
      );
    }

    const supabase = createSupabaseServiceClient();
    const { data, error } = await supabase
      .from("reward_rounds")
      .select(
        "chain_key, round_id, status, period_start, period_end, period_start_unix, period_end_unix, reward_amount_wei, funded_amount_wei, claimed_amount_wei, merkle_root, claim_paused, updated_at",
      )
      .eq("chain_key", chainKey)
      .not("merkle_root", "is", null)
      .order("period_end", { ascending: false })
      .limit(50);

    if (error) {
      throw new Error(`Failed to read reward_rounds: ${error.message}`);
    }

    const rounds = ((data ?? []) as RewardRoundRow[])
      .filter(isProofReadyRound)
      .map((round) => ({
        chainKey: round.chain_key,
        roundId: BigInt(round.round_id).toString(),
        status: round.status,
        periodStart: round.period_start,
        periodEnd: round.period_end,
        periodStartUnix: BigInt(round.period_start_unix).toString(),
        periodEndUnix: BigInt(round.period_end_unix).toString(),
        rewardAmountWei: BigInt(round.reward_amount_wei).toString(),
        rewardAmountOiOi: formatUnits(BigInt(round.reward_amount_wei), 18),
        fundedAmountWei: BigInt(round.funded_amount_wei).toString(),
        fundedAmountOiOi: formatUnits(BigInt(round.funded_amount_wei), 18),
        claimedAmountWei: BigInt(round.claimed_amount_wei).toString(),
        claimedAmountOiOi: formatUnits(BigInt(round.claimed_amount_wei), 18),
        merkleRoot: round.merkle_root,
        claimPaused: round.claim_paused,
        updatedAt: round.updated_at,
      }));

    return jsonResponse({
      ok: true,
      chain,
      chainKey,
      rounds,
    });
  } catch (error) {
    console.error(error);

    return jsonResponse(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unexpected reward rounds API error.",
      },
      500,
    );
  }
}
