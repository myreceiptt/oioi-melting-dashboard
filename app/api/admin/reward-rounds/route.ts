import { NextRequest, NextResponse } from "next/server";
import { formatUnits } from "viem";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  created_tx_hash: string | null;
  funded_tx_hash: string | null;
  metadata: Record<string, unknown> | null;
  updated_at: string;
};

type RewardAllocationRow = {
  amount_wei: string;
  proof: string[];
  claimed: boolean;
};

function getChainKey(chain: string | null): ChainKey | null {
  if (chain === "base") return "baseSepolia";
  if (chain === "ethereum") return "ethereumSepolia";
  return null;
}

function normalizeRoundId(value: string | null) {
  if (!value || value.trim() === "") return null;
  if (!/^\d+$/.test(value.trim())) return null;
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

function sumWei(rows: RewardAllocationRow[]) {
  return rows.reduce((sum, row) => sum + BigInt(row.amount_wei), 0n).toString();
}

async function fetchAllocationSummary({
  chainKey,
  roundId,
}: {
  chainKey: ChainKey;
  roundId: string;
}) {
  const supabase = createSupabaseServiceClient();

  const { data, error } = await supabase
    .from("reward_allocations")
    .select("amount_wei, proof, claimed")
    .eq("chain_key", chainKey)
    .eq("round_id", roundId);

  if (error) {
    throw new Error(`Failed to read reward_allocations: ${error.message}`);
  }

  const rows = (data ?? []) as RewardAllocationRow[];

  return {
    allocationCount: rows.length,
    positiveAllocationCount: rows.filter((row) => BigInt(row.amount_wei) > 0n)
      .length,
    proofReadyCount: rows.filter(
      (row) => BigInt(row.amount_wei) > 0n && Array.isArray(row.proof),
    ).length,
    claimedCount: rows.filter((row) => row.claimed).length,
    allocatedAmountWei: sumWei(rows),
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const chain = searchParams.get("chain");
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

    const supabase = createSupabaseServiceClient();

    let query = supabase
      .from("reward_rounds")
      .select(
        "chain_key, round_id, status, period_start, period_end, period_start_unix, period_end_unix, reward_amount_wei, funded_amount_wei, claimed_amount_wei, merkle_root, claim_paused, calculation_id, created_tx_hash, funded_tx_hash, metadata, updated_at",
      )
      .eq("chain_key", chainKey)
      .order("period_end", { ascending: false });

    if (requestedRoundId) {
      query = query.eq("round_id", requestedRoundId);
    }

    const { data, error } = await query.limit(requestedRoundId ? 1 : 25);

    if (error) {
      throw new Error(`Failed to read reward_rounds: ${error.message}`);
    }

    const rounds = (data ?? []) as RewardRoundRow[];

    const responseRounds = await Promise.all(
      rounds.map(async (round) => {
        const allocationSummary = await fetchAllocationSummary({
          chainKey,
          roundId: round.round_id,
        });

        const normalizedRound = {
          ...round,
          round_id: BigInt(round.round_id).toString(),
          period_start_unix: BigInt(round.period_start_unix).toString(),
          period_end_unix: BigInt(round.period_end_unix).toString(),
          reward_amount_wei: BigInt(round.reward_amount_wei).toString(),
          funded_amount_wei: BigInt(round.funded_amount_wei).toString(),
          claimed_amount_wei: BigInt(round.claimed_amount_wei).toString(),
        };

        return {
          ...normalizedRound,
          reward_amount_oioi: formatUnits(
            BigInt(normalizedRound.reward_amount_wei),
            18,
          ),
          funded_amount_oioi: formatUnits(
            BigInt(normalizedRound.funded_amount_wei),
            18,
          ),
          claimed_amount_oioi: formatUnits(
            BigInt(normalizedRound.claimed_amount_wei),
            18,
          ),
          allocation_summary: allocationSummary,
          ready_for_create:
            Boolean(normalizedRound.merkle_root) &&
            BigInt(normalizedRound.reward_amount_wei) > 0n &&
            allocationSummary.allocationCount > 0,
          ready_for_funding:
            Boolean(normalizedRound.created_tx_hash) ||
            normalizedRound.status === "created" ||
            normalizedRound.status === "funded",
        };
      }),
    );

    return jsonResponse({
      ok: true,
      chain,
      chainKey,
      roundId: requestedRoundId,
      rounds: responseRounds,
    });
  } catch (error) {
    console.error(error);

    return jsonResponse(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unexpected admin reward rounds API error.",
      },
      500,
    );
  }
}
