"use client";

import { useAccount, useReadContract } from "wagmi";
import type { Address } from "viem";
import type { ChainSet } from "@/lib/chains/chainConfig";
import {
  erc20Abi,
  gatedMintAdminAbi,
  rewardDistributorAdminAbi,
  rotyAdminAbi,
  stakingAdminAbi,
} from "@/lib/contracts/abis";
import { getContractAddresses } from "@/lib/contracts/addresses";
import { EXPECTED_ADMIN_OWNER_ADDRESS } from "@/lib/admin/adminContractConfig";
import {
  formatBool,
  formatEth,
  formatNumber,
  formatTokenAmount,
  shortAddress,
} from "@/lib/utils/format";
import { sameAddress } from "@/lib/utils/address";

function ReadCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div>
        <p className="text-sm uppercase tracking-[0.25em] text-white/40">
          Read-Only Functions
        </p>
        <h2 className="mt-2 text-2xl font-semibold">{title}</h2>
        {description ? (
          <p className="mt-2 text-sm text-white/60">{description}</p>
        ) : null}
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 px-4">
        {children}
      </div>
    </article>
  );
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
    <div className="grid gap-2 border-b border-white/10 py-3 last:border-b-0 md:grid-cols-[220px_1fr]">
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

function asAddress(value: unknown): Address | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  return value as Address;
}

function asBigInt(value: unknown): bigint | undefined {
  return typeof value === "bigint" ? value : undefined;
}

function asBool(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function isExpectedAdminOwner(ownerAddress: Address | undefined): boolean {
  return Boolean(
    ownerAddress && sameAddress(ownerAddress, EXPECTED_ADMIN_OWNER_ADDRESS),
  );
}

function NftAdminReadCard({
  label,
  address,
  kind,
}: {
  label: string;
  address: Address;
  kind: "roty" | "gated";
}) {
  const abi = kind === "roty" ? rotyAdminAbi : gatedMintAdminAbi;

  const owner = useReadContract({
    address,
    abi,
    functionName: "owner",
  });

  const pendingOwner = useReadContract({
    address,
    abi,
    functionName: "pendingOwner",
  });

  const totalMinted = useReadContract({
    address,
    abi,
    functionName: "totalMinted",
  });

  const remainingSupply = useReadContract({
    address,
    abi,
    functionName: "remainingSupply",
  });

  const maxSupply = useReadContract({
    address,
    abi,
    functionName: "maxSupply",
  });

  const maxMintPerTx = useReadContract({
    address,
    abi,
    functionName: "maxMintPerTx",
  });

  const mintPrice = useReadContract({
    address,
    abi,
    functionName: "mintPrice",
  });

  const treasury = useReadContract({
    address,
    abi,
    functionName: "treasury",
  });

  const revealed = useReadContract({
    address,
    abi,
    functionName: "revealed",
  });

  const metadataLocked = useReadContract({
    address,
    abi,
    functionName: "metadataLocked",
  });

  const unrevealedURI = useReadContract({
    address,
    abi,
    functionName: "unrevealedURI",
  });

  const revealedBaseURI = useReadContract({
    address,
    abi,
    functionName: "revealedBaseURI",
  });

  const baseExtension = useReadContract({
    address,
    abi,
    functionName: "baseExtension",
  });

  const ownerAddress = asAddress(owner.data);
  const isExpectedOwner = isExpectedAdminOwner(ownerAddress);

  return (
    <ReadCard
      title={label}
      description="NFT admin state: ownership, supply, pricing, treasury, and metadata.">
      <ReadRow
        label="Owner"
        value={shortAddress(ownerAddress)}
        warning={
          !isExpectedOwner ? "Owner differs from expected admin." : undefined
        }
      />
      <ReadRow
        label="Pending owner"
        value={shortAddress(asAddress(pendingOwner.data))}
      />
      <ReadRow
        label="Total minted"
        value={formatNumber(asBigInt(totalMinted.data))}
      />
      <ReadRow
        label="Remaining supply"
        value={formatNumber(asBigInt(remainingSupply.data))}
      />
      <ReadRow
        label="Max supply"
        value={formatNumber(asBigInt(maxSupply.data))}
      />
      <ReadRow
        label="Max mint per tx"
        value={formatNumber(asBigInt(maxMintPerTx.data))}
      />
      <ReadRow label="Mint price" value={formatEth(asBigInt(mintPrice.data))} />
      <ReadRow
        label="Treasury"
        value={shortAddress(asAddress(treasury.data))}
      />
      <ReadRow label="Revealed" value={formatBool(asBool(revealed.data))} />
      <ReadRow
        label="Metadata locked"
        value={formatBool(asBool(metadataLocked.data))}
      />
      <ReadRow
        label="Unrevealed URI"
        value={asString(unrevealedURI.data) ?? "—"}
      />
      <ReadRow
        label="Revealed base URI"
        value={asString(revealedBaseURI.data) ?? "—"}
      />
      <ReadRow
        label="Base extension"
        value={asString(baseExtension.data) ?? "—"}
      />
    </ReadCard>
  );
}

function RotyPhaseReadCard({ address }: { address: Address }) {
  const whitelistMintEnabled = useReadContract({
    address,
    abi: rotyAdminAbi,
    functionName: "whitelistMintEnabled",
  });

  const publicMintEnabled = useReadContract({
    address,
    abi: rotyAdminAbi,
    functionName: "publicMintEnabled",
  });

  const merkleRoot = useReadContract({
    address,
    abi: rotyAdminAbi,
    functionName: "merkleRoot",
  });

  const originChainId = useReadContract({
    address,
    abi: rotyAdminAbi,
    functionName: "ORIGIN_CHAIN_ID",
  });

  const originContract = useReadContract({
    address,
    abi: rotyAdminAbi,
    functionName: "ORIGIN_CONTRACT",
  });

  const originName = useReadContract({
    address,
    abi: rotyAdminAbi,
    functionName: "ORIGIN_NAME",
  });

  return (
    <ReadCard
      title="ROTY Mint & Provenance"
      description="ROTY-specific whitelist, public mint, Merkle root, and origin state.">
      <ReadRow
        label="Whitelist mint enabled"
        value={formatBool(asBool(whitelistMintEnabled.data))}
      />
      <ReadRow
        label="Public mint enabled"
        value={formatBool(asBool(publicMintEnabled.data))}
      />
      <ReadRow label="Merkle root" value={asString(merkleRoot.data) ?? "—"} />
      <ReadRow
        label="Origin chain ID"
        value={formatNumber(asBigInt(originChainId.data))}
      />
      <ReadRow
        label="Origin contract"
        value={shortAddress(asAddress(originContract.data))}
      />
      <ReadRow label="Origin name" value={asString(originName.data) ?? "—"} />
    </ReadCard>
  );
}

function GatedMintPhaseReadCard({
  label,
  address,
  includeMeltingCollection,
}: {
  label: string;
  address: Address;
  includeMeltingCollection?: boolean;
}) {
  const gatedMintEnabled = useReadContract({
    address,
    abi: gatedMintAdminAbi,
    functionName: "gatedMintEnabled",
  });

  const stakingContract = useReadContract({
    address,
    abi: gatedMintAdminAbi,
    functionName: "stakingContract",
  });

  const rotyCollection = useReadContract({
    address,
    abi: gatedMintAdminAbi,
    functionName: "rotyCollection",
  });

  const meltingCollection = useReadContract({
    address,
    abi: gatedMintAdminAbi,
    functionName: "meltingCollection",
    query: {
      enabled: Boolean(includeMeltingCollection),
      retry: false,
    },
  });

  return (
    <ReadCard
      title={`${label} Gated Mint`}
      description="Gated mint phase and eligibility contract references.">
      <ReadRow
        label="Gated mint enabled"
        value={formatBool(asBool(gatedMintEnabled.data))}
      />
      <ReadRow
        label="Staking contract"
        value={shortAddress(asAddress(stakingContract.data))}
      />
      <ReadRow
        label="ROTY collection"
        value={shortAddress(asAddress(rotyCollection.data))}
      />
      {includeMeltingCollection ? (
        <ReadRow
          label="Melting collection"
          value={shortAddress(asAddress(meltingCollection.data))}
        />
      ) : null}
    </ReadCard>
  );
}

function StakingAdminReadCard({
  staking,
  roty,
  melting,
  amanda,
}: {
  staking: Address;
  roty: Address;
  melting: Address;
  amanda: Address;
}) {
  const owner = useReadContract({
    address: staking,
    abi: stakingAdminAbi,
    functionName: "owner",
  });

  const pendingOwner = useReadContract({
    address: staking,
    abi: stakingAdminAbi,
    functionName: "pendingOwner",
  });

  const buildStage = useReadContract({
    address: staking,
    abi: stakingAdminAbi,
    functionName: "BUILD_STAGE",
  });

  const rotyApproved = useReadContract({
    address: staking,
    abi: stakingAdminAbi,
    functionName: "approvedCollection",
    args: [roty],
  });

  const meltingApproved = useReadContract({
    address: staking,
    abi: stakingAdminAbi,
    functionName: "approvedCollection",
    args: [melting],
  });

  const amandaApproved = useReadContract({
    address: staking,
    abi: stakingAdminAbi,
    functionName: "approvedCollection",
    args: [amanda],
  });

  const ownerAddress = asAddress(owner.data);
  const isExpectedOwner = isExpectedAdminOwner(ownerAddress);

  return (
    <ReadCard
      title="OiOi Soft Staking"
      description="Soft staking owner state and approved collection registry.">
      <ReadRow
        label="Owner"
        value={shortAddress(ownerAddress)}
        warning={
          !isExpectedOwner ? "Owner differs from expected admin." : undefined
        }
      />
      <ReadRow
        label="Pending owner"
        value={shortAddress(asAddress(pendingOwner.data))}
      />
      <ReadRow label="Build stage" value={asString(buildStage.data) ?? "—"} />
      <ReadRow
        label="ROTY approved"
        value={formatBool(asBool(rotyApproved.data))}
      />
      <ReadRow
        label="Melting approved"
        value={formatBool(asBool(meltingApproved.data))}
      />
      <ReadRow
        label="Amanda approved"
        value={formatBool(asBool(amandaApproved.data))}
      />
    </ReadCard>
  );
}

function RewardDistributorAdminReadCard({ address }: { address: Address }) {
  const owner = useReadContract({
    address,
    abi: rewardDistributorAdminAbi,
    functionName: "owner",
  });

  const pendingOwner = useReadContract({
    address,
    abi: rewardDistributorAdminAbi,
    functionName: "pendingOwner",
  });

  const buildStage = useReadContract({
    address,
    abi: rewardDistributorAdminAbi,
    functionName: "BUILD_STAGE",
  });

  const rewardToken = useReadContract({
    address,
    abi: rewardDistributorAdminAbi,
    functionName: "rewardToken",
  });

  const totalRewardFunded = useReadContract({
    address,
    abi: rewardDistributorAdminAbi,
    functionName: "totalRewardFunded",
  });

  const totalRewardClaimed = useReadContract({
    address,
    abi: rewardDistributorAdminAbi,
    functionName: "totalRewardClaimed",
  });

  const allocatedUnclaimedRewardBalance = useReadContract({
    address,
    abi: rewardDistributorAdminAbi,
    functionName: "allocatedUnclaimedRewardBalance",
  });

  const excessRewardTokenBalance = useReadContract({
    address,
    abi: rewardDistributorAdminAbi,
    functionName: "excessRewardTokenBalance",
  });

  const ownerAddress = asAddress(owner.data);
  const isExpectedOwner = isExpectedAdminOwner(ownerAddress);

  return (
    <ReadCard
      title="OiOi Reward Distributor"
      description="Reward distributor owner state, accounting counters, and reward token.">
      <ReadRow
        label="Owner"
        value={shortAddress(ownerAddress)}
        warning={
          !isExpectedOwner ? "Owner differs from expected admin." : undefined
        }
      />
      <ReadRow
        label="Pending owner"
        value={shortAddress(asAddress(pendingOwner.data))}
      />
      <ReadRow label="Build stage" value={asString(buildStage.data) ?? "—"} />
      <ReadRow
        label="Reward token"
        value={shortAddress(asAddress(rewardToken.data))}
      />
      <ReadRow
        label="Total reward funded"
        value={formatTokenAmount({ value: asBigInt(totalRewardFunded.data) })}
      />
      <ReadRow
        label="Total reward claimed"
        value={formatTokenAmount({ value: asBigInt(totalRewardClaimed.data) })}
      />
      <ReadRow
        label="Allocated unclaimed balance"
        value={formatTokenAmount({
          value: asBigInt(allocatedUnclaimedRewardBalance.data),
        })}
      />
      <ReadRow
        label="Excess reward token balance"
        value={formatTokenAmount({
          value: asBigInt(excessRewardTokenBalance.data),
        })}
      />
    </ReadCard>
  );
}

function OioiAdminReadCard({
  token,
  rewardDistributor,
}: {
  token: Address;
  rewardDistributor: Address;
}) {
  const { address } = useAccount();

  const name = useReadContract({
    address: token,
    abi: erc20Abi,
    functionName: "name",
  });

  const symbol = useReadContract({
    address: token,
    abi: erc20Abi,
    functionName: "symbol",
  });

  const decimals = useReadContract({
    address: token,
    abi: erc20Abi,
    functionName: "decimals",
  });

  const totalSupply = useReadContract({
    address: token,
    abi: erc20Abi,
    functionName: "totalSupply",
  });

  const adminBalance = useReadContract({
    address: token,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [EXPECTED_ADMIN_OWNER_ADDRESS],
  });

  const connectedWalletBalance = useReadContract({
    address: token,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(address),
    },
  });

  const distributorBalance = useReadContract({
    address: token,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [rewardDistributor],
  });

  const allowance = useReadContract({
    address: token,
    abi: erc20Abi,
    functionName: "allowance",
    args: [EXPECTED_ADMIN_OWNER_ADDRESS, rewardDistributor],
  });

  return (
    <ReadCard
      title="$OiOi Token"
      description="Reward token read state for funding reward rounds.">
      <ReadRow label="Name" value={asString(name.data) ?? "—"} />
      <ReadRow label="Symbol" value={asString(symbol.data) ?? "—"} />
      <ReadRow label="Decimals" value={formatNumber(asBigInt(decimals.data))} />
      <ReadRow
        label="Total supply"
        value={formatTokenAmount({ value: asBigInt(totalSupply.data) })}
      />
      <ReadRow
        label="Admin wallet balance"
        value={formatTokenAmount({ value: asBigInt(adminBalance.data) })}
      />
      <ReadRow
        label="Connected wallet balance"
        value={
          address
            ? formatTokenAmount({
                value: asBigInt(connectedWalletBalance.data),
              })
            : "Connect wallet"
        }
      />
      <ReadRow
        label="Reward Distributor balance"
        value={formatTokenAmount({ value: asBigInt(distributorBalance.data) })}
      />
      <ReadRow
        label="Admin allowance"
        value={formatTokenAmount({ value: asBigInt(allowance.data) })}
      />
    </ReadCard>
  );
}

export function AdminReadCards({ chainSet }: { chainSet: ChainSet }) {
  const addresses = getContractAddresses(chainSet);
  const chainLabel = chainSet === "base" ? "BASE" : "Ethereum";

  return (
    <section className="grid gap-5">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <p className="text-sm uppercase tracking-[0.25em] text-white/50">
          Live Admin Reads
        </p>
        <h2 className="mt-2 text-2xl font-semibold">
          {chainLabel} contract state
        </h2>
        <p className="mt-2 text-sm text-white/60">
          These cards read the current contract state only. Transaction forms
          are available below it.
        </p>
      </section>

      <NftAdminReadCard
        label={chainSet === "base" ? "ROTY BASE" : "ROTY dETH"}
        address={addresses.roty}
        kind="roty"
      />
      <RotyPhaseReadCard address={addresses.roty} />

      <NftAdminReadCard
        label={chainSet === "base" ? "Melting BASE" : "Melting dETH"}
        address={addresses.melting}
        kind="gated"
      />
      <GatedMintPhaseReadCard
        label={chainSet === "base" ? "Melting BASE" : "Melting dETH"}
        address={addresses.melting}
      />

      <NftAdminReadCard
        label={chainSet === "base" ? "Amanda BASE" : "Amanda dETH"}
        address={addresses.amanda}
        kind="gated"
      />
      <GatedMintPhaseReadCard
        label={chainSet === "base" ? "Amanda BASE" : "Amanda dETH"}
        address={addresses.amanda}
        includeMeltingCollection
      />

      <StakingAdminReadCard
        staking={addresses.staking}
        roty={addresses.roty}
        melting={addresses.melting}
        amanda={addresses.amanda}
      />

      <RewardDistributorAdminReadCard address={addresses.rewardDistributor} />

      <OioiAdminReadCard
        token={addresses.oioi}
        rewardDistributor={addresses.rewardDistributor}
      />
    </section>
  );
}
