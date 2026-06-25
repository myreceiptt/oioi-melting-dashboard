"use client";

import { useAccount, useReadContract } from "wagmi";
import type { ChainSet } from "@/lib/chains/chainConfig";
import { getChainCollections } from "@/lib/contracts/collectionConfig";
import { stakingAbi } from "@/lib/contracts/abis";
import { formatBool } from "@/lib/utils/format";
import { ResponsiveHash } from "@/components/app/ResponsiveHash";

function StatusPill({ value }: { value: boolean | undefined }) {
  return (
    <span className="text-right font-mono text-sm text-black">
      {formatBool(value)}
    </span>
  );
}

function CollectionStakeSummary({
  collectionName,
  collectionAddress,
  stakingAddress,
  chainId,
  walletAddress,
}: {
  collectionName: string;
  collectionAddress: `0x${string}`;
  stakingAddress: `0x${string}`;
  chainId: number;
  walletAddress: `0x${string}` | undefined;
}) {
  const approved = useReadContract({
    address: stakingAddress,
    abi: stakingAbi,
    functionName: "approvedCollection",
    args: [collectionAddress],
    chainId,
  });

  const hasValidStake = useReadContract({
    address: stakingAddress,
    abi: stakingAbi,
    functionName: "hasValidStake",
    args: walletAddress ? [walletAddress, collectionAddress] : undefined,
    chainId,
    query: {
      enabled: Boolean(walletAddress),
    },
  });

  return (
    <div className="mt-5 rounded-2xl border border-white/10 bg-white/70 px-4">
      <div className="flex items-center justify-between gap-4 border-b border-black/40 py-3">
        <div className="font-medium text-black">{collectionName}</div>
        <button
          className="cursor-pointer rounded-xl px-4 py-2 text-sm bg-white text-black hover:bg-(--oioi-accent) hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:text-black disabled:hover:bg-white"
          disabled={approved.isFetching || hasValidStake.isFetching}
          onClick={() => {
            void approved.refetch();
            void hasValidStake.refetch();
          }}
          type="button">
          {approved.isFetching || hasValidStake.isFetching
            ? "Refreshing..."
            : "Refresh"}
        </button>
      </div>
      <div className="flex items-center justify-between gap-4 border-b border-black/40 py-3">
        <div className="break-all font-mono text-sm text-black/70">
          <ResponsiveHash value={collectionAddress} />
        </div>
        <div className="text-right font-mono text-sm text-black">Deployed</div>
      </div>
      <div className="flex items-center justify-between gap-4 border-b border-black/40 py-3">
        <div className="text-sm text-black/70">Approved in staking</div>
        <StatusPill value={approved.data as boolean | undefined} />
      </div>
      <div className="flex items-center justify-between gap-4 py-3">
        <div className="text-sm text-black/70">This wallet has valid stake</div>
        <StatusPill value={hasValidStake.data as boolean | undefined} />
      </div>
    </div>
  );
}

export function DashboardReadPanel({ chainSet }: { chainSet: ChainSet }) {
  const { address } = useAccount();
  const collections = getChainCollections(chainSet);
  const stakingAddress = collections[0]?.stakingAddress;

  if (!stakingAddress) {
    return null;
  }

  return (
    <>
      <section className="rounded-3xl border border-white/10 bg-black p-6">
        <p className="text-sm uppercase tracking-[0.25em] text-white/70">
          Staking Summary Card
        </p>
        <h2 className="mt-2 text-2xl font-semibold">Staking Summary</h2>
        <p className="mt-2 text-sm text-white/70">
          This card is for the staking summary. Stake and unstake actions are
          available below it.
        </p>
      </section>

      <article className="min-w-0 rounded-3xl border border-white/10 bg-black p-6">
        <p className="text-sm uppercase tracking-[0.25em] text-white/70">
          Live Contract State
        </p>
        <h2 className="mt-2 text-2xl font-semibold">Read-Only Panel</h2>
        <p className="mt-2 text-sm text-white/70">
          This panel reads the staking approval and the current valid stake
          status.
        </p>

        {!address ? (
          <div className="mt-5 rounded-2xl border border-white/10 bg-yellow-300 p-4 text-black">
            Connect wallet to see wallet-specific stake status.
          </div>
        ) : null}

        {collections.map((collection) => (
          <CollectionStakeSummary
            chainId={collection.requiredChainId}
            collectionAddress={collection.contractAddress}
            collectionName={collection.name}
            key={collection.contractAddress}
            stakingAddress={stakingAddress}
            walletAddress={address}
          />
        ))}
      </article>
    </>
  );
}
