"use client";

import { useEffect, useMemo, useState } from "react";
import type { Address, Hash } from "viem";
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import type { ChainSet } from "@/lib/chains/chainConfig";
import { stakingAdminAbi } from "@/lib/contracts/abis";
import { getContractAddresses } from "@/lib/contracts/addresses";
import { EXPECTED_ADMIN_OWNER_ADDRESS } from "@/lib/admin/adminContractConfig";
import { getTxUrl } from "@/lib/services/explorer";
import { sameAddress } from "@/lib/utils/address";
import { formatBool, shortAddress } from "@/lib/utils/format";

type StakingCollectionConfig = {
  key: "roty" | "melting" | "amanda";
  label: string;
  address: Address;
  warning: string;
};

function isExpectedOwner(address: string | undefined) {
  return Boolean(address && sameAddress(address, EXPECTED_ADMIN_OWNER_ADDRESS));
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
    <div className="grid gap-2 border-b border-white/10 py-3 last:border-b-0 md:grid-cols-[240px_1fr]">
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

function TxStatus({
  chainSet,
  txHash,
  isLoading,
  isSuccess,
  isError,
}: {
  chainSet: ChainSet;
  txHash: Hash | undefined;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
}) {
  if (!txHash) {
    return null;
  }

  return (
    <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm">
      <div className="font-medium">Transaction status</div>
      <a
        className="mt-2 block break-all font-mono underline underline-offset-4"
        href={getTxUrl(chainSet, txHash)}
        rel="noreferrer"
        target="_blank">
        {txHash}
      </a>
      <div className="mt-1 text-white/60">
        {isLoading
          ? "Mining..."
          : isSuccess
            ? "Mined successfully. State refreshed."
            : isError
              ? "Transaction failed or receipt error."
              : "Submitted."}
      </div>
    </div>
  );
}

function StakingCollectionControl({
  chainSet,
  stakingAddress,
  collection,
}: {
  chainSet: ChainSet;
  stakingAddress: Address;
  collection: StakingCollectionConfig;
}) {
  const { address: connectedAddress, isConnected } = useAccount();
  const [lastRequestedValue, setLastRequestedValue] = useState<boolean | null>(
    null,
  );
  const [lastActionLabel, setLastActionLabel] = useState<string | null>(null);

  const userIsExpectedOwner = useMemo(
    () => isExpectedOwner(connectedAddress),
    [connectedAddress],
  );

  const ownerRead = useReadContract({
    address: stakingAddress,
    abi: stakingAdminAbi,
    functionName: "owner",
  });

  const approvedRead = useReadContract({
    address: stakingAddress,
    abi: stakingAdminAbi,
    functionName: "approvedCollection",
    args: [collection.address],
  });

  const buildStageRead = useReadContract({
    address: stakingAddress,
    abi: stakingAdminAbi,
    functionName: "BUILD_STAGE",
  });

  const {
    data: txHash,
    error: writeError,
    isPending: isWritePending,
    writeContractAsync,
  } = useWriteContract();

  const receipt = useWaitForTransactionReceipt({
    hash: txHash,
    query: {
      enabled: Boolean(txHash),
    },
  });

  function refetchReads() {
    void ownerRead.refetch();
    void approvedRead.refetch();
    void buildStageRead.refetch();
  }

  useEffect(() => {
    if (receipt.isSuccess) {
      refetchReads();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receipt.isSuccess]);

  const ownerAddress =
    typeof ownerRead.data === "string" ? ownerRead.data : undefined;
  const approved =
    typeof approvedRead.data === "boolean" ? approvedRead.data : undefined;
  const buildStage =
    typeof buildStageRead.data === "string" ? buildStageRead.data : undefined;
  const readError =
    ownerRead.error ?? approvedRead.error ?? buildStageRead.error;
  const isRefreshing =
    ownerRead.isFetching ||
    approvedRead.isFetching ||
    buildStageRead.isFetching;

  const actionDisabledBase =
    !isConnected || !userIsExpectedOwner || isWritePending || receipt.isLoading;

  function confirmRegistryChange(nextValue: boolean) {
    return window.confirm(
      [
        "HIGH RISK STAKING REGISTRY ACTION",
        `${nextValue ? "Approve" : "Unapprove"} ${collection.label}`,
        "",
        collection.warning,
        "",
        `Staking contract: ${stakingAddress}`,
        `Collection: ${collection.address}`,
        `Current approved: ${formatBool(approved)}`,
        `New approved: ${nextValue ? "Yes" : "No"}`,
        "",
        "Changing staking approval can affect staking eligibility, gated mint eligibility, and future dashboard behavior.",
      ].join("\n"),
    );
  }

  async function setCollectionApproved(nextValue: boolean) {
    if (!confirmRegistryChange(nextValue)) {
      return;
    }

    const direction = nextValue ? "APPROVE" : "UNAPPROVE";
    setLastRequestedValue(nextValue);
    setLastActionLabel(`${direction} ${collection.label}`);

    await writeContractAsync({
      address: stakingAddress,
      abi: stakingAdminAbi,
      functionName: "setCollectionApproved",
      args: [collection.address, nextValue],
    });
  }

  return (
    <article className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-white/40">
            Staking Registry
          </p>
          <h3 className="mt-2 text-2xl font-semibold">{collection.label}</h3>
          <p className="mt-2 max-w-2xl text-sm text-white/60">
            Approve or unapprove this NFT collection for non-custodial soft
            staking.
          </p>
        </div>

        <button
          className="rounded-2xl border border-white/10 px-4 py-2 text-sm hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={isRefreshing}
          onClick={refetchReads}
          type="button">
          {isRefreshing ? "Refreshing..." : `Approved: ${formatBool(approved)}`}
        </button>
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 px-4">
        <ReadRow
          label="Staking owner"
          value={shortAddress(ownerAddress)}
          warning={
            ownerAddress &&
            !sameAddress(ownerAddress, EXPECTED_ADMIN_OWNER_ADDRESS)
              ? "Owner differs from expected admin."
              : undefined
          }
        />
        <ReadRow label="Build stage" value={buildStage ?? "—"} />
        <ReadRow
          label="Staking contract"
          value={shortAddress(stakingAddress)}
        />
        <ReadRow
          label="Collection address"
          value={shortAddress(collection.address)}
        />
        <ReadRow label="Approved" value={formatBool(approved)} />
      </div>

      <div className="mt-5 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4">
        <div className="font-medium text-yellow-100">Operational warning</div>
        <p className="mt-2 text-sm text-yellow-100/80">{collection.warning}</p>
      </div>

      {!userIsExpectedOwner ? (
        <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100/80">
          Write actions are disabled because the connected wallet is not the
          expected owner.
        </div>
      ) : null}

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <button
          className="rounded-2xl border border-green-500/30 bg-green-500/10 px-5 py-3 font-medium text-green-100 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={actionDisabledBase || approved === true}
          onClick={() => void setCollectionApproved(true)}
          type="button">
          Approve Collection
        </button>

        <button
          className="rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-3 font-medium text-red-100 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={actionDisabledBase || approved === false}
          onClick={() => void setCollectionApproved(false)}
          type="button">
          Unapprove Collection
        </button>
      </div>

      {lastActionLabel ? (
        <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm">
          <div className="font-medium">Last requested action</div>
          <div className="mt-2 text-white/60">{lastActionLabel}</div>
          <div className="mt-1 text-white/60">
            Requested value: {lastRequestedValue ? "Yes" : "No"}
          </div>
        </div>
      ) : null}

      {isWritePending ? (
        <div className="mt-5 rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4 text-sm text-blue-100/80">
          Waiting for wallet signature...
        </div>
      ) : null}

      <TxStatus
        chainSet={chainSet}
        isError={receipt.isError}
        isLoading={receipt.isLoading}
        isSuccess={receipt.isSuccess}
        txHash={txHash}
      />

      {writeError ? (
        <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100/80">
          {writeError.message}
        </div>
      ) : null}

      {readError ? (
        <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100/80">
          Read error: {readError.message}
        </div>
      ) : null}
    </article>
  );
}

export function AdminStakingRegistryControls({
  chainSet,
}: {
  chainSet: ChainSet;
}) {
  const addresses = getContractAddresses(chainSet);

  const collections: StakingCollectionConfig[] = [
    {
      key: "roty",
      label: chainSet === "base" ? "ROTY BASE" : "ROTY dETH",
      address: addresses.roty,
      warning:
        "ROTY staking is the root eligibility signal for Melting and Amanda gated mint and downstream reward participation. Unapproving ROTY can disrupt future staking operations.",
    },
    {
      key: "melting",
      label: chainSet === "base" ? "Melting BASE" : "Melting dETH",
      address: addresses.melting,
      warning:
        "Melting staking is part of Amanda gated mint eligibility and reward participation. Unapproving Melting can disrupt later gated mint and reward flows.",
    },
    {
      key: "amanda",
      label: chainSet === "base" ? "Amanda BASE" : "Amanda dETH",
      address: addresses.amanda,
      warning:
        "Amanda staking contributes to reward participation. Unapproving Amanda can disrupt reward flow and dashboard behavior.",
    },
  ];

  return (
    <section className="grid gap-5">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <p className="text-sm uppercase tracking-[0.25em] text-white/50">
          Admin Writes
        </p>
        <h2 className="mt-2 text-2xl font-semibold">
          Staking Registry Controls
        </h2>
        <p className="mt-2 text-sm text-white/60">
          Owner-only controls for approving or unapproving NFT collections in
          OiOi Soft Staking.
        </p>
      </section>

      {collections.map((collection) => (
        <StakingCollectionControl
          chainSet={chainSet}
          collection={collection}
          key={collection.key}
          stakingAddress={addresses.staking}
        />
      ))}
    </section>
  );
}
