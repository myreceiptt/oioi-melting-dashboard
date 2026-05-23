"use client";

import { useEffect, useMemo, useState } from "react";
import type { Hash } from "viem";
import { formatUnits, isHex, parseUnits } from "viem";
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import type { ChainSet } from "@/lib/chains/chainConfig";
import { erc20Abi, rewardDistributorAdminAbi } from "@/lib/contracts/abis";
import { getContractAddresses } from "@/lib/contracts/addresses";
import { EXPECTED_ADMIN_OWNER_ADDRESS } from "@/lib/admin/adminContractConfig";
import { getTxUrl } from "@/lib/services/explorer";
import { sameAddress } from "@/lib/utils/address";
import {
  formatBool,
  formatTokenAmount,
  shortAddress,
} from "@/lib/utils/format";

type TxAction =
  | "approve"
  | "createRound"
  | "fundRound"
  | "pauseClaims"
  | "unpauseClaims";

type RoundMode = "createNew" | "existingSupabase";

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

const ZERO_BYTES32 =
  "0x0000000000000000000000000000000000000000000000000000000000000000" as const;

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

type BoundarySyncStatus =
  | "queued"
  | "running"
  | "paused"
  | "success"
  | "failed"
  | "cancelled"
  | "skipped";

type BoundarySyncTarget = {
  id: string;
  chain_key: string;
  task_key: string;
  status: BoundarySyncStatus;
  from_block: number | null;
  target_block: number | null;
  last_processed_block: number | null;
  attempts: number;
  next_attempt_at: string | null;
  error_message: string | null;
  updated_at?: string;
};

type BoundarySyncSnapshot = {
  id: string;
  chain_key: string;
  status: string;
  from_block: number;
  to_block: number;
  from_block_timestamp: string | null;
  to_block_timestamp: string | null;
  reward_amount_wei: string | null;
};

type BoundarySyncJob = {
  id: string;
  status: BoundarySyncStatus;
  reward_amount_wei: string | null;
  requested_by: string | null;
  started_at: string | null;
  finished_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  request_payload: Record<string, unknown>;
  targets: BoundarySyncTarget[];
  snapshots: BoundarySyncSnapshot[];
};

type BoundarySyncApiResponse =
  | {
      ok: true;
      jobs: BoundarySyncJob[];
    }
  | {
      ok: false;
      error: string;
    };

function isExpectedOwner(address: string | undefined) {
  return Boolean(address && sameAddress(address, EXPECTED_ADMIN_OWNER_ADDRESS));
}

function parseBigIntInput(value: string): bigint | null {
  const clean = value.trim();

  if (!clean) {
    return null;
  }

  if (!/^\d+$/.test(clean)) {
    return null;
  }

  return BigInt(clean);
}

function parseDateTimeToUnix(value: string): bigint | null {
  if (!value) {
    return null;
  }

  const timestampMs = new Date(value).getTime();

  if (!Number.isFinite(timestampMs)) {
    return null;
  }

  return BigInt(Math.floor(timestampMs / 1000));
}

function parseBytes32(value: string): `0x${string}` | null {
  const clean = value.trim();

  if (!isHex(clean)) {
    return null;
  }

  if (!/^0x[a-fA-F0-9]{64}$/.test(clean)) {
    return null;
  }

  return clean as `0x${string}`;
}

function parseTokenAmount(value: string, decimals: number): bigint | null {
  const clean = value.trim();

  if (!clean) {
    return null;
  }

  if (!/^\d+(\.\d+)?$/.test(clean)) {
    return null;
  }

  try {
    return parseUnits(clean, decimals);
  } catch {
    return null;
  }
}

function asBigInt(value: unknown): bigint | undefined {
  return typeof value === "bigint" ? value : undefined;
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

function maxBigInt(a: bigint, b: bigint) {
  return a > b ? a : b;
}

function normalizeRoundId(value: string | number | bigint) {
  return BigInt(value).toString();
}

function parseWeiString(value: string | undefined | null): bigint | null {
  if (!value || !/^\d+$/.test(value)) {
    return null;
  }

  return BigInt(value);
}

function normalizeRoundStatus(value: string | undefined | null) {
  return (value ?? "").toLowerCase();
}

function getTargetChainId(chainSet: ChainSet) {
  const isMainnet = process.env.NEXT_PUBLIC_APP_ENV === "mainnet";

  if (chainSet === "base") {
    return isMainnet ? 8453 : 84532;
  }

  return isMainnet ? 1 : 11155111;
}

function getTargetChainLabel(chainSet: ChainSet) {
  const isMainnet = process.env.NEXT_PUBLIC_APP_ENV === "mainnet";

  if (chainSet === "base") {
    return isMainnet ? "Base Mainnet" : "Base Sepolia";
  }

  return isMainnet ? "Ethereum Mainnet" : "Ethereum Sepolia";
}

function blockInputValid(value: string) {
  return /^\d+$/.test(value.trim()) && BigInt(value.trim()) > 0n;
}

function isActiveBoundaryJob(status: BoundarySyncStatus | undefined) {
  return status === "queued" || status === "running" || status === "paused";
}

function summarizeBoundaryTargets(job: BoundarySyncJob | null) {
  if (!job) {
    return "No boundary sync job loaded.";
  }

  const counts = job.targets.reduce(
    (summary, target) => {
      summary[target.status] = (summary[target.status] ?? 0) + 1;
      return summary;
    },
    {} as Record<string, number>,
  );

  return [
    `success=${counts.success ?? 0}`,
    `running=${counts.running ?? 0}`,
    `queued=${counts.queued ?? 0}`,
    `paused=${counts.paused ?? 0}`,
    `failed=${counts.failed ?? 0}`,
  ].join(" · ");
}

function isSupabaseStatusReadyForCreate(status: string | null) {
  return status === "calculated" || status === "finalized";
}

function isSupabaseStatusAlreadyCreated(status: string | null) {
  return (
    status === "created" ||
    status === "funded" ||
    status === "claim_paused" ||
    status === "closed"
  );
}

function padDatePart(value: number) {
  return String(value).padStart(2, "0");
}

function toDateTimeLocalInput(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = padDatePart(date.getMonth() + 1);
  const day = padDatePart(date.getDate());
  const hour = padDatePart(date.getHours());
  const minute = padDatePart(date.getMinutes());

  return `${year}-${month}-${day}T${hour}:${minute}`;
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
    <div className="grid gap-2 border-b border-white/10 py-3 last:border-b-0 md:grid-cols-[260px_1fr]">
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

function Field({
  label,
  description,
  value,
  onChange,
  placeholder,
  type = "text",
  readOnly = false,
}: {
  label: string;
  description?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  readOnly?: boolean;
}) {
  return (
    <label className="block rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="font-medium">{label}</div>
      {description ? (
        <p className="mt-1 text-xs text-white/50">{description}</p>
      ) : null}
      <input
        className="mt-3 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 font-mono text-sm outline-none focus:border-white/30 disabled:cursor-not-allowed disabled:opacity-60"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        type={type}
        value={value}
      />
    </label>
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
            ? "Mined successfully. Run reward event sync after create/fund/claim so Supabase reflects the on-chain state."
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

export function AdminRewardRoundControls({ chainSet }: { chainSet: ChainSet }) {
  const {
    address: connectedAddress,
    chainId: connectedChainId,
    isConnected,
  } = useAccount();
  const addresses = getContractAddresses(chainSet);
  const targetChainId = useMemo(() => getTargetChainId(chainSet), [chainSet]);
  const targetChainLabel = useMemo(
    () => getTargetChainLabel(chainSet),
    [chainSet],
  );
  const connectedToTargetChain = connectedChainId === targetChainId;

  const [roundMode, setRoundMode] = useState<RoundMode>("createNew");
  const [rounds, setRounds] = useState<AdminRewardRound[]>([]);
  const [selectedSupabaseRoundId, setSelectedSupabaseRoundId] = useState("");
  const [isRoundsLoading, setIsRoundsLoading] = useState(false);
  const [roundsError, setRoundsError] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [roundIdInput, setRoundIdInput] = useState("");
  const [periodStartInput, setPeriodStartInput] = useState("");
  const [periodEndInput, setPeriodEndInput] = useState("");
  const [rewardAmountInput, setRewardAmountInput] = useState("");
  const [fundAmountInput, setFundAmountInput] = useState("");
  const [approveAmountInput, setApproveAmountInput] = useState("");
  const [merkleRootInput, setMerkleRootInput] = useState("");
  const [lastAction, setLastAction] = useState<TxAction | null>(null);
  const [baseBoundaryBlockInput, setBaseBoundaryBlockInput] = useState("");
  const [ethereumBoundaryBlockInput, setEthereumBoundaryBlockInput] =
    useState("");
  const [boundaryRewardAmountInput, setBoundaryRewardAmountInput] =
    useState("");
  const [boundaryJobs, setBoundaryJobs] = useState<BoundarySyncJob[]>([]);
  const [isBoundaryLoading, setIsBoundaryLoading] = useState(false);
  const [isBoundarySubmitting, setIsBoundarySubmitting] = useState(false);
  const [boundaryError, setBoundaryError] = useState<string | null>(null);
  const [boundarySubmitStatus, setBoundarySubmitStatus] = useState<
    string | null
  >(null);

  const userIsExpectedOwner = useMemo(
    () => isExpectedOwner(connectedAddress),
    [connectedAddress],
  );

  const latestBoundaryJob = boundaryJobs[0] ?? null;
  const activeBoundaryJob = useMemo(
    () =>
      boundaryJobs.find((job) => isActiveBoundaryJob(job.status)) ??
      latestBoundaryJob,
    [boundaryJobs, latestBoundaryJob],
  );
  const boundaryJobActive = isActiveBoundaryJob(activeBoundaryJob?.status);

  const selectedSupabaseRound = useMemo(() => {
    return (
      rounds.find(
        (round) => normalizeRoundId(round.round_id) === selectedSupabaseRoundId,
      ) ?? null
    );
  }, [rounds, selectedSupabaseRoundId]);

  const roundId = parseBigIntInput(roundIdInput);
  const periodStart = parseDateTimeToUnix(periodStartInput);
  const periodEnd = parseDateTimeToUnix(periodEndInput);
  const selectedSupabaseStatus = normalizeRoundStatus(
    selectedSupabaseRound?.status,
  );
  const selectedSupabaseRoundIdValue = selectedSupabaseRound
    ? parseWeiString(selectedSupabaseRound.round_id)
    : null;
  const selectedSupabasePeriodStart = selectedSupabaseRound
    ? parseWeiString(selectedSupabaseRound.period_start_unix)
    : null;
  const selectedSupabasePeriodEnd = selectedSupabaseRound
    ? parseWeiString(selectedSupabaseRound.period_end_unix)
    : null;
  const selectedSupabaseRewardAmount = selectedSupabaseRound
    ? parseWeiString(selectedSupabaseRound.reward_amount_wei)
    : null;
  const selectedSupabaseMerkleRootValue = selectedSupabaseRound?.merkle_root
    ? parseBytes32(selectedSupabaseRound.merkle_root)
    : null;
  const transactionRoundId =
    roundMode === "existingSupabase" && selectedSupabaseRound
      ? selectedSupabaseRoundIdValue
      : roundId;
  const transactionPeriodStart =
    roundMode === "existingSupabase" && selectedSupabaseRound
      ? selectedSupabasePeriodStart
      : periodStart;
  const transactionPeriodEnd =
    roundMode === "existingSupabase" && selectedSupabaseRound
      ? selectedSupabasePeriodEnd
      : periodEnd;

  const tokenDecimalsRead = useReadContract({
    chainId: targetChainId,
    address: addresses.oioi,
    abi: erc20Abi,
    functionName: "decimals",
  });

  const tokenSymbolRead = useReadContract({
    chainId: targetChainId,
    address: addresses.oioi,
    abi: erc20Abi,
    functionName: "symbol",
  });

  const tokenDecimals =
    typeof tokenDecimalsRead.data === "number" ? tokenDecimalsRead.data : 18;
  const tokenSymbol =
    typeof tokenSymbolRead.data === "string" ? tokenSymbolRead.data : "OiOi";
  const boundaryRewardAmount = parseTokenAmount(
    boundaryRewardAmountInput,
    tokenDecimals,
  );
  const boundarySubmitDisabled =
    !isConnected ||
    !userIsExpectedOwner ||
    isBoundarySubmitting ||
    boundaryJobActive ||
    !blockInputValid(baseBoundaryBlockInput) ||
    !blockInputValid(ethereumBoundaryBlockInput) ||
    boundaryRewardAmount === null ||
    boundaryRewardAmount <= 0n;

  const rewardAmount = parseTokenAmount(rewardAmountInput, tokenDecimals);
  const fundAmount = parseTokenAmount(fundAmountInput, tokenDecimals);
  const approveAmount = parseTokenAmount(approveAmountInput, tokenDecimals);
  const merkleRoot = parseBytes32(merkleRootInput);
  const transactionRewardAmount =
    roundMode === "existingSupabase" && selectedSupabaseRound
      ? selectedSupabaseRewardAmount
      : rewardAmount;
  const transactionMerkleRoot =
    roundMode === "existingSupabase" && selectedSupabaseRound
      ? selectedSupabaseMerkleRootValue
      : merkleRoot;

  const rewardRoundRead = useReadContract({
    chainId: targetChainId,
    address: addresses.rewardDistributor,
    abi: rewardDistributorAdminAbi,
    functionName: "getRewardRound",
    args: transactionRoundId !== null ? [transactionRoundId] : undefined,
    query: {
      enabled: transactionRoundId !== null,
      retry: false,
    },
  });

  const isRoundFundedRead = useReadContract({
    chainId: targetChainId,
    address: addresses.rewardDistributor,
    abi: rewardDistributorAdminAbi,
    functionName: "isRoundFunded",
    args: transactionRoundId !== null ? [transactionRoundId] : undefined,
    query: {
      enabled: transactionRoundId !== null,
      retry: false,
    },
  });

  const totalRewardFundedRead = useReadContract({
    chainId: targetChainId,
    address: addresses.rewardDistributor,
    abi: rewardDistributorAdminAbi,
    functionName: "totalRewardFunded",
  });

  const totalRewardClaimedRead = useReadContract({
    chainId: targetChainId,
    address: addresses.rewardDistributor,
    abi: rewardDistributorAdminAbi,
    functionName: "totalRewardClaimed",
  });

  const adminBalanceRead = useReadContract({
    chainId: targetChainId,
    address: addresses.oioi,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [EXPECTED_ADMIN_OWNER_ADDRESS],
  });

  const rewardDistributorBalanceRead = useReadContract({
    chainId: targetChainId,
    address: addresses.oioi,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [addresses.rewardDistributor],
  });

  const allowanceRead = useReadContract({
    chainId: targetChainId,
    address: addresses.oioi,
    abi: erc20Abi,
    functionName: "allowance",
    args: [EXPECTED_ADMIN_OWNER_ADDRESS, addresses.rewardDistributor],
  });

  const {
    data: txHash,
    error: writeError,
    isPending: isWritePending,
    writeContractAsync,
  } = useWriteContract();

  const receipt = useWaitForTransactionReceipt({
    chainId: targetChainId,
    hash: txHash,
    query: {
      enabled: Boolean(txHash),
    },
  });

  const roundData = rewardRoundRead.data as RewardRoundData | undefined;
  const roundExists = roundData?.[0] === true;
  const roundClaimPaused = roundData?.[1] === true;
  const roundRewardAmount = roundData?.[4] ?? 0n;
  const roundFundedAmount = roundData?.[5] ?? 0n;
  const roundClaimedAmount = roundData?.[6] ?? 0n;
  const onChainMerkleRoot = roundData?.[7];
  const roundIsFunded =
    typeof isRoundFundedRead.data === "boolean"
      ? isRoundFundedRead.data
      : false;
  const allowance = asBigInt(allowanceRead.data) ?? 0n;
  const amountNeededToFund = roundExists
    ? maxBigInt(roundRewardAmount - roundFundedAmount, 0n)
    : (transactionRewardAmount ?? 0n);
  const allowanceSufficient =
    amountNeededToFund > 0n && allowance >= amountNeededToFund;
  const roundFullyClaimed =
    roundExists &&
    roundRewardAmount > 0n &&
    roundClaimedAmount >= roundRewardAmount;
  const selectedSupabaseRoundAlreadyCreated = isSupabaseStatusAlreadyCreated(
    selectedSupabaseStatus,
  );
  const selectedSupabaseRoundStatusAllowsCreate =
    roundMode !== "existingSupabase" ||
    isSupabaseStatusReadyForCreate(selectedSupabaseStatus);
  const selectedSupabaseMerkleRoot = selectedSupabaseRound?.merkle_root ?? null;
  const selectedSupabaseRootMatches =
    Boolean(selectedSupabaseMerkleRoot && merkleRoot) &&
    selectedSupabaseMerkleRoot?.toLowerCase() === merkleRoot?.toLowerCase();
  const onChainRootMatchesSupabase =
    Boolean(selectedSupabaseMerkleRoot && onChainMerkleRoot) &&
    selectedSupabaseMerkleRoot?.toLowerCase() ===
      onChainMerkleRoot?.toLowerCase();
  const selectedRoundOnChainMismatch =
    roundMode === "existingSupabase" &&
    Boolean(selectedSupabaseRound) &&
    roundExists &&
    !onChainRootMatchesSupabase;
  const onChainOperationalStatus = !roundExists
    ? "not_created"
    : roundFullyClaimed
      ? "closed"
      : roundIsFunded
        ? roundClaimPaused
          ? "claim_paused"
          : "funded"
        : "created";
  const supabaseStatusMayLag =
    roundMode === "existingSupabase" &&
    Boolean(selectedSupabaseRound) &&
    roundExists &&
    selectedSupabaseStatus !== onChainOperationalStatus;
  const selectedSupabaseInputLocked =
    roundMode !== "existingSupabase" ||
    (Boolean(selectedSupabaseRound) &&
      transactionRoundId !== null &&
      transactionPeriodStart !== null &&
      transactionPeriodEnd !== null &&
      transactionRewardAmount !== null &&
      transactionMerkleRoot !== null &&
      transactionMerkleRoot !== ZERO_BYTES32 &&
      transactionRoundId === selectedSupabaseRoundIdValue &&
      transactionPeriodStart === selectedSupabasePeriodStart &&
      transactionPeriodEnd === selectedSupabasePeriodEnd &&
      transactionRewardAmount === selectedSupabaseRewardAmount &&
      transactionMerkleRoot.toLowerCase() ===
        selectedSupabaseMerkleRootValue?.toLowerCase());
  const createCoreValid =
    transactionRoundId !== null &&
    transactionPeriodStart !== null &&
    transactionPeriodEnd !== null &&
    transactionRewardAmount !== null &&
    transactionRewardAmount > 0n &&
    transactionMerkleRoot !== null &&
    transactionMerkleRoot !== ZERO_BYTES32 &&
    transactionPeriodEnd > transactionPeriodStart;

  const actionDisabledBase =
    !isConnected ||
    !connectedToTargetChain ||
    !userIsExpectedOwner ||
    isWritePending ||
    receipt.isLoading;

  function refetchRewardReads() {
    void rewardRoundRead.refetch();
    void isRoundFundedRead.refetch();
    void totalRewardFundedRead.refetch();
    void totalRewardClaimedRead.refetch();
    void adminBalanceRead.refetch();
    void rewardDistributorBalanceRead.refetch();
    void allowanceRead.refetch();
  }

  async function fetchRounds({ preserveSelection = true } = {}) {
    setIsRoundsLoading(true);
    setRoundsError(null);

    try {
      const response = await fetch(
        `/api/admin/reward-rounds?chain=${chainSet}`,
        {
          cache: "no-store",
        },
      );
      const json = (await response.json()) as AdminRewardRoundApiResponse;

      if (!response.ok || json.ok === false) {
        setRounds([]);
        setSelectedSupabaseRoundId("");
        setRoundsError(
          json.ok === false ? json.error : "Failed to load reward rounds.",
        );
        return;
      }

      const normalizedRounds = json.rounds.map((round) => ({
        ...round,
        round_id: normalizeRoundId(round.round_id),
        period_start_unix: normalizeRoundId(round.period_start_unix),
        period_end_unix: normalizeRoundId(round.period_end_unix),
        reward_amount_wei: normalizeRoundId(round.reward_amount_wei),
        funded_amount_wei: normalizeRoundId(round.funded_amount_wei),
        claimed_amount_wei: normalizeRoundId(round.claimed_amount_wei),
      }));

      setRounds(normalizedRounds);

      if (normalizedRounds.length === 0) {
        setSelectedSupabaseRoundId("");
        return;
      }

      setSelectedSupabaseRoundId((current) => {
        if (
          preserveSelection &&
          current &&
          normalizedRounds.some((round) => round.round_id === current)
        ) {
          return current;
        }

        return normalizedRounds[0].round_id;
      });
    } catch (error) {
      setRounds([]);
      setSelectedSupabaseRoundId("");
      setRoundsError(
        error instanceof Error
          ? error.message
          : "Failed to load reward rounds.",
      );
    } finally {
      setIsRoundsLoading(false);
    }
  }

  function resetRoundInputs() {
    setRoundIdInput("");
    setPeriodStartInput("");
    setPeriodEndInput("");
    setRewardAmountInput("");
    setFundAmountInput("");
    setApproveAmountInput("");
    setMerkleRootInput("");
  }

  function applySupabaseRound(round: AdminRewardRound) {
    setRoundIdInput(normalizeRoundId(round.round_id));
    setPeriodStartInput(toDateTimeLocalInput(round.period_start));
    setPeriodEndInput(toDateTimeLocalInput(round.period_end));
    setRewardAmountAndDefaultFunding(round.reward_amount_oioi);
    setFundAmountInput(round.reward_amount_oioi);
    setApproveAmountInput(round.reward_amount_oioi);
    setMerkleRootInput(round.merkle_root ?? "");
  }

  function buildCopyText(round: AdminRewardRound) {
    return [
      `Round ID: ${round.round_id}`,
      `Reward amount (${tokenSymbol}): ${round.reward_amount_oioi}`,
      `Reward amount (wei): ${round.reward_amount_wei}`,
      `Fund amount (${tokenSymbol}): ${round.reward_amount_oioi}`,
      `Approve amount (${tokenSymbol}): ${round.reward_amount_oioi}`,
      `Period start: ${round.period_start}`,
      `Period end: ${round.period_end}`,
      `Period start unix: ${round.period_start_unix}`,
      `Period end unix: ${round.period_end_unix}`,
      `Merkle root: ${round.merkle_root ?? ""}`,
      `Allocation count: ${round.allocation_summary.allocationCount}`,
      `Allocated amount wei: ${round.allocation_summary.allocatedAmountWei}`,
    ].join("\n");
  }

  async function copySelectedRoundValues() {
    if (!selectedSupabaseRound) {
      return;
    }

    await navigator.clipboard.writeText(buildCopyText(selectedSupabaseRound));
    setCopyStatus("Copied selected round values.");
    window.setTimeout(() => setCopyStatus(null), 2500);
  }

  async function fetchBoundaryJobs() {
    setIsBoundaryLoading(true);
    setBoundaryError(null);

    try {
      const response = await fetch("/api/admin/boundary-sync", {
        cache: "no-store",
      });
      const json = (await response.json()) as BoundarySyncApiResponse;

      if (!response.ok || json.ok === false) {
        setBoundaryJobs([]);
        setBoundaryError(
          json.ok === false ? json.error : "Failed to load boundary sync jobs.",
        );
        return;
      }

      setBoundaryJobs(json.jobs);

      if (json.jobs[0]?.status === "success") {
        void fetchRounds({ preserveSelection: true });
      }
    } catch (error) {
      setBoundaryJobs([]);
      setBoundaryError(
        error instanceof Error
          ? error.message
          : "Failed to load boundary sync jobs.",
      );
    } finally {
      setIsBoundaryLoading(false);
    }
  }

  async function submitBoundarySyncJob() {
    if (boundarySubmitDisabled) {
      return;
    }

    const confirmed = confirmAction({
      title: "Submit Block Tapal Batas",
      risk: "critical",
      lines: [
        `Base Sepolia target block: ${baseBoundaryBlockInput.trim()}`,
        `Ethereum Sepolia target block: ${ethereumBoundaryBlockInput.trim()}`,
        `Reward amount: ${boundaryRewardAmountInput} ${tokenSymbol}`,
        "This creates a queued Supabase job. Run the boundary worker until the job reaches success before creating the reward round on-chain.",
      ],
    });

    if (!confirmed) {
      return;
    }

    setIsBoundarySubmitting(true);
    setBoundaryError(null);
    setBoundarySubmitStatus(null);

    try {
      const response = await fetch("/api/admin/boundary-sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-oioi-admin": connectedAddress ?? "",
        },
        body: JSON.stringify({
          chains: {
            baseSepolia: baseBoundaryBlockInput.trim(),
            ethereumSepolia: ethereumBoundaryBlockInput.trim(),
          },
          rewardAmountOiOi: boundaryRewardAmountInput.trim(),
        }),
      });
      const json = (await response.json()) as BoundarySyncApiResponse;

      if (!response.ok || json.ok === false) {
        setBoundaryError(
          json.ok === false
            ? json.error
            : "Failed to submit boundary sync job.",
        );
        return;
      }

      setBoundaryJobs(json.jobs);
      setBoundarySubmitStatus("Boundary sync job submitted.");
      setRoundMode("existingSupabase");
    } catch (error) {
      setBoundaryError(
        error instanceof Error
          ? error.message
          : "Failed to submit boundary sync job.",
      );
    } finally {
      setIsBoundarySubmitting(false);
    }
  }

  useEffect(() => {
    void fetchRounds({ preserveSelection: true });
    void fetchBoundaryJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chainSet]);

  useEffect(() => {
    if (!boundaryJobActive) {
      return;
    }

    const timer = window.setInterval(() => {
      void fetchBoundaryJobs();
    }, 15_000);

    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boundaryJobActive]);

  useEffect(() => {
    if (receipt.isSuccess) {
      refetchRewardReads();
      void fetchRounds({ preserveSelection: true });

      const timers = [1_500, 5_000].map((delay) =>
        window.setTimeout(() => {
          refetchRewardReads();
          void fetchRounds({ preserveSelection: true });
        }, delay),
      );

      return () => {
        timers.forEach((timer) => window.clearTimeout(timer));
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receipt.isSuccess]);

  useEffect(() => {
    if (roundMode === "existingSupabase" && selectedSupabaseRound) {
      applySupabaseRound(selectedSupabaseRound);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundMode, selectedSupabaseRoundId, selectedSupabaseRound?.updated_at]);

  useEffect(() => {
    if (
      roundMode !== "existingSupabase" ||
      !selectedSupabaseRound ||
      !roundExists ||
      roundIsFunded ||
      amountNeededToFund <= 0n
    ) {
      return;
    }

    const remainingAmountInput = formatUnits(amountNeededToFund, tokenDecimals);

    if (fundAmount === null || fundAmount > amountNeededToFund) {
      setFundAmountInput(remainingAmountInput);
    }

    if (approveAmount === null || approveAmount < amountNeededToFund) {
      setApproveAmountInput(remainingAmountInput);
    }
  }, [
    amountNeededToFund,
    approveAmount,
    fundAmount,
    roundExists,
    roundIsFunded,
    roundMode,
    selectedSupabaseRound,
    tokenDecimals,
  ]);

  function setRewardAmountAndDefaultFunding(nextValue: string) {
    setRewardAmountInput((previousRewardAmount) => {
      setApproveAmountInput((previousApproveAmount) => {
        if (
          !previousApproveAmount ||
          previousApproveAmount === previousRewardAmount
        ) {
          return nextValue;
        }

        return previousApproveAmount;
      });

      setFundAmountInput((previousFundAmount) => {
        if (
          !previousFundAmount ||
          previousFundAmount === previousRewardAmount
        ) {
          return nextValue;
        }

        return previousFundAmount;
      });

      return nextValue;
    });
  }

  function setPeriodEndAndRoundId(nextValue: string) {
    setPeriodEndInput(nextValue);

    if (roundMode !== "createNew") {
      return;
    }

    const parsedPeriodEnd = parseDateTimeToUnix(nextValue);

    if (parsedPeriodEnd !== null) {
      setRoundIdInput(parsedPeriodEnd.toString());
    }
  }

  function changeRoundMode(nextMode: RoundMode) {
    setRoundMode(nextMode);

    if (nextMode === "createNew") {
      resetRoundInputs();
      return;
    }

    if (rounds.length === 0) {
      void fetchRounds({ preserveSelection: false });
      return;
    }

    const round = selectedSupabaseRound ?? rounds[0];
    setSelectedSupabaseRoundId(round.round_id);
    applySupabaseRound(round);
  }

  function confirmAction({
    title,
    lines,
    risk,
  }: {
    title: string;
    lines: string[];
    risk: "high" | "critical";
  }) {
    const prefix =
      risk === "critical" ? "CRITICAL ADMIN ACTION" : "HIGH RISK ADMIN ACTION";

    return window.confirm(
      [
        prefix,
        title,
        "",
        ...lines,
        "",
        "Only continue if the reward calculator output, Merkle root, amount, and round ID have been reviewed.",
      ].join("\n"),
    );
  }

  async function approveRewardFunding() {
    if (approveAmount === null) {
      return;
    }

    const confirmed = confirmAction({
      title: "Approve $OiOi reward funding",
      risk: "high",
      lines: [
        `Token: ${addresses.oioi}`,
        `Spender: ${addresses.rewardDistributor}`,
        `Amount: ${approveAmountInput} ${tokenSymbol}`,
        `Selected round: ${transactionRoundId?.toString() ?? "invalid"}`,
        `Amount still needed to fund: ${formatTokenAmount({ value: amountNeededToFund })}`,
      ],
    });

    if (!confirmed) {
      return;
    }

    setLastAction("approve");

    await writeContractAsync({
      chainId: targetChainId,
      address: addresses.oioi,
      abi: erc20Abi,
      functionName: "approve",
      args: [addresses.rewardDistributor, approveAmount],
    });
  }

  async function createRewardRound() {
    if (
      transactionRoundId === null ||
      transactionPeriodStart === null ||
      transactionPeriodEnd === null ||
      transactionRewardAmount === null ||
      transactionMerkleRoot === null ||
      !createCoreValid
    ) {
      return;
    }

    const confirmed = confirmAction({
      title: "Create reward round",
      risk: "critical",
      lines: [
        `Round ID: ${transactionRoundId.toString()}`,
        `Period start: ${transactionPeriodStart.toString()}`,
        `Period end: ${transactionPeriodEnd.toString()}`,
        `Reward amount wei: ${transactionRewardAmount.toString()}`,
        `Reward amount input: ${rewardAmountInput} ${tokenSymbol}`,
        `Merkle root: ${transactionMerkleRoot}`,
        selectedSupabaseRound
          ? `Supabase indexed status: ${selectedSupabaseRound.status}`
          : "Supabase indexed status: create-new/manual",
      ],
    });

    if (!confirmed) {
      return;
    }

    setLastAction("createRound");

    await writeContractAsync({
      chainId: targetChainId,
      address: addresses.rewardDistributor,
      abi: rewardDistributorAdminAbi,
      functionName: "createRewardRound",
      args: [
        transactionRoundId,
        transactionPeriodStart,
        transactionPeriodEnd,
        transactionRewardAmount,
        transactionMerkleRoot,
      ],
    });
  }

  async function fundRewardRound() {
    if (transactionRoundId === null || fundAmount === null) {
      return;
    }

    const confirmed = confirmAction({
      title: "Fund reward round",
      risk: "high",
      lines: [
        `Round ID: ${transactionRoundId.toString()}`,
        `Fund amount: ${fundAmountInput} ${tokenSymbol}`,
        `RewardDistributor: ${addresses.rewardDistributor}`,
        `Current allowance: ${formatTokenAmount({ value: allowance })}`,
        `Amount still needed to fund: ${formatTokenAmount({ value: amountNeededToFund })}`,
      ],
    });

    if (!confirmed) {
      return;
    }

    setLastAction("fundRound");

    await writeContractAsync({
      chainId: targetChainId,
      address: addresses.rewardDistributor,
      abi: rewardDistributorAdminAbi,
      functionName: "fundRewardRound",
      args: [transactionRoundId, fundAmount],
    });
  }

  async function setClaimPaused(paused: boolean) {
    if (transactionRoundId === null) {
      return;
    }

    const confirmed = confirmAction({
      title: paused ? "Pause reward claims" : "Unpause reward claims",
      risk: paused ? "high" : "critical",
      lines: [
        `Round ID: ${transactionRoundId.toString()}`,
        `New claimPaused value: ${paused ? "true" : "false"}`,
      ],
    });

    if (!confirmed) {
      return;
    }

    setLastAction(paused ? "pauseClaims" : "unpauseClaims");

    await writeContractAsync({
      chainId: targetChainId,
      address: addresses.rewardDistributor,
      abi: rewardDistributorAdminAbi,
      functionName: "setClaimPaused",
      args: [transactionRoundId, paused],
    });
  }

  const selectedRoundReadyForCreate =
    roundMode === "createNew" ||
    (Boolean(selectedSupabaseRound) &&
      selectedSupabaseRound?.ready_for_create === true &&
      selectedSupabaseRoundStatusAllowsCreate &&
      !selectedSupabaseRoundAlreadyCreated);
  const approveAmountEnough =
    approveAmount !== null &&
    amountNeededToFund > 0n &&
    approveAmount >= amountNeededToFund;
  const fundAmountValid =
    fundAmount !== null &&
    fundAmount > 0n &&
    amountNeededToFund > 0n &&
    fundAmount <= amountNeededToFund;

  const createRoundDisabled =
    actionDisabledBase ||
    !createCoreValid ||
    !selectedRoundReadyForCreate ||
    !selectedSupabaseInputLocked ||
    selectedSupabaseRoundAlreadyCreated ||
    roundExists;

  const approveDisabled =
    actionDisabledBase ||
    approveAmount === null ||
    !approveAmountEnough ||
    !roundExists ||
    roundIsFunded ||
    allowanceSufficient ||
    selectedRoundOnChainMismatch ||
    roundFullyClaimed;

  const fundDisabled =
    actionDisabledBase ||
    transactionRoundId === null ||
    !fundAmountValid ||
    !roundExists ||
    roundIsFunded ||
    !allowanceSufficient ||
    selectedRoundOnChainMismatch ||
    roundFullyClaimed;

  const pauseDisabled =
    actionDisabledBase ||
    transactionRoundId === null ||
    !roundExists ||
    selectedRoundOnChainMismatch ||
    roundFullyClaimed;

  const suggestedAction = (() => {
    if (roundMode === "existingSupabase" && isRoundsLoading) {
      return "Loading Supabase reward rounds.";
    }

    if (isConnected && !connectedToTargetChain) {
      return `Switch wallet to ${targetChainLabel} (chainId ${targetChainId}) before sending reward admin transactions. Contract reads are locked to the target chain.`;
    }

    if (roundMode === "existingSupabase" && !selectedSupabaseRound) {
      return "Select an existing Supabase reward round first.";
    }

    if (!createCoreValid && !roundExists) {
      return "Complete a valid round ID, period, positive reward amount, and non-zero Merkle root.";
    }

    if (
      roundMode === "existingSupabase" &&
      selectedSupabaseRoundAlreadyCreated &&
      !roundExists
    ) {
      return "Supabase says this round was already created on-chain, but the current contract read does not confirm it yet. Refresh reads, check chain/RPC, and do not create again.";
    }

    if (
      roundMode === "existingSupabase" &&
      isSupabaseStatusReadyForCreate(selectedSupabaseStatus) &&
      !roundExists
    ) {
      return "Create the selected Supabase reward round on-chain.";
    }

    if (!roundExists) {
      return "Create the reward round on-chain first.";
    }

    if (selectedRoundOnChainMismatch) {
      return "On-chain round exists, but Merkle root does not match the selected Supabase round. Stop and review before funding.";
    }

    if (roundFullyClaimed) {
      return "This round appears fully claimed from on-chain counters. Treat as read-only.";
    }

    if (!roundIsFunded && !allowanceSufficient) {
      return "Approve enough $OiOi allowance for the selected round.";
    }

    if (!roundIsFunded && allowanceSufficient) {
      return "Fund the selected reward round.";
    }

    if (roundIsFunded) {
      return "Round is funded. Claim should be available to eligible wallets unless paused or already claimed.";
    }

    return "Review selected round state.";
  })();

  return (
    <section className="grid gap-5">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <p className="text-sm uppercase tracking-[0.25em] text-white/50">
          Admin Writes
        </p>
        <h2 className="mt-2 text-2xl font-semibold">Reward Round Controls</h2>
        <p className="mt-2 text-sm text-white/60">
          Owner-only controls for selecting Supabase-generated reward rounds,
          creating them on-chain, approving $OiOi, funding reward rounds, and
          pausing or unpausing claims.
        </p>

        <div className="mt-5 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4">
          <div className="font-medium text-yellow-100">Important</div>
          <p className="mt-2 text-sm text-yellow-100/80">
            Existing round mode is backed by Supabase reward calculator and
            Merkle proof data. Create-new mode remains available for controlled
            manual testing only.
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-blue-500/30 bg-blue-500/10 p-6">
        <h3 className="text-2xl font-semibold text-blue-100">
          Current contract model
        </h3>
        <div className="mt-3 grid gap-2 text-sm text-blue-100/80">
          <p>
            The RewardDistributor contract does not auto-generate sequential
            round IDs. In the chosen workflow, the reward pipeline uses
            periodEnd Unix timestamp as the round ID.
          </p>
          <p>
            Period start, period end, reward amount, and Merkle root should come
            from Supabase reward calculation output before create/fund actions.
          </p>
          <p>
            Approval is global ERC20 allowance, not per-round status. The UI
            treats approval as ready only when allowance is enough to fund the
            selected round.
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-white/50">
              Boundary Sync
            </p>
            <h3 className="mt-2 text-2xl font-semibold">Block Tapal Batas</h3>
            <p className="mt-2 max-w-3xl text-sm text-white/60">
              Submit the final block numbers and reward amount for the next
              reward period. The worker syncs both chains, rebuilds derived
              state, calculates allocations, and generates the Merkle root
              before the round can be created on-chain.
            </p>
          </div>

          <button
            className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={isBoundaryLoading}
            onClick={() => void fetchBoundaryJobs()}
            type="button"
          >
            {isBoundaryLoading ? "Refreshing..." : "Refresh sync status"}
          </button>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <Field
            label="Base Sepolia Block Tapal Batas"
            description="Final Base Sepolia block for this reward period."
            onChange={setBaseBoundaryBlockInput}
            placeholder="41832200"
            value={baseBoundaryBlockInput}
          />
          <Field
            label="Ethereum Sepolia Block Tapal Batas"
            description="Final Ethereum Sepolia block for this reward period."
            onChange={setEthereumBoundaryBlockInput}
            placeholder="10896262"
            value={ethereumBoundaryBlockInput}
          />
          <Field
            label={`Reward amount (${tokenSymbol})`}
            description="Total amount to allocate for the generated round."
            onChange={setBoundaryRewardAmountInput}
            placeholder="1000"
            value={boundaryRewardAmountInput}
          />
        </div>

        <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <button
            className="rounded-2xl border border-white/10 bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={boundarySubmitDisabled}
            onClick={() => void submitBoundarySyncJob()}
            type="button"
          >
            {isBoundarySubmitting ? "Submitting..." : "Submit Tapal Batas"}
          </button>

          <div className="text-sm text-white/60">
            {boundaryJobActive
              ? "An active boundary sync job exists. Finish or cancel it before submitting another one."
              : "Submit is available when both blocks and reward amount are valid."}
          </div>
        </div>

        {boundarySubmitStatus ? (
          <div className="mt-4 rounded-2xl border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-100/80">
            {boundarySubmitStatus}
          </div>
        ) : null}

        {boundaryError ? (
          <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100/80">
            {boundaryError}
          </div>
        ) : null}

        <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 px-4">
          <ReadRow
            label="Latest job"
            value={activeBoundaryJob?.id ?? "No boundary sync job found"}
          />
          <ReadRow
            label="Job status"
            value={activeBoundaryJob?.status ?? "—"}
            warning={
              activeBoundaryJob?.error_message ??
              (activeBoundaryJob?.status === "paused"
                ? "Worker paused this job. Check the target error and rerun the worker after the retry delay."
                : undefined)
            }
          />
          <ReadRow
            label="Target summary"
            value={summarizeBoundaryTargets(activeBoundaryJob)}
          />
          <ReadRow
            label="Reward amount"
            value={
              activeBoundaryJob?.reward_amount_wei
                ? `${formatUnits(BigInt(activeBoundaryJob.reward_amount_wei), tokenDecimals)} ${tokenSymbol}`
                : "—"
            }
          />
          <ReadRow
            label="Created"
            value={activeBoundaryJob?.created_at ?? "—"}
          />
          <ReadRow
            label="Finished"
            value={activeBoundaryJob?.finished_at ?? "—"}
          />
        </div>

        {activeBoundaryJob?.snapshots.length ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {activeBoundaryJob.snapshots.map((snapshot) => (
              <div
                className="rounded-2xl border border-white/10 bg-black/20 px-4"
                key={snapshot.id}
              >
                <ReadRow label="Chain" value={snapshot.chain_key} />
                <ReadRow label="Snapshot status" value={snapshot.status} />
                <ReadRow
                  label="From block"
                  value={snapshot.from_block.toString()}
                />
                <ReadRow
                  label="To block"
                  value={snapshot.to_block.toString()}
                />
                <ReadRow
                  label="From timestamp"
                  value={snapshot.from_block_timestamp ?? "—"}
                />
                <ReadRow
                  label="To timestamp"
                  value={snapshot.to_block_timestamp ?? "—"}
                />
              </div>
            ))}
          </div>
        ) : null}

        {activeBoundaryJob?.targets.length ? (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-black/20">
            <table className="w-full min-w-[840px] text-left text-sm">
              <thead className="border-b border-white/10 text-white/50">
                <tr>
                  <th className="px-4 py-3 font-medium">Chain</th>
                  <th className="px-4 py-3 font-medium">Task</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Progress</th>
                  <th className="px-4 py-3 font-medium">Attempts</th>
                  <th className="px-4 py-3 font-medium">Next attempt</th>
                  <th className="px-4 py-3 font-medium">Error</th>
                </tr>
              </thead>
              <tbody>
                {activeBoundaryJob.targets.map((target) => (
                  <tr className="border-b border-white/5" key={target.id}>
                    <td className="px-4 py-3 font-mono">{target.chain_key}</td>
                    <td className="px-4 py-3 font-mono">{target.task_key}</td>
                    <td className="px-4 py-3">{target.status}</td>
                    <td className="px-4 py-3 font-mono">
                      {target.last_processed_block ?? "—"} /{" "}
                      {target.target_block ?? "—"}
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {target.attempts.toString()}
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {target.next_attempt_at ?? "—"}
                    </td>
                    <td className="max-w-[260px] px-4 py-3 text-red-100/80">
                      {target.error_message ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h3 className="text-2xl font-semibold">Round selector</h3>
        <p className="mt-2 text-sm text-white/60">
          Choose whether to manually create a new test round or operate on an
          existing Supabase-generated round.
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="block rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="font-medium">Round mode</div>
            <p className="mt-1 text-xs text-white/50">
              Existing Supabase round auto-fills the reward round form from the
              reward calculator and Merkle pipeline.
            </p>
            <select
              className="mt-3 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-white/30"
              onChange={(event) =>
                changeRoundMode(event.target.value as RoundMode)
              }
              value={roundMode}
            >
              <option value="createNew">Create new round</option>
              <option value="existingSupabase">Existing Supabase round</option>
            </select>
          </label>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="font-medium">Suggested action</div>
            <p className="mt-3 text-sm text-white/70">{suggestedAction}</p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h3 className="text-2xl font-semibold">Reward round input</h3>
            <p className="mt-2 text-sm text-white/60">
              Existing Supabase rounds auto-fill the form. Create-new mode
              starts blank and auto-fills round ID from period end.
            </p>
          </div>

          <button
            className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={roundMode !== "existingSupabase" || isRoundsLoading}
            onClick={() => void fetchRounds({ preserveSelection: true })}
            type="button"
          >
            {isRoundsLoading ? "Refreshing..." : "Refresh rounds"}
          </button>
        </div>

        {roundMode === "existingSupabase" ? (
          <div className="mt-5 grid gap-4 md:grid-cols-[360px_1fr]">
            <label className="block rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="font-medium">Existing reward round</div>
              <p className="mt-1 text-xs text-white/50">
                Select a Supabase-generated round. The fields below will be
                populated from the selected round.
              </p>
              <select
                className="mt-3 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-white/30"
                disabled={isRoundsLoading || rounds.length === 0}
                onChange={(event) =>
                  setSelectedSupabaseRoundId(event.target.value)
                }
                value={selectedSupabaseRoundId}
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

              <button
                className="mt-4 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                disabled={!selectedSupabaseRound}
                onClick={() => void copySelectedRoundValues()}
                type="button"
              >
                Copy selected round values
              </button>
              {copyStatus ? (
                <div className="mt-2 text-xs text-green-100/80">
                  {copyStatus}
                </div>
              ) : null}
            </label>

            <div className="rounded-2xl border border-white/10 bg-black/20 px-4">
              {roundsError ? (
                <div className="py-4 text-sm text-red-100/80">
                  {roundsError}
                </div>
              ) : selectedSupabaseRound ? (
                <>
                  <ReadRow
                    label="Supabase indexed status"
                    value={selectedSupabaseRound.status}
                  />
                  <ReadRow
                    label="Ready for create"
                    value={formatBool(selectedSupabaseRound.ready_for_create)}
                    warning={
                      selectedSupabaseRound.ready_for_create
                        ? undefined
                        : "This round is missing Merkle root, reward amount, or allocations."
                    }
                  />
                  <ReadRow
                    label="Reward amount"
                    value={`${selectedSupabaseRound.reward_amount_oioi} ${tokenSymbol}`}
                  />
                  <ReadRow
                    label="Merkle root"
                    value={selectedSupabaseRound.merkle_root ?? "Not generated"}
                  />
                  <ReadRow
                    label="Allocation count"
                    value={selectedSupabaseRound.allocation_summary.allocationCount.toString()}
                  />
                  <ReadRow
                    label="Positive allocations"
                    value={selectedSupabaseRound.allocation_summary.positiveAllocationCount.toString()}
                  />
                  <ReadRow
                    label="Proof-ready allocations"
                    value={selectedSupabaseRound.allocation_summary.proofReadyCount.toString()}
                  />
                  <ReadRow
                    label="Claimed allocations"
                    value={selectedSupabaseRound.allocation_summary.claimedCount.toString()}
                  />
                  <ReadRow
                    label="Allocated amount wei"
                    value={
                      selectedSupabaseRound.allocation_summary
                        .allocatedAmountWei
                    }
                  />
                </>
              ) : (
                <div className="py-4 text-sm text-white/60">
                  No Supabase reward round selected.
                </div>
              )}
            </div>
          </div>
        ) : null}

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field
            label="Round ID"
            description={
              roundMode === "createNew"
                ? "Auto-generated from period end Unix timestamp."
                : "Auto-filled from the selected Supabase round."
            }
            onChange={setRoundIdInput}
            placeholder="1778842307"
            readOnly={
              roundMode === "createNew" || Boolean(selectedSupabaseRound)
            }
            value={roundIdInput}
          />
          <Field
            label={`Reward amount (${tokenSymbol})`}
            description="Total reward allocation for this round. Existing Supabase mode locks this value to calculator output."
            onChange={setRewardAmountAndDefaultFunding}
            placeholder="1000"
            readOnly={Boolean(selectedSupabaseRound)}
            value={rewardAmountInput}
          />
          <Field
            label={`Fund amount (${tokenSymbol})`}
            description="Amount to fund. If the round is partially funded, this is adjusted to the remaining amount needed."
            onChange={setFundAmountInput}
            placeholder="1000"
            value={fundAmountInput}
          />
          <Field
            label={`Approve amount (${tokenSymbol})`}
            description="Amount to approve RewardDistributor to spend. Must be at least amount needed to fund."
            onChange={setApproveAmountInput}
            placeholder="1000"
            value={approveAmountInput}
          />
          <Field
            label="Period start"
            description="Reward period start from Supabase reward calculation."
            onChange={setPeriodStartInput}
            readOnly={Boolean(selectedSupabaseRound)}
            type="datetime-local"
            value={periodStartInput}
          />
          <Field
            label="Period end"
            description="Reward period end. In create-new mode this becomes roundId."
            onChange={setPeriodEndAndRoundId}
            readOnly={Boolean(selectedSupabaseRound)}
            type="datetime-local"
            value={periodEndInput}
          />
        </div>

        <div className="mt-4">
          <Field
            label="Merkle root"
            description="bytes32 root from reward calculator output. Must match published reward proofs."
            onChange={setMerkleRootInput}
            placeholder="0x..."
            readOnly={Boolean(selectedSupabaseRound)}
            value={merkleRootInput}
          />
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h3 className="text-2xl font-semibold">On-chain reward round state</h3>
        <p className="mt-2 text-sm text-white/60">
          The selected round ID is read directly from the RewardDistributor
          contract on the target chain before any write action.
        </p>

        <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 px-4">
          <ReadRow label="Round exists" value={formatBool(roundExists)} />
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
          <ReadRow label="Merkle root" value={roundData?.[7] ?? "—"} />
          <ReadRow label="Round funded" value={formatBool(roundIsFunded)} />
          <ReadRow
            label="On-chain root matches Supabase"
            value={
              selectedSupabaseRound && roundExists
                ? formatBool(onChainRootMatchesSupabase)
                : "—"
            }
          />
        </div>

        {rewardRoundRead.error ? (
          <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100/80">
            Read error: {rewardRoundRead.error.message}
          </div>
        ) : null}
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h3 className="text-2xl font-semibold">
          On-chain funding and token state
        </h3>

        <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 px-4">
          <ReadRow
            label="Target chain"
            value={`${targetChainLabel} (${targetChainId})`}
          />
          <ReadRow
            label="Connected wallet chain"
            value={
              connectedChainId === undefined
                ? "Not connected"
                : connectedChainId.toString()
            }
            warning={
              isConnected && !connectedToTargetChain
                ? "Switch wallet to the target chain before write actions."
                : undefined
            }
          />
          <ReadRow
            label="Connected to target chain"
            value={formatBool(isConnected && connectedToTargetChain)}
          />
          <ReadRow
            label="Admin wallet"
            value={shortAddress(EXPECTED_ADMIN_OWNER_ADDRESS)}
          />
          <ReadRow label="$OiOi token" value={shortAddress(addresses.oioi)} />
          <ReadRow
            label="RewardDistributor"
            value={shortAddress(addresses.rewardDistributor)}
          />
          <ReadRow
            label="Admin $OiOi balance"
            value={formatTokenAmount({ value: adminBalanceRead.data })}
          />
          <ReadRow
            label="RewardDistributor $OiOi balance"
            value={formatTokenAmount({
              value: rewardDistributorBalanceRead.data,
            })}
          />
          <ReadRow
            label="Admin allowance"
            value={formatTokenAmount({ value: allowanceRead.data })}
          />
          <ReadRow
            label="Total reward funded"
            value={formatTokenAmount({ value: totalRewardFundedRead.data })}
          />
          <ReadRow
            label="Total reward claimed"
            value={formatTokenAmount({ value: totalRewardClaimedRead.data })}
          />
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h3 className="text-2xl font-semibold">Action readiness checklist</h3>
        <p className="mt-2 text-sm text-white/60">
          This combines selected Supabase data, parsed transaction inputs,
          on-chain round state, and funding readiness before any write action.
        </p>

        <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 px-4">
          <ReadRow
            label="Round mode"
            value={
              roundMode === "createNew" ? "Create new" : "Existing Supabase"
            }
          />
          <ReadRow
            label="Target chain"
            value={`${targetChainLabel} (${targetChainId})`}
          />
          <ReadRow
            label="Wallet chain matches target"
            value={formatBool(isConnected && connectedToTargetChain)}
            warning={
              isConnected && !connectedToTargetChain
                ? "Write buttons are disabled until the wallet is on the target chain."
                : undefined
            }
          />
          <ReadRow
            label="Selected Supabase round"
            value={selectedSupabaseRound?.round_id ?? "—"}
          />
          <ReadRow
            label="Transaction round ID"
            value={
              transactionRoundId === null
                ? "Invalid"
                : transactionRoundId.toString()
            }
          />
          <ReadRow
            label="Round ID parsed"
            value={roundId === null ? "Invalid" : roundId.toString()}
          />
          <ReadRow
            label="Period start parsed"
            value={
              periodStart === null
                ? "Invalid"
                : formatUnixTimestamp(periodStart)
            }
          />
          <ReadRow
            label="Period end parsed"
            value={
              periodEnd === null ? "Invalid" : formatUnixTimestamp(periodEnd)
            }
          />
          <ReadRow
            label="Reward amount parsed"
            value={
              rewardAmount === null
                ? "Invalid"
                : formatTokenAmount({ value: rewardAmount })
            }
          />
          <ReadRow
            label="Fund amount parsed"
            value={
              fundAmount === null
                ? "Invalid"
                : formatTokenAmount({ value: fundAmount })
            }
          />
          <ReadRow
            label="Approve amount parsed"
            value={
              approveAmount === null
                ? "Invalid"
                : formatTokenAmount({ value: approveAmount })
            }
          />
          <ReadRow label="Merkle root parsed" value={merkleRoot ?? "Invalid"} />
          <ReadRow
            label="Create core valid"
            value={formatBool(createCoreValid)}
            warning={
              createCoreValid
                ? undefined
                : "Requires positive reward amount, period end greater than period start, and non-zero Merkle root."
            }
          />
          <ReadRow
            label="Supabase status allows create"
            value={
              selectedSupabaseRound
                ? formatBool(selectedSupabaseRoundStatusAllowsCreate)
                : "—"
            }
            warning={
              selectedSupabaseRoundStatusAllowsCreate
                ? undefined
                : "Only calculated/finalized rounds should be created. Created/funded/closed rounds must not be created again."
            }
          />
          <ReadRow
            label="Supabase input locked"
            value={formatBool(selectedSupabaseInputLocked)}
          />
          <ReadRow
            label="Supabase root matches input"
            value={
              selectedSupabaseRound
                ? formatBool(selectedSupabaseRootMatches)
                : "—"
            }
          />
          <ReadRow
            label="Operational status source"
            value={`On-chain: ${onChainOperationalStatus}`}
            warning={
              supabaseStatusMayLag
                ? `Supabase status is still ${selectedSupabaseStatus}; reward event sync can reconcile it later.`
                : undefined
            }
          />
          <ReadRow label="Round exists" value={formatBool(roundExists)} />
          <ReadRow label="Round funded" value={formatBool(roundIsFunded)} />
          <ReadRow label="Claim paused" value={formatBool(roundClaimPaused)} />
          <ReadRow
            label="Amount needed to fund"
            value={formatTokenAmount({ value: amountNeededToFund })}
          />
          <ReadRow
            label="Approve amount enough"
            value={formatBool(approveAmountEnough)}
          />
          <ReadRow
            label="Allowance sufficient"
            value={formatBool(allowanceSufficient)}
          />
          <ReadRow
            label="Fund amount valid"
            value={formatBool(fundAmountValid)}
          />
          <ReadRow
            label="Round fully claimed"
            value={formatBool(roundFullyClaimed)}
          />
        </div>
      </section>

      {!userIsExpectedOwner ? (
        <section className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-100/80">
          Reward write actions are disabled because the connected wallet is not
          the expected owner.
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2">
        <button
          className="rounded-3xl border border-green-500/30 bg-green-500/10 p-5 font-medium text-green-100 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={createRoundDisabled}
          onClick={() => void createRewardRound()}
          type="button"
        >
          Create Reward Round
        </button>

        <button
          className="rounded-3xl border border-blue-500/30 bg-blue-500/10 p-5 font-medium text-blue-100 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={approveDisabled}
          onClick={() => void approveRewardFunding()}
          type="button"
        >
          Approve $OiOi Funding
        </button>

        <button
          className="rounded-3xl border border-green-500/30 bg-green-500/10 p-5 font-medium text-green-100 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={fundDisabled}
          onClick={() => void fundRewardRound()}
          type="button"
        >
          Fund Reward Round
        </button>

        <div className="grid gap-4 md:grid-cols-2">
          <button
            className="rounded-3xl border border-yellow-500/30 bg-yellow-500/10 p-5 font-medium text-yellow-100 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={pauseDisabled || roundClaimPaused}
            onClick={() => void setClaimPaused(true)}
            type="button"
          >
            Pause Claims
          </button>

          <button
            className="rounded-3xl border border-red-500/30 bg-red-500/10 p-5 font-medium text-red-100 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={pauseDisabled || !roundClaimPaused}
            onClick={() => void setClaimPaused(false)}
            type="button"
          >
            Unpause Claims
          </button>
        </div>
      </section>

      {lastAction ? (
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="font-medium">Last requested reward action</div>
          <div className="mt-2 font-mono text-sm text-white/60">
            {lastAction}
          </div>
        </section>
      ) : null}

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
