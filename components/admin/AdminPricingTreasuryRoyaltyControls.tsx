"use client";

import { useEffect, useMemo, useState } from "react";
import type { Abi, Address, Hash } from "viem";
import { isAddress, parseEther } from "viem";
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import type { ChainSet } from "@/lib/chains/chainConfig";
import { gatedMintAdminAbi, rotyAdminAbi } from "@/lib/contracts/abis";
import { getContractAddresses } from "@/lib/contracts/addresses";
import { EXPECTED_ADMIN_OWNER_ADDRESS } from "@/lib/admin/adminContractConfig";
import { getTxUrl } from "@/lib/services/explorer";
import { ResponsiveHash } from "@/components/app/ResponsiveHash";
import { sameAddress } from "@/lib/utils/address";
import { formatEth, formatNumber, shortAddress } from "@/lib/utils/format";

type FinancialCollectionConfig = {
  key: "roty" | "melting" | "amanda";
  label: string;
  address: Address;
  abi: Abi;
};

function isExpectedOwner(address: string | undefined) {
  return Boolean(address && sameAddress(address, EXPECTED_ADMIN_OWNER_ADDRESS));
}

function parseEthInput(value: string): bigint | null {
  const clean = value.trim();

  if (!clean) {
    return null;
  }

  if (!/^\d+(\.\d+)?$/.test(clean)) {
    return null;
  }

  try {
    return parseEther(clean);
  } catch {
    return null;
  }
}

function parseRoyaltyPercentToFeeNumerator(value: string): bigint | null {
  const clean = value.trim();

  if (!clean) {
    return null;
  }

  if (!/^\d+(\.\d{1,2})?$/.test(clean)) {
    return null;
  }

  const [wholePart, decimalPart = ""] = clean.split(".");
  const basisPoints =
    BigInt(wholePart) * 100n + BigInt(decimalPart.padEnd(2, "0"));

  if (basisPoints > 10_000n) {
    return null;
  }

  return basisPoints;
}

function formatRoyaltyPercentFromAmount(royaltyAmount: bigint | undefined) {
  if (royaltyAmount === undefined) {
    return "—";
  }

  const oneEth = parseEther("1");
  const basisPoints = (royaltyAmount * 10_000n) / oneEth;
  const whole = basisPoints / 100n;
  const decimals = (basisPoints % 100n).toString().padStart(2, "0");

  return `${whole.toString()}.${decimals}%`;
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
        <ResponsiveHash value={txHash} />
      </a>

      <div className="mt-1 text-white/60">
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

function FinancialCollectionControls({
  chainSet,
  config,
}: {
  chainSet: ChainSet;
  config: FinancialCollectionConfig;
}) {
  const { address: connectedAddress, isConnected } = useAccount();

  const [mintPriceInput, setMintPriceInput] = useState("");
  const [treasuryInput, setTreasuryInput] = useState("");
  const [royaltyReceiverInput, setRoyaltyReceiverInput] = useState("");
  const [royaltyPercentInput, setRoyaltyPercentInput] = useState("");
  const [lastActionLabel, setLastActionLabel] = useState<string | null>(null);
  const [lastRequestedValue, setLastRequestedValue] = useState<string | null>(
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

  const mintPriceRead = useReadContract({
    address: config.address,
    abi: config.abi,
    functionName: "mintPrice",
  });

  const treasuryRead = useReadContract({
    address: config.address,
    abi: config.abi,
    functionName: "treasury",
  });

  const royaltyInfoRead = useReadContract({
    address: config.address,
    abi: config.abi,
    functionName: "royaltyInfo",
    args: [1n, parseEther("1")],
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

  function refetchFinancialReads() {
    void ownerRead.refetch();
    void mintPriceRead.refetch();
    void treasuryRead.refetch();
    void royaltyInfoRead.refetch();
  }

  useEffect(() => {
    if (receipt.isSuccess) {
      refetchFinancialReads();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receipt.isSuccess]);

  const ownerAddress =
    typeof ownerRead.data === "string" ? ownerRead.data : undefined;
  const mintPrice =
    typeof mintPriceRead.data === "bigint" ? mintPriceRead.data : undefined;
  const treasury =
    typeof treasuryRead.data === "string" ? treasuryRead.data : undefined;

  const royaltyInfo = royaltyInfoRead.data as
    | readonly [Address, bigint]
    | undefined;
  const royaltyReceiver = royaltyInfo?.[0];
  const royaltyAmountForOneEth = royaltyInfo?.[1];
  const readError =
    ownerRead.error ??
    mintPriceRead.error ??
    treasuryRead.error ??
    royaltyInfoRead.error;
  const isRefreshing =
    ownerRead.isFetching ||
    mintPriceRead.isFetching ||
    treasuryRead.isFetching ||
    royaltyInfoRead.isFetching;

  const parsedMintPrice = parseEthInput(mintPriceInput);
  const parsedTreasury = isAddress(treasuryInput.trim())
    ? (treasuryInput.trim() as Address)
    : null;
  const parsedRoyaltyReceiver = isAddress(royaltyReceiverInput.trim())
    ? (royaltyReceiverInput.trim() as Address)
    : null;
  const parsedRoyaltyFeeNumerator =
    parseRoyaltyPercentToFeeNumerator(royaltyPercentInput);

  const actionDisabledBase =
    !isConnected || !userIsExpectedOwner || isWritePending || receipt.isLoading;

  function confirmAction({
    title,
    lines,
    critical,
  }: {
    title: string;
    lines: string[];
    critical?: boolean;
  }) {
    const prefix = critical
      ? "CRITICAL FINANCIAL ADMIN ACTION"
      : "HIGH RISK FINANCIAL ADMIN ACTION";

    return window.confirm(
      [
        prefix,
        title,
        "",
        ...lines,
        "",
        "Only continue after reviewing the current value, new value, and operational impact.",
      ].join("\n"),
    );
  }

  async function setMintPrice() {
    if (parsedMintPrice === null) {
      return;
    }

    const confirmed = confirmAction({
      title: `Set mint price for ${config.label}`,
      lines: [
        `Contract: ${config.address}`,
        `Current mint price: ${formatEth(mintPrice)}`,
        `New mint price: ${mintPriceInput} ETH`,
      ],
    });

    if (!confirmed) {
      return;
    }

    setLastActionLabel(`SET MINT PRICE ${config.label}`);
    setLastRequestedValue(`${mintPriceInput} ETH`);

    await writeContractAsync({
      address: config.address,
      abi: config.abi,
      functionName: "setMintPrice",
      args: [parsedMintPrice],
    });
  }

  async function setTreasury() {
    if (!parsedTreasury) {
      return;
    }

    const confirmed = confirmAction({
      title: `Set treasury for ${config.label}`,
      critical: true,
      lines: [
        `Contract: ${config.address}`,
        `Current treasury: ${treasury ?? "—"}`,
        `New treasury: ${parsedTreasury}`,
        "",
        "Mint proceeds will be sent to the new treasury immediately after this transaction.",
      ],
    });

    if (!confirmed) {
      return;
    }

    setLastActionLabel(`SET TREASURY ${config.label}`);
    setLastRequestedValue(parsedTreasury);

    await writeContractAsync({
      address: config.address,
      abi: config.abi,
      functionName: "setTreasury",
      args: [parsedTreasury],
    });
  }

  async function setDefaultRoyalty() {
    if (!parsedRoyaltyReceiver || parsedRoyaltyFeeNumerator === null) {
      return;
    }

    const confirmed = confirmAction({
      title: `Set default royalty for ${config.label}`,
      critical: true,
      lines: [
        `Contract: ${config.address}`,
        `Current royalty receiver: ${royaltyReceiver ?? "—"}`,
        `Current royalty: ${formatRoyaltyPercentFromAmount(royaltyAmountForOneEth)}`,
        `New royalty receiver: ${parsedRoyaltyReceiver}`,
        `New royalty percent: ${royaltyPercentInput}%`,
        `New fee numerator: ${parsedRoyaltyFeeNumerator.toString()}`,
      ],
    });

    if (!confirmed) {
      return;
    }

    setLastActionLabel(`SET DEFAULT ROYALTY ${config.label}`);
    setLastRequestedValue(`${parsedRoyaltyReceiver} / ${royaltyPercentInput}%`);

    await writeContractAsync({
      address: config.address,
      abi: config.abi,
      functionName: "setDefaultRoyalty",
      args: [parsedRoyaltyReceiver, parsedRoyaltyFeeNumerator],
    });
  }

  return (
    <article className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-white/40">
            Pricing / treasury / royalty
          </p>
          <h3 className="mt-2 text-2xl font-semibold">{config.label}</h3>
          <p className="mt-2 max-w-2xl text-sm text-white/60">
            Update paid mint price, mint proceeds treasury, and ERC2981 default
            royalty settings.
          </p>
        </div>

        <button
          className="rounded-2xl border border-white/10 px-4 py-2 text-sm hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={isRefreshing}
          onClick={refetchFinancialReads}
          type="button">
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 px-4">
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
        <ReadRow label="Mint price" value={formatEth(mintPrice)} />
        <ReadRow label="Treasury" value={shortAddress(treasury)} />
        <ReadRow
          label="Royalty receiver"
          value={shortAddress(royaltyReceiver)}
        />
        <ReadRow
          label="Royalty for 1 ETH sale"
          value={`${formatEth(royaltyAmountForOneEth)} (${formatRoyaltyPercentFromAmount(
            royaltyAmountForOneEth,
          )})`}
        />
      </div>

      {!userIsExpectedOwner ? (
        <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100/80">
          Write actions are disabled because the connected wallet is not the
          expected owner.
        </div>
      ) : null}

      <div className="mt-5 grid gap-5">
        <Field
          label="New mint price"
          description="Human-readable native token amount. Example: 0.001047"
          onChange={setMintPriceInput}
          placeholder="0.001047"
          value={mintPriceInput}
        />

        <button
          className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 px-5 py-3 font-medium text-yellow-100 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={actionDisabledBase || parsedMintPrice === null}
          onClick={() => void setMintPrice()}
          type="button">
          Set Mint Price
        </button>

        <Field
          label="New treasury"
          description="Address that receives future mint proceeds."
          onChange={setTreasuryInput}
          placeholder={treasury ?? "0x..."}
          value={treasuryInput}
        />

        <button
          className="rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-3 font-medium text-red-100 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={actionDisabledBase || !parsedTreasury}
          onClick={() => void setTreasury()}
          type="button">
          Set Treasury
        </button>

        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="New royalty receiver"
            description="Address that receives future royalty."
            onChange={setRoyaltyReceiverInput}
            placeholder={royaltyReceiver ?? "0x..."}
            value={royaltyReceiverInput}
          />

          <Field
            label="New royalty percent"
            description="Example: 11 for 11%. Supports up to 2 decimals."
            onChange={setRoyaltyPercentInput}
            placeholder="11"
            value={royaltyPercentInput}
          />
        </div>

        <button
          className="rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-3 font-medium text-red-100 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={
            actionDisabledBase ||
            !parsedRoyaltyReceiver ||
            parsedRoyaltyFeeNumerator === null
          }
          onClick={() => void setDefaultRoyalty()}
          type="button">
          Set Default Royalty
        </button>
      </div>

      {lastActionLabel ? (
        <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm">
          <div className="font-medium">Last requested action</div>
          <div className="mt-2 text-white/60">{lastActionLabel}</div>
          <div className="mt-1 break-all text-white/60">
            Requested value: {lastRequestedValue}
          </div>
        </div>
      ) : null}

      {isWritePending ? (
        <div className="mt-5 rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4 text-sm text-blue-100/80">
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
        <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100/80">
          {writeError.message}
        </div>
      ) : null}

      {readError ? (
        <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100/80">
          Read error: {readError.message}
        </div>
      ) : null}
    </article>
  );
}

export function AdminPricingTreasuryRoyaltyControls({
  chainSet,
}: {
  chainSet: ChainSet;
}) {
  const addresses = getContractAddresses(chainSet);

  const collections: FinancialCollectionConfig[] = [
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
    <section className="grid gap-5" id="money-controls">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <p className="text-sm uppercase tracking-[0.25em] text-white/50">
          Admin Writes
        </p>
        <h2 className="mt-2 text-2xl font-semibold">
          Pricing, Treasury, and Royalty Controls
        </h2>
        <p className="mt-2 text-sm text-white/60">
          Owner-only controls for mint price, mint proceeds treasury, and
          ERC2981 default royalty.
        </p>
      </section>

      {collections.map((collection) => (
        <FinancialCollectionControls
          chainSet={chainSet}
          config={collection}
          key={collection.key}
        />
      ))}
    </section>
  );
}
