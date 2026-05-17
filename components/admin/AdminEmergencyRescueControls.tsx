"use client";

import { useEffect, useMemo, useState } from "react";
import type { Abi, Address, Hash } from "viem";
import { isAddress, parseEther, parseUnits } from "viem";
import {
  useAccount,
  useBalance,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import type { ChainSet } from "@/lib/chains/chainConfig";
import {
  erc20Abi,
  gatedMintAdminAbi,
  rewardDistributorAdminAbi,
  rotyAdminAbi,
} from "@/lib/contracts/abis";
import { getContractAddresses } from "@/lib/contracts/addresses";
import { EXPECTED_ADMIN_OWNER_ADDRESS } from "@/lib/admin/adminContractConfig";
import { getTxUrl } from "@/lib/services/explorer";
import { sameAddress } from "@/lib/utils/address";
import { formatEth, formatTokenAmount, shortAddress } from "@/lib/utils/format";

type RescueAction =
  | "rescueExcessOioi"
  | "rescueContractEth"
  | "rescueContractErc20";

type RescueContractConfig = {
  key: "roty" | "melting" | "amanda";
  label: string;
  address: Address;
  abi: Abi;
};

function isExpectedOwner(address: string | undefined) {
  return Boolean(address && sameAddress(address, EXPECTED_ADMIN_OWNER_ADDRESS));
}

function parseTokenAmount(value: string, decimals: number): bigint | null {
  const clean = value.trim();

  if (!clean || !/^\d+(\.\d+)?$/.test(clean)) {
    return null;
  }

  try {
    return parseUnits(clean, decimals);
  } catch {
    return null;
  }
}

function parseEthInput(value: string): bigint | null {
  const clean = value.trim();

  if (!clean || !/^\d+(\.\d+)?$/.test(clean)) {
    return null;
  }

  try {
    return parseEther(clean);
  } catch {
    return null;
  }
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
}: {
  label: string;
  description?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
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
        type="text"
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
            ? "Mined successfully. State refreshed."
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

function typedConfirm({
  title,
  body,
  confirmationText,
}: {
  title: string;
  body: string[];
  confirmationText: string;
}) {
  const typed = window.prompt(
    [
      "CRITICAL EMERGENCY ADMIN ACTION",
      title,
      "",
      ...body,
      "",
      `Type "${confirmationText}" to continue.`,
    ].join("\n"),
  );

  return typed === confirmationText;
}

function RewardDistributorExcessRescue({
  chainSet,
}: {
  chainSet: ChainSet;
}) {
  const { address: connectedAddress, isConnected } = useAccount();
  const addresses = getContractAddresses(chainSet);

  const [recipientInput, setRecipientInput] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [lastAction, setLastAction] = useState<RescueAction | null>(null);

  const userIsExpectedOwner = useMemo(
    () => isExpectedOwner(connectedAddress),
    [connectedAddress],
  );

  const rewardOwnerRead = useReadContract({
    address: addresses.rewardDistributor,
    abi: rewardDistributorAdminAbi,
    functionName: "owner",
  });

  const rewardTokenRead = useReadContract({
    address: addresses.rewardDistributor,
    abi: rewardDistributorAdminAbi,
    functionName: "rewardToken",
  });

  const allocatedUnclaimedRead = useReadContract({
    address: addresses.rewardDistributor,
    abi: rewardDistributorAdminAbi,
    functionName: "allocatedUnclaimedRewardBalance",
  });

  const excessRead = useReadContract({
    address: addresses.rewardDistributor,
    abi: rewardDistributorAdminAbi,
    functionName: "excessRewardTokenBalance",
  });

  const distributorOioiBalanceRead = useReadContract({
    address: addresses.oioi,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [addresses.rewardDistributor],
  });

  const oioiDecimalsRead = useReadContract({
    address: addresses.oioi,
    abi: erc20Abi,
    functionName: "decimals",
  });

  const oioiSymbolRead = useReadContract({
    address: addresses.oioi,
    abi: erc20Abi,
    functionName: "symbol",
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

  function refetchReads() {
    void rewardOwnerRead.refetch();
    void rewardTokenRead.refetch();
    void allocatedUnclaimedRead.refetch();
    void excessRead.refetch();
    void distributorOioiBalanceRead.refetch();
  }

  useEffect(() => {
    if (receipt.isSuccess) {
      refetchReads();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receipt.isSuccess]);

  const ownerAddress =
    typeof rewardOwnerRead.data === "string" ? rewardOwnerRead.data : undefined;
  const rewardToken =
    typeof rewardTokenRead.data === "string" ? rewardTokenRead.data : undefined;
  const allocatedUnclaimed =
    typeof allocatedUnclaimedRead.data === "bigint"
      ? allocatedUnclaimedRead.data
      : undefined;
  const excess =
    typeof excessRead.data === "bigint" ? excessRead.data : undefined;
  const distributorBalance =
    typeof distributorOioiBalanceRead.data === "bigint"
      ? distributorOioiBalanceRead.data
      : undefined;
  const decimals =
    typeof oioiDecimalsRead.data === "number" ? oioiDecimalsRead.data : 18;
  const symbol =
    typeof oioiSymbolRead.data === "string" ? oioiSymbolRead.data : "OiOi";

  const parsedRecipient = isAddress(recipientInput.trim())
    ? (recipientInput.trim() as Address)
    : null;
  const parsedAmount = parseTokenAmount(amountInput, decimals);

  const amountExceedsExcess =
    parsedAmount !== null && excess !== undefined && parsedAmount > excess;

  const actionDisabled =
    !isConnected ||
    !userIsExpectedOwner ||
    !parsedRecipient ||
    parsedAmount === null ||
    parsedAmount <= 0n ||
    excess === undefined ||
    excess <= 0n ||
    amountExceedsExcess ||
    isWritePending ||
    receipt.isLoading;

  async function rescueExcessOioi() {
    if (!parsedRecipient || parsedAmount === null || amountExceedsExcess) {
      return;
    }

    const confirmed = typedConfirm({
      title: "Rescue excess $OiOi from RewardDistributor",
      confirmationText: "RESCUE EXCESS OIOI",
      body: [
        "This action must only rescue excess reward token balance.",
        "Do not rescue allocated or unclaimed rewards.",
        "",
        `RewardDistributor: ${addresses.rewardDistributor}`,
        `$OiOi token: ${addresses.oioi}`,
        `Recipient: ${parsedRecipient}`,
        `Amount: ${amountInput} ${symbol}`,
        `Allocated unclaimed: ${formatTokenAmount({ value: allocatedUnclaimed })}`,
        `Excess available: ${formatTokenAmount({ value: excess })}`,
      ],
    });

    if (!confirmed) {
      return;
    }

    setLastAction("rescueExcessOioi");

    await writeContractAsync({
      address: addresses.rewardDistributor,
      abi: rewardDistributorAdminAbi,
      functionName: "rescueERC20",
      args: [addresses.oioi, parsedRecipient, parsedAmount],
    });
  }

  return (
    <article className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6">
      <div>
        <p className="text-sm uppercase tracking-[0.25em] text-red-100/60">
          RewardDistributor emergency
        </p>
        <h3 className="mt-2 text-2xl font-semibold text-red-100">
          Rescue Excess $OiOi
        </h3>
        <p className="mt-2 max-w-3xl text-sm text-red-100/80">
          Only rescue excess $OiOi that is not allocated to active/unclaimed
          rewards. This control intentionally blocks amounts greater than
          excessRewardTokenBalance.
        </p>
      </div>

      <div className="mt-5 rounded-2xl border border-red-500/30 bg-black/20 px-4">
        <ReadRow
          label="RewardDistributor owner"
          value={shortAddress(ownerAddress)}
          warning={
            ownerAddress && !sameAddress(ownerAddress, EXPECTED_ADMIN_OWNER_ADDRESS)
              ? "Owner differs from expected admin."
              : undefined
          }
        />
        <ReadRow label="Reward token" value={shortAddress(rewardToken)} />
        <ReadRow
          label="RewardDistributor $OiOi balance"
          value={formatTokenAmount({ value: distributorBalance })}
        />
        <ReadRow
          label="Allocated unclaimed reward"
          value={formatTokenAmount({ value: allocatedUnclaimed })}
          warning="Never rescue this amount."
        />
        <ReadRow
          label="Excess reward token balance"
          value={formatTokenAmount({ value: excess })}
          warning="This is the maximum rescue amount allowed by this UI."
        />
      </div>

      {!userIsExpectedOwner ? (
        <div className="mt-5 rounded-2xl border border-red-500/30 bg-black/20 p-4 text-sm text-red-100/80">
          Rescue actions are disabled because the connected wallet is not the
          expected owner.
        </div>
      ) : null}

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Field
          label="Recipient"
          description="Wallet that receives rescued excess $OiOi."
          onChange={setRecipientInput}
          placeholder={EXPECTED_ADMIN_OWNER_ADDRESS}
          value={recipientInput}
        />

        <Field
          label={`Amount (${symbol})`}
          description="Must be less than or equal to excess reward token balance."
          onChange={setAmountInput}
          placeholder="0.000001"
          value={amountInput}
        />
      </div>

      <div className="mt-5 rounded-2xl border border-red-500/30 bg-black/20 p-4">
        <div className="font-medium text-red-100">Validation</div>
        <div className="mt-3 rounded-xl border border-white/10 px-4">
          <ReadRow
            label="Recipient valid"
            value={parsedRecipient ? "Yes" : "No"}
          />
          <ReadRow
            label="Amount parsed"
            value={
              parsedAmount === null
                ? "Invalid"
                : formatTokenAmount({ value: parsedAmount })
            }
          />
          <ReadRow
            label="Amount within excess"
            value={amountExceedsExcess ? "No" : "Yes"}
            warning={amountExceedsExcess ? "Amount exceeds excess balance." : undefined}
          />
        </div>
      </div>

      <button
        className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-3 font-medium text-red-100 disabled:cursor-not-allowed disabled:opacity-40"
        disabled={actionDisabled}
        onClick={() => void rescueExcessOioi()}
        type="button"
      >
        Rescue Excess $OiOi
      </button>

      {lastAction ? (
        <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm">
          <div className="font-medium">Last emergency action</div>
          <div className="mt-2 font-mono text-red-100/80">{lastAction}</div>
        </div>
      ) : null}

      {isWritePending ? (
        <div className="mt-5 rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4 text-sm text-blue-100/80">
          Waiting for wallet signature...
        </div>
      ) : null}

      <TxStatus
        chainSet={chainSet}
        errorMessage={writeError?.message}
        isError={receipt.isError}
        isLoading={receipt.isLoading}
        isSuccess={receipt.isSuccess}
        txHash={txHash}
      />
    </article>
  );
}

function ContractRescueControls({
  chainSet,
  config,
}: {
  chainSet: ChainSet;
  config: RescueContractConfig;
}) {
  const { address: connectedAddress, isConnected } = useAccount();

  const [ethRecipientInput, setEthRecipientInput] = useState("");
  const [ethAmountInput, setEthAmountInput] = useState("");
  const [erc20TokenInput, setErc20TokenInput] = useState("");
  const [erc20RecipientInput, setErc20RecipientInput] = useState("");
  const [erc20AmountInput, setErc20AmountInput] = useState("");
  const [lastAction, setLastAction] = useState<RescueAction | null>(null);

  const userIsExpectedOwner = useMemo(
    () => isExpectedOwner(connectedAddress),
    [connectedAddress],
  );

  const ownerRead = useReadContract({
    address: config.address,
    abi: config.abi,
    functionName: "owner",
  });

  const nativeBalance = useBalance({
    address: config.address,
  });

  const tokenAddress = isAddress(erc20TokenInput.trim())
    ? (erc20TokenInput.trim() as Address)
    : undefined;

  const erc20DecimalsRead = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: "decimals",
    query: {
      enabled: Boolean(tokenAddress),
    },
  });

  const erc20SymbolRead = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: "symbol",
    query: {
      enabled: Boolean(tokenAddress),
    },
  });

  const erc20ContractBalanceRead = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: tokenAddress ? [config.address] : undefined,
    query: {
      enabled: Boolean(tokenAddress),
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

  function refetchReads() {
    void ownerRead.refetch();
    void nativeBalance.refetch();
    void erc20DecimalsRead.refetch();
    void erc20SymbolRead.refetch();
    void erc20ContractBalanceRead.refetch();
  }

  useEffect(() => {
    if (receipt.isSuccess) {
      refetchReads();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receipt.isSuccess]);

  const ownerAddress =
    typeof ownerRead.data === "string" ? ownerRead.data : undefined;
  const ethRecipient = isAddress(ethRecipientInput.trim())
    ? (ethRecipientInput.trim() as Address)
    : null;
  const ethAmount = parseEthInput(ethAmountInput);

  const erc20Recipient = isAddress(erc20RecipientInput.trim())
    ? (erc20RecipientInput.trim() as Address)
    : null;
  const erc20Decimals =
    typeof erc20DecimalsRead.data === "number" ? erc20DecimalsRead.data : 18;
  const erc20Symbol =
    typeof erc20SymbolRead.data === "string" ? erc20SymbolRead.data : "token";
  const erc20Amount = parseTokenAmount(erc20AmountInput, erc20Decimals);
  const erc20ContractBalance =
    typeof erc20ContractBalanceRead.data === "bigint"
      ? erc20ContractBalanceRead.data
      : undefined;

  const ethExceedsBalance =
    ethAmount !== null &&
    nativeBalance.data?.value !== undefined &&
    ethAmount > nativeBalance.data.value;

  const erc20ExceedsBalance =
    erc20Amount !== null &&
    erc20ContractBalance !== undefined &&
    erc20Amount > erc20ContractBalance;

  const actionDisabledBase =
    !isConnected || !userIsExpectedOwner || isWritePending || receipt.isLoading;

  const rescueEthDisabled =
    actionDisabledBase ||
    !ethRecipient ||
    ethAmount === null ||
    ethAmount <= 0n ||
    ethExceedsBalance;

  const rescueErc20Disabled =
    actionDisabledBase ||
    !tokenAddress ||
    !erc20Recipient ||
    erc20Amount === null ||
    erc20Amount <= 0n ||
    erc20ExceedsBalance;

  async function rescueEth() {
    if (!ethRecipient || ethAmount === null || ethExceedsBalance) {
      return;
    }

    const confirmed = typedConfirm({
      title: `Rescue ETH from ${config.label}`,
      confirmationText: "RESCUE ETH",
      body: [
        "Use only for accidental ETH stuck in this NFT contract.",
        "",
        `Contract: ${config.address}`,
        `Recipient: ${ethRecipient}`,
        `Amount: ${ethAmountInput} ETH`,
        `Contract ETH balance: ${formatEth(nativeBalance.data?.value)}`,
      ],
    });

    if (!confirmed) {
      return;
    }

    setLastAction("rescueContractEth");

    await writeContractAsync({
      address: config.address,
      abi: config.abi,
      functionName: "rescueETH",
      args: [ethRecipient, ethAmount],
    });
  }

  async function rescueErc20() {
    if (!tokenAddress || !erc20Recipient || erc20Amount === null || erc20ExceedsBalance) {
      return;
    }

    const confirmed = typedConfirm({
      title: `Rescue ERC20 from ${config.label}`,
      confirmationText: "RESCUE ERC20",
      body: [
        "Use only for accidental ERC20 tokens stuck in this NFT contract.",
        "Do not use this for RewardDistributor allocated reward balances.",
        "",
        `Contract: ${config.address}`,
        `Token: ${tokenAddress}`,
        `Recipient: ${erc20Recipient}`,
        `Amount: ${erc20AmountInput} ${erc20Symbol}`,
        `Contract token balance: ${formatTokenAmount({
          value: erc20ContractBalance,
        })}`,
      ],
    });

    if (!confirmed) {
      return;
    }

    setLastAction("rescueContractErc20");

    await writeContractAsync({
      address: config.address,
      abi: config.abi,
      functionName: "rescueERC20",
      args: [tokenAddress, erc20Recipient, erc20Amount],
    });
  }

  return (
    <article className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div>
        <p className="text-sm uppercase tracking-[0.25em] text-white/40">
          NFT contract rescue
        </p>
        <h3 className="mt-2 text-2xl font-semibold">{config.label}</h3>
        <p className="mt-2 max-w-3xl text-sm text-white/60">
          Emergency rescue controls for accidental ETH or ERC20 tokens stuck in
          this NFT contract.
        </p>
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 px-4">
        <ReadRow
          label="Owner"
          value={shortAddress(ownerAddress)}
          warning={
            ownerAddress && !sameAddress(ownerAddress, EXPECTED_ADMIN_OWNER_ADDRESS)
              ? "Owner differs from expected admin."
              : undefined
          }
        />
        <ReadRow label="Contract" value={shortAddress(config.address)} />
        <ReadRow
          label="Contract ETH balance"
          value={formatEth(nativeBalance.data?.value)}
        />
      </div>

      {!userIsExpectedOwner ? (
        <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100/80">
          Rescue actions are disabled because the connected wallet is not the
          expected owner.
        </div>
      ) : null}

      <section className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
        <h4 className="font-semibold text-red-100">Rescue ETH</h4>
        <p className="mt-2 text-sm text-red-100/80">
          Use only if native ETH was accidentally sent to this NFT contract.
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field
            label="ETH recipient"
            onChange={setEthRecipientInput}
            placeholder={EXPECTED_ADMIN_OWNER_ADDRESS}
            value={ethRecipientInput}
          />
          <Field
            label="ETH amount"
            onChange={setEthAmountInput}
            placeholder="0.001"
            value={ethAmountInput}
          />
        </div>

        <div className="mt-4 rounded-xl border border-white/10 px-4">
          <ReadRow label="Recipient valid" value={ethRecipient ? "Yes" : "No"} />
          <ReadRow
            label="Amount parsed"
            value={ethAmount === null ? "Invalid" : formatEth(ethAmount)}
          />
          <ReadRow
            label="Amount within balance"
            value={ethExceedsBalance ? "No" : "Yes"}
            warning={ethExceedsBalance ? "Amount exceeds contract ETH balance." : undefined}
          />
        </div>

        <button
          className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-3 font-medium text-red-100 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={rescueEthDisabled}
          onClick={() => void rescueEth()}
          type="button"
        >
          Rescue ETH
        </button>
      </section>

      <section className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
        <h4 className="font-semibold text-red-100">Rescue ERC20</h4>
        <p className="mt-2 text-sm text-red-100/80">
          Use only for accidental ERC20 tokens stuck in this NFT contract.
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field
            label="ERC20 token"
            onChange={setErc20TokenInput}
            placeholder="0x..."
            value={erc20TokenInput}
          />
          <Field
            label="ERC20 recipient"
            onChange={setErc20RecipientInput}
            placeholder={EXPECTED_ADMIN_OWNER_ADDRESS}
            value={erc20RecipientInput}
          />
          <Field
            label={`Amount (${erc20Symbol})`}
            onChange={setErc20AmountInput}
            placeholder="1"
            value={erc20AmountInput}
          />
        </div>

        <div className="mt-4 rounded-xl border border-white/10 px-4">
          <ReadRow label="Token valid" value={tokenAddress ? "Yes" : "No"} />
          <ReadRow
            label="Token balance in contract"
            value={formatTokenAmount({ value: erc20ContractBalance })}
          />
          <ReadRow label="Recipient valid" value={erc20Recipient ? "Yes" : "No"} />
          <ReadRow
            label="Amount parsed"
            value={
              erc20Amount === null
                ? "Invalid"
                : formatTokenAmount({ value: erc20Amount })
            }
          />
          <ReadRow
            label="Amount within balance"
            value={erc20ExceedsBalance ? "No" : "Yes"}
            warning={
              erc20ExceedsBalance
                ? "Amount exceeds token balance in this contract."
                : undefined
            }
          />
        </div>

        <button
          className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-3 font-medium text-red-100 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={rescueErc20Disabled}
          onClick={() => void rescueErc20()}
          type="button"
        >
          Rescue ERC20
        </button>
      </section>

      {lastAction ? (
        <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm">
          <div className="font-medium">Last emergency action</div>
          <div className="mt-2 font-mono text-red-100/80">{lastAction}</div>
        </div>
      ) : null}

      {isWritePending ? (
        <div className="mt-5 rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4 text-sm text-blue-100/80">
          Waiting for wallet signature...
        </div>
      ) : null}

      <TxStatus
        chainSet={chainSet}
        errorMessage={writeError?.message}
        isError={receipt.isError}
        isLoading={receipt.isLoading}
        isSuccess={receipt.isSuccess}
        txHash={txHash}
      />
    </article>
  );
}

export function AdminEmergencyRescueControls({
  chainSet,
}: {
  chainSet: ChainSet;
}) {
  const addresses = getContractAddresses(chainSet);

  const rescueContracts: RescueContractConfig[] = [
    {
      key: "roty",
      label: chainSet === "base" ? "The ROTY BASE" : "The ROTY dETH",
      address: addresses.roty,
      abi: rotyAdminAbi,
    },
    {
      key: "melting",
      label: chainSet === "base" ? "Melting BASE" : "MELTING dETH",
      address: addresses.melting,
      abi: gatedMintAdminAbi,
    },
    {
      key: "amanda",
      label: chainSet === "base" ? "Amanda BASE" : "Amanda dETH",
      address: addresses.amanda,
      abi: gatedMintAdminAbi,
    },
  ];

  return (
    <section className="grid gap-5">
      <section className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6">
        <p className="text-sm uppercase tracking-[0.25em] text-red-100/60">
          Critical Admin
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-red-100">
          Emergency / Rescue Controls
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-red-100/80">
          Emergency controls for rescuing excess reward token balance and
          accidental assets. These controls should not be used for normal
          operations.
        </p>
      </section>

      <RewardDistributorExcessRescue chainSet={chainSet} />

      {rescueContracts.map((contract) => (
        <ContractRescueControls
          chainSet={chainSet}
          config={contract}
          key={contract.key}
        />
      ))}
    </section>
  );
}
