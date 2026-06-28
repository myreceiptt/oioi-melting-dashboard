"use client";

import { useEffect, useMemo, useState } from "react";
import {
  useAccount,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import type { ChainSet } from "@/lib/chains/chainConfig";
import { stakingAbi } from "@/lib/contracts/abis";
import type { CollectionConfig } from "@/lib/contracts/collectionConfig";
import type { CollectionKey } from "@/lib/contracts/collectionConfig";
import { getChainCollections } from "@/lib/contracts/collectionConfig";
import { getTxUrl } from "@/lib/services/explorer";
import { formatBool, shortAddress } from "@/lib/utils/format";
import type { DashboardWalletNft } from "@/lib/dashboard/walletNfts";
import { ResponsiveHash } from "@/components/app/ResponsiveHash";

type DashboardNftResponse = {
  ok: boolean;
  error?: string;
  cacheStatus?: "hit" | "refresh";
  cacheTtlSeconds?: number;
  fetchedAt?: string;
  nfts?: DashboardWalletNft[];
};

type LastAction = {
  action: "stake" | "unstake";
  tokenId: string;
  collectionName: string;
} | null;

type StatusTone = "neutral" | "green" | "yellow" | "blue" | "red";

const STATUS_TONE_CLASSES: Record<StatusTone, string> = {
  neutral: "border-white/10 bg-white text-black",
  green: "border-white/10 bg-[#b7f56d] text-black",
  yellow: "border-white/10 bg-yellow-300 text-black",
  blue: "border-white/10 bg-white text-black",
  red: "border-white/10 bg-[#ff9b4a] text-black",
};

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

function StatusPill({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: StatusTone;
}) {
  const className = STATUS_TONE_CLASSES[tone];

  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid min-w-0 gap-2 border-b border-black/40 py-3 last:border-b-0 sm:grid-cols-[180px_1fr]">
      <div className="text-sm text-black/70">{label}</div>
      <div className="min-w-0 break-all text-left font-mono text-sm text-black sm:text-right wrap-anywhere">
        {value}
      </div>
    </div>
  );
}

function getNftStatus(nft: DashboardWalletNft) {
  if (nft.stakeActive && nft.stakeValid) {
    return { label: "Staked", tone: "yellow" as const };
  }

  if (nft.stakeActive && !nft.stakeValid) {
    return { label: "Can Unstake", tone: "green" as const };
  }

  if (nft.walletOwnsToken) {
    return { label: "Owned", tone: "neutral" as const };
  }

  return { label: "History", tone: "red" as const };
}

function getNextStepTone({
  selectedNft,
  isConnected,
  isWritePending,
  isConfirming,
}: {
  selectedNft: DashboardWalletNft | null;
  isConnected: boolean;
  isWritePending: boolean;
  isConfirming: boolean;
}): StatusTone {
  if (isWritePending || isConfirming) {
    return "yellow";
  }

  if (!isConnected || !selectedNft) {
    return "neutral";
  }

  if (selectedNft.stakeActive && selectedNft.stakeValid) {
    return "neutral";
  }

  if (selectedNft.stakeActive && !selectedNft.stakeValid) {
    return "red";
  }

  if (selectedNft.walletOwnsToken) {
    return "yellow";
  }

  return "neutral";
}

function getActionState({
  selectedNft,
  isConnected,
  isWritePending,
  isConfirming,
}: {
  selectedNft: DashboardWalletNft | null;
  isConnected: boolean;
  isWritePending: boolean;
  isConfirming: boolean;
}) {
  if (!isConnected) {
    return {
      action: null,
      message: "Connect wallet to stake or unstake NFT.",
      disabled: true,
    } as const;
  }

  if (!selectedNft) {
    return {
      action: null,
      message: "Select an NFT first.",
      disabled: true,
    } as const;
  }

  if (isWritePending || isConfirming) {
    return {
      action: null,
      message: "Transaction in progress.",
      disabled: true,
    } as const;
  }

  if (selectedNft.canUnstake) {
    return {
      action: "unstake",
      message: selectedNft.stakeValid
        ? "This NFT is actively staked. You can unstake it."
        : "This wallet has an active stake record but no longer owns the NFT. You can clear it by unstaking.",
      disabled: false,
    } as const;
  }

  if (selectedNft.canStake) {
    return {
      action: "stake",
      message: "This wallet owns the NFT and can stake it.",
      disabled: false,
    } as const;
  }

  if (!selectedNft.collectionApproved) {
    return {
      action: null,
      message: "This collection is not approved in the staking registry.",
      disabled: true,
    } as const;
  }

  if (!selectedNft.walletOwnsToken) {
    return {
      action: null,
      message: "This wallet does not currently own this NFT.",
      disabled: true,
    } as const;
  }

  return {
    action: null,
    message: "No write action is currently available for this NFT.",
    disabled: true,
  } as const;
}

function NftThumbnail({
  nft,
  className = "",
}: {
  nft: DashboardWalletNft;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt={nft.metadata.name}
      className={`h-full w-full object-cover ${className}`}
      src={nft.media.thumbnailUrl || nft.media.imageUrl}
    />
  );
}

function NftAsset({
  nft,
  className = "",
}: {
  nft: DashboardWalletNft;
  className?: string;
}) {
  if (nft.media.assetType === "html") {
    return (
      <iframe
        className={`h-full w-full border-0 bg-white ${className}`}
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        src={nft.media.assetUrl}
        title={nft.metadata.name}
      />
    );
  }

  if (nft.media.assetType === "video") {
    return (
      <video
        className={`h-full w-full object-cover ${className}`}
        controls
        muted
        playsInline
        poster={nft.media.thumbnailUrl}
        src={nft.media.assetUrl}
      />
    );
  }

  if (nft.media.assetType === "audio") {
    return (
      <div
        className={`flex h-full w-full items-center justify-center bg-black/40 p-4 ${className}`}>
        <audio className="w-full" controls src={nft.media.assetUrl} />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt={nft.metadata.name}
      className={`h-full w-full object-cover ${className}`}
      src={nft.media.assetUrl}
    />
  );
}

function NftModal({
  nft,
  onClose,
}: {
  nft: DashboardWalletNft;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-3xl border border-white/10 bg-black p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-white/40">
              {nft.collectionName}
            </p>
            <h3 className="mt-2 text-2xl font-semibold">{nft.metadata.name}</h3>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black p-1">
            <button
              className="cursor-pointer rounded-xl px-4 py-2 text-sm hover:bg-(--oioi-accent)"
              type="button"
              onClick={onClose}>
              Close
            </button>
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-black/30">
          <div className="aspect-square">
            <NftAsset nft={nft} />
          </div>
        </div>

        {nft.metadata.description ? (
          <p className="mt-4 text-sm text-white/60">
            {nft.metadata.description}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function TxStatus({
  chainSet,
  txHash,
  isConfirming,
  isSuccess,
}: {
  chainSet: ChainSet;
  txHash: `0x${string}` | undefined;
  isConfirming: boolean;
  isSuccess: boolean;
}) {
  if (!txHash) {
    return null;
  }

  return (
    <div className="mt-4 min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-yellow-300 p-4 text-black">
      <h3 className="font-medium">Transaction status</h3>
      <a
        className="mt-2 block break-all font-mono text-sm text-black/70 underline underline-offset-4"
        href={getTxUrl(chainSet, txHash)}
        rel="noreferrer"
        target="_blank">
        <ResponsiveHash value={txHash} />
      </a>
      <p className="mt-2 text-sm text-black/70">
        {isConfirming
          ? "Waiting for confirmation..."
          : isSuccess
            ? "Mined successfully. Dashboard NFT data will refresh."
            : "Submitted to wallet."}
      </p>
    </div>
  );
}

function CollectionStakeCard({
  config,
  nfts,
  loading,
  refreshError,
  onRefresh,
}: {
  config: CollectionConfig;
  nfts: DashboardWalletNft[];
  loading: boolean;
  refreshError: string | null;
  onRefresh: (force?: boolean) => Promise<void>;
}) {
  const { isConnected } = useAccount();
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const [modalNft, setModalNft] = useState<DashboardWalletNft | null>(null);
  const [manualTokenIdInput, setManualTokenIdInput] = useState("1");
  const [lastAction, setLastAction] = useState<LastAction>(null);

  const selectedNft = useMemo(() => {
    if (nfts.length === 0) {
      return null;
    }

    const selected = nfts.find((nft) => nft.tokenId === selectedTokenId);
    return selected ?? nfts[0] ?? null;
  }, [nfts, selectedTokenId]);

  useEffect(() => {
    if (!selectedNft) {
      setSelectedTokenId(null);
      return;
    }

    if (
      !selectedTokenId ||
      !nfts.some((nft) => nft.tokenId === selectedTokenId)
    ) {
      setSelectedTokenId(selectedNft.tokenId);
    }
  }, [nfts, selectedNft, selectedTokenId]);

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

    void onRefresh(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess]);

  const actionState = getActionState({
    selectedNft,
    isConnected,
    isWritePending,
    isConfirming,
  });
  const selectedActionLabel = selectedNft?.canUnstake
    ? "Unstake Selected NFT"
    : selectedNft?.canStake
      ? "Stake Selected NFT"
      : "No write action is currently available for this selection.";
  const nextStepTone = getNextStepTone({
    selectedNft,
    isConnected,
    isWritePending,
    isConfirming,
  });

  function handleAction() {
    if (!selectedNft || actionState.disabled || !actionState.action) {
      return;
    }

    const tokenId = BigInt(selectedNft.tokenId);
    setLastAction({
      action: actionState.action,
      tokenId: selectedNft.tokenId,
      collectionName: selectedNft.collectionName,
    });

    writeContract({
      address: config.stakingAddress,
      abi: stakingAbi,
      functionName: actionState.action,
      args: [config.contractAddress, tokenId],
    });
  }

  const manualTokenId = parseTokenId(manualTokenIdInput);

  function handleManualStake() {
    if (!manualTokenId) {
      return;
    }

    setLastAction({
      action: "stake",
      tokenId: manualTokenId.toString(),
      collectionName: config.name,
    });

    writeContract({
      address: config.stakingAddress,
      abi: stakingAbi,
      functionName: "stake",
      args: [config.contractAddress, manualTokenId],
    });
  }

  function handleManualUnstake() {
    if (!manualTokenId) {
      return;
    }

    setLastAction({
      action: "unstake",
      tokenId: manualTokenId.toString(),
      collectionName: config.name,
    });

    writeContract({
      address: config.stakingAddress,
      abi: stakingAbi,
      functionName: "unstake",
      args: [config.contractAddress, manualTokenId],
    });
  }

  return (
    <article className="min-w-0 rounded-3xl border border-white/10 bg-black p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-white/70">
            Symbol: {config.symbol}
          </p>
          <h2 className="mt-2 text-2xl font-semibold">{config.name}</h2>
          <p className="mt-2 text-sm text-white/70">
            Contract Address:{" "}
            <span className="break-all font-mono text-sm text-white/70">
              <ResponsiveHash value={config.contractAddress} />
            </span>
          </p>
        </div>

        <div className="grid rounded-2xl border border-white/10 bg-black p-1">
          <button
            className="cursor-pointer rounded-xl px-4 py-2 text-sm hover:bg-(--oioi-accent) disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-black"
            disabled={loading}
            type="button"
            onClick={() => void onRefresh(true)}>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="mt-5">
        {loading && nfts.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/70 px-5 py-4 text-sm text-black/70">
            Loading wallet NFTs...
          </div>
        ) : null}

        {!loading && nfts.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/70 px-5 py-4 text-sm text-black/70">
            No owned or staked NFT found for this collection.
          </div>
        ) : null}

        {nfts.length > 0 ? (
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
            {nfts.map((nft) => {
              const status = getNftStatus(nft);
              const selected = selectedNft?.tokenId === nft.tokenId;

              return (
                <div
                  className={`overflow-hidden rounded-2xl border text-left transition hover:bg-(--oioi-accent) hover:border-(--oioi-accent) hover:text-white ${
                    selected
                      ? "border-(--oioi-accent) bg-(--oioi-accent) text-white"
                      : "border-white/10 bg-white/70 text-black"
                  }`}
                  key={`${nft.collectionKey}-${nft.tokenId}`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter" && event.key !== " ") {
                      return;
                    }

                    event.preventDefault();
                    setSelectedTokenId(nft.tokenId);
                  }}
                  onClick={() => setSelectedTokenId(nft.tokenId)}>
                  <div
                    className="aspect-square overflow-hidden bg-black/40"
                    onDoubleClick={() => setModalNft(nft)}>
                    <NftThumbnail nft={nft} />
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="truncate font-medium">
                        {nft.metadata.name}
                      </div>
                      <StatusPill label={status.label} tone={status.tone} />
                    </div>
                    <div className="mt-2 font-mono text-sm">
                      Token #{nft.tokenId}
                    </div>
                    <button
                      className="mt-3 cursor-pointer rounded-xl bg-white px-3 py-2 text-xs text-black hover:bg-black hover:text-white"
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setModalNft(nft);
                      }}>
                      View asset
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>

      {selectedNft ? (
        <div className="mt-5 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/70 p-4 text-black">
            <div className="text-xs uppercase tracking-[0.2em] text-black/70">
              Token ID
            </div>
            <div className="mt-2 font-mono text-lg">{selectedNft.tokenId}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/70 p-4 text-black">
            <div className="text-xs uppercase tracking-[0.2em] text-black/70">
              Owner
            </div>
            <div className="mt-2 font-mono text-lg">
              {shortAddress(selectedNft.ownerAddress ?? undefined)}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/70 p-4 text-black">
            <div className="text-xs uppercase tracking-[0.2em] text-black/70">
              Stake Active
            </div>
            <div className="mt-2 font-mono text-lg">
              {formatBool(selectedNft.stakeActive)}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/70 p-4 text-black">
            <div className="text-xs uppercase tracking-[0.2em] text-black/70">
              Stake Valid
            </div>
            <div className="mt-2 font-mono text-lg">
              {formatBool(selectedNft.stakeValid)}
            </div>
          </div>
        </div>
      ) : null}

      <div
        className={`mt-5 rounded-2xl p-4 ${STATUS_TONE_CLASSES[nextStepTone]}`}>
        <h3 className="font-medium">Next step</h3>
        <p className="mt-2 text-sm text-black/70">{actionState.message}</p>
      </div>

      <button
        className="mt-4 w-full cursor-pointer rounded-2xl bg-white px-5 py-4 font-medium text-black hover:bg-(--oioi-accent) hover:text-white disabled:cursor-not-allowed disabled:bg-white disabled:text-black disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-black"
        disabled={actionState.disabled}
        type="button"
        onClick={handleAction}>
        {selectedActionLabel}
      </button>

      {lastAction ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/70 p-4 text-black">
          <h3 className="font-medium">Last requested action</h3>
          <p className="mt-2 text-sm text-black/70">
            {lastAction.action === "stake" ? "Stake NFT" : "Unstake NFT"}
          </p>
          <p className="mt-1 text-sm text-black/70">
            Requested value: {lastAction.collectionName} #{lastAction.tokenId}
          </p>
        </div>
      ) : null}

      {lastAction && isWritePending ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-yellow-300 p-4 text-sm text-black">
          Waiting for wallet signature...
        </div>
      ) : null}

      <TxStatus
        chainSet={config.chainSet}
        isConfirming={isConfirming}
        isSuccess={isSuccess}
        txHash={txHash}
      />

      {writeError || receiptError ? (
        <div className="mt-4 min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-[#ff9b4a] p-4 text-black">
          <h3 className="font-medium">Transaction failed</h3>
          <p className="mt-2 max-w-full break-all whitespace-pre-wrap text-sm text-black/70">
            {(writeError || receiptError)?.message}
          </p>
        </div>
      ) : null}

      {refreshError ? (
        <div className="mt-4 min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-[#ff9b4a] p-4 text-black">
          <h3 className="font-medium">NFT refresh failed</h3>
          <p className="mt-2 max-w-full break-all whitespace-pre-wrap text-sm text-black/70">
            {refreshError}
          </p>
        </div>
      ) : null}

      <details className="mt-5 rounded-2xl border border-white/10 bg-white/70 p-4 text-black">
        <summary className="cursor-pointer font-medium">
          Advanced Diagnostics
        </summary>
        <p className="mt-3 text-sm text-black/70">
          Use this only when NFT discovery is unavailable or a chain read looks
          wrong.
        </p>

        <div className="mt-4 rounded-2xl border border-black/40 bg-white px-4">
          <Row
            label="Collection approved"
            value={formatBool(selectedNft?.collectionApproved ?? undefined)}
          />
          <Row
            label="Wallet owns selected NFT"
            value={formatBool(selectedNft?.walletOwnsToken)}
          />
          <Row
            label="Stake record exists"
            value={formatBool(selectedNft?.stakeExists)}
          />
          <Row label="Can stake" value={formatBool(selectedNft?.canStake)} />
          <Row
            label="Can unstake"
            value={formatBool(selectedNft?.canUnstake)}
          />
          <Row
            label="Source"
            value={selectedNft ? JSON.stringify(selectedNft.source) : "None"}
          />
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_auto]">
          <input
            className="rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-white/40"
            inputMode="numeric"
            min={1}
            type="number"
            value={manualTokenIdInput}
            onChange={(event) => setManualTokenIdInput(event.target.value)}
          />
          <button
            className="cursor-pointer rounded-2xl bg-white px-5 py-3 text-sm text-black hover:bg-(--oioi-accent) hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-black"
            disabled={!manualTokenId || isWritePending || isConfirming}
            type="button"
            onClick={handleManualStake}>
            Manual Stake
          </button>
          <button
            className="cursor-pointer rounded-2xl bg-white px-5 py-3 text-sm text-black hover:bg-(--oioi-accent) hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-black"
            disabled={!manualTokenId || isWritePending || isConfirming}
            type="button"
            onClick={handleManualUnstake}>
            Manual Unstake
          </button>
        </div>
      </details>

      {modalNft ? (
        <NftModal nft={modalNft} onClose={() => setModalNft(null)} />
      ) : null}
    </article>
  );
}

export function StakeActionPanel({
  chainSet,
  collectionKey,
}: {
  chainSet: ChainSet;
  collectionKey?: CollectionKey;
}) {
  const { address, isConnected } = useAccount();
  const collections = getChainCollections(chainSet).filter((collection) =>
    collectionKey ? collection.collectionKey === collectionKey : true,
  );
  const [nfts, setNfts] = useState<DashboardWalletNft[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cacheStatus, setCacheStatus] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);

  async function refreshNfts(force = false) {
    if (!address) {
      setNfts([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        chain: chainSet,
        account: address,
      });

      if (force) {
        params.set("refresh", "1");
      }

      const response = await fetch(
        `/api/dashboard/wallet-nfts?${params.toString()}`,
        {
          cache: "no-store",
        },
      );
      const data = (await response.json()) as DashboardNftResponse;

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Failed to load dashboard NFTs.");
      }

      setNfts(data.nfts ?? []);
      setCacheStatus(data.cacheStatus ?? null);
      setFetchedAt(data.fetchedAt ?? null);
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Unexpected dashboard NFT refresh error.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refreshNfts(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, chainSet]);

  const nftsByCollection = useMemo(() => {
    const grouped = new Map<string, DashboardWalletNft[]>();

    for (const nft of nfts) {
      const existing = grouped.get(nft.collectionKey) ?? [];
      existing.push(nft);
      grouped.set(nft.collectionKey, existing);
    }

    return grouped;
  }, [nfts]);

  return (
    <section className="grid gap-5 scroll-mt-30" id="soft-staking">
      <section className="rounded-3xl border border-white/10 bg-black p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-white/70">
              Soft Staking
            </p>
            <h2 className="mt-2 text-2xl font-semibold">Stake / Unstake NFT</h2>
            <p className="mt-2 max-w-3xl text-sm text-white/70">
              Select an owned or previously staked NFT. The list is refreshed
              from Alchemy, checked against on-chain staking state, and cached
              for a short period.
            </p>
          </div>
        </div>

        {!isConnected ? (
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/70 p-4 text-sm text-black/70">
            Connect wallet to discover owned and staked NFTs.
          </div>
        ) : null}

        {isConnected ? (
          <div className="mt-5 flex flex-wrap gap-2 text-sm">
            <StatusPill label={`Cache: ${cacheStatus ?? "none"}`} />
            <StatusPill label={`NFTs: ${nfts.length}`} tone="blue" />
            {fetchedAt ? <StatusPill label={`Fetched: ${fetchedAt}`} /> : null}
          </div>
        ) : null}
      </section>

      {collections.map((collection) => (
        <CollectionStakeCard
          config={collection}
          key={collection.contractAddress}
          loading={loading}
          nfts={nftsByCollection.get(collection.collectionKey) ?? []}
          refreshError={error}
          onRefresh={refreshNfts}
        />
      ))}
    </section>
  );
}
