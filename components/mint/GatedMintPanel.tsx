"use client";

import { useMemo, useState } from "react";
import {
  useAccount,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import type { CollectionConfig } from "@/lib/contracts/collectionConfig";
import { gatedMintAbi } from "@/lib/contracts/abis";
import { useGatedEligibility } from "@/lib/hooks/useGatedEligibility";
import { useMintReadState } from "@/lib/hooks/useMintReadState";
import { getTxUrl } from "@/lib/services/explorer";
import { ResponsiveHash } from "@/components/app/ResponsiveHash";
import { formatEth, formatNumber } from "@/lib/utils/format";

function clampQuantity(value: number, max: number) {
  if (!Number.isFinite(value)) {
    return 1;
  }

  if (value < 1) {
    return 1;
  }

  if (value > max) {
    return max;
  }

  return Math.floor(value);
}

function getEligibilityLabel(config: CollectionConfig) {
  if (config.collectionKey === "melting") {
    return "Melting requires a valid ROTY soft stake on this same chain.";
  }

  return "Amanda requires a valid ROTY or Melting soft stake on this same chain.";
}

function TxStatus({
  config,
  txHash,
  isConfirming,
  isSuccess,
}: {
  config: CollectionConfig;
  txHash: `0x${string}` | undefined;
  isConfirming: boolean;
  isSuccess: boolean;
}) {
  if (!txHash) {
    return null;
  }

  return (
    <div className="mt-6 min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-yellow-300 p-4 text-black">
      <div className="font-medium">Transaction status</div>
      <a
        className="mt-2 block break-all font-mono text-sm text-black/70 underline underline-offset-4"
        href={getTxUrl(config.chainSet, txHash)}
        rel="noreferrer"
        target="_blank">
        <ResponsiveHash value={txHash} />
      </a>
      <p className="mt-2 text-sm text-black/70">
        {isConfirming
          ? "Waiting for confirmation..."
          : isSuccess
            ? "Mined successfully. Mint state will refresh from on-chain reads."
            : "Submitted."}
      </p>
    </div>
  );
}

function ErrorMessageBlock({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <div className="mt-6 min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-[#ff9b4a] p-4">
      <h3 className="font-medium text-black">{title}</h3>
      <p className="mt-2 max-w-full break-all whitespace-pre-wrap text-sm text-black/70">
        {message}
      </p>
    </div>
  );
}

export function GatedMintPanel({ config }: { config: CollectionConfig }) {
  const { address, isConnected } = useAccount();
  const mintState = useMintReadState(config);
  const eligibility = useGatedEligibility(config);
  const [quantity, setQuantity] = useState(1);
  const [lastAction, setLastAction] = useState(false);

  const {
    data: txHash,
    error: writeError,
    isPending: isWritePending,
    writeContract,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const maxMintPerTx = Number(mintState.maxMintPerTx ?? 1n);
  const remainingSupply = Number(mintState.remainingSupply ?? 0n);
  const maxQuantity = Math.max(1, Math.min(maxMintPerTx, remainingSupply || 1));
  const safeQuantity = clampQuantity(quantity, maxQuantity);

  const totalPrice = useMemo(() => {
    if (mintState.mintPrice === undefined) {
      return undefined;
    }

    return mintState.mintPrice * BigInt(safeQuantity);
  }, [mintState.mintPrice, safeQuantity]);

  const soldOut = mintState.remainingSupply === 0n;
  const gatedMintClosed = mintState.gatedMintEnabled !== true;
  const walletEligible = eligibility.eligible === true;
  const hasMintPrice = mintState.mintPrice !== undefined;
  const isRefreshing = mintState.isFetching || eligibility.isFetching;
  const transactionInProgress = isWritePending || isConfirming;

  const disabledReason = (() => {
    if (!isConnected || !address) {
      return "Connect wallet to mint.";
    }

    if (mintState.isLoading || eligibility.isLoading) {
      return "Loading contract state.";
    }

    if (mintState.error) {
      return "Contract read failed.";
    }

    if (eligibility.error) {
      return "Eligibility check failed.";
    }

    if (soldOut) {
      return "Sold out.";
    }

    if (gatedMintClosed) {
      return "Gated mint is closed.";
    }

    if (!walletEligible) {
      return "This wallet is not eligible to mint.";
    }

    if (!hasMintPrice || totalPrice === undefined) {
      return "Mint price unavailable.";
    }

    if (transactionInProgress) {
      return "Transaction in progress.";
    }

    return null;
  })();

  function handleQuantityChange(value: string) {
    setQuantity(clampQuantity(Number(value), maxQuantity));
  }

  function handleMint() {
    if (disabledReason || totalPrice === undefined) {
      return;
    }

    setLastAction(true);

    writeContract({
      address: config.contractAddress,
      abi: gatedMintAbi,
      functionName: "mint",
      args: [BigInt(safeQuantity)],
      value: totalPrice,
    });
  }

  function handleRefresh() {
    mintState.refetch();
    void eligibility.refetch();
  }

  return (
    <article className="min-w-0 rounded-3xl border border-white/10 bg-black p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-white/70">
            Staking-Gated Mint
          </p>
          <h2 className="mt-2 text-2xl font-semibold">{config.name}</h2>
          <p className="mt-2 text-sm text-white/70">
            {getEligibilityLabel(config)}
          </p>
        </div>
        <div className="grid rounded-2xl border border-white/10 bg-black p-1">
          <button
            className="cursor-pointer rounded-xl px-4 py-2 text-sm hover:bg-(--oioi-accent) disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-black"
            disabled={isRefreshing}
            type="button"
            onClick={handleRefresh}>
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-white/70 px-4">
        <div className="flex items-center justify-between gap-4 border-b border-black/40 py-3 last:border-b-0">
          <span className="text-sm text-black/70">Gated mint enabled</span>
          <span className="font-mono text-sm text-black">
            {mintState.gatedMintEnabled ? "Yes" : "No"}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4 border-b border-black/40 py-3 last:border-b-0">
          <span className="text-sm text-black/70">This wallet eligible</span>
          <span className="font-mono text-sm text-black">
            {eligibility.eligible === undefined
              ? "—"
              : eligibility.eligible
                ? "Yes"
                : "No"}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4 border-b border-black/40 py-3 last:border-b-0">
          <span className="text-sm text-black/70">Remaining supply</span>
          <span className="font-mono text-sm text-black">
            {formatNumber(mintState.remainingSupply)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4 border-b border-black/40 py-3 last:border-b-0">
          <span className="text-sm text-black/70">Max mint per tx</span>
          <span className="font-mono text-sm text-black">
            {formatNumber(mintState.maxMintPerTx)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4 border-b border-black/40 py-3 last:border-b-0">
          <span className="text-sm text-black/70">Unit price</span>
          <span className="font-mono text-sm text-black">
            {formatEth(mintState.mintPrice)}
          </span>
        </div>
      </div>

      <div className="mt-6 grid gap-4 rounded-2xl border border-white/10 bg-white/70 p-4 text-black">
        <label className="grid gap-2">
          <span className="text-sm text-black/70">Quantity</span>
          <input
            className="rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-white/40"
            disabled={soldOut || isWritePending || isConfirming}
            max={maxQuantity}
            min={1}
            type="number"
            value={safeQuantity}
            onChange={(event) => handleQuantityChange(event.target.value)}
          />
        </label>

        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-black/70">Total price</span>
          <span className="font-mono text-sm">{formatEth(totalPrice)}</span>
        </div>

        <button
          className="cursor-pointer rounded-2xl bg-white px-5 py-3 text-center font-medium leading-snug whitespace-normal text-black hover:bg-(--oioi-accent) hover:text-white disabled:cursor-not-allowed disabled:bg-white disabled:text-black disabled:opacity-40"
          disabled={Boolean(disabledReason)}
          type="button"
          onClick={handleMint}>
          {disabledReason && !transactionInProgress
            ? disabledReason
            : `Mint ${config.symbol}`}
        </button>
      </div>

      {mintState.error ? (
        <ErrorMessageBlock
          message={mintState.error.message}
          title="Contract read failed"
        />
      ) : null}

      {eligibility.error ? (
        <ErrorMessageBlock
          message={eligibility.error.message}
          title="Eligibility check failed"
        />
      ) : null}

      {lastAction && isWritePending ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-yellow-300 p-4 text-sm text-black">
          Waiting for wallet signature...
        </div>
      ) : null}

      <TxStatus
        config={config}
        isConfirming={isConfirming}
        isSuccess={isSuccess}
        txHash={txHash}
      />

      {writeError || receiptError ? (
        <ErrorMessageBlock
          message={(writeError || receiptError)?.message ?? ""}
          title="Transaction failed"
        />
      ) : null}
    </article>
  );
}
