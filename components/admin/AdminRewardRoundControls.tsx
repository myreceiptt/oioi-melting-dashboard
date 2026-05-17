"use client";

import { useEffect, useMemo, useState } from "react";
import type { Address, Hash } from "viem";
import { isHex, parseUnits } from "viem";
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import type { ChainSet } from "@/lib/chains/chainConfig";
import {
  erc20Abi,
  rewardDistributorAdminAbi,
} from "@/lib/contracts/abis";
import { getContractAddresses } from "@/lib/contracts/addresses";
import { EXPECTED_ADMIN_OWNER_ADDRESS } from "@/lib/admin/adminContractConfig";
import { getTxUrl } from "@/lib/services/explorer";
import { sameAddress } from "@/lib/utils/address";
import {
  formatBool,
  formatNumber,
  formatTokenAmount,
  shortAddress,
} from "@/lib/utils/format";

type TxAction =
  | "approve"
  | "createRound"
  | "fundRound"
  | "pauseClaims"
  | "unpauseClaims";

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
    <div className="grid gap-2 border-b border-white/10 py-3 last:border-b-0 md:grid-cols-[240px_1fr]">
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
}: {
  label: string;
  description?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="font-medium">{label}</div>
      {description ? (
        <p className="mt-1 text-xs text-white/50">{description}</p>
      ) : null}
      <input
        className="mt-3 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 font-mono text-sm outline-none focus:border-white/30"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
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
            ? "Mined successfully."
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

export function AdminRewardRoundControls({
  chainSet,
}: {
  chainSet: ChainSet;
}) {
  const { address: connectedAddress, isConnected } = useAccount();
  const addresses = getContractAddresses(chainSet);

  const [roundIdInput, setRoundIdInput] = useState("");
  const [periodStartInput, setPeriodStartInput] = useState("");
  const [periodEndInput, setPeriodEndInput] = useState("");
  const [rewardAmountInput, setRewardAmountInput] = useState("");
  const [fundAmountInput, setFundAmountInput] = useState("");
  const [approveAmountInput, setApproveAmountInput] = useState("");
  const [merkleRootInput, setMerkleRootInput] = useState("");
  const [lastAction, setLastAction] = useState<TxAction | null>(null);

  const userIsExpectedOwner = useMemo(
    () => isExpectedOwner(connectedAddress),
    [connectedAddress],
  );

  const roundId = parseBigIntInput(roundIdInput);
  const periodStart = parseDateTimeToUnix(periodStartInput);
  const periodEnd = parseDateTimeToUnix(periodEndInput);

  const tokenDecimalsRead = useReadContract({
    address: addresses.oioi,
    abi: erc20Abi,
    functionName: "decimals",
  });

  const tokenSymbolRead = useReadContract({
    address: addresses.oioi,
    abi: erc20Abi,
    functionName: "symbol",
  });

  const tokenDecimals =
    typeof tokenDecimalsRead.data === "number" ? tokenDecimalsRead.data : 18;
  const tokenSymbol =
    typeof tokenSymbolRead.data === "string" ? tokenSymbolRead.data : "OiOi";

  const rewardAmount = parseTokenAmount(rewardAmountInput, tokenDecimals);
  const fundAmount = parseTokenAmount(fundAmountInput, tokenDecimals);
  const approveAmount = parseTokenAmount(approveAmountInput, tokenDecimals);
  const merkleRoot = parseBytes32(merkleRootInput);

  const rewardRoundRead = useReadContract({
    address: addresses.rewardDistributor,
    abi: rewardDistributorAdminAbi,
    functionName: "getRewardRound",
    args: roundId !== null ? [roundId] : undefined,
    query: {
      enabled: roundId !== null,
      retry: false,
    },
  });

  const isRoundFundedRead = useReadContract({
    address: addresses.rewardDistributor,
    abi: rewardDistributorAdminAbi,
    functionName: "isRoundFunded",
    args: roundId !== null ? [roundId] : undefined,
    query: {
      enabled: roundId !== null,
      retry: false,
    },
  });

  const totalRewardFundedRead = useReadContract({
    address: addresses.rewardDistributor,
    abi: rewardDistributorAdminAbi,
    functionName: "totalRewardFunded",
  });

  const totalRewardClaimedRead = useReadContract({
    address: addresses.rewardDistributor,
    abi: rewardDistributorAdminAbi,
    functionName: "totalRewardClaimed",
  });

  const adminBalanceRead = useReadContract({
    address: addresses.oioi,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [EXPECTED_ADMIN_OWNER_ADDRESS],
  });

  const rewardDistributorBalanceRead = useReadContract({
    address: addresses.oioi,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [addresses.rewardDistributor],
  });

  const allowanceRead = useReadContract({
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
    hash: txHash,
    query: {
      enabled: Boolean(txHash),
    },
  });

  const roundData = rewardRoundRead.data as RewardRoundData | undefined;
  const roundExists = roundData?.[0] === true;
  const roundClaimPaused = roundData?.[1] === true;
  const roundIsFunded =
    typeof isRoundFundedRead.data === "boolean"
      ? isRoundFundedRead.data
      : false;

  const actionDisabledBase =
    !isConnected || !userIsExpectedOwner || isWritePending || receipt.isLoading;

  function refetchRewardReads() {
    void rewardRoundRead.refetch();
    void isRoundFundedRead.refetch();
    void totalRewardFundedRead.refetch();
    void totalRewardClaimedRead.refetch();
    void adminBalanceRead.refetch();
    void rewardDistributorBalanceRead.refetch();
    void allowanceRead.refetch();
  }

  useEffect(() => {
    if (receipt.isSuccess) {
      refetchRewardReads();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receipt.isSuccess]);

  function setRewardAmountAndDefaultFunding(nextValue: string) {
    setRewardAmountInput((previousRewardAmount) => {
      setApproveAmountInput((previousApproveAmount) => {
        if (!previousApproveAmount || previousApproveAmount === previousRewardAmount) {
          return nextValue;
        }

        return previousApproveAmount;
      });

      setFundAmountInput((previousFundAmount) => {
        if (!previousFundAmount || previousFundAmount === previousRewardAmount) {
          return nextValue;
        }

        return previousFundAmount;
      });

      return nextValue;
    });
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
      risk === "critical"
        ? "CRITICAL ADMIN ACTION"
        : "HIGH RISK ADMIN ACTION";

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
      ],
    });

    if (!confirmed) {
      return;
    }

    setLastAction("approve");

    await writeContractAsync({
      address: addresses.oioi,
      abi: erc20Abi,
      functionName: "approve",
      args: [addresses.rewardDistributor, approveAmount],
    });
  }

  async function createRewardRound() {
    if (
      roundId === null ||
      periodStart === null ||
      periodEnd === null ||
      rewardAmount === null ||
      merkleRoot === null
    ) {
      return;
    }

    const confirmed = confirmAction({
      title: "Create reward round",
      risk: "critical",
      lines: [
        `Round ID: ${roundId.toString()}`,
        `Period start: ${periodStart.toString()}`,
        `Period end: ${periodEnd.toString()}`,
        `Reward amount: ${rewardAmountInput} ${tokenSymbol}`,
        `Merkle root: ${merkleRoot}`,
      ],
    });

    if (!confirmed) {
      return;
    }

    setLastAction("createRound");

    await writeContractAsync({
      address: addresses.rewardDistributor,
      abi: rewardDistributorAdminAbi,
      functionName: "createRewardRound",
      args: [roundId, periodStart, periodEnd, rewardAmount, merkleRoot],
    });
  }

  async function fundRewardRound() {
    if (roundId === null || fundAmount === null) {
      return;
    }

    const confirmed = confirmAction({
      title: "Fund reward round",
      risk: "high",
      lines: [
        `Round ID: ${roundId.toString()}`,
        `Fund amount: ${fundAmountInput} ${tokenSymbol}`,
        `RewardDistributor: ${addresses.rewardDistributor}`,
      ],
    });

    if (!confirmed) {
      return;
    }

    setLastAction("fundRound");

    await writeContractAsync({
      address: addresses.rewardDistributor,
      abi: rewardDistributorAdminAbi,
      functionName: "fundRewardRound",
      args: [roundId, fundAmount],
    });
  }

  async function setClaimPaused(paused: boolean) {
    if (roundId === null) {
      return;
    }

    const confirmed = confirmAction({
      title: paused ? "Pause reward claims" : "Unpause reward claims",
      risk: paused ? "high" : "critical",
      lines: [
        `Round ID: ${roundId.toString()}`,
        `New claimPaused value: ${paused ? "true" : "false"}`,
      ],
    });

    if (!confirmed) {
      return;
    }

    setLastAction(paused ? "pauseClaims" : "unpauseClaims");

    await writeContractAsync({
      address: addresses.rewardDistributor,
      abi: rewardDistributorAdminAbi,
      functionName: "setClaimPaused",
      args: [roundId, paused],
    });
  }

  const createRoundDisabled =
    actionDisabledBase ||
    roundId === null ||
    periodStart === null ||
    periodEnd === null ||
    rewardAmount === null ||
    merkleRoot === null ||
    roundExists;

  const approveDisabled = actionDisabledBase || approveAmount === null;

  const fundDisabled =
    actionDisabledBase ||
    roundId === null ||
    fundAmount === null ||
    !roundExists ||
    roundIsFunded;

  const pauseDisabled = actionDisabledBase || roundId === null || !roundExists;

  return (
    <section className="grid gap-5">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <p className="text-sm uppercase tracking-[0.25em] text-white/50">
          Admin Writes
        </p>
        <h2 className="mt-2 text-2xl font-semibold">Reward Round Controls</h2>
        <p className="mt-2 text-sm text-white/60">
          Owner-only controls for approving $OiOi, creating reward rounds,
          funding reward rounds, and pausing or unpausing claims.
        </p>

        <div className="mt-5 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4">
          <div className="font-medium text-yellow-100">Important</div>
          <p className="mt-2 text-sm text-yellow-100/80">
            This UI does not calculate rewards. Use only with reviewed output
            from the Supabase-backed indexer and reward calculator.
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
            round IDs. The admin/reward pipeline must provide a unique round ID.
          </p>
          <p>
            Period start and period end are also explicit inputs. In the final
            workflow, the Supabase indexer/reward calculator should suggest
            these values from indexed staking and prior reward data.
          </p>
          <p>
            Approval does not fund the round. Approval only allows the
            RewardDistributor to pull $OiOi. Funding happens separately through
            Fund Reward Round.
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h3 className="text-2xl font-semibold">Reward round input</h3>
        <p className="mt-2 text-sm text-white/60">
          Use the same round ID, period, amount, and Merkle root generated by the
          reward pipeline. Reward amount auto-fills approve and fund amounts
          unless you have manually edited them.
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field
            label="Round ID"
            description="Unique uint256 round ID. Later, the reward pipeline can suggest this."
            onChange={setRoundIdInput}
            placeholder="1778842307"
            value={roundIdInput}
          />
          <Field
            label={`Reward amount (${tokenSymbol})`}
            description="Total reward allocation for this round. This auto-fills approve and fund amounts."
            onChange={setRewardAmountAndDefaultFunding}
            placeholder="1000"
            value={rewardAmountInput}
          />
          <Field
            label={`Fund amount (${tokenSymbol})`}
            description="Amount to fund into an existing round. Usually equal to reward amount."
            onChange={setFundAmountInput}
            placeholder="1000"
            value={fundAmountInput}
          />
          <Field
            label={`Approve amount (${tokenSymbol})`}
            description="Amount to approve RewardDistributor to spend. Must be at least fund amount."
            onChange={setApproveAmountInput}
            placeholder="1000"
            value={approveAmountInput}
          />
          <Field
            label="Period start"
            description="Reward period start. Later, indexer/reward pipeline should suggest this."
            onChange={setPeriodStartInput}
            type="datetime-local"
            value={periodStartInput}
          />
          <Field
            label="Period end"
            description="Reward period end. Usually the reward calculation cutoff time."
            onChange={setPeriodEndInput}
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
            value={merkleRootInput}
          />
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h3 className="text-2xl font-semibold">Input validation</h3>
        <p className="mt-2 text-sm text-white/60">
          This shows how the admin UI parses your reward round inputs.
        </p>

        <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 px-4">
          <ReadRow
            label="Round ID parsed"
            value={roundId === null ? "Invalid" : roundId.toString()}
          />
          <ReadRow
            label="Period start parsed"
            value={
              periodStart === null ? "Invalid" : formatUnixTimestamp(periodStart)
            }
          />
          <ReadRow
            label="Period end parsed"
            value={periodEnd === null ? "Invalid" : formatUnixTimestamp(periodEnd)}
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
          <ReadRow label="Round exists" value={formatBool(roundExists)} />
          <ReadRow label="Round funded" value={formatBool(roundIsFunded)} />
          <ReadRow label="Claim paused" value={formatBool(roundClaimPaused)} />
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h3 className="text-2xl font-semibold">Reward round read</h3>
        <p className="mt-2 text-sm text-white/60">
          Enter a round ID above to inspect the round before writing.
        </p>

        <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 px-4">
          <ReadRow label="Round exists" value={formatBool(roundExists)} />
          <ReadRow label="Claim paused" value={formatBool(roundData?.[1])} />
          <ReadRow label="Period start" value={formatUnixTimestamp(roundData?.[2])} />
          <ReadRow label="Period end" value={formatUnixTimestamp(roundData?.[3])} />
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
        </div>

        {rewardRoundRead.error ? (
          <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100/80">
            Read error: {rewardRoundRead.error.message}
          </div>
        ) : null}
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h3 className="text-2xl font-semibold">Reward funding state</h3>

        <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 px-4">
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
            value={formatTokenAmount({ value: rewardDistributorBalanceRead.data })}
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

      {!userIsExpectedOwner ? (
        <section className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-100/80">
          Reward write actions are disabled because the connected wallet is not
          the expected owner.
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2">
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
          disabled={createRoundDisabled}
          onClick={() => void createRewardRound()}
          type="button"
        >
          Create Reward Round
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
