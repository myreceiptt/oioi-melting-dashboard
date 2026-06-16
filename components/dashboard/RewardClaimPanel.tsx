"use client";

import { useEffect, useMemo, useState } from "react";
import type { Address, Hash } from "viem";
import { parseAbi } from "viem";
import {
  useAccount,
  useReadContract,
  useReadContracts,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import type { ChainSet } from "@/lib/chains/chainConfig";
import { getContractAddresses } from "@/lib/contracts/addresses";
import { getTxUrl } from "@/lib/services/explorer";
import { ResponsiveHash } from "@/components/app/ResponsiveHash";
import {
  formatBool,
  formatTokenAmount,
  shortAddress,
} from "@/lib/utils/format";

const rewardClaimAbi = parseAbi([
  "function getRewardRound(uint256 roundId) view returns (bool exists, bool claimPaused, uint64 periodStart, uint64 periodEnd, uint256 rewardAmount, uint256 fundedAmount, uint256 claimedAmount, bytes32 merkleRoot)",
  "function isRoundFunded(uint256 roundId) view returns (bool)",
  "function hasClaimed(uint256 roundId, address account) view returns (bool)",
  "function claim(uint256 roundId, uint256 amount, bytes32[] calldata proof)",
]);

type RewardRoundData = {
  exists: boolean;
  claimPaused: boolean;
  periodStart: bigint;
  periodEnd: bigint;
  rewardAmount: bigint;
  fundedAmount: bigint;
  claimedAmount: bigint;
  merkleRoot: `0x${string}`;
};

type RewardProofSuccess = {
  ok: true;
  eligible: boolean;
  chain: ChainSet;
  chainKey: string;
  account: string;
  round: {
    roundId: string;
    status: string;
    periodStart: string;
    periodEnd: string;
    periodStartUnix: string;
    periodEndUnix: string;
    rewardAmountWei: string;
    fundedAmountWei: string;
    claimedAmountWei: string;
    merkleRoot: `0x${string}`;
    claimPaused: boolean;
    metadata: Record<string, unknown>;
  };
  allocation: null | {
    account: string;
    amountWei: string;
    proof: `0x${string}`[];
    rawScore: string | null;
    durationSeconds: number;
    collectionBreakdown: Record<string, unknown>;
    claimed: boolean;
  };
  claim: null | {
    claimed: true;
    amountWei: string;
    txHash: string;
    blockNumber: number;
    blockTimestamp: string;
  };
};

type RewardProofError = {
  ok: false;
  error: string;
  chain?: ChainSet;
  chainKey?: string;
  account?: string;
  roundId?: string | null;
};

type RewardProofResponse = RewardProofSuccess | RewardProofError;

type RewardRoundListItem = {
  chainKey: string;
  roundId: string;
  status: string;
  periodStart: string;
  periodEnd: string;
  periodStartUnix: string;
  periodEndUnix: string;
  rewardAmountWei: string;
  rewardAmountOiOi: string;
  fundedAmountWei: string;
  fundedAmountOiOi: string;
  claimedAmountWei: string;
  claimedAmountOiOi: string;
  merkleRoot: `0x${string}`;
  claimPaused: boolean;
  updatedAt: string;
};

type RewardRoundsResponse =
  | {
      ok: true;
      chain: ChainSet;
      chainKey: string;
      rounds: RewardRoundListItem[];
    }
  | {
      ok: false;
      error: string;
    };

function asRewardRoundData(value: unknown): RewardRoundData | undefined {
  if (!value) {
    return undefined;
  }

  if (Array.isArray(value)) {
    const tuple = value as unknown as readonly [
      boolean,
      boolean,
      bigint,
      bigint,
      bigint,
      bigint,
      bigint,
      `0x${string}`,
    ];

    return {
      exists: tuple[0],
      claimPaused: tuple[1],
      periodStart: tuple[2],
      periodEnd: tuple[3],
      rewardAmount: tuple[4],
      fundedAmount: tuple[5],
      claimedAmount: tuple[6],
      merkleRoot: tuple[7],
    };
  }

  return value as RewardRoundData;
}

function parseBigIntString(value: string | undefined | null) {
  if (!value || !/^\d+$/.test(value)) {
    return null;
  }

  return BigInt(value);
}

function formatUnixTimestamp(value: bigint | undefined) {
  if (value === undefined) {
    return "—";
  }

  const date = new Date(Number(value) * 1000);

  if (Number.isNaN(date.getTime())) {
    return value.toString();
  }

  return `${value.toString()} (${date.toISOString()})`;
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
    <div className="grid min-w-0 gap-2 border-b border-black/40 py-3 last:border-b-0 md:grid-cols-[220px_1fr]">
      <div>
        <div className="text-sm text-black/70">{label}</div>
        {warning ? (
          <div className="mt-1 text-xs text-black/60">{warning}</div>
        ) : null}
      </div>
      <div className="min-w-0 break-all font-mono text-sm text-black md:text-right wrap-anywhere">
        {value}
      </div>
    </div>
  );
}

function StatusPill({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "success" | "warning" | "danger" | "info" | "purple";
}) {
  const toneClass =
    tone === "success"
      ? "border-white/10 bg-[#b7f56d] text-black"
      : tone === "warning"
        ? "border-white/10 bg-yellow-300 text-black"
        : tone === "danger"
          ? "border-white/10 bg-[#ff9b4a] text-black"
          : tone === "info"
            ? "border-white/10 bg-white text-black"
            : tone === "purple"
              ? "border-white/10 bg-yellow-300 text-black"
              : "border-white/10 bg-white text-black";

  return (
    <span
      className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-medium ${toneClass}`}>
      {label}
    </span>
  );
}

function SummaryTile({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/70 p-4 text-black">
      <div className="text-xs uppercase tracking-[0.18em] text-black/70">
        {label}
      </div>
      <div className="mt-2 break-all font-mono text-sm text-black">{value}</div>
      {detail ? (
        <div className="mt-2 text-xs text-black/70">{detail}</div>
      ) : null}
    </div>
  );
}

function TxStatus({
  chainSet,
  txHash,
  isLoading,
  isSuccess,
  isError,
}: {
  chainSet: ChainSet;
  txHash: Hash | undefined;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
}) {
  if (!txHash) {
    return null;
  }

  return (
    <div className="mt-5 min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-yellow-300 p-4 text-sm text-black">
      <div className="font-medium">Transaction status</div>

      <a
        className="mt-2 block break-all font-mono text-black/70 underline underline-offset-4"
        href={getTxUrl(chainSet, txHash)}
        rel="noreferrer"
        target="_blank">
        <ResponsiveHash value={txHash} />
      </a>

      <div className="mt-2 text-black/70">
        {isLoading
          ? "Mining..."
          : isSuccess
            ? "Mined successfully. Claim state will refresh from on-chain and Supabase proof data."
            : isError
              ? "Transaction failed or receipt error."
              : txHash
                ? "Submitted."
                : ""}
      </div>
    </div>
  );
}

export function RewardClaimPanel({ chainSet }: { chainSet: ChainSet }) {
  const { address, isConnected } = useAccount();
  const addresses = getContractAddresses(chainSet);

  const [proofData, setProofData] = useState<RewardProofResponse | null>(null);
  const [isProofLoading, setIsProofLoading] = useState(false);
  const [proofError, setProofError] = useState<string | null>(null);
  const [rounds, setRounds] = useState<RewardRoundListItem[]>([]);
  const [selectedRoundId, setSelectedRoundId] = useState("");
  const [isRoundsLoading, setIsRoundsLoading] = useState(false);
  const [roundsError, setRoundsError] = useState<string | null>(null);
  const [lastActionLabel, setLastActionLabel] = useState<string | null>(null);
  const [lastRequestedValue, setLastRequestedValue] = useState<string | null>(
    null,
  );
  const [lastActionRoundId, setLastActionRoundId] = useState<string | null>(
    null,
  );
  const [lastActionTxHash, setLastActionTxHash] = useState<Hash | undefined>();

  const account = address ? address.toLowerCase() : null;
  const roundFundingReads = useReadContracts({
    contracts: rounds.map((round) => ({
      address: addresses.rewardDistributor,
      abi: rewardClaimAbi,
      functionName: "isRoundFunded",
      args: [BigInt(round.roundId)],
    })),
    query: {
      enabled: rounds.length > 0,
      retry: false,
    },
  });
  const fundedRoundIds = useMemo(() => {
    const ids = new Set<string>();

    roundFundingReads.data?.forEach((read, index) => {
      if (read.status === "success" && read.result === true) {
        const roundId = rounds[index]?.roundId;

        if (roundId) {
          ids.add(roundId);
        }
      }
    });

    return ids;
  }, [roundFundingReads.data, rounds]);
  const fundedRounds = useMemo(
    () => rounds.filter((round) => fundedRoundIds.has(round.roundId)),
    [fundedRoundIds, rounds],
  );
  const selectedRound = useMemo(
    () =>
      fundedRounds.find((round) => round.roundId === selectedRoundId) ?? null,
    [fundedRounds, selectedRoundId],
  );

  const proofUrl = useMemo(() => {
    if (!account || !selectedRoundId) {
      return null;
    }

    const params = new URLSearchParams({
      chain: chainSet,
      account,
      roundId: selectedRoundId,
    });

    return `/api/rewards/proof?${params.toString()}`;
  }, [account, chainSet, selectedRoundId]);

  async function fetchRounds({ preserveSelection = true } = {}) {
    setIsRoundsLoading(true);
    setRoundsError(null);

    try {
      const response = await fetch(`/api/rewards/rounds?chain=${chainSet}`, {
        method: "GET",
        cache: "no-store",
      });
      const json = (await response.json()) as RewardRoundsResponse;

      if (!response.ok || json.ok === false) {
        setRounds([]);
        setSelectedRoundId("");
        setRoundsError(
          json.ok === false ? json.error : "Reward round list failed.",
        );
        return;
      }

      setRounds(json.rounds);
      setSelectedRoundId((current) =>
        preserveSelection &&
        current &&
        json.rounds.some((round) => round.roundId === current)
          ? current
          : "",
      );
    } catch (error) {
      setRounds([]);
      setSelectedRoundId("");
      setRoundsError(
        error instanceof Error ? error.message : "Reward round list failed.",
      );
    } finally {
      setIsRoundsLoading(false);
    }
  }

  async function fetchProof() {
    if (!proofUrl) {
      setProofData(null);
      setProofError(null);
      return;
    }

    setIsProofLoading(true);
    setProofError(null);

    try {
      const response = await fetch(proofUrl, {
        method: "GET",
        cache: "no-store",
      });

      const json = (await response.json()) as RewardProofResponse;

      setProofData(json);

      if (!response.ok || json.ok === false) {
        setProofError(
          json.ok === false ? json.error : "Reward proof lookup failed.",
        );
      }
    } catch (error) {
      setProofError(
        error instanceof Error ? error.message : "Reward proof lookup failed.",
      );
      setProofData(null);
    } finally {
      setIsProofLoading(false);
    }
  }

  useEffect(() => {
    void fetchRounds({ preserveSelection: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chainSet]);

  useEffect(() => {
    void fetchProof();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proofUrl]);

  useEffect(() => {
    setSelectedRoundId((current) => {
      if (current && fundedRounds.some((round) => round.roundId === current)) {
        return current;
      }

      return fundedRounds[0]?.roundId ?? "";
    });
  }, [fundedRounds]);

  const roundId = parseBigIntString(selectedRoundId);
  const allocation = proofData?.ok ? proofData.allocation : null;
  const allocationAmount = parseBigIntString(allocation?.amountWei ?? null);
  const proof = allocation?.proof ?? [];

  const rewardRoundRead = useReadContract({
    address: addresses.rewardDistributor,
    abi: rewardClaimAbi,
    functionName: "getRewardRound",
    args: roundId !== null ? [roundId] : undefined,
    query: {
      enabled: roundId !== null,
      retry: false,
    },
  });

  const isRoundFundedRead = useReadContract({
    address: addresses.rewardDistributor,
    abi: rewardClaimAbi,
    functionName: "isRoundFunded",
    args: roundId !== null ? [roundId] : undefined,
    query: {
      enabled: roundId !== null,
      retry: false,
    },
  });

  const hasClaimedRead = useReadContract({
    address: addresses.rewardDistributor,
    abi: rewardClaimAbi,
    functionName: "hasClaimed",
    args:
      roundId !== null && address ? [roundId, address as Address] : undefined,
    query: {
      enabled: roundId !== null && Boolean(address),
      retry: false,
    },
  });

  const {
    data: txHash,
    error: writeError,
    isPending: isWritePending,
    writeContractAsync,
  } = useWriteContract();

  const receipt = useWaitForTransactionReceipt({
    hash: txHash,
    query: {
      enabled: Boolean(txHash),
    },
  });

  const roundData = asRewardRoundData(rewardRoundRead.data);
  const onChainRoundExists = roundData?.exists === true;
  const onChainClaimPaused = roundData?.claimPaused === true;
  const onChainRewardAmount = roundData?.rewardAmount ?? 0n;
  const onChainFundedAmount = roundData?.fundedAmount ?? 0n;
  const onChainClaimedAmount = roundData?.claimedAmount ?? 0n;
  const onChainMerkleRoot = roundData?.merkleRoot;
  const onChainRoundFunded =
    typeof isRoundFundedRead.data === "boolean"
      ? isRoundFundedRead.data
      : false;
  const onChainClaimed =
    typeof hasClaimedRead.data === "boolean" ? hasClaimedRead.data : false;
  const onChainRoundClosed =
    onChainRoundExists &&
    onChainRewardAmount > 0n &&
    onChainClaimedAmount >= onChainRewardAmount;
  const rewardReadError =
    rewardRoundRead.error ?? isRoundFundedRead.error ?? hasClaimedRead.error;
  const isRewardReadsRefreshing =
    roundFundingReads.isFetching ||
    rewardRoundRead.isFetching ||
    isRoundFundedRead.isFetching ||
    hasClaimedRead.isFetching;
  const showSelectedRoundActionContext =
    lastActionRoundId !== null && lastActionRoundId === selectedRoundId;
  const visibleTxHash = showSelectedRoundActionContext
    ? lastActionTxHash
    : undefined;

  const apiEligible = proofData?.ok ? proofData.eligible : false;
  const dbClaimed =
    allocation?.claimed === true ||
    (proofData?.ok === true && proofData.claim !== null);
  const amountPositive = allocationAmount !== null && allocationAmount > 0n;
  const hasMerkleRoot = proofData?.ok
    ? Boolean(proofData.round.merkleRoot)
    : false;
  const merkleRootMatches =
    proofData?.ok && onChainMerkleRoot
      ? proofData.round.merkleRoot.toLowerCase() ===
        onChainMerkleRoot.toLowerCase()
      : false;

  const claimDisabledReason = (() => {
    if (!isConnected) return "Connect wallet first.";
    if (rounds.length === 0)
      return "No proof-ready reward round is available on this chain yet.";
    if (fundedRounds.length === 0)
      return roundFundingReads.isLoading
        ? "Checking on-chain funding state."
        : "No funded reward round is available on this chain yet.";
    if (!selectedRoundId) return "Select a reward round first.";
    if (!proofData) return "Reward proof has not loaded yet.";
    if (proofData.ok === false) return proofData.error;
    if (!apiEligible || !allocation)
      return "This wallet has no allocation for the selected reward round. Keep staking for future rounds.";
    if (!amountPositive) return "Allocation amount is zero.";
    if (!hasMerkleRoot) return "Reward round has no Merkle root yet.";
    if (roundId === null) return "Invalid reward round ID.";
    if (!onChainRoundExists)
      return "Reward round has not been created on-chain yet.";
    if (!merkleRootMatches)
      return "On-chain Merkle root does not match proof API.";
    if (!onChainRoundFunded) return "Reward round is not funded on-chain yet.";
    if (onChainClaimPaused) return "Reward claims are paused for this round.";
    if (onChainClaimed || dbClaimed)
      return "This wallet has already claimed this round.";
    if (isWritePending) return "Waiting for wallet signature.";
    if (receipt.isLoading) return "Transaction is mining.";
    return null;
  })();

  const claimDisabled = claimDisabledReason !== null;
  const selectedRoundStatus = (() => {
    if (rounds.length === 0) {
      return { label: "No Round", tone: "neutral" as const };
    }

    if (fundedRounds.length === 0 || !selectedRoundId || !proofData) {
      return { label: "Checking", tone: "neutral" as const };
    }

    if (proofData.ok === false || rewardReadError) {
      return { label: "Read Error", tone: "danger" as const };
    }

    if (onChainRoundClosed) {
      return { label: "Closed", tone: "neutral" as const };
    }

    if (onChainClaimPaused) {
      return { label: "Paused", tone: "purple" as const };
    }

    if (onChainClaimed || dbClaimed) {
      return { label: "Already Claimed", tone: "neutral" as const };
    }

    if (!apiEligible || !allocation) {
      return { label: "Not Eligible", tone: "danger" as const };
    }

    if (claimDisabled) {
      return { label: "Funded", tone: "warning" as const };
    }

    return { label: "Ready to Claim", tone: "success" as const };
  })();
  const nextStepTone = (() => {
    if (!claimDisabledReason) {
      return "success" as const;
    }

    if (proofData?.ok === false && claimDisabledReason === proofData.error) {
      return "danger" as const;
    }

    if (
      claimDisabledReason === "Checking on-chain funding state." ||
      claimDisabledReason === "Allocation amount is zero." ||
      claimDisabledReason === "This wallet has already claimed this round."
    ) {
      return "neutral" as const;
    }

    if (
      claimDisabledReason ===
        "This wallet has no allocation for the selected reward round. Keep staking for future rounds." ||
      claimDisabledReason === "Invalid reward round ID." ||
      claimDisabledReason === "On-chain Merkle root does not match proof API."
    ) {
      return "danger" as const;
    }

    return "warning" as const;
  })();
  const nextStepClass =
    nextStepTone === "success"
      ? "bg-[#b7f56d]"
      : nextStepTone === "danger"
        ? "bg-[#ff9b4a]"
        : nextStepTone === "neutral"
          ? "bg-white/70"
          : "bg-yellow-300";

  function refetchClaimReads() {
    void roundFundingReads.refetch();
    void rewardRoundRead.refetch();
    void isRoundFundedRead.refetch();
    void hasClaimedRead.refetch();
  }

  function refreshClaimPanel() {
    void fetchRounds({ preserveSelection: true });
    void fetchProof();
    refetchClaimReads();
  }

  async function claimReward() {
    if (
      claimDisabled ||
      roundId === null ||
      allocationAmount === null ||
      !allocation
    ) {
      return;
    }

    setLastActionLabel("Claim $OiOi");
    setLastRequestedValue(
      `Round ${roundId.toString()} / ${formatTokenAmount({
        value: allocationAmount,
        symbol: "OiOi",
      })}`,
    );
    setLastActionRoundId(roundId.toString());
    setLastActionTxHash(undefined);

    const hash = await writeContractAsync({
      address: addresses.rewardDistributor,
      abi: rewardClaimAbi,
      functionName: "claim",
      args: [roundId, allocationAmount, proof],
    });
    setLastActionTxHash(hash);
  }

  useEffect(() => {
    if (receipt.isSuccess) {
      void fetchProof();
      refetchClaimReads();

      const timers = [1_500, 5_000].map((delay) =>
        window.setTimeout(() => {
          void fetchProof();
          refetchClaimReads();
        }, delay),
      );

      return () => {
        timers.forEach((timer) => window.clearTimeout(timer));
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receipt.isSuccess]);

  return (
    <section className="grid gap-5" id="reward-claim">
      <section className="rounded-3xl border border-white/10 bg-black p-6">
        <p className="text-sm uppercase tracking-[0.25em] text-white/70">
          Claim Rewards
        </p>
        <h2 className="mt-2 text-2xl font-semibold">All Available Rewards</h2>
        <p className="mt-2 text-sm text-white/70">
          Not all rewards are available, and not all available rewards can be
          given to you. Please check and claim by yourself.
        </p>
      </section>
      <article className="rounded-3xl border border-white/10 bg-black p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-white/70">
              $OiOi Rewards
            </p>
            <h2 className="mt-2 text-2xl font-semibold">
              Check and Claim $OiOi
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-white/70">
              Select a funded reward round, review your allocation, then claim
              when the proof and on-chain state agree.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black p-1">
            <button
              className="cursor-pointer rounded-xl px-4 py-2 text-sm hover:bg-(--oioi-accent) disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-black"
              disabled={
                isRoundsLoading || isProofLoading || isRewardReadsRefreshing
              }
              onClick={refreshClaimPanel}
              type="button">
              {isRoundsLoading || isProofLoading || isRewardReadsRefreshing
                ? "Refreshing..."
                : "Refresh rounds"}
            </button>
          </div>
        </div>

        {roundsError ? (
          <div className="mt-5 min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-[#ff9b4a] p-4 text-sm text-black whitespace-pre-wrap break-all">
            {roundsError}
          </div>
        ) : null}

        <div className="mt-5 grid gap-4 md:grid-cols-[420px_1fr]">
          <label className="block">
            <div className="font-medium">Available reward round</div>
            <select
              className="mt-3 w-full rounded-xl border border-white/10 bg-black px-3 py-3 text-sm outline-none focus:border-white/40"
              disabled={
                isRoundsLoading ||
                roundFundingReads.isLoading ||
                fundedRounds.length === 0
              }
              onChange={(event) => setSelectedRoundId(event.target.value)}
              value={selectedRoundId}>
              {fundedRounds.length === 0 ? (
                <option value="">
                  {roundFundingReads.isLoading
                    ? "Checking on-chain funding"
                    : "No funded reward rounds"}
                </option>
              ) : null}
              {fundedRounds.map((round) => (
                <option key={round.roundId} value={round.roundId}>
                  {round.roundId} — {round.rewardAmountOiOi} OiOi
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-end">
            <StatusPill
              label={selectedRoundStatus.label}
              tone={selectedRoundStatus.tone}
            />
          </div>
        </div>

        {selectedRound ? (
          <>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <SummaryTile label="Round ID" value={selectedRound.roundId} />
              <SummaryTile
                label="Reward amount"
                value={`${selectedRound.rewardAmountOiOi} OiOi`}
                detail={`Period end: ${selectedRound.periodEnd}`}
              />
              <SummaryTile
                label="Period"
                value={selectedRound.periodEnd}
                detail={`Start: ${selectedRound.periodStart}`}
              />
              <SummaryTile
                label="Funded"
                value={formatTokenAmount({
                  value: onChainFundedAmount,
                  symbol: "OiOi",
                })}
                detail={`Reward amount: ${formatTokenAmount({
                  value: onChainRewardAmount || undefined,
                  symbol: "OiOi",
                })}`}
              />
              <SummaryTile
                label="Claimed"
                value={formatTokenAmount({
                  value: onChainClaimedAmount,
                  symbol: "OiOi",
                })}
                detail={onChainRoundClosed ? "Fully claimed" : "Still open"}
              />
              <SummaryTile
                label="Your allocation"
                value={formatTokenAmount({
                  value: allocationAmount ?? undefined,
                  symbol: "OiOi",
                })}
                detail={
                  allocation
                    ? `${allocation.durationSeconds.toString()} weighted seconds`
                    : apiEligible
                      ? "Loading allocation"
                      : "No allocation for this wallet"
                }
              />
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-white/70 p-4 text-black">
              <div className="text-xs uppercase tracking-[0.18em] text-black/70">
                Merkle root
              </div>
              <div className="mt-2 break-all font-mono text-sm text-black">
                <ResponsiveHash
                  value={
                    proofData?.ok
                      ? proofData.round.merkleRoot
                      : selectedRound.merkleRoot
                  }
                />
              </div>
            </div>
          </>
        ) : (
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/70 p-4 text-sm text-black/70">
            No funded reward round selected.
          </div>
        )}

        {proofError ? (
          <div className="mt-4 min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-[#ff9b4a] p-4 text-sm text-black whitespace-pre-wrap break-all">
            Proof error: {proofError}
          </div>
        ) : null}

        {rewardReadError ? (
          <div className="mt-4 min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-[#ff9b4a] p-4 text-sm text-black whitespace-pre-wrap break-all">
            Reward read error: {rewardReadError.message}
          </div>
        ) : null}

        <div
          className={`mt-5 rounded-2xl border border-white/10 p-4 text-black ${nextStepClass}`}>
          <div className="font-medium">Next step</div>
          <p className="mt-2 text-sm text-black/70">
            {claimDisabledReason ?? "This wallet is ready to claim."}
          </p>
        </div>

        <button
          className="mt-5 w-full cursor-pointer rounded-2xl bg-white px-5 py-3 text-center font-medium text-black hover:bg-(--oioi-accent) hover:text-white disabled:cursor-not-allowed disabled:bg-white disabled:text-black disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-black"
          disabled={claimDisabled}
          onClick={() => void claimReward()}
          type="button">
          Claim $OiOi
        </button>

        {showSelectedRoundActionContext && lastActionLabel ? (
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/70 p-4 text-sm text-black">
            <div className="font-medium">Last requested action</div>
            <div className="mt-2 text-black/70">{lastActionLabel}</div>
            {lastRequestedValue ? (
              <div className="mt-1 break-all text-black/70">
                Requested value: {lastRequestedValue}
              </div>
            ) : null}
          </div>
        ) : null}

        {showSelectedRoundActionContext && isWritePending ? (
          <div className="mt-4 rounded-2xl border border-white/10 bg-yellow-300 p-4 text-sm text-black">
            Waiting for wallet signature...
          </div>
        ) : null}

        <TxStatus
          chainSet={chainSet}
          isError={receipt.isError}
          isLoading={receipt.isLoading}
          isSuccess={receipt.isSuccess}
          txHash={visibleTxHash}
        />

        {showSelectedRoundActionContext && writeError ? (
          <div className="mt-4 min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-[#ff9b4a] p-4 text-sm text-black whitespace-pre-wrap break-all">
            {writeError.message}
          </div>
        ) : null}

        <details className="mt-5 rounded-2xl border border-white/10 bg-white/70 p-4 text-black">
          <summary className="cursor-pointer font-medium">
            Advanced Diagnostics
          </summary>
          <p className="mt-2 text-sm text-black/70">
            Use this only when the claim button is unexpectedly unavailable or a
            reward read looks wrong.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-black/20 bg-white px-4">
              <ReadRow
                label="Connected wallet"
                value={account ? shortAddress(account) : "Connect wallet"}
              />
              <ReadRow
                label="Reward Distributor"
                value={shortAddress(addresses.rewardDistributor)}
              />
              <ReadRow
                label="Proof loading"
                value={formatBool(isProofLoading)}
              />
              <ReadRow
                label="Proof API"
                value={proofData?.ok ? "OK" : proofError ? "Error" : "—"}
                warning={proofError ?? undefined}
              />
              <ReadRow
                label="Eligible"
                value={proofData?.ok ? formatBool(proofData.eligible) : "—"}
              />
              <ReadRow
                label="DB claimed"
                value={allocation ? formatBool(dbClaimed) : "—"}
              />
              <ReadRow
                label="Proof length"
                value={allocation ? allocation.proof.length.toString() : "—"}
                warning={
                  allocation && allocation.proof.length === 0
                    ? "Proof length can be 0 for a single-leaf Merkle tree."
                    : undefined
                }
              />
            </div>

            <div className="rounded-2xl border border-black/20 bg-white px-4">
              <ReadRow
                label="Round exists"
                value={formatBool(onChainRoundExists)}
              />
              <ReadRow
                label="Round funded"
                value={formatBool(onChainRoundFunded)}
              />
              <ReadRow
                label="Claim paused"
                value={formatBool(onChainClaimPaused)}
              />
              <ReadRow
                label="On-chain claimed"
                value={formatBool(onChainClaimed)}
              />
              <ReadRow
                label="Round closed"
                value={formatBool(onChainRoundClosed)}
              />
              <ReadRow
                label="Merkle root matches"
                value={proofData?.ok ? formatBool(merkleRootMatches) : "—"}
              />
              <ReadRow
                label="On-chain Merkle root"
                value={onChainMerkleRoot ?? "—"}
              />
              <ReadRow
                label="Period start"
                value={formatUnixTimestamp(roundData?.periodStart)}
              />
              <ReadRow
                label="Period end"
                value={formatUnixTimestamp(roundData?.periodEnd)}
              />
            </div>
          </div>
        </details>
      </article>
    </section>
  );
}
