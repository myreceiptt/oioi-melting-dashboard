"use client";

import { useEffect, useMemo, useState } from "react";
import type { Address } from "viem";
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
import { ResponsiveHash } from "@/components/app/ResponsiveHash";
import { formatBool, shortAddress } from "@/lib/utils/format";
import { sameAddress } from "@/lib/utils/address";

type PhaseControlConfig = {
  key: string;
  label: string;
  description: string;
  warning: string;
  contractLabel: string;
  address: Address;
  abi: typeof rotyAdminAbi | typeof gatedMintAdminAbi;
  readFunctionName:
    | "whitelistMintEnabled"
    | "publicMintEnabled"
    | "gatedMintEnabled";
  writeFunctionName:
    | "setWhitelistMintEnabled"
    | "setPublicMintEnabled"
    | "setGatedMintEnabled";
};

function isExpectedOwner(address: string | undefined) {
  return Boolean(address && sameAddress(address, EXPECTED_ADMIN_OWNER_ADDRESS));
}

function PhaseControlCard({
  chainSet,
  config,
}: {
  chainSet: ChainSet;
  config: PhaseControlConfig;
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

  const phaseState = useReadContract({
    address: config.address,
    abi: config.abi,
    functionName: config.readFunctionName,
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

  useEffect(() => {
    if (receipt.isSuccess) {
      void phaseState.refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receipt.isSuccess]);

  const currentValue =
    typeof phaseState.data === "boolean" ? phaseState.data : undefined;

  const txIsMining = Boolean(txHash && receipt.isLoading);
  const actionDisabled =
    !isConnected ||
    !userIsExpectedOwner ||
    currentValue === undefined ||
    isWritePending ||
    txIsMining;

  async function requestPhaseChange(nextValue: boolean) {
    if (!userIsExpectedOwner) {
      return;
    }

    const direction = nextValue ? "ENABLE" : "DISABLE";
    const actionLabel = `${direction} ${config.label}`;

    const confirmed = window.confirm(
      [
        actionLabel,
        "",
        config.warning,
        "",
        `Contract: ${config.contractLabel}`,
        `Address: ${config.address}`,
        `Current value: ${formatBool(currentValue)}`,
        `New value: ${nextValue ? "Yes" : "No"}`,
        "",
        "Only continue if you intentionally want to change this live contract state.",
      ].join("\n"),
    );

    if (!confirmed) {
      return;
    }

    setLastRequestedValue(nextValue);
    setLastActionLabel(actionLabel);

    await writeContractAsync({
      address: config.address,
      abi: config.abi,
      functionName: config.writeFunctionName,
      args: [nextValue],
    });
  }

  return (
    <article className="rounded-3xl border border-white/10 bg-black p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-white/70">
            Mint phase control
          </p>
          <h3 className="mt-2 text-2xl font-semibold">{config.label}</h3>
          <p className="mt-2 max-w-2xl text-sm text-white/70">
            {config.description}
          </p>
        </div>

        <div className="grid rounded-2xl border border-white/10 bg-black p-1">
          <button
            className="grid rounded-xl px-4 py-2 text-center text-sm hover:bg-(--oioi-accent) disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-black"
            disabled={phaseState.isFetching}
            onClick={() => void phaseState.refetch()}
            type="button">
            {phaseState.isFetching
              ? "Refreshing..."
              : `Current: ${formatBool(currentValue)}`}
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 rounded-2xl border border-white/10 bg-white/70 p-4 text-sm text-black md:grid-cols-2">
        <div>
          <div className="text-black/70">Contract</div>
          <div className="mt-1 font-mono">{config.contractLabel}</div>
        </div>
        <div>
          <div className="text-black/70">Address</div>
          <div className="mt-1 font-mono">{shortAddress(config.address)}</div>
        </div>
        <div>
          <div className="text-black/70">Connected wallet</div>
          <div className="mt-1 font-mono">{shortAddress(connectedAddress)}</div>
        </div>
        <div>
          <div className="text-black/70">Expected owner</div>
          <div className="mt-1 font-mono">
            {shortAddress(EXPECTED_ADMIN_OWNER_ADDRESS)}
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-yellow-300 p-4 text-black">
        <div className="font-medium">Operational warning</div>
        <p className="mt-2 text-sm text-black/70">{config.warning}</p>
      </div>

      {!userIsExpectedOwner ? (
        <div className="mt-5 rounded-2xl border border-white/10 bg-[#ff9b4a] p-4 text-sm text-black">
          Write actions are disabled because the connected wallet is not the
          expected owner.
        </div>
      ) : null}

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <button
          className="cursor-pointer rounded-2xl bg-white px-5 py-4 font-medium text-black hover:bg-(--oioi-accent) hover:text-white disabled:cursor-not-allowed disabled:bg-white disabled:text-black disabled:opacity-40"
          disabled={actionDisabled || currentValue === true}
          onClick={() => void requestPhaseChange(true)}
          type="button">
          Enable
        </button>

        <button
          className="cursor-pointer rounded-2xl bg-white px-5 py-4 font-medium text-black hover:bg-(--oioi-accent) hover:text-white disabled:cursor-not-allowed disabled:bg-white disabled:text-black disabled:opacity-40"
          disabled={actionDisabled || currentValue === false}
          onClick={() => void requestPhaseChange(false)}
          type="button">
          Disable
        </button>
      </div>

      {lastActionLabel ? (
        <div className="mt-5 rounded-2xl border border-white/10 bg-white/70 p-4 text-sm text-black">
          <div className="font-medium">Last requested action</div>
          <div className="mt-2 text-black/70">{lastActionLabel}</div>
          <div className="mt-1 text-black/70">
            Requested value: {lastRequestedValue ? "Yes" : "No"}
          </div>
        </div>
      ) : null}

      {isWritePending ? (
        <div className="mt-5 rounded-2xl border border-white/10 bg-yellow-300 p-4 text-sm text-black">
          Waiting for wallet signature...
        </div>
      ) : null}

      {txHash ? (
        <div className="mt-5 rounded-2xl border border-white/10 bg-white/70 p-4 text-sm text-black">
          <div className="font-medium">Transaction status</div>
          <a
            className="mt-2 block break-all font-mono underline underline-offset-4"
            href={getTxUrl(chainSet, txHash)}
            rel="noreferrer"
            target="_blank">
            <ResponsiveHash value={txHash} />
          </a>
          <div className="mt-1 text-black/70">
            {receipt.isLoading
              ? "Mining..."
              : receipt.isSuccess
                ? "Mined successfully. State refreshed."
                : receipt.isError
                  ? "Transaction failed or receipt error."
                  : "Submitted."}
          </div>
        </div>
      ) : null}

      {writeError ? (
        <div className="mt-5 min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-[#ff9b4a] p-4">
          <h4 className="font-medium text-black">Transaction failed</h4>
          <p className="mt-2 max-w-full break-all whitespace-pre-wrap text-sm text-black/70">
            {writeError.message}
          </p>
        </div>
      ) : null}

      {phaseState.error ? (
        <div className="mt-5 min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-[#ff9b4a] p-4">
          <h4 className="font-medium text-black">Contract read failed</h4>
          <p className="mt-2 max-w-full break-all whitespace-pre-wrap text-sm text-black/70">
            {phaseState.error.message}
          </p>
        </div>
      ) : null}
    </article>
  );
}

export function AdminMintPhaseControls({ chainSet }: { chainSet: ChainSet }) {
  const addresses = getContractAddresses(chainSet);

  const controls: PhaseControlConfig[] = [
    {
      key: "roty-whitelist",
      label: "ROTY Whitelist Mint",
      description:
        "Enable or disable free whitelist mint for whitelisted ROTY wallets.",
      warning:
        "Only enable after whitelist root, public proof file, frontend proof lookup, and final QA are confirmed.",
      contractLabel: chainSet === "base" ? "ROTY BASE" : "ROTY dETH",
      address: addresses.roty,
      abi: rotyAdminAbi,
      readFunctionName: "whitelistMintEnabled",
      writeFunctionName: "setWhitelistMintEnabled",
    },
    {
      key: "roty-public",
      label: "ROTY Public Mint",
      description: "Enable or disable paid public ROTY mint.",
      warning:
        "Only enable after pricing, treasury, supply, frontend, and monitoring are ready. Public mint allows paid minting.",
      contractLabel: chainSet === "base" ? "ROTY BASE" : "ROTY dETH",
      address: addresses.roty,
      abi: rotyAdminAbi,
      readFunctionName: "publicMintEnabled",
      writeFunctionName: "setPublicMintEnabled",
    },
    {
      key: "melting-gated",
      label: "Melting Gated Mint",
      description:
        "Enable or disable Melting paid gated mint for wallets with valid ROTY soft stake.",
      warning:
        "Only enable after ROTY staking eligibility, mint price, and frontend gated mint QA are confirmed.",
      contractLabel: chainSet === "base" ? "Melting BASE" : "Melting dETH",
      address: addresses.melting,
      abi: gatedMintAdminAbi,
      readFunctionName: "gatedMintEnabled",
      writeFunctionName: "setGatedMintEnabled",
    },
    {
      key: "amanda-gated",
      label: "Amanda Gated Mint",
      description:
        "Enable or disable Amanda paid gated mint for wallets with valid ROTY or Melting soft stake.",
      warning:
        "Only enable after ROTY and/or Melting staking eligibility, mint price, and frontend gated mint QA are confirmed.",
      contractLabel: chainSet === "base" ? "Amanda BASE" : "Amanda dETH",
      address: addresses.amanda,
      abi: gatedMintAdminAbi,
      readFunctionName: "gatedMintEnabled",
      writeFunctionName: "setGatedMintEnabled",
    },
  ];

  return (
    <section className="grid gap-5 scroll-mt-30" id="phase-controls">
      <section className="rounded-3xl border border-white/10 bg-black p-6">
        <p className="text-sm uppercase tracking-[0.25em] text-white/70">
          Admin Writes
        </p>
        <h2 className="mt-2 text-2xl font-semibold">Mint Phase Controls</h2>
        <p className="mt-2 text-sm text-white/70">
          Owner-only controls for whitelist, public, and gated mint phases.
          Every action requires confirmation and should be tested before
          opening.
        </p>
      </section>

      {controls.map((control) => (
        <PhaseControlCard
          chainSet={chainSet}
          config={control}
          key={control.key}
        />
      ))}
    </section>
  );
}
