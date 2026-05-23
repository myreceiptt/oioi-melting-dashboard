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

type RewardRoundData = readonly [
  boolean,
  boolean,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  `0x${string}`,
];

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

function asRewardRoundData(value: unknown) {
  return value as RewardRoundData | undefined;
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

function TxStatus({
  chainSet,
  txHash,
  isLoading,
  isSuccess,
  isError,
  errorMessage,
}: {
  chainSet: ChainSet;
  txHash: Hash | undefined;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  errorMessage?: string;
}) {
  if (!txHash && !errorMessage) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm">
      <div className="font-medium">Transaction status</div>

      {txHash ? (
        <a
          className="mt-2 block break-all font-mono underline underline-offset-4"
          href={getTxUrl(chainSet, txHash)}
          rel="noreferrer"
          target="_blank"
        >
          {txHash}
        </a>
      ) : null}

      <div className="mt-2 text-white/60">
        {isLoading
          ? "Mining..."
          : isSuccess
            ? "Mined successfully. Refresh reward events later to update Supabase claim records."
            : isError
              ? "Transaction failed or receipt error."
              : txHash
                ? "Submitted."
                : ""}
      </div>

      {errorMessage ? (
        <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-red-100/80">
          {errorMessage}
        </div>
      ) : null}
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

  const roundIdString = proofData?.ok ? proofData.round.roundId : null;
  const roundId = parseBigIntString(roundIdString);
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
  const onChainRoundExists = roundData?.[0] === true;
  const onChainClaimPaused = roundData?.[1] === true;
  const onChainMerkleRoot = roundData?.[7];
  const onChainRoundFunded =
    typeof isRoundFundedRead.data === "boolean"
      ? isRoundFundedRead.data
      : false;
  const onChainClaimed =
    typeof hasClaimedRead.data === "boolean" ? hasClaimedRead.data : false;

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

  async function claimReward() {
    if (
      claimDisabled ||
      roundId === null ||
      allocationAmount === null ||
      !allocation
    ) {
      return;
    }

    await writeContractAsync({
      address: addresses.rewardDistributor,
      abi: rewardClaimAbi,
      functionName: "claim",
      args: [roundId, allocationAmount, proof],
    });
  }

  useEffect(() => {
    if (receipt.isSuccess) {
      void fetchProof();
      void rewardRoundRead.refetch();
      void isRoundFundedRead.refetch();
      void hasClaimedRead.refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receipt.isSuccess]);

  return (
    <section className="grid gap-5">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <p className="text-sm uppercase tracking-[0.25em] text-white/50">
          $OiOi rewards
        </p>
        <h2 className="mt-2 text-2xl font-semibold">Reward Claim Panel</h2>
        <p className="mt-2 text-sm text-white/60">
          This panel reads off-chain reward proof data from Supabase and checks
          the RewardDistributor state on-chain before enabling claim.
        </p>

        <div className="mt-5 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4">
          <div className="font-medium text-yellow-100">Important</div>
          <p className="mt-2 text-sm text-yellow-100/80">
            Claim becomes available only after the admin creates and funds the
            same reward round on-chain with the Merkle root generated by the
            reward pipeline.
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h3 className="text-2xl font-semibold">Reward round</h3>
            <p className="mt-2 text-sm text-white/60">
              Select a funded reward round. Funding, pause, and claimed state
              are checked directly on-chain before claim is enabled.
            </p>
          </div>

          <button
            className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={isRoundsLoading}
            onClick={() => void fetchRounds({ preserveSelection: true })}
            type="button"
          >
            {isRoundsLoading ? "Refreshing..." : "Refresh rounds"}
          </button>
        </div>

        {roundsError ? (
          <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100/80">
            {roundsError}
          </div>
        ) : null}

        <div className="mt-5 grid gap-4 md:grid-cols-[360px_1fr]">
          <label className="block rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="font-medium">Available reward rounds</div>
            <p className="mt-1 text-xs text-white/50">
              Newest funded rounds are listed first.
            </p>
            <select
              className="mt-3 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-white/30"
              disabled={
                isRoundsLoading ||
                roundFundingReads.isLoading ||
                fundedRounds.length === 0
              }
              onChange={(event) => setSelectedRoundId(event.target.value)}
              value={selectedRoundId}
            >
              {fundedRounds.length === 0 ? (
                <option value="">
                  {roundFundingReads.isLoading
                    ? "Checking on-chain funding"
                    : "No funded reward rounds"}
                </option>
              ) : null}
              {fundedRounds.map((round) => (
                <option key={round.roundId} value={round.roundId}>
                  {round.roundId} — {round.status}
                </option>
              ))}
            </select>
          </label>

          <div className="rounded-2xl border border-white/10 bg-black/20 px-4">
            <ReadRow
              label="Selected round"
              value={selectedRound?.roundId ?? "—"}
            />
            <ReadRow label="Status" value={selectedRound?.status ?? "—"} />
            <ReadRow
              label="Reward amount"
              value={
                selectedRound ? `${selectedRound.rewardAmountOiOi} OiOi` : "—"
              }
            />
            <ReadRow
              label="Funded amount"
              value={
                selectedRound ? `${selectedRound.fundedAmountOiOi} OiOi` : "—"
              }
            />
            <ReadRow
              label="Claimed amount"
              value={
                selectedRound ? `${selectedRound.claimedAmountOiOi} OiOi` : "—"
              }
            />
            <ReadRow
              label="Claim paused"
              value={
                selectedRound ? formatBool(selectedRound.claimPaused) : "—"
              }
            />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h3 className="text-2xl font-semibold">Proof API status</h3>

        <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 px-4">
          <ReadRow
            label="Connected wallet"
            value={account ? shortAddress(account) : "Connect wallet"}
          />
          <ReadRow label="Proof loading" value={formatBool(isProofLoading)} />
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
            label="Round ID"
            value={proofData?.ok ? proofData.round.roundId : "—"}
          />
          <ReadRow
            label="DB round status"
            value={proofData?.ok ? proofData.round.status : "—"}
          />
          <ReadRow
            label="DB Merkle root"
            value={proofData?.ok ? proofData.round.merkleRoot : "—"}
          />
          <ReadRow
            label="Allocation amount"
            value={formatTokenAmount({ value: allocationAmount ?? undefined })}
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
          <ReadRow
            label="DB claimed"
            value={allocation ? formatBool(dbClaimed) : "—"}
          />
        </div>

        <button
          className="mt-5 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={!account || isProofLoading}
          onClick={() => void fetchProof()}
          type="button"
        >
          Refresh Proof
        </button>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h3 className="text-2xl font-semibold">On-chain reward round state</h3>

        <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 px-4">
          <ReadRow
            label="RewardDistributor"
            value={shortAddress(addresses.rewardDistributor)}
          />
          <ReadRow label="Round exists" value={formatBool(roundData?.[0])} />
          <ReadRow label="Claim paused" value={formatBool(roundData?.[1])} />
          <ReadRow
            label="Period start"
            value={formatUnixTimestamp(roundData?.[2])}
          />
          <ReadRow
            label="Period end"
            value={formatUnixTimestamp(roundData?.[3])}
          />
          <ReadRow
            label="Reward amount"
            value={formatTokenAmount({ value: roundData?.[4] })}
          />
          <ReadRow
            label="Funded amount"
            value={formatTokenAmount({ value: roundData?.[5] })}
          />
          <ReadRow
            label="Claimed amount"
            value={formatTokenAmount({ value: roundData?.[6] })}
          />
          <ReadRow label="On-chain Merkle root" value={roundData?.[7] ?? "—"} />
          <ReadRow
            label="Round funded"
            value={formatBool(onChainRoundFunded)}
          />
          <ReadRow
            label="On-chain claimed"
            value={formatBool(onChainClaimed)}
          />
          <ReadRow
            label="Merkle root matches"
            value={proofData?.ok ? formatBool(merkleRootMatches) : "—"}
          />
        </div>

        {rewardRoundRead.error ? (
          <div className="mt-4 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-100/80">
            Reward round read warning: {rewardRoundRead.error.message}
          </div>
        ) : null}
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h3 className="text-2xl font-semibold">Claim</h3>

        <p className="mt-2 text-sm text-white/60">
          The claim button is enabled only when proof API data and on-chain
          reward round state agree.
        </p>

        {claimDisabledReason ? (
          <div className="mt-5 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-100/80">
            {claimDisabledReason}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-100/80">
            This wallet is ready to claim.
          </div>
        )}

        <button
          className="mt-5 rounded-2xl border border-green-500/30 bg-green-500/10 px-5 py-3 font-medium text-green-100 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={claimDisabled}
          onClick={() => void claimReward()}
          type="button"
        >
          Claim $OiOi
        </button>
      </section>

      {isWritePending ? (
        <section className="rounded-3xl border border-blue-500/30 bg-blue-500/10 p-6 text-sm text-blue-100/80">
          Waiting for wallet signature...
        </section>
      ) : null}

      <TxStatus
        chainSet={chainSet}
        errorMessage={writeError?.message}
        isError={receipt.isError}
        isLoading={receipt.isLoading}
        isSuccess={receipt.isSuccess}
        txHash={txHash}
      />
    </section>
  );
}
