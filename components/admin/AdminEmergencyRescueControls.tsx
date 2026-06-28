"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import { ResponsiveHash } from "@/components/app/ResponsiveHash";
import { sameAddress } from "@/lib/utils/address";
import { formatEth, formatTokenAmount, shortAddress } from "@/lib/utils/format";

type RescueContractConfig = {
  key: "roty" | "melting" | "amanda";
  label: string;
  address: Address;
  abi: Abi;
};

type DetectedErc20Token = {
  address: Address;
  name: string;
  symbol: string;
  decimals: number;
  balance_wei: string;
  balance_formatted: string;
};

type RescueTokenBalancesApiResponse =
  | {
      ok: true;
      chain: ChainSet;
      collection: RescueContractConfig["key"];
      contractAddress: Address;
      tokens: DetectedErc20Token[];
    }
  | {
      ok: false;
      error: string;
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
    <div className="grid gap-2 border-b border-black/40 py-3 last:border-b-0 md:grid-cols-[260px_1fr]">
      <div>
        <div className="text-sm text-black/70">{label}</div>
        {warning ? (
          <div className="mt-1 text-xs text-[#7a3a00]">{warning}</div>
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
    <label className="grid gap-2">
      <div className="font-medium text-black">{label}</div>
      {description ? (
        <p className="text-xs text-black/70">{description}</p>
      ) : null}
      <input
        className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3 font-mono text-sm text-white outline-none focus:border-white/30"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type="text"
        value={value}
      />
    </label>
  );
}

function TokenBalanceSelect({
  label,
  description,
  value,
  tokens,
  loading,
  onChange,
}: {
  label: string;
  description?: string;
  value: string;
  tokens: DetectedErc20Token[];
  loading: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2">
      <div className="font-medium text-black">{label}</div>
      {description ? (
        <p className="text-xs text-black/70">{description}</p>
      ) : null}
      <select
        className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3 font-mono text-sm text-white outline-none focus:border-white/30 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={loading}
        onChange={(event) => onChange(event.target.value)}
        value={value}>
        <option value="">
          {loading ? "Loading detected ERC20 balances..." : "Select token"}
        </option>
        {tokens.map((token) => (
          <option key={token.address} value={token.address}>
            {token.symbol} — {shortAddress(token.address)} —{" "}
            {token.balance_formatted} {token.symbol}
          </option>
        ))}
      </select>
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
    <div className="mt-5 rounded-2xl border border-white/10 bg-white/70 p-4 text-sm text-black">
      <div className="font-medium text-black">Transaction status</div>

      <a
        className="mt-2 block break-all font-mono underline underline-offset-4"
        href={getTxUrl(chainSet, txHash)}
        rel="noreferrer"
        target="_blank">
        <ResponsiveHash value={txHash} />
      </a>

      <div className="mt-1 text-black/70">
        {isLoading
          ? "Mining..."
          : isSuccess
            ? "Mined successfully. State refreshed."
            : isError
              ? "Transaction failed or receipt error."
              : "Submitted."}
      </div>
    </div>
  );
}

function ErrorMessageBlock({
  title,
  message,
  className = "mt-5",
}: {
  title: string;
  message: string;
  className?: string;
}) {
  return (
    <div
      className={`${className} min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-[#ff9b4a] p-4`}>
      <h4 className="font-medium text-black">{title}</h4>
      <p className="mt-2 max-w-full break-all whitespace-pre-wrap text-sm text-black/70">
        {message}
      </p>
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

function RewardDistributorExcessRescue({ chainSet }: { chainSet: ChainSet }) {
  const { address: connectedAddress, isConnected } = useAccount();
  const addresses = getContractAddresses(chainSet);

  const [recipientInput, setRecipientInput] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [lastActionLabel, setLastActionLabel] = useState<string | null>(null);
  const [lastRequestedValue, setLastRequestedValue] = useState<string | null>(
    null,
  );

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
    void oioiDecimalsRead.refetch();
    void oioiSymbolRead.refetch();
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
  const readError =
    rewardOwnerRead.error ??
    rewardTokenRead.error ??
    allocatedUnclaimedRead.error ??
    excessRead.error ??
    distributorOioiBalanceRead.error ??
    oioiDecimalsRead.error ??
    oioiSymbolRead.error;
  const isRefreshing =
    rewardOwnerRead.isFetching ||
    rewardTokenRead.isFetching ||
    allocatedUnclaimedRead.isFetching ||
    excessRead.isFetching ||
    distributorOioiBalanceRead.isFetching ||
    oioiDecimalsRead.isFetching ||
    oioiSymbolRead.isFetching;

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
      title: "Rescue excess $OiOi from Reward Distributor",
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

    setLastActionLabel("RESCUE EXCESS OIOI");
    setLastRequestedValue(`${amountInput} ${symbol} to ${parsedRecipient}`);

    await writeContractAsync({
      address: addresses.rewardDistributor,
      abi: rewardDistributorAdminAbi,
      functionName: "rescueERC20",
      args: [addresses.oioi, parsedRecipient, parsedAmount],
    });
  }

  return (
    <article className="rounded-3xl border border-white/10 bg-black p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-white/40">
            Reward Distributor emergency
          </p>
          <h3 className="mt-2 text-2xl font-semibold">Rescue Excess $OiOi</h3>
          <p className="mt-2 max-w-3xl text-sm text-white/70">
            Only rescue excess $OiOi that is not allocated to active/unclaimed
            rewards or will be blocked.
          </p>
        </div>

        <div className="grid rounded-2xl border border-white/10 bg-black p-1">
          <button
            className="rounded-xl px-4 py-2 text-sm hover:bg-(--oioi-accent) disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-black"
            disabled={isRefreshing}
            onClick={refetchReads}
            type="button">
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-white/70 px-4 text-black">
        <ReadRow
          label="Reward Distributor owner"
          value={shortAddress(ownerAddress)}
          warning={
            ownerAddress &&
            !sameAddress(ownerAddress, EXPECTED_ADMIN_OWNER_ADDRESS)
              ? "Owner differs from expected admin."
              : undefined
          }
        />
        <ReadRow label="Reward token" value={shortAddress(rewardToken)} />
        <ReadRow
          label="Reward Distributor $OiOi balance"
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
          warning="The maximum rescue amount allowed."
        />
      </div>

      {!userIsExpectedOwner ? (
        <div className="mt-5 rounded-2xl border border-white/10 bg-[#ff9b4a] p-4 text-sm text-black">
          Rescue actions are disabled because the connected wallet is not the
          expected owner.
        </div>
      ) : null}

      <div className="mt-5 grid gap-4 rounded-2xl border border-white/10 bg-white/70 p-4 text-black md:grid-cols-2">
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

      <div className="mt-5 rounded-2xl border border-white/10 bg-white/70 p-4 text-black">
        <div className="font-medium text-black">Validation</div>
        <div className="mt-3 rounded-xl border border-black/10 bg-white/70 px-4">
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
            warning={
              amountExceedsExcess ? "Amount exceeds excess balance." : undefined
            }
          />
        </div>
      </div>

      <div className="mt-5 grid gap-5">
        <button
          className="rounded-2xl bg-[#ff9b4a] px-5 py-4 font-medium text-black hover:bg-(--oioi-accent) hover:text-white disabled:cursor-not-allowed disabled:bg-white disabled:text-black disabled:opacity-40"
          disabled={actionDisabled}
          onClick={() => void rescueExcessOioi()}
          type="button">
          Rescue Excess $OiOi
        </button>
      </div>

      {lastActionLabel ? (
        <div className="mt-5 rounded-2xl border border-white/10 bg-white/70 p-4 text-sm text-black">
          <div className="font-medium text-black">Last requested action</div>
          <div className="mt-2 text-black/70">{lastActionLabel}</div>
          <div className="mt-1 break-all text-black/70">
            Requested value: {lastRequestedValue}
          </div>
        </div>
      ) : null}

      {isWritePending ? (
        <div className="mt-5 rounded-2xl border border-white/10 bg-yellow-300 p-4 text-sm text-black">
          Waiting for wallet signature...
        </div>
      ) : null}

      <TxStatus
        chainSet={chainSet}
        isError={receipt.isError}
        isLoading={receipt.isLoading}
        isSuccess={receipt.isSuccess}
        txHash={txHash}
      />

      {writeError ? (
        <ErrorMessageBlock
          message={writeError.message}
          title="Transaction failed"
        />
      ) : null}

      {readError ? (
        <ErrorMessageBlock
          message={readError.message}
          title="Contract read failed"
        />
      ) : null}
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
  const [lastActionLabel, setLastActionLabel] = useState<string | null>(null);
  const [lastRequestedValue, setLastRequestedValue] = useState<string | null>(
    null,
  );
  const [detectedErc20Tokens, setDetectedErc20Tokens] = useState<
    DetectedErc20Token[]
  >([]);
  const [isDetectedTokensLoading, setIsDetectedTokensLoading] = useState(false);
  const [detectedTokensError, setDetectedTokensError] = useState<string | null>(
    null,
  );

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

  const fetchDetectedErc20Tokens = useCallback(async () => {
    setIsDetectedTokensLoading(true);
    setDetectedTokensError(null);

    try {
      const params = new URLSearchParams({
        chain: chainSet,
        collection: config.key,
      });
      const response = await fetch(
        `/api/admin/rescue-token-balances?${params.toString()}`,
        {
          cache: "no-store",
        },
      );
      const json = (await response.json()) as RescueTokenBalancesApiResponse;

      if (!response.ok || json.ok === false) {
        setDetectedErc20Tokens([]);
        setDetectedTokensError(
          json.ok === false
            ? json.error
            : "Failed to load detected ERC20 token balances.",
        );
        return;
      }

      setDetectedErc20Tokens(json.tokens);
    } catch (error) {
      setDetectedErc20Tokens([]);
      setDetectedTokensError(
        error instanceof Error
          ? error.message
          : "Failed to load detected ERC20 token balances.",
      );
    } finally {
      setIsDetectedTokensLoading(false);
    }
  }, [chainSet, config.key]);

  function refetchReads() {
    void ownerRead.refetch();
    void nativeBalance.refetch();
    void fetchDetectedErc20Tokens();
    if (tokenAddress) {
      void erc20DecimalsRead.refetch();
      void erc20SymbolRead.refetch();
      void erc20ContractBalanceRead.refetch();
    }
  }

  useEffect(() => {
    void fetchDetectedErc20Tokens();
  }, [fetchDetectedErc20Tokens]);

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
  const selectedDetectedToken = tokenAddress
    ? detectedErc20Tokens.find((token) =>
        sameAddress(token.address, tokenAddress),
      )
    : undefined;
  const erc20Decimals =
    typeof erc20DecimalsRead.data === "number"
      ? erc20DecimalsRead.data
      : selectedDetectedToken?.decimals ?? 18;
  const erc20Symbol =
    typeof erc20SymbolRead.data === "string" && erc20SymbolRead.data.trim()
      ? erc20SymbolRead.data.trim()
      : selectedDetectedToken?.symbol ?? "token";
  const erc20Amount = parseTokenAmount(erc20AmountInput, erc20Decimals);
  const erc20ContractBalance =
    typeof erc20ContractBalanceRead.data === "bigint"
      ? erc20ContractBalanceRead.data
      : undefined;
  const readError =
    ownerRead.error ??
    nativeBalance.error ??
    erc20DecimalsRead.error ??
    erc20SymbolRead.error ??
    erc20ContractBalanceRead.error;
  const isRefreshing =
    ownerRead.isFetching ||
    nativeBalance.isFetching ||
    erc20DecimalsRead.isFetching ||
    erc20SymbolRead.isFetching ||
    erc20ContractBalanceRead.isFetching ||
    isDetectedTokensLoading;

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

    setLastActionLabel(`RESCUE ETH ${config.label}`);
    setLastRequestedValue(`${ethAmountInput} ETH to ${ethRecipient}`);

    await writeContractAsync({
      address: config.address,
      abi: config.abi,
      functionName: "rescueETH",
      args: [ethRecipient, ethAmount],
    });
  }

  async function rescueErc20() {
    if (
      !tokenAddress ||
      !erc20Recipient ||
      erc20Amount === null ||
      erc20ExceedsBalance
    ) {
      return;
    }

    const confirmed = typedConfirm({
      title: `Rescue ERC20 from ${config.label}`,
      confirmationText: "RESCUE ERC20",
      body: [
        "Use only for accidental ERC20 tokens stuck in this NFT contract.",
        "Do not use this for Reward Distributor allocated reward balances.",
        "",
        `Contract: ${config.address}`,
        `Token: ${tokenAddress}`,
        `Recipient: ${erc20Recipient}`,
        `Amount: ${erc20AmountInput} ${erc20Symbol}`,
        `Contract token balance: ${formatTokenAmount({
          decimals: erc20Decimals,
          symbol: erc20Symbol,
          value: erc20ContractBalance,
        })}`,
      ],
    });

    if (!confirmed) {
      return;
    }

    setLastActionLabel(`RESCUE ERC20 ${config.label}`);
    setLastRequestedValue(
      `${erc20AmountInput} ${erc20Symbol} to ${erc20Recipient}`,
    );

    await writeContractAsync({
      address: config.address,
      abi: config.abi,
      functionName: "rescueERC20",
      args: [tokenAddress, erc20Recipient, erc20Amount],
    });
  }

  return (
    <article className="rounded-3xl border border-white/10 bg-black p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-white/40">
            NFT contract rescue
          </p>
          <h3 className="mt-2 text-2xl font-semibold">{config.label}</h3>
          <p className="mt-2 max-w-3xl text-sm text-white/70">
            Emergency rescue controls for accidental ETH or ERC20 tokens stuck
            in this NFT contract.
          </p>
        </div>

        <div className="grid rounded-2xl border border-white/10 bg-black p-1">
          <button
            className="rounded-xl px-4 py-2 text-sm hover:bg-(--oioi-accent) disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-black"
            disabled={isRefreshing}
            onClick={refetchReads}
            type="button">
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-white/70 px-4 text-black">
        <ReadRow
          label="Owner"
          value={shortAddress(ownerAddress)}
          warning={
            ownerAddress &&
            !sameAddress(ownerAddress, EXPECTED_ADMIN_OWNER_ADDRESS)
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
        <div className="mt-5 rounded-2xl border border-white/10 bg-[#ff9b4a] p-4 text-sm text-black">
          Rescue actions are disabled because the connected wallet is not the
          expected owner.
        </div>
      ) : null}

      <div className="mt-5 rounded-2xl border border-white/10 bg-white/70 p-4 text-black">
        <h4 className="font-semibold text-black">Rescue ETH</h4>
        <p className="mt-2 text-sm text-black/70">
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

        <div className="mt-4 rounded-xl border border-black/10 bg-white/70 px-4">
          <ReadRow
            label="Recipient valid"
            value={ethRecipient ? "Yes" : "No"}
          />
          <ReadRow
            label="Amount parsed"
            value={ethAmount === null ? "Invalid" : formatEth(ethAmount)}
          />
          <ReadRow
            label="Amount within balance"
            value={ethExceedsBalance ? "No" : "Yes"}
            warning={
              ethExceedsBalance
                ? "Amount exceeds contract ETH balance."
                : undefined
            }
          />
        </div>

        <div className="mt-5 grid gap-5">
          <button
            className="rounded-2xl bg-[#ff9b4a] px-5 py-4 font-medium text-black hover:bg-(--oioi-accent) hover:text-white disabled:cursor-not-allowed disabled:bg-white disabled:text-black disabled:opacity-40"
            disabled={rescueEthDisabled}
            onClick={() => void rescueEth()}
            type="button">
            Rescue ETH
          </button>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-white/70 p-4 text-black">
        <h4 className="font-semibold text-black">Rescue ERC20</h4>
        <p className="mt-2 text-sm text-black/70">
          Use only for accidental ERC20 tokens stuck in this NFT contract.
        </p>

        <div className="mt-4 grid gap-4">
          <TokenBalanceSelect
            description="Detected by Alchemy from ERC20 token balances held by this NFT contract."
            label="Detected ERC20 token"
            loading={isDetectedTokensLoading}
            onChange={setErc20TokenInput}
            tokens={detectedErc20Tokens}
            value={selectedDetectedToken?.address ?? ""}
          />

          {!isDetectedTokensLoading && detectedErc20Tokens.length === 0 ? (
            <div className="rounded-2xl border border-black/10 bg-white/70 p-4 text-sm text-black/70">
              No ERC20 token balances detected by Alchemy for this contract.
              Use a custom token address only if you have verified one manually.
            </div>
          ) : null}

          {selectedDetectedToken ? (
            <div className="rounded-2xl border border-black/10 bg-white/70 px-4">
              <ReadRow
                label="Selected token"
                value={`${selectedDetectedToken.name} (${selectedDetectedToken.symbol})`}
              />
              <ReadRow
                label="Selected token address"
                value={selectedDetectedToken.address}
              />
              <ReadRow
                label="Detected token balance"
                value={`${selectedDetectedToken.balance_formatted} ${selectedDetectedToken.symbol}`}
              />
            </div>
          ) : null}

          <Field
            description="Fallback for verified token addresses not returned by Alchemy."
            label="Custom ERC20 token"
            onChange={setErc20TokenInput}
            placeholder="0x..."
            value={erc20TokenInput}
          />
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
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

        <div className="mt-4 rounded-xl border border-black/10 bg-white/70 px-4">
          <ReadRow label="Token valid" value={tokenAddress ? "Yes" : "No"} />
          <ReadRow
            label="Token balance in contract"
            value={formatTokenAmount({
              decimals: erc20Decimals,
              symbol: erc20Symbol,
              value: erc20ContractBalance,
            })}
          />
          <ReadRow
            label="Recipient valid"
            value={erc20Recipient ? "Yes" : "No"}
          />
          <ReadRow
            label="Amount parsed"
            value={
              erc20Amount === null
                ? "Invalid"
                : formatTokenAmount({
                    decimals: erc20Decimals,
                    symbol: erc20Symbol,
                    value: erc20Amount,
                  })
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

        <div className="mt-5 grid gap-5">
          <button
            className="rounded-2xl bg-[#ff9b4a] px-5 py-4 font-medium text-black hover:bg-(--oioi-accent) hover:text-white disabled:cursor-not-allowed disabled:bg-white disabled:text-black disabled:opacity-40"
            disabled={rescueErc20Disabled}
            onClick={() => void rescueErc20()}
            type="button">
            Rescue ERC20
          </button>
        </div>
      </div>

      {lastActionLabel ? (
        <div className="mt-5 rounded-2xl border border-white/10 bg-white/70 p-4 text-sm text-black">
          <div className="font-medium text-black">Last requested action</div>
          <div className="mt-2 text-black/70">{lastActionLabel}</div>
          <div className="mt-1 break-all text-black/70">
            Requested value: {lastRequestedValue}
          </div>
        </div>
      ) : null}

      {isWritePending ? (
        <div className="mt-5 rounded-2xl border border-white/10 bg-yellow-300 p-4 text-sm text-black">
          Waiting for wallet signature...
        </div>
      ) : null}

      <TxStatus
        chainSet={chainSet}
        isError={receipt.isError}
        isLoading={receipt.isLoading}
        isSuccess={receipt.isSuccess}
        txHash={txHash}
      />

      {writeError ? (
        <ErrorMessageBlock
          message={writeError.message}
          title="Transaction failed"
        />
      ) : null}

      {detectedTokensError ? (
        <ErrorMessageBlock
          message={detectedTokensError}
          title="Detected ERC20 balances failed to load"
        />
      ) : null}

      {readError ? (
        <ErrorMessageBlock
          message={readError.message}
          title="Contract read failed"
        />
      ) : null}
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
      label: chainSet === "base" ? "ROTY BASE" : "ROTY dETH",
      address: addresses.roty,
      abi: rotyAdminAbi,
    },
    {
      key: "melting",
      label: chainSet === "base" ? "Melting BASE" : "Melting dETH",
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
    <section className="grid gap-5 scroll-mt-30" id="rescue-controls">
      <section className="rounded-3xl border border-white/10 bg-black p-6">
        <p className="text-sm uppercase tracking-[0.25em] text-white/50">
          Critical Admin
        </p>
        <h2 className="mt-2 text-2xl font-semibold">
          Emergency / Rescue Controls
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-white/70">
          Controls for rescuing excess reward token balance and accidental
          assets. Should not be used for normal operations.
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
