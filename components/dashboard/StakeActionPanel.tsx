"use client";

import { useEffect, useMemo, useState } from "react";
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import type { ChainSet } from "@/lib/chains/chainConfig";
import { erc721SharedAbi, stakingAbi } from "@/lib/contracts/abis";
import type { CollectionConfig } from "@/lib/contracts/collectionConfig";
import { getChainCollections } from "@/lib/contracts/collectionConfig";
import { getTxUrl } from "@/lib/services/explorer";
import { sameAddress } from "@/lib/utils/address";
import { formatBool, shortAddress } from "@/lib/utils/format";

function parseTokenId(value: string) {
  const trimmed = value.trim();

  if (!/^\d+$/.test(trimmed)) {
    return undefined;
  }

  const parsed = BigInt(trimmed);

  if (parsed <= 0n) {
    return undefined;
  }

  return parsed;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/10 py-3 last:border-b-0">
      <div className="text-sm text-white/60">{label}</div>
      <div className="text-right font-mono text-sm">{value}</div>
    </div>
  );
}

function CollectionStakeCard({ config }: { config: CollectionConfig }) {
  const { address, isConnected } = useAccount();
  const [tokenIdInput, setTokenIdInput] = useState("1");
  const [lastAction, setLastAction] = useState<"stake" | "unstake" | null>(
    null,
  );

  const tokenId = useMemo(() => parseTokenId(tokenIdInput), [tokenIdInput]);
  const hasValidTokenId = tokenId !== undefined;

  const ownerOf = useReadContract({
    address: config.contractAddress,
    abi: erc721SharedAbi,
    functionName: "ownerOf",
    args: tokenId ? [tokenId] : undefined,
    query: {
      enabled: hasValidTokenId,
      retry: false,
    },
  });

  const isStakeActive = useReadContract({
    address: config.stakingAddress,
    abi: stakingAbi,
    functionName: "isStakeActive",
    args:
      address && tokenId
        ? [address, config.contractAddress, tokenId]
        : undefined,
    query: {
      enabled: Boolean(address && tokenId),
    },
  });

  const isStakeValid = useReadContract({
    address: config.stakingAddress,
    abi: stakingAbi,
    functionName: "isStakeValid",
    args:
      address && tokenId
        ? [address, config.contractAddress, tokenId]
        : undefined,
    query: {
      enabled: Boolean(address && tokenId),
    },
  });

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

  useEffect(() => {
    if (!isSuccess) {
      return;
    }

    void ownerOf.refetch();
    void isStakeActive.refetch();
    void isStakeValid.refetch();
  }, [isSuccess, ownerOf, isStakeActive, isStakeValid]);

  const ownerAddress = ownerOf.data as string | undefined;
  const active = isStakeActive.data as boolean | undefined;
  const valid = isStakeValid.data as boolean | undefined;

  const connectedWalletOwnsToken =
    Boolean(address && ownerAddress) &&
    sameAddress(address as string, ownerAddress as string);

  const stakeDisabledReason = (() => {
    if (!isConnected || !address) {
      return "Connect wallet first.";
    }

    if (!hasValidTokenId) {
      return "Enter a valid tokenId.";
    }

    if (ownerOf.isLoading) {
      return "Checking token owner.";
    }

    if (ownerOf.error) {
      return "Token does not exist or owner read failed.";
    }

    if (!connectedWalletOwnsToken) {
      return "This wallet does not own this NFT.";
    }

    if (active) {
      return "This NFT is already actively staked by this wallet.";
    }

    if (isWritePending || isConfirming) {
      return "Transaction in progress.";
    }

    return null;
  })();

  const unstakeDisabledReason = (() => {
    if (!isConnected || !address) {
      return "Connect wallet first.";
    }

    if (!hasValidTokenId) {
      return "Enter a valid tokenId.";
    }

    if (isStakeActive.isLoading) {
      return "Checking stake status.";
    }

    if (!active) {
      return "This NFT does not have an active stake from this wallet.";
    }

    if (isWritePending || isConfirming) {
      return "Transaction in progress.";
    }

    return null;
  })();

  function handleStake() {
    if (stakeDisabledReason || !tokenId) {
      return;
    }

    setLastAction("stake");

    writeContract({
      address: config.stakingAddress,
      abi: stakingAbi,
      functionName: "stake",
      args: [config.contractAddress, tokenId],
    });
  }

  function handleUnstake() {
    if (unstakeDisabledReason || !tokenId) {
      return;
    }

    setLastAction("unstake");

    writeContract({
      address: config.stakingAddress,
      abi: stakingAbi,
      functionName: "unstake",
      args: [config.contractAddress, tokenId],
    });
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
      <div>
        <div className="text-lg font-semibold">{config.name}</div>
        <div className="mt-1 text-sm text-white/60">{config.symbol}</div>
        <div className="mt-2 break-all font-mono text-xs text-white/40">
          {config.contractAddress}
        </div>
      </div>

      <label className="mt-5 grid gap-2">
        <span className="text-sm text-white/60">Token ID</span>
        <input
          className="rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-white/40"
          inputMode="numeric"
          min={1}
          type="number"
          value={tokenIdInput}
          onChange={(event) => setTokenIdInput(event.target.value)}
        />
      </label>

      <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 px-4">
        <Row label="Owner" value={shortAddress(ownerAddress)} />
        <Row
          label="Connected wallet owns token"
          value={formatBool(connectedWalletOwnsToken)}
        />
        <Row label="Stake active" value={formatBool(active)} />
        <Row label="Stake valid" value={formatBool(valid)} />
      </div>

      {ownerOf.error ? (
        <div className="mt-4 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-100">
          Could not read ownerOf for this tokenId. The token may not exist yet.
        </div>
      ) : null}

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <button
          className="rounded-2xl bg-white px-5 py-3 font-medium text-black hover:bg-white/80 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={Boolean(stakeDisabledReason)}
          type="button"
          onClick={handleStake}>
          {isWritePending && lastAction === "stake"
            ? "Confirm stake..."
            : isConfirming && lastAction === "stake"
              ? "Staking..."
              : "Stake"}
        </button>

        <button
          className="rounded-2xl border border-white/10 px-5 py-3 font-medium hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={Boolean(unstakeDisabledReason)}
          type="button"
          onClick={handleUnstake}>
          {isWritePending && lastAction === "unstake"
            ? "Confirm unstake..."
            : isConfirming && lastAction === "unstake"
              ? "Unstaking..."
              : "Unstake"}
        </button>
      </div>

      {stakeDisabledReason ? (
        <p className="mt-3 text-sm text-white/50">
          Stake: {stakeDisabledReason}
        </p>
      ) : null}

      {unstakeDisabledReason ? (
        <p className="mt-2 text-sm text-white/50">
          Unstake: {unstakeDisabledReason}
        </p>
      ) : null}

      {txHash ? (
        <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-sm text-white/60">Transaction</div>
          <a
            className="mt-1 block break-all font-mono text-sm underline underline-offset-4"
            href={getTxUrl(config.chainSet, txHash)}
            rel="noreferrer"
            target="_blank">
            {txHash}
          </a>
        </div>
      ) : null}

      {isSuccess ? (
        <div className="mt-5 rounded-2xl border border-green-500/30 bg-green-500/10 p-4 text-green-100">
          {lastAction === "unstake" ? "Unstake confirmed." : "Stake confirmed."}
        </div>
      ) : null}

      {writeError || receiptError ? (
        <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
          <h3 className="font-medium text-red-100">Transaction failed</h3>
          <p className="mt-2 wrap-break-word text-sm text-red-100/80">
            {(writeError || receiptError)?.message}
          </p>
        </div>
      ) : null}
    </div>
  );
}

export function StakeActionPanel({ chainSet }: { chainSet: ChainSet }) {
  const collections = getChainCollections(chainSet);

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div>
        <p className="text-sm uppercase tracking-[0.25em] text-white/50">
          Soft Staking
        </p>
        <h2 className="mt-2 text-2xl font-semibold">Stake / Unstake NFT</h2>
        <p className="mt-2 text-sm text-white/60">
          Enter a tokenId manually. Owned NFT discovery will be added later with
          the indexer. Your NFT stays in your wallet; soft staking records your
          staking intent.
        </p>
      </div>

      <div className="mt-6 grid gap-4">
        {collections.map((collection) => (
          <CollectionStakeCard
            config={collection}
            key={collection.contractAddress}
          />
        ))}
      </div>
    </section>
  );
}
