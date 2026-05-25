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

type RoundMode = "createNew" | "existingSupabase";

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

function StatusPill({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "success" | "warning" | "danger" | "info" | "purple";
}) {
  const toneClass =
    tone === "success"
      ? "border-green-500/30 bg-green-500/10 text-green-100"
      : tone === "warning"
        ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-100"
        : tone === "danger"
          ? "border-red-500/30 bg-red-500/10 text-red-100"
          : tone === "info"
            ? "border-blue-500/30 bg-blue-500/10 text-blue-100"
            : tone === "purple"
              ? "border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-100"
              : "border-white/10 bg-white/5 text-white/70";

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
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="text-xs uppercase tracking-[0.18em] text-white/40">
        {label}
      </div>
      <div className="mt-2 break-all font-mono text-sm text-white">{value}</div>
      {detail ? (
        <div className="mt-2 text-xs text-white/50">{detail}</div>
      ) : null}
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
    <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm">
      <div className="font-medium">Transaction status</div>

      <a
        className="mt-2 block break-all font-mono underline underline-offset-4"
        href={getTxUrl(chainSet, txHash)}
        rel="noreferrer"
        target="_blank">
        {txHash}
      </a>

      <div className="mt-2 text-white/60">
        {isLoading
          ? "Mining..."
          : isSuccess
            ? "Mined successfully. On-chain reads will refresh; reward event sync is optional reconciliation."
            : isError
              ? "Transaction failed or receipt error."
              : txHash
                ? "Submitted."
                : ""}
      </div>
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

  const [roundMode, setRoundMode] = useState<RoundMode>("existingSupabase");
  const [rounds, setRounds] = useState<AdminRewardRound[]>([]);
  const [selectedSupabaseRoundId, setSelectedSupabaseRoundId] = useState("");
  const [isRoundsLoading, setIsRoundsLoading] = useState(false);
  const [roundsError, setRoundsError] = useState<string | null>(null);
  const [roundIdInput, setRoundIdInput] = useState("");
  const [periodStartInput, setPeriodStartInput] = useState("");
  const [periodEndInput, setPeriodEndInput] = useState("");
  const [rewardAmountInput, setRewardAmountInput] = useState("");
  const [fundAmountInput, setFundAmountInput] = useState("");
  const [approveAmountInput, setApproveAmountInput] = useState("");
  const [merkleRootInput, setMerkleRootInput] = useState("");
  const [lastActionLabel, setLastActionLabel] = useState<string | null>(null);
  const [lastRequestedValue, setLastRequestedValue] = useState<string | null>(
    null,
  );
  const [lastActionRoundId, setLastActionRoundId] = useState<string | null>(
    null,
  );
  const [lastActionTxHash, setLastActionTxHash] = useState<Hash | undefined>();
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
  const selectedRoundContextId = transactionRoundId?.toString() ?? null;

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
  const showSelectedRoundActionContext =
    lastActionRoundId !== null && lastActionRoundId === selectedRoundContextId;
  const visibleTxHash = showSelectedRoundActionContext
    ? lastActionTxHash
    : undefined;

  const roundData = rewardRoundRead.data as RewardRoundData | undefined;
  const roundReadSuccessful =
    transactionRoundId !== null &&
    rewardRoundRead.isSuccess &&
    Boolean(roundData);
  const roundReadPending =
    transactionRoundId !== null &&
    (rewardRoundRead.isLoading || rewardRoundRead.isFetching);
  const roundReadFailed =
    transactionRoundId !== null && rewardRoundRead.isError;
  const roundExists = roundReadSuccessful && roundData?.exists === true;
  const roundClaimPaused = roundData?.claimPaused === true;
  const roundRewardAmount = roundData?.rewardAmount ?? 0n;
  const roundFundedAmount = roundData?.fundedAmount ?? 0n;
  const roundClaimedAmount = roundData?.claimedAmount ?? 0n;
  const onChainMerkleRoot = roundData?.merkleRoot;
  const roundIsFunded =
    roundReadSuccessful &&
    roundExists &&
    roundRewardAmount > 0n &&
    roundFundedAmount >= roundRewardAmount;
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
  const rewardReadError =
    rewardRoundRead.error ??
    isRoundFundedRead.error ??
    totalRewardFundedRead.error ??
    totalRewardClaimedRead.error ??
    adminBalanceRead.error ??
    rewardDistributorBalanceRead.error ??
    allowanceRead.error ??
    tokenDecimalsRead.error ??
    tokenSymbolRead.error;
  const isRewardReadsRefreshing =
    rewardRoundRead.isFetching ||
    isRoundFundedRead.isFetching ||
    totalRewardFundedRead.isFetching ||
    totalRewardClaimedRead.isFetching ||
    adminBalanceRead.isFetching ||
    rewardDistributorBalanceRead.isFetching ||
    allowanceRead.isFetching ||
    tokenDecimalsRead.isFetching ||
    tokenSymbolRead.isFetching;
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
  const onChainOperationalStatus =
    transactionRoundId === null
      ? "no_round"
      : roundReadFailed
        ? "read_error"
        : roundReadPending || !roundReadSuccessful
          ? "checking"
          : !roundExists
            ? "not_created"
            : roundFullyClaimed
              ? "closed"
              : roundIsFunded
                ? roundClaimPaused
                  ? "claim_paused"
                  : "funded"
                : "created";
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
    void tokenDecimalsRead.refetch();
    void tokenSymbolRead.refetch();
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

  function setLastRequestedAction({
    label,
    requestedValue,
    roundId,
  }: {
    label: string;
    requestedValue: string;
    roundId: bigint;
  }) {
    setLastActionLabel(label);
    setLastRequestedValue(requestedValue);
    setLastActionRoundId(roundId.toString());
    setLastActionTxHash(undefined);
  }

  async function approveRewardFunding() {
    if (approveAmount === null || transactionRoundId === null) {
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

    setLastRequestedAction({
      label: "Approve $OiOi Funding",
      requestedValue: `${approveAmountInput} ${tokenSymbol} for round ${transactionRoundId.toString()}`,
      roundId: transactionRoundId,
    });

    const hash = await writeContractAsync({
      chainId: targetChainId,
      address: addresses.oioi,
      abi: erc20Abi,
      functionName: "approve",
      args: [addresses.rewardDistributor, approveAmount],
    });
    setLastActionTxHash(hash);
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

    setLastRequestedAction({
      label: "Create Reward Round",
      requestedValue: `Round ${transactionRoundId.toString()} / ${formatTokenAmount(
        {
          value: transactionRewardAmount,
          symbol: tokenSymbol,
          decimals: tokenDecimals,
        },
      )}`,
      roundId: transactionRoundId,
    });

    const hash = await writeContractAsync({
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
    setLastActionTxHash(hash);
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
        `Reward Distributor: ${addresses.rewardDistributor}`,
        `Current allowance: ${formatTokenAmount({ value: allowance })}`,
        `Amount still needed to fund: ${formatTokenAmount({ value: amountNeededToFund })}`,
      ],
    });

    if (!confirmed) {
      return;
    }

    setLastRequestedAction({
      label: "Fund Reward Round",
      requestedValue: `Round ${transactionRoundId.toString()} / ${fundAmountInput} ${tokenSymbol}`,
      roundId: transactionRoundId,
    });

    const hash = await writeContractAsync({
      chainId: targetChainId,
      address: addresses.rewardDistributor,
      abi: rewardDistributorAdminAbi,
      functionName: "fundRewardRound",
      args: [transactionRoundId, fundAmount],
    });
    setLastActionTxHash(hash);
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

    setLastRequestedAction({
      label: paused ? "Pause Claims" : "Unpause Claims",
      requestedValue: `Round ${transactionRoundId.toString()} / claimPaused=${paused ? "true" : "false"}`,
      roundId: transactionRoundId,
    });

    const hash = await writeContractAsync({
      chainId: targetChainId,
      address: addresses.rewardDistributor,
      abi: rewardDistributorAdminAbi,
      functionName: "setClaimPaused",
      args: [transactionRoundId, paused],
    });
    setLastActionTxHash(hash);
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
    !roundReadSuccessful ||
    !createCoreValid ||
    !selectedRoundReadyForCreate ||
    !selectedSupabaseInputLocked ||
    selectedSupabaseRoundAlreadyCreated ||
    roundExists;

  const approveDisabled =
    actionDisabledBase ||
    !roundReadSuccessful ||
    approveAmount === null ||
    !approveAmountEnough ||
    !roundExists ||
    roundIsFunded ||
    allowanceSufficient ||
    selectedRoundOnChainMismatch ||
    roundFullyClaimed;

  const fundDisabled =
    actionDisabledBase ||
    !roundReadSuccessful ||
    transactionRoundId === null ||
    !fundAmountValid ||
    !roundExists ||
    roundIsFunded ||
    !allowanceSufficient ||
    selectedRoundOnChainMismatch ||
    roundFullyClaimed;

  const pauseDisabled =
    actionDisabledBase ||
    !roundReadSuccessful ||
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

    if (roundReadFailed) {
      return "Reward Distributor read failed. Refresh reads and check RPC, chain, and contract address before continuing.";
    }

    if (roundReadPending || !roundReadSuccessful) {
      return "Checking selected reward round on-chain state. Write actions stay disabled until the contract read succeeds.";
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

  const boundaryStatusTone =
    activeBoundaryJob?.status === "success"
      ? "success"
      : activeBoundaryJob?.status === "failed" ||
          activeBoundaryJob?.status === "cancelled"
        ? "danger"
        : boundaryJobActive
          ? "warning"
          : "neutral";
  const selectedRoundActionStatus = (() => {
    if (!selectedSupabaseRound) {
      return {
        label: "No Round",
        tone: "neutral" as const,
      };
    }

    if (onChainOperationalStatus === "checking") {
      return {
        label: "Checking",
        tone: "neutral" as const,
      };
    }

    if (onChainOperationalStatus === "read_error") {
      return {
        label: "Read Error",
        tone: "danger" as const,
      };
    }

    if (onChainOperationalStatus === "not_created") {
      return {
        label: "Not Created",
        tone: "danger" as const,
      };
    }

    if (onChainOperationalStatus === "closed") {
      return {
        label: "Closed",
        tone: "neutral" as const,
      };
    }

    if (onChainOperationalStatus === "claim_paused") {
      return {
        label: "Paused",
        tone: "purple" as const,
      };
    }

    if (onChainOperationalStatus === "funded") {
      return {
        label: "Funded",
        tone: "success" as const,
      };
    }

    if (onChainOperationalStatus === "created" && allowanceSufficient) {
      return {
        label: "Not Funded",
        tone: "warning" as const,
      };
    }

    return {
      label: "Created",
      tone: "info" as const,
    };
  })();
  const nextAction = (() => {
    if (createRoundDisabled === false) {
      return {
        key: "create",
        label: "Create Reward Round",
        tone: "green",
        handler: () => void createRewardRound(),
      };
    }

    if (approveDisabled === false) {
      return {
        key: "approve",
        label: "Approve $OiOi Funding",
        tone: "blue",
        handler: () => void approveRewardFunding(),
      };
    }

    if (fundDisabled === false) {
      return {
        key: "fund",
        label: "Fund Reward Round",
        tone: "green",
        handler: () => void fundRewardRound(),
      };
    }

    if (pauseDisabled === false && !roundClaimPaused) {
      return {
        key: "pause",
        label: "Pause Claims",
        tone: "yellow",
        handler: () => void setClaimPaused(true),
      };
    }

    if (pauseDisabled === false && roundClaimPaused) {
      return {
        key: "unpause",
        label: "Unpause Claims",
        tone: "red",
        handler: () => void setClaimPaused(false),
      };
    }

    return null;
  })();
  const nextActionClass =
    nextAction?.tone === "blue"
      ? "border-blue-500/30 bg-blue-500/10 text-blue-100 hover:bg-blue-500/20"
      : nextAction?.tone === "yellow"
        ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-100 hover:bg-yellow-500/20"
        : nextAction?.tone === "red"
          ? "border-red-500/30 bg-red-500/10 text-red-100 hover:bg-red-500/20"
          : "border-green-500/30 bg-green-500/10 text-green-100 hover:bg-green-500/20";

  return (
    <section className="grid gap-5">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <p className="text-sm uppercase tracking-[0.25em] text-white/50">
          Reward Operations
        </p>
        <h2 className="mt-2 text-2xl font-semibold">Reward Round Controls</h2>
        <p className="mt-2 text-sm text-white/60">
          Submit a block boundary, wait until the worker generates a calculated
          round, then operate that round.
        </p>
      </section>

      <article className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-white/40">
              Reward Round Preparation
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="mt-2 text-2xl font-semibold">The Worker Jobs</h3>
              <StatusPill
                label={activeBoundaryJob?.status ?? "no job"}
                tone={boundaryStatusTone}
              />
            </div>
            <p className="mt-2 max-w-3xl text-sm text-white/60">
              This job is the only required sync/rebuild phase for the next
              reward round. Wait till the job succeeds, OiOi!
            </p>
          </div>

          <button
            className="rounded-2xl border border-white/10 px-4 py-2 text-sm hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={isBoundaryLoading}
            onClick={() => void fetchBoundaryJobs()}
            type="button">
            {isBoundaryLoading ? "Refreshing..." : "Refresh job"}
          </button>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <Field
            label="BASE boundary block"
            description="Final BASE block for the next reward round."
            onChange={setBaseBoundaryBlockInput}
            placeholder="41832200"
            value={baseBoundaryBlockInput}
          />
          <Field
            label="Ethereum boundary block"
            description="Final Ethereum block for the next reward round."
            onChange={setEthereumBoundaryBlockInput}
            placeholder="10896262"
            value={ethereumBoundaryBlockInput}
          />
          <Field
            label={`Reward amount (${tokenSymbol})`}
            description="Total amount allocated by the next reward round."
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
            type="button">
            {isBoundarySubmitting ? "Submitting..." : "Submit The Jobs"}
          </button>

          <div className="text-sm text-white/60">
            {boundaryJobActive
              ? "An active boundary job exists. Finish or cancel it before submitting another one."
              : "Submit is available after both blocks and reward amount are valid."}
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

        <div className="mt-5 grid gap-4 md:grid-cols-4">
          <SummaryTile
            label="Active job"
            value={activeBoundaryJob?.id ?? "—"}
            detail={summarizeBoundaryTargets(activeBoundaryJob)}
          />
          <SummaryTile
            label="Reward amount"
            value={
              activeBoundaryJob?.reward_amount_wei
                ? `${formatUnits(BigInt(activeBoundaryJob.reward_amount_wei), tokenDecimals)} ${tokenSymbol}`
                : "—"
            }
          />
          <SummaryTile
            label="Created"
            value={activeBoundaryJob?.created_at ?? "—"}
          />
          <SummaryTile
            label="Finished"
            value={activeBoundaryJob?.finished_at ?? "—"}
          />
        </div>

        {activeBoundaryJob?.error_message ? (
          <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100/80">
            {activeBoundaryJob.error_message}
          </div>
        ) : null}

        {activeBoundaryJob?.targets.length ? (
          <details className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
            <summary className="cursor-pointer font-medium">
              Worker target progress
            </summary>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {activeBoundaryJob.targets.map((target) => (
                <div
                  className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm"
                  key={target.id}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono">{target.chain_key}</span>
                    <StatusPill label={target.status} />
                  </div>
                  <div className="mt-2 font-mono text-white/60">
                    {target.task_key}: {target.last_processed_block ?? "—"} /{" "}
                    {target.target_block ?? "—"}
                  </div>
                  {target.error_message ? (
                    <div className="mt-2 text-xs text-red-100/80">
                      {target.error_message}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </details>
        ) : null}
      </article>

      <article className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-white/40">
              The Reward Rounds
            </p>
            <h3 className="mt-2 text-2xl font-semibold">Reward Operations</h3>
            <p className="mt-2 max-w-3xl text-sm text-white/60">
              Choose the reward round. The status are decided from on-chain
              reads after selection.
            </p>
          </div>

          <button
            className="rounded-2xl border border-white/10 px-4 py-2 text-sm hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={isRoundsLoading || isRewardReadsRefreshing}
            onClick={() => {
              void fetchRounds({ preserveSelection: true });
              refetchRewardReads();
            }}
            type="button">
            {isRoundsLoading || isRewardReadsRefreshing
              ? "Refreshing..."
              : "Refresh rounds"}
          </button>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-[420px_1fr]">
          <label className="block">
            <div className="font-medium">Existing reward round</div>
            <select
              className="mt-3 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm outline-none focus:border-white/30"
              disabled={isRoundsLoading || rounds.length === 0}
              onChange={(event) =>
                setSelectedSupabaseRoundId(event.target.value)
              }
              value={selectedSupabaseRoundId}>
              {rounds.length === 0 ? (
                <option value="">No rounds found</option>
              ) : null}
              {rounds.map((round) => (
                <option key={round.round_id} value={round.round_id}>
                  {round.round_id} — {round.reward_amount_oioi} {tokenSymbol}
                </option>
              ))}
            </select>
            {roundsError ? (
              <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-100/80">
                {roundsError}
              </div>
            ) : null}
          </label>

          <div className="flex items-end">
            <StatusPill
              label={selectedRoundActionStatus.label}
              tone={selectedRoundActionStatus.tone}
            />
          </div>
        </div>

        {selectedSupabaseRound ? (
          <>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <SummaryTile
                label="Round ID"
                value={selectedSupabaseRound.round_id}
              />
              <SummaryTile
                label="Reward amount"
                value={`${selectedSupabaseRound.reward_amount_oioi} ${tokenSymbol}`}
                detail={`Need to fund: ${formatTokenAmount({
                  value: amountNeededToFund,
                  symbol: tokenSymbol,
                  decimals: tokenDecimals,
                })}`}
              />
              <SummaryTile
                label="Period"
                value={selectedSupabaseRound.period_end}
                detail={`Start: ${selectedSupabaseRound.period_start}`}
              />
              <SummaryTile
                label="Allocations"
                value={selectedSupabaseRound.allocation_summary.positiveAllocationCount.toString()}
                detail={`${selectedSupabaseRound.allocation_summary.proofReadyCount} proof-ready`}
              />
              <SummaryTile
                label="Funded"
                value={formatTokenAmount({
                  value: roundFundedAmount,
                  symbol: tokenSymbol,
                  decimals: tokenDecimals,
                })}
                detail={`Reward amount: ${formatTokenAmount({
                  value:
                    roundRewardAmount || transactionRewardAmount || undefined,
                  symbol: tokenSymbol,
                  decimals: tokenDecimals,
                })}`}
              />
              <SummaryTile
                label="Claimed"
                value={formatTokenAmount({
                  value: roundClaimedAmount,
                  symbol: tokenSymbol,
                  decimals: tokenDecimals,
                })}
                detail={roundFullyClaimed ? "Fully claimed" : "Still open"}
              />
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-white/40">
                Merkle root
              </div>
              <div className="mt-2 break-all font-mono text-sm">
                {selectedSupabaseRound.merkle_root ?? "Not generated"}
              </div>
            </div>
          </>
        ) : (
          <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/60">
            No reward round selected.
          </div>
        )}

        {rewardReadError ? (
          <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100/80">
            Reward read error: {rewardReadError.message}
          </div>
        ) : null}

        <div className="mt-5 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4">
          <div className="font-medium text-yellow-100">Next step</div>
          <p className="mt-2 text-sm text-yellow-100/80">{suggestedAction}</p>
        </div>

        {nextAction ? (
          <button
            className={`mt-5 w-full rounded-2xl border px-5 py-3 text-center font-medium disabled:cursor-not-allowed disabled:opacity-40 ${nextActionClass}`}
            onClick={nextAction.handler}
            type="button">
            {nextAction.label}
          </button>
        ) : (
          <div className="mt-5 w-full rounded-2xl border px-5 py-3 text-center font-medium border-white/10 bg-white/5 text-white/60">
            No write action is currently available for this selection.
          </div>
        )}

        {!userIsExpectedOwner ? (
          <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100/80">
            The connected wallet is not the expected owner.
          </div>
        ) : null}

        {showSelectedRoundActionContext && lastActionLabel ? (
          <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm">
            <div className="font-medium">Last requested action</div>
            <div className="mt-2 text-white/60">{lastActionLabel}</div>
            {lastRequestedValue ? (
              <div className="mt-1 break-all text-white/60">
                Requested value: {lastRequestedValue}
              </div>
            ) : null}
          </div>
        ) : null}

        {showSelectedRoundActionContext && isWritePending ? (
          <div className="mt-4 rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4 text-sm text-blue-100/80">
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
          <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100/80">
            {writeError.message}
          </div>
        ) : null}

        <details className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
          <summary className="cursor-pointer font-medium">
            Advanced Diagnostics
          </summary>
          <p className="mt-2 text-sm text-white/60">
            Use this only when a button is unexpectedly unavailable or a chain
            read looks wrong.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/20 px-4">
              <ReadRow
                label="Wallet chain"
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
                label="Expected owner"
                value={shortAddress(EXPECTED_ADMIN_OWNER_ADDRESS)}
              />
              <ReadRow
                label="Owner wallet connected"
                value={formatBool(userIsExpectedOwner)}
              />
              <ReadRow
                label="$OiOi token"
                value={shortAddress(addresses.oioi)}
              />
              <ReadRow
                label="Reward Distributor"
                value={shortAddress(addresses.rewardDistributor)}
              />
              <ReadRow
                label="Admin balance"
                value={formatTokenAmount({
                  value: adminBalanceRead.data,
                  symbol: tokenSymbol,
                  decimals: tokenDecimals,
                })}
              />
              <ReadRow
                label="Allowance"
                value={formatTokenAmount({
                  value: allowanceRead.data,
                  symbol: tokenSymbol,
                  decimals: tokenDecimals,
                })}
              />
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 px-4">
              <ReadRow label="Round exists" value={formatBool(roundExists)} />
              <ReadRow label="Round funded" value={formatBool(roundIsFunded)} />
              <ReadRow
                label="Claim paused"
                value={formatBool(roundClaimPaused)}
              />
              <ReadRow
                label="Root matches"
                value={
                  selectedSupabaseRound && roundExists
                    ? formatBool(onChainRootMatchesSupabase)
                    : "—"
                }
              />
              <ReadRow
                label="Create core valid"
                value={formatBool(createCoreValid)}
              />
              <ReadRow
                label="Input locked"
                value={formatBool(selectedSupabaseInputLocked)}
              />
              <ReadRow
                label="Allowance sufficient"
                value={formatBool(allowanceSufficient)}
              />
              <ReadRow
                label="Fund amount valid"
                value={formatBool(fundAmountValid)}
              />
            </div>
          </div>
        </details>
      </article>
    </section>
  );
}
