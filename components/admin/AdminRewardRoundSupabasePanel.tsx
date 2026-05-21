"use client";

import { useEffect, useMemo, useState } from "react";
import type { ChainSet } from "@/lib/chains/chainConfig";
import { shortAddress } from "@/lib/utils/format";

type AdminRewardRoundApiResponse =
  | {
      ok: true;
      chain: ChainSet;
      chainKey: string;
      roundId: string | null;
      rounds: AdminRewardRound[];
    }
  | {
      ok: false;
      error: string;
    };

type AdminRewardRound = {
  chain_key: string;
  round_id: string;
  status: string;
  period_start: string;
  period_end: string;
  period_start_unix: string;
  period_end_unix: string;
  reward_amount_wei: string;
  reward_amount_oioi: string;
  funded_amount_wei: string;
  funded_amount_oioi: string;
  claimed_amount_wei: string;
  claimed_amount_oioi: string;
  merkle_root: `0x${string}` | null;
  claim_paused: boolean;
  calculation_id: string | null;
  created_tx_hash: string | null;
  funded_tx_hash: string | null;
  metadata: Record<string, unknown> | null;
  updated_at: string;
  allocation_summary: {
    allocationCount: number;
    positiveAllocationCount: number;
    proofReadyCount: number;
    claimedCount: number;
    allocatedAmountWei: string;
  };
  ready_for_create: boolean;
  ready_for_funding: boolean;
};

function StatusBadge({ value }: { value: string }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/70">
      {value}
    </span>
  );
}

function ReadRow({
  label,
  value,
  warning,
}: {
  label: string;
  value: string;
  warning?: string;
}) {
  return (
    <div className="grid gap-2 border-b border-white/10 py-3 last:border-b-0 md:grid-cols-[220px_1fr]">
      <div>
        <div className="text-sm text-white/60">{label}</div>
        {warning ? (
          <div className="mt-1 text-xs text-yellow-100/70">{warning}</div>
        ) : null}
      </div>
      <div className="break-all font-mono text-sm md:text-right">{value}</div>
    </div>
  );
}

function buildCopyText(round: AdminRewardRound) {
  return [
    `Round ID: ${round.round_id}`,
    `Reward amount (OiOi): ${round.reward_amount_oioi}`,
    `Reward amount (wei): ${round.reward_amount_wei}`,
    `Period start: ${round.period_start}`,
    `Period end: ${round.period_end}`,
    `Period start unix: ${round.period_start_unix}`,
    `Period end unix: ${round.period_end_unix}`,
    `Merkle root: ${round.merkle_root ?? ""}`,
  ].join("\n");
}

export function AdminRewardRoundSupabasePanel({
  chainSet,
}: {
  chainSet: ChainSet;
}) {
  const [rounds, setRounds] = useState<AdminRewardRound[]>([]);
  const [selectedRoundId, setSelectedRoundId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const selectedRound = useMemo(() => {
    return rounds.find((round) => round.round_id === selectedRoundId) ?? null;
  }, [rounds, selectedRoundId]);

  async function fetchRounds() {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/admin/reward-rounds?chain=${chainSet}`, {
        cache: "no-store",
      });

      const json = (await response.json()) as AdminRewardRoundApiResponse;

      if (!response.ok || json.ok === false) {
        setErrorMessage(json.ok === false ? json.error : "Failed to load rounds.");
        setRounds([]);
        return;
      }

      setRounds(json.rounds);

      if (json.rounds.length > 0) {
        setSelectedRoundId((current) =>
          current && json.rounds.some((round) => round.round_id === current)
            ? current
            : json.rounds[0].round_id,
        );
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to load rounds.",
      );
      setRounds([]);
    } finally {
      setIsLoading(false);
    }
  }

  async function copySelectedRound() {
    if (!selectedRound) {
      return;
    }

    await navigator.clipboard.writeText(buildCopyText(selectedRound));
    setCopyStatus("Copied selected round values.");
    window.setTimeout(() => setCopyStatus(null), 2500);
  }

  useEffect(() => {
    void fetchRounds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chainSet]);

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-white/50">
            Supabase reward rounds
          </p>
          <h2 className="mt-2 text-2xl font-semibold">
            Reward Round Source Panel
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-white/60">
            This panel reads calculated/finalized reward rounds from Supabase.
            Use it as the source of truth before creating and funding a reward
            round on-chain.
          </p>
        </div>

        <button
          className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={isLoading}
          onClick={() => void fetchRounds()}
          type="button"
        >
          {isLoading ? "Refreshing..." : "Refresh rounds"}
        </button>
      </div>

      {errorMessage ? (
        <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100/80">
          {errorMessage}
        </div>
      ) : null}

      <div className="mt-5 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-100/80">
        Existing on-chain create/fund controls remain manual for now. This panel
        helps you pick the correct Supabase-generated round values.
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-[360px_1fr]">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <label className="text-sm text-white/60" htmlFor={`round-${chainSet}`}>
            Existing reward rounds
          </label>

          <select
            className="mt-2 w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm"
            id={`round-${chainSet}`}
            onChange={(event) => setSelectedRoundId(event.target.value)}
            value={selectedRoundId}
          >
            {rounds.length === 0 ? (
              <option value="">No rounds found</option>
            ) : null}

            {rounds.map((round) => (
              <option key={round.round_id} value={round.round_id}>
                {round.round_id} — {round.status}
              </option>
            ))}
          </select>

          <div className="mt-4 grid gap-2">
            <button
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={!selectedRound}
              onClick={() => void copySelectedRound()}
              type="button"
            >
              Copy selected round values
            </button>

            {copyStatus ? (
              <div className="text-xs text-green-100/80">{copyStatus}</div>
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 px-4">
          {selectedRound ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 py-4">
                <div className="font-mono text-sm">
                  Round {selectedRound.round_id}
                </div>
                <StatusBadge value={selectedRound.status} />
              </div>

              <ReadRow label="Chain" value={selectedRound.chain_key} />
              <ReadRow label="Round ID" value={selectedRound.round_id} />
              <ReadRow
                label="Period start"
                value={`${selectedRound.period_start_unix} (${selectedRound.period_start})`}
              />
              <ReadRow
                label="Period end"
                value={`${selectedRound.period_end_unix} (${selectedRound.period_end})`}
              />
              <ReadRow
                label="Reward amount"
                value={`${selectedRound.reward_amount_oioi} OiOi`}
              />
              <ReadRow
                label="Reward amount wei"
                value={selectedRound.reward_amount_wei}
              />
              <ReadRow
                label="Funded amount"
                value={`${selectedRound.funded_amount_oioi} OiOi`}
              />
              <ReadRow
                label="Claimed amount"
                value={`${selectedRound.claimed_amount_oioi} OiOi`}
              />
              <ReadRow
                label="Merkle root"
                value={selectedRound.merkle_root ?? "Not generated"}
                warning={
                  selectedRound.merkle_root
                    ? undefined
                    : "Run rewards:merkle-db before creating this round on-chain."
                }
              />
              <ReadRow
                label="Calculation ID"
                value={selectedRound.calculation_id ?? "—"}
              />
              <ReadRow
                label="Created tx"
                value={
                  selectedRound.created_tx_hash
                    ? shortAddress(selectedRound.created_tx_hash)
                    : "Not created on-chain yet"
                }
              />
              <ReadRow
                label="Funded tx"
                value={
                  selectedRound.funded_tx_hash
                    ? shortAddress(selectedRound.funded_tx_hash)
                    : "Not funded on-chain yet"
                }
              />
              <ReadRow
                label="Allocations"
                value={selectedRound.allocation_summary.allocationCount.toString()}
              />
              <ReadRow
                label="Positive allocations"
                value={selectedRound.allocation_summary.positiveAllocationCount.toString()}
              />
              <ReadRow
                label="Proof-ready allocations"
                value={selectedRound.allocation_summary.proofReadyCount.toString()}
              />
              <ReadRow
                label="Claimed allocations"
                value={selectedRound.allocation_summary.claimedCount.toString()}
              />
              <ReadRow
                label="Allocated amount wei"
                value={selectedRound.allocation_summary.allocatedAmountWei}
              />
              <ReadRow
                label="Ready for create"
                value={selectedRound.ready_for_create ? "Yes" : "No"}
              />
            </>
          ) : (
            <div className="py-6 text-sm text-white/60">
              No Supabase reward round selected.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
