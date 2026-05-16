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

export function GatedMintPanel({ config }: { config: CollectionConfig }) {
  const { address, isConnected } = useAccount();
  const mintState = useMintReadState(config);
  const eligibility = useGatedEligibility(config);
  const [quantity, setQuantity] = useState(1);

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

    if (isWritePending || isConfirming) {
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

    writeContract({
      address: config.contractAddress,
      abi: gatedMintAbi,
      functionName: "mint",
      args: [BigInt(safeQuantity)],
      value: totalPrice,
    });
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div>
        <p className="text-sm uppercase tracking-[0.25em] text-white/50">
          Staking-Gated Mint
        </p>
        <h2 className="mt-2 text-2xl font-semibold">{config.name}</h2>
        <p className="mt-2 text-sm text-white/60">
          {getEligibilityLabel(config)}
        </p>
      </div>

      <div className="mt-6 grid gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-white/60">Gated mint enabled</span>
          <span className="font-mono text-sm">
            {mintState.gatedMintEnabled ? "Yes" : "No"}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-white/60">This wallet eligible</span>
          <span className="font-mono text-sm">
            {eligibility.eligible === undefined
              ? "—"
              : eligibility.eligible
                ? "Yes"
                : "No"}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-white/60">Remaining supply</span>
          <span className="font-mono text-sm">
            {formatNumber(mintState.remainingSupply)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-white/60">Max mint per tx</span>
          <span className="font-mono text-sm">
            {formatNumber(mintState.maxMintPerTx)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-white/60">Unit price</span>
          <span className="font-mono text-sm">
            {formatEth(mintState.mintPrice)}
          </span>
        </div>
      </div>

      <div className="mt-6 grid gap-4 rounded-2xl border border-white/10 bg-black/20 p-4">
        <label className="grid gap-2">
          <span className="text-sm text-white/60">Quantity</span>
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
          <span className="text-sm text-white/60">Total price</span>
          <span className="font-mono text-sm">{formatEth(totalPrice)}</span>
        </div>

        <button
          className="rounded-2xl bg-white px-5 py-3 font-medium text-black hover:bg-white/80 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={Boolean(disabledReason)}
          type="button"
          onClick={handleMint}
        >
          {isWritePending
            ? "Confirm in wallet..."
            : isConfirming
              ? "Waiting for confirmation..."
              : `Mint ${config.symbol}`}
        </button>

        {disabledReason ? (
          <p className="text-sm text-white/50">{disabledReason}</p>
        ) : null}
      </div>

      {txHash ? (
        <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="text-sm text-white/60">Transaction</div>
          <a
            className="mt-1 block break-all font-mono text-sm text-white underline underline-offset-4"
            href={getTxUrl(config.chainSet, txHash)}
            rel="noreferrer"
            target="_blank"
          >
            {txHash}
          </a>
        </div>
      ) : null}

      {isSuccess ? (
        <div className="mt-6 rounded-2xl border border-green-500/30 bg-green-500/10 p-4 text-green-100">
          Gated mint transaction confirmed.
        </div>
      ) : null}

      {writeError || receiptError ? (
        <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
          <h3 className="font-medium text-red-100">Transaction failed</h3>
          <p className="mt-2 break-words text-sm text-red-100/80">
            {(writeError || receiptError)?.message}
          </p>
        </div>
      ) : null}
    </section>
  );
}
