"use client";

import { useAccount, useReadContract } from "wagmi";
import type { ChainSet } from "@/lib/chains/chainConfig";
import { getChainCollections } from "@/lib/contracts/collectionConfig";
import { stakingAbi } from "@/lib/contracts/abis";
import { formatBool } from "@/lib/utils/format";

function StatusPill({ value }: { value: boolean | undefined }) {
  return (
    <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs">
      {formatBool(value)}
    </span>
  );
}

function CollectionStakeSummary({
  collectionName,
  collectionAddress,
  stakingAddress,
  walletAddress,
}: {
  collectionName: string;
  collectionAddress: `0x${string}`;
  stakingAddress: `0x${string}`;
  walletAddress: `0x${string}` | undefined;
}) {
  const approved = useReadContract({
    address: stakingAddress,
    abi: stakingAbi,
    functionName: "approvedCollection",
    args: [collectionAddress],
  });

  const hasValidStake = useReadContract({
    address: stakingAddress,
    abi: stakingAbi,
    functionName: "hasValidStake",
    args: walletAddress ? [walletAddress, collectionAddress] : undefined,
    query: {
      enabled: Boolean(walletAddress),
    },
  });

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="font-medium">{collectionName}</div>
        <button
          className="rounded-2xl border border-white/10 px-4 py-2 text-sm hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={approved.isFetching || hasValidStake.isFetching}
          onClick={() => {
            void approved.refetch();
            void hasValidStake.refetch();
          }}
          type="button"
        >
          {approved.isFetching || hasValidStake.isFetching
            ? "Refreshing..."
            : "Refresh"}
        </button>
      </div>
      <div className="mt-2 break-all font-mono text-xs text-white/40">
        {collectionAddress}
      </div>
      <div className="mt-4 grid gap-2 text-sm">
        <div className="flex items-center justify-between gap-4">
          <span className="text-white/60">Approved in staking</span>
          <StatusPill value={approved.data as boolean | undefined} />
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-white/60">This wallet has valid stake</span>
          <StatusPill value={hasValidStake.data as boolean | undefined} />
        </div>
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
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <h2 className="font-semibold">Read-only staking summary.</h2>
      <p className="mt-2 text-sm text-white/60">
        This panel reads the staking approval and the current valid stake
        status. Stake and unstake actions are available below it.
      </p>

      {!address ? (
        <div className="mt-5 grid gap-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm md:grid-cols-2">
          <div>
            <div className="text-white/60">
              Connect wallet to see wallet-specific stake status.
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-5 grid gap-5">
        {collections.map((collection) => (
          <CollectionStakeSummary
            collectionAddress={collection.contractAddress}
            collectionName={collection.name}
            key={collection.contractAddress}
            stakingAddress={stakingAddress}
            walletAddress={address}
          />
        ))}
      </div>
    </section>
  );
}
