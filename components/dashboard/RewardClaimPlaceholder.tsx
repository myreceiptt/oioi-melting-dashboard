"use client";

import { useAccount, useReadContract } from "wagmi";
import type { ChainSet } from "@/lib/chains/chainConfig";
import { erc20Abi, rewardDistributorAbi } from "@/lib/contracts/abis";
import { getContractAddresses } from "@/lib/contracts/addresses";
import { getAddressUrl } from "@/lib/services/explorer";
import { formatTokenAmount, shortAddress } from "@/lib/utils/format";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/10 py-3 last:border-b-0">
      <div className="text-sm text-white/60">{label}</div>
      <div className="text-right font-mono text-sm">{value}</div>
    </div>
  );
}

export function RewardClaimPlaceholder({ chainSet }: { chainSet: ChainSet }) {
  const { address } = useAccount();
  const addresses = getContractAddresses(chainSet);

  const rewardToken = useReadContract({
    address: addresses.rewardDistributor,
    abi: rewardDistributorAbi,
    functionName: "rewardToken",
  });

  const totalRewardFunded = useReadContract({
    address: addresses.rewardDistributor,
    abi: rewardDistributorAbi,
    functionName: "totalRewardFunded",
  });

  const totalRewardClaimed = useReadContract({
    address: addresses.rewardDistributor,
    abi: rewardDistributorAbi,
    functionName: "totalRewardClaimed",
  });

  const allocatedUnclaimedRewardBalance = useReadContract({
    address: addresses.rewardDistributor,
    abi: rewardDistributorAbi,
    functionName: "allocatedUnclaimedRewardBalance",
  });

  const excessRewardTokenBalance = useReadContract({
    address: addresses.rewardDistributor,
    abi: rewardDistributorAbi,
    functionName: "excessRewardTokenBalance",
  });

  const walletOioiBalance = useReadContract({
    address: addresses.oioi,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(address),
    },
  });

  const distributorOioiBalance = useReadContract({
    address: addresses.oioi,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [addresses.rewardDistributor],
  });

  const hasReadError =
    rewardToken.error ||
    totalRewardFunded.error ||
    totalRewardClaimed.error ||
    allocatedUnclaimedRewardBalance.error ||
    excessRewardTokenBalance.error ||
    walletOioiBalance.error ||
    distributorOioiBalance.error;

  return (
    <section className="grid gap-5">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <p className="text-sm uppercase tracking-[0.25em] text-white/50">
          Reward Distribution
        </p>
        <h2 className="mt-2 text-2xl font-semibold">Claim $OiOi Rewards</h2>
        <p className="mt-2 text-sm text-white/60">
          This is the $OiOi rewards claim card. Transaction forms available in
          the write sections.
        </p>
      </section>
      <article className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-white/40">
            $OiOi Rewards
          </p>
          <h2 className="mt-2 text-2xl font-semibold">Reward Claim</h2>
          <p className="mt-2 text-sm text-white/60">
            Reward claim requires round data, allocation amount, and Merkle
            proof from the indexer/reward pipeline. This panel show the rewards
            value.
          </p>
        </div>

        <div className="mt-6 grid gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
          <div>
            <div className="text-sm text-white/60">Reward Distributor</div>
            <a
              className="mt-1 block break-all font-mono text-sm underline underline-offset-4"
              href={getAddressUrl(chainSet, addresses.rewardDistributor)}
              rel="noreferrer"
              target="_blank">
              {addresses.rewardDistributor}
            </a>
          </div>

          <div>
            <div className="text-sm text-white/60">$OiOi Token</div>
            <a
              className="mt-1 block break-all font-mono text-sm underline underline-offset-4"
              href={getAddressUrl(chainSet, addresses.oioi)}
              rel="noreferrer"
              target="_blank">
              {addresses.oioi}
            </a>
          </div>
        </div>

        {hasReadError ? (
          <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
            <h3 className="font-medium text-red-100">Reward read warning</h3>
            <p className="mt-2 text-sm text-red-100/80">
              Some reward contract reads failed. Check chain, RPC, and contract
              config.
            </p>
          </div>
        ) : null}

        <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 px-4">
          <Row
            label="Reward token from distributor"
            value={shortAddress(rewardToken.data as string | undefined)}
          />
          <Row
            label="Total reward funded"
            value={formatTokenAmount({
              value: totalRewardFunded.data as bigint | undefined,
            })}
          />
          <Row
            label="Total reward claimed"
            value={formatTokenAmount({
              value: totalRewardClaimed.data as bigint | undefined,
            })}
          />
          <Row
            label="Allocated unclaimed balance"
            value={formatTokenAmount({
              value: allocatedUnclaimedRewardBalance.data as bigint | undefined,
            })}
          />
          <Row
            label="Excess reward token balance"
            value={formatTokenAmount({
              value: excessRewardTokenBalance.data as bigint | undefined,
            })}
          />
          <Row
            label="Distributor $OiOi balance"
            value={formatTokenAmount({
              value: distributorOioiBalance.data as bigint | undefined,
            })}
          />
          <Row
            label="This wallet $OiOi balance"
            value={
              address
                ? formatTokenAmount({
                    value: walletOioiBalance.data as bigint | undefined,
                  })
                : "Connect wallet"
            }
          />
        </div>

        <div className="mt-6 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4">
          <h3 className="font-medium text-yellow-100">Claim not active yet</h3>
          <p className="mt-2 text-sm text-yellow-100/80">
            The claim button will be enabled after the indexer can serve reward
            round data and Merkle proofs for each wallet.
          </p>
        </div>

        <button
          className="mt-5 w-full cursor-not-allowed rounded-2xl border border-white/10 px-5 py-3 font-medium opacity-40"
          disabled
          type="button">
          Claim $OiOi — Coming Soon
        </button>
      </article>
    </section>
  );
}
