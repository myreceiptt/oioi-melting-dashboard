"use client";

import { useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { ResponsiveHash } from "@/components/app/ResponsiveHash";

export function ConnectWalletButton() {
  const [open, setOpen] = useState(false);
  const { address, isConnected, chain } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/70 p-4">
        <div className="text-sm text-black/70">Connected wallet</div>
        <div className="mt-1 font-mono text-sm text-black">
          <ResponsiveHash value={address} />
        </div>
        <div className="mt-1 text-sm text-black/70">
          Chain: {chain?.name ?? "Unknown"}
        </div>
        <button
          className="mt-3 rounded-xl bg-white px-4 py-2 text-sm text-black hover:bg-(--oioi-accent) hover:text-white cursor-pointer"
          type="button"
          onClick={() => disconnect()}>
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        className="rounded-2xl bg-white px-5 py-3 font-medium text-black hover:bg-(--oioi-accent) hover:text-white cursor-pointer"
        type="button"
        onClick={() => setOpen(true)}>
        Connect Wallet
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-3xl border border-white/40 bg-(--oioi-bg) p-6 text-white shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Connect wallet</h2>
                <p className="mt-1 text-sm text-white">
                  Required wallet compatibility, strict EOA-first identity.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black p-1">
                <button
                  className="cursor-pointer rounded-xl px-3 py-1 text-white transition hover:bg-(--oioi-accent)"
                  type="button"
                  onClick={() => setOpen(false)}>
                  ×
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              {connectors.map((connector) => (
                <div
                  key={connector.uid}
                  className="rounded-2xl border border-white/10 bg-black p-1">
                  <button
                    className="cursor-pointer w-full rounded-xl px-4 py-3 text-left text-white hover:bg-(--oioi-accent) disabled:opacity-10"
                    disabled={isPending}
                    type="button"
                    onClick={() => {
                      connect({ connector });
                      setOpen(false);
                    }}>
                    {connector.name}
                  </button>
                </div>
              ))}
            </div>

            <p className="mt-5 text-xs leading-relaxed text-white">
              No email login, no phone login, no passkey login, no social login,
              no embedded wallet, and no smart account.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
