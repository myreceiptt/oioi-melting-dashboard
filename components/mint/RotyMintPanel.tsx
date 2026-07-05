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
        target="_blank"
      >
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
  const isRefreshing = mintState.isFetching || whitelistProof.isFetching;
  const transactionInProgress = isWritePending || isConfirming;

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

    if (transactionInProgress) {
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

    if (transactionInProgress) {
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

  function handleRefresh() {
    mintState.refetch();

    if (address) {
      void whitelistProof.refetch();
    }
  }

  return (
    <article className="min-w-0 rounded-3xl border border-white/10 bg-black p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-white/70">
            NFT Mint Form
          </p>
          <h2 className="mt-2 text-2xl font-semibold">{config.name}</h2>
          <p className="mt-2 text-sm text-white/70">
            The connected wallet is your identity. Use the same wallet to mint,
            stake, and claim.
          </p>
        </div>
        <div className="grid rounded-2xl border border-white/10 bg-black p-1">
          <button
            className="cursor-pointer rounded-xl px-4 py-2 text-sm hover:bg-(--oioi-accent) disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-black"
            disabled={isRefreshing}
            type="button"
            onClick={handleRefresh}
          >
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-white/70 px-4">
        <div className="flex items-center justify-between gap-4 border-b border-black/40 py-3 last:border-b-0">
          <div className="text-sm text-black/70">Whitelist mint enabled</div>
          <div className="text-right font-mono text-sm text-black">
            {mintState.whitelistMintEnabled ? "Yes" : "No"}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 border-b border-black/40 py-3 last:border-b-0">
          <div className="text-sm text-black/70">Public mint enabled</div>
          <div className="text-right font-mono text-sm text-black">
            {mintState.publicMintEnabled ? "Yes" : "No"}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 border-b border-black/40 py-3 last:border-b-0">
          <div className="text-sm text-black/70">Whitelist eligible</div>
          <div className="font-mono text-sm text-black">
            {whitelistProof.data?.eligible === undefined
              ? "—"
              : whitelistProof.data.eligible
                ? "Yes"
                : "No"}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 border-b border-black/40 py-3 last:border-b-0">
          <div className="text-sm text-black/70">Whitelist claimed</div>
          <div className="font-mono text-sm text-black">
            {mintState.whitelistClaimed === undefined
              ? "—"
              : mintState.whitelistClaimed
                ? "Yes"
                : "No"}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 border-b border-black/40 py-3 last:border-b-0">
          <div className="text-sm text-black/70">Remaining supply</div>
          <div className="font-mono text-sm text-black">
            {formatNumber(mintState.remainingSupply)}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 border-b border-black/40 py-3 last:border-b-0">
          <div className="text-sm text-black/70">Unit price</div>
          <div className="font-mono text-sm text-black">
            {formatEth(mintState.mintPrice)}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 rounded-2xl border border-white/10 bg-white/70 p-4 text-black">
        <h3 className="font-medium">Whitelist Mint</h3>
        <p className="text-sm text-black/70">
          Whitelist mint is free and can be claimed once per whitelisted wallet
          on each chain.
        </p>

        <button
          className="cursor-pointer rounded-2xl bg-white px-5 py-3 text-center font-medium leading-snug whitespace-normal text-black hover:bg-(--oioi-accent) hover:text-white disabled:cursor-not-allowed disabled:bg-white disabled:text-black disabled:opacity-40"
          disabled={Boolean(whitelistDisabledReason)}
          type="button"
          onClick={handleWhitelistMint}
        >
          {whitelistDisabledReason && !transactionInProgress
            ? whitelistDisabledReason
            : "Whitelist Mint"}
        </button>
      </div>

      <div className="mt-5 grid gap-4 rounded-2xl border border-white/10 bg-white/70 p-4 text-black">
        <h3 className="font-medium">Public Mint</h3>

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
          disabled={Boolean(publicDisabledReason)}
          type="button"
          onClick={handlePublicMint}
        >
          {publicDisabledReason && !transactionInProgress
            ? publicDisabledReason
            : "Public Mint"}
        </button>
      </div>

      {mintState.error ? (
        <ErrorMessageBlock
          message={mintState.error.message}
          title="Contract read failed"
        />
      ) : null}

      {whitelistProof.error ? (
        <ErrorMessageBlock
          message={whitelistProof.error.message}
          title="Whitelist proof lookup failed"
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
