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
import { gatedMintAdminAbi, rotyAdminAbi } from "@/lib/contracts/abis";
import { getContractAddresses } from "@/lib/contracts/addresses";
import { EXPECTED_ADMIN_OWNER_ADDRESS } from "@/lib/admin/adminContractConfig";
import { getTxUrl } from "@/lib/services/explorer";
import { sameAddress } from "@/lib/utils/address";
import { formatBool, shortAddress } from "@/lib/utils/format";

type MetadataAction =
  | "setUnrevealedURI"
  | "setRevealedBaseURI"
  | "setBaseExtension"
  | "setRevealed"
  | "lockMetadata";

type MetadataAbi = typeof rotyAdminAbi | typeof gatedMintAdminAbi;

type MetadataCollectionConfig = {
  key: "roty" | "melting" | "amanda";
  label: string;
  address: Address;
  abi: MetadataAbi;
};

function isExpectedOwner(address: string | undefined) {
  return Boolean(address && sameAddress(address, EXPECTED_ADMIN_OWNER_ADDRESS));
}

function isPendingUri(value: string | undefined) {
  if (!value) {
    return true;
  }

  return value.toLowerCase().includes("pending");
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

function Field({
  label,
  description,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  description?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="font-medium">{label}</div>
      {description ? (
        <p className="mt-1 text-xs text-white/50">{description}</p>
      ) : null}
      <input
        className="mt-3 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 font-mono text-sm outline-none focus:border-white/30"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type="text"
        value={value}
      />
    </label>
  );
}

function TxStatus({
  chainSet,
  txHash,
  isLoading,
  isSuccess,
  isError,
  errorMessage,
}: {
  chainSet: ChainSet;
  txHash: Hash | undefined;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  errorMessage?: string;
}) {
  if (!txHash && !errorMessage) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm">
      <div className="font-medium">Transaction status</div>

      {txHash ? (
        <a
          className="mt-2 block break-all font-mono underline underline-offset-4"
          href={getTxUrl(chainSet, txHash)}
          rel="noreferrer"
          target="_blank">
          {txHash}
        </a>
      ) : null}

      <div className="mt-2 text-white/60">
        {isLoading
          ? "Mining..."
          : isSuccess
            ? "Mined successfully. State refreshed."
            : isError
              ? "Transaction failed or receipt error."
              : txHash
                ? "Submitted."
                : ""}
      </div>

      {errorMessage ? (
        <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-red-100/80">
          {errorMessage}
        </div>
      ) : null}
    </div>
  );
}

function MetadataCollectionControls({
  chainSet,
  config,
}: {
  chainSet: ChainSet;
  config: MetadataCollectionConfig;
}) {
  const { address: connectedAddress, isConnected } = useAccount();

  const [unrevealedInput, setUnrevealedInput] = useState("");
  const [revealedBaseInput, setRevealedBaseInput] = useState("");
  const [baseExtensionInput, setBaseExtensionInput] = useState("");
  const [lastAction, setLastAction] = useState<MetadataAction | null>(null);

  const userIsExpectedOwner = useMemo(
    () => isExpectedOwner(connectedAddress),
    [connectedAddress],
  );

  const ownerRead = useReadContract({
    address: config.address,
    abi: config.abi,
    functionName: "owner",
  });

  const revealedRead = useReadContract({
    address: config.address,
    abi: config.abi,
    functionName: "revealed",
  });

  const metadataLockedRead = useReadContract({
    address: config.address,
    abi: config.abi,
    functionName: "metadataLocked",
  });

  const unrevealedUriRead = useReadContract({
    address: config.address,
    abi: config.abi,
    functionName: "unrevealedURI",
  });

  const revealedBaseUriRead = useReadContract({
    address: config.address,
    abi: config.abi,
    functionName: "revealedBaseURI",
  });

  const baseExtensionRead = useReadContract({
    address: config.address,
    abi: config.abi,
    functionName: "baseExtension",
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

  function refetchMetadataReads() {
    void ownerRead.refetch();
    void revealedRead.refetch();
    void metadataLockedRead.refetch();
    void unrevealedUriRead.refetch();
    void revealedBaseUriRead.refetch();
    void baseExtensionRead.refetch();
  }

  useEffect(() => {
    if (receipt.isSuccess) {
      refetchMetadataReads();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receipt.isSuccess]);

  const ownerAddress =
    typeof ownerRead.data === "string" ? ownerRead.data : undefined;
  const revealed =
    typeof revealedRead.data === "boolean" ? revealedRead.data : undefined;
  const metadataLocked =
    typeof metadataLockedRead.data === "boolean"
      ? metadataLockedRead.data
      : undefined;
  const unrevealedURI =
    typeof unrevealedUriRead.data === "string"
      ? unrevealedUriRead.data
      : undefined;
  const revealedBaseURI =
    typeof revealedBaseUriRead.data === "string"
      ? revealedBaseUriRead.data
      : undefined;
  const baseExtension =
    typeof baseExtensionRead.data === "string"
      ? baseExtensionRead.data
      : undefined;

  const revealedBaseUriIsPending = isPendingUri(revealedBaseURI);

  const actionDisabledBase =
    !isConnected ||
    !userIsExpectedOwner ||
    metadataLocked === true ||
    isWritePending ||
    receipt.isLoading;

  function confirmStandardAction({
    title,
    lines,
  }: {
    title: string;
    lines: string[];
  }) {
    return window.confirm(
      [
        "HIGH RISK METADATA ACTION",
        title,
        "",
        ...lines,
        "",
        "Only continue if the URI and metadata rendering have been reviewed.",
      ].join("\n"),
    );
  }

  function confirmLockMetadata() {
    const typed = window.prompt(
      [
        "CRITICAL IRREVERSIBLE ACTION",
        "Lock metadata permanently.",
        "",
        "This action cannot be undone.",
        "Only lock after revealed metadata is final, checked, and approved.",
        "",
        'Type "LOCK METADATA" to continue.',
      ].join("\n"),
    );

    return typed === "LOCK METADATA";
  }

  async function setUnrevealedURI() {
    const value = unrevealedInput.trim();

    if (!value) {
      return;
    }

    const confirmed = confirmStandardAction({
      title: `Set unrevealed URI for ${config.label}`,
      lines: [
        `Contract: ${config.address}`,
        `Current unrevealed URI: ${unrevealedURI ?? "—"}`,
        `New unrevealed URI: ${value}`,
      ],
    });

    if (!confirmed) {
      return;
    }

    setLastAction("setUnrevealedURI");

    await writeContractAsync({
      address: config.address,
      abi: config.abi,
      functionName: "setUnrevealedURI",
      args: [value],
    });
  }

  async function setRevealedBaseURI() {
    const value = revealedBaseInput.trim();

    if (!value) {
      return;
    }

    const confirmed = confirmStandardAction({
      title: `Set revealed base URI for ${config.label}`,
      lines: [
        `Contract: ${config.address}`,
        `Current revealed base URI: ${revealedBaseURI ?? "—"}`,
        `New revealed base URI: ${value}`,
        "",
        "Confirm trailing slash and metadata path format before signing.",
      ],
    });

    if (!confirmed) {
      return;
    }

    setLastAction("setRevealedBaseURI");

    await writeContractAsync({
      address: config.address,
      abi: config.abi,
      functionName: "setRevealedBaseURI",
      args: [value],
    });
  }

  async function setBaseExtension() {
    const value = baseExtensionInput.trim();

    const confirmed = confirmStandardAction({
      title: `Set base extension for ${config.label}`,
      lines: [
        `Contract: ${config.address}`,
        `Current base extension: ${baseExtension ?? "—"}`,
        `New base extension: ${value || "(empty string)"}`,
      ],
    });

    if (!confirmed) {
      return;
    }

    setLastAction("setBaseExtension");

    await writeContractAsync({
      address: config.address,
      abi: config.abi,
      functionName: "setBaseExtension",
      args: [value],
    });
  }

  async function setRevealed(nextValue: boolean) {
    if (nextValue && revealedBaseUriIsPending) {
      window.alert(
        "Reveal is blocked because revealedBaseURI is empty or still contains 'pending'. Set a final revealed base URI first.",
      );
      return;
    }

    const confirmed = confirmStandardAction({
      title: `${nextValue ? "Enable" : "Disable"} reveal for ${config.label}`,
      lines: [
        `Contract: ${config.address}`,
        `Current revealed state: ${formatBool(revealed)}`,
        `New revealed state: ${nextValue ? "Yes" : "No"}`,
        `Revealed base URI: ${revealedBaseURI ?? "—"}`,
      ],
    });

    if (!confirmed) {
      return;
    }

    setLastAction("setRevealed");

    await writeContractAsync({
      address: config.address,
      abi: config.abi,
      functionName: "setRevealed",
      args: [nextValue],
    });
  }

  async function lockMetadata() {
    if (!confirmLockMetadata()) {
      return;
    }

    setLastAction("lockMetadata");

    await writeContractAsync({
      address: config.address,
      abi: config.abi,
      functionName: "lockMetadata",
    });
  }

  return (
    <article className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-white/40">
            Metadata controls
          </p>
          <h3 className="mt-2 text-2xl font-semibold">{config.label}</h3>
          <p className="mt-2 max-w-2xl text-sm text-white/60">
            Update unrevealed URI, revealed base URI, base extension,
            reveal state, and final metadata lock.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-right">
          <div className="text-xs uppercase tracking-[0.2em] text-white/40">
            Locked
          </div>
          <div className="mt-1 text-lg font-semibold">
            {formatBool(metadataLocked)}
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 px-4">
        <ReadRow
          label="Owner"
          value={shortAddress(ownerAddress)}
          warning={
            ownerAddress &&
            !sameAddress(ownerAddress, EXPECTED_ADMIN_OWNER_ADDRESS)
              ? "Owner differs from expected admin."
              : undefined
          }
        />
        <ReadRow label="Revealed" value={formatBool(revealed)} />
        <ReadRow label="Metadata locked" value={formatBool(metadataLocked)} />
        <ReadRow label="Unrevealed URI" value={unrevealedURI ?? "—"} />
        <ReadRow
          label="Revealed base URI"
          value={revealedBaseURI ?? "—"}
          warning={
            revealedBaseUriIsPending
              ? "Reveal is blocked until this URI is final."
              : undefined
          }
        />
        <ReadRow label="Base extension" value={baseExtension ?? "—"} />
      </div>

      {metadataLocked ? (
        <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100/80">
          Metadata is locked. Write controls are disabled.
        </div>
      ) : null}

      {!userIsExpectedOwner ? (
        <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100/80">
          Write actions are disabled because the connected wallet is not the
          expected owner.
        </div>
      ) : null}

      <div className="mt-5 grid gap-4">
        <Field
          label="New unrevealed URI"
          description="Used while revealed=false."
          onChange={setUnrevealedInput}
          placeholder={unrevealedURI ?? "ipfs://..."}
          value={unrevealedInput}
        />

        <button
          className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 px-5 py-3 font-medium text-yellow-100 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={actionDisabledBase || unrevealedInput.trim() === ""}
          onClick={() => void setUnrevealedURI()}
          type="button">
          Set Unrevealed URI
        </button>

        <Field
          label="New revealed base URI"
          description="Used while revealed=true. Confirm trailing slash and token URI format."
          onChange={setRevealedBaseInput}
          placeholder={revealedBaseURI ?? "ipfs://.../"}
          value={revealedBaseInput}
        />

        <button
          className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 px-5 py-3 font-medium text-yellow-100 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={actionDisabledBase || revealedBaseInput.trim() === ""}
          onClick={() => void setRevealedBaseURI()}
          type="button">
          Set Revealed Base URI
        </button>

        <Field
          label="New base extension"
          description="Usually .json or empty string, depending on metadata path format."
          onChange={setBaseExtensionInput}
          placeholder={baseExtension ?? ".json"}
          value={baseExtensionInput}
        />

        <button
          className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 px-5 py-3 font-medium text-yellow-100 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={actionDisabledBase}
          onClick={() => void setBaseExtension()}
          type="button">
          Set Base Extension
        </button>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <button
          className="rounded-2xl border border-green-500/30 bg-green-500/10 px-5 py-3 font-medium text-green-100 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={
            actionDisabledBase || revealed === true || revealedBaseUriIsPending
          }
          onClick={() => void setRevealed(true)}
          type="button">
          Reveal Metadata
        </button>

        <button
          className="rounded-2xl border border-orange-500/30 bg-orange-500/10 px-5 py-3 font-medium text-orange-100 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={actionDisabledBase || revealed === false}
          onClick={() => void setRevealed(false)}
          type="button">
          Set Unrevealed
        </button>
      </div>

      <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
        <div className="font-medium text-red-100">Critical action</div>
        <p className="mt-2 text-sm text-red-100/80">
          Lock metadata is irreversible. Only use after final revealed metadata
          has been checked and approved.
        </p>

        <button
          className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-3 font-medium text-red-100 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={actionDisabledBase}
          onClick={() => void lockMetadata()}
          type="button">
          Lock Metadata
        </button>
      </div>

      {lastAction ? (
        <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm">
          <div className="font-medium">Last metadata action</div>
          <div className="mt-2 font-mono text-white/60">{lastAction}</div>
        </div>
      ) : null}

      {isWritePending ? (
        <div className="mt-5 rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4 text-sm text-blue-100/80">
          Waiting for wallet signature...
        </div>
      ) : null}

      <TxStatus
        chainSet={chainSet}
        errorMessage={writeError?.message}
        isError={receipt.isError}
        isLoading={receipt.isLoading}
        isSuccess={receipt.isSuccess}
        txHash={txHash}
      />
    </article>
  );
}

export function AdminMetadataControls({ chainSet }: { chainSet: ChainSet }) {
  const addresses = getContractAddresses(chainSet);

  const collections: MetadataCollectionConfig[] = [
    {
      key: "roty",
      label: chainSet === "base" ? "ROTY BASE" : "ROTY dETH",
      address: addresses.roty,
      abi: rotyAdminAbi,
    },
    {
      key: "melting",
      label: chainSet === "base" ? "Melting BASE" : "Melting dETH",
      address: addresses.melting,
      abi: gatedMintAdminAbi,
    },
    {
      key: "amanda",
      label: chainSet === "base" ? "Amanda BASE" : "Amanda dETH",
      address: addresses.amanda,
      abi: gatedMintAdminAbi,
    },
  ];

  return (
    <section className="grid gap-5">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <p className="text-sm uppercase tracking-[0.25em] text-white/50">
          Admin Writes
        </p>
        <h2 className="mt-2 text-2xl font-semibold">Metadata Controls</h2>
        <p className="mt-2 text-sm text-white/60">
          Owner-only controls for unrevealed URI, revealed base URI, token URI
          extension, reveal state, and irreversible metadata lock.
        </p>

        <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
          <div className="font-medium text-red-100">Critical reminder</div>
          <p className="mt-2 text-sm text-red-100/80">
            Do not reveal or lock metadata until final metadata has been checked
            on testnet and marketplace rendering has been reviewed.
          </p>
        </div>
      </section>

      {collections.map((collection) => (
        <MetadataCollectionControls
          chainSet={chainSet}
          config={collection}
          key={collection.key}
        />
      ))}
    </section>
  );
}
