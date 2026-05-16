"use client";

import { useMemo, useState } from "react";
import {
  useAccount,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import type { CollectionConfig } from "@/lib/contracts/collectionConfig";
import { rotyAbi } from "@/lib/contracts/abis";
import { useMintReadState } from "@/lib/hooks/useMintReadState";
import { useRotyWhitelistProof } from "@/lib/hooks/useRotyWhitelistProof";
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

export function RotyMintPanel({ config }: { config: CollectionConfig }) {
  const { address, isConnected } = useAccount();
  const mintState = useMintReadState(config);
  const whitelistProof = useRotyWhitelistProof(config.chainSet);
  const [quantity, setQuantity] = useState(1);
  const [lastAction, setLastAction] = useState<"whitelist" | "public" | null>(
    null,
  );

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
  const publicMintClosed = mintState.publicMintEnabled !== true;
  const whitelistMintClosed = mintState.whitelistMintEnabled !== true;
  const whitelistEligible = whitelistProof.data?.eligible === true;
  const whitelistAlreadyClaimed = mintState.whitelistClaimed === true;
  const hasMintPrice = mintState.mintPrice !== undefined;

  const publicDisabledReason = (() => {
    if (!isConnected || !address) {
      return "Connect wallet to mint.";
    }

    if (mintState.isLoading) {
      return "Loading contract state.";
    }

    if (mintState.error) {
      return "Contract read failed.";
    }

    if (soldOut) {
      return "Sold out.";
    }

    if (publicMintClosed) {
      return "Public mint is closed.";
    }

    if (!hasMintPrice || totalPrice === undefined) {
      return "Mint price unavailable.";
    }

    if (isWritePending || isConfirming) {
      return "Transaction in progress.";
    }

    return null;
  })();

  const whitelistDisabledReason = (() => {
    if (!isConnected || !address) {
      return "Connect wallet to mint.";
    }

    if (mintState.isLoading || whitelistProof.isLoading) {
      return "Loading whitelist status.";
    }

    if (mintState.error) {
      return "Contract read failed.";
    }

    if (whitelistProof.error) {
      return "Whitelist proof lookup failed.";
    }

    if (soldOut) {
      return "Sold out.";
    }

    if (whitelistMintClosed) {
      return "Whitelist mint is closed.";
    }

    if (!whitelistEligible) {
      return "This wallet is not whitelisted.";
    }

    if (whitelistAlreadyClaimed) {
      return "This wallet already claimed whitelist mint.";
    }

    if (isWritePending || isConfirming) {
      return "Transaction in progress.";
    }

    return null;
  })();

  function handleQuantityChange(value: string) {
    setQuantity(clampQuantity(Number(value), maxQuantity));
  }

  function handlePublicMint() {
    if (publicDisabledReason || totalPrice === undefined) {
      return;
    }

    setLastAction("public");

    writeContract({
      address: config.contractAddress,
      abi: rotyAbi,
      functionName: "publicMint",
      args: [BigInt(safeQuantity)],
      value: totalPrice,
    });
  }

  function handleWhitelistMint() {
    if (whitelistDisabledReason || !whitelistProof.data) {
      return;
    }

    setLastAction("whitelist");

    writeContract({
      address: config.contractAddress,
      abi: rotyAbi,
      functionName: "whitelistMint",
      args: [whitelistProof.data.proof],
    });
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div>
        <p className="text-sm uppercase tracking-[0.25em] text-white/50">
          ROTY Mint
        </p>
        <h2 className="mt-2 text-2xl font-semibold">{config.name}</h2>
        <p className="mt-2 text-sm text-white/60">
          The connected wallet is your identity. Use the same wallet to mint,
          stake, and claim.
        </p>
      </div>

      <div className="mt-6 grid gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-white/60">Whitelist mint enabled</span>
          <span className="font-mono text-sm">
            {mintState.whitelistMintEnabled ? "Yes" : "No"}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-white/60">Public mint enabled</span>
          <span className="font-mono text-sm">
            {mintState.publicMintEnabled ? "Yes" : "No"}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-white/60">Whitelist eligible</span>
          <span className="font-mono text-sm">
            {whitelistProof.data?.eligible === undefined
              ? "—"
              : whitelistProof.data.eligible
                ? "Yes"
                : "No"}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-white/60">Whitelist claimed</span>
          <span className="font-mono text-sm">
            {mintState.whitelistClaimed === undefined
              ? "—"
              : mintState.whitelistClaimed
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
          <span className="text-sm text-white/60">Unit price</span>
          <span className="font-mono text-sm">
            {formatEth(mintState.mintPrice)}
          </span>
        </div>
      </div>

      <div className="mt-6 grid gap-4 rounded-2xl border border-white/10 bg-black/20 p-4">
        <h3 className="font-medium">Whitelist Mint</h3>
        <p className="text-sm text-white/60">
          Whitelist mint is free and can be claimed once per whitelisted wallet
          on each chain.
        </p>

        <button
          className="rounded-2xl bg-white px-5 py-3 font-medium text-black hover:bg-white/80 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={Boolean(whitelistDisabledReason)}
          type="button"
          onClick={handleWhitelistMint}>
          {isWritePending && lastAction === "whitelist"
            ? "Confirm in wallet..."
            : isConfirming && lastAction === "whitelist"
              ? "Waiting for confirmation..."
              : "Whitelist Mint"}
        </button>

        {whitelistDisabledReason ? (
          <p className="text-sm text-white/50">{whitelistDisabledReason}</p>
        ) : null}
      </div>

      <div className="mt-6 grid gap-4 rounded-2xl border border-white/10 bg-black/20 p-4">
        <h3 className="font-medium">Public Mint</h3>

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
          disabled={Boolean(publicDisabledReason)}
          type="button"
          onClick={handlePublicMint}>
          {isWritePending && lastAction === "public"
            ? "Confirm in wallet..."
            : isConfirming && lastAction === "public"
              ? "Waiting for confirmation..."
              : "Public Mint"}
        </button>

        {publicDisabledReason ? (
          <p className="text-sm text-white/50">{publicDisabledReason}</p>
        ) : null}
      </div>

      {txHash ? (
        <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="text-sm text-white/60">Transaction</div>
          <a
            className="mt-1 block break-all font-mono text-sm text-white underline underline-offset-4"
            href={getTxUrl(config.chainSet, txHash)}
            rel="noreferrer"
            target="_blank">
            {txHash}
          </a>
        </div>
      ) : null}

      {isSuccess ? (
        <div className="mt-6 rounded-2xl border border-green-500/30 bg-green-500/10 p-4 text-green-100">
          {lastAction === "whitelist"
            ? "Whitelist mint transaction confirmed."
            : "Public mint transaction confirmed."}
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
