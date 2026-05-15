"use client";

import { useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";

export function ConnectWalletButton() {
  const [open, setOpen] = useState(false);
  const { address, isConnected, chain } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="text-sm text-white/60">Connected wallet</div>
        <div className="mt-1 font-mono text-sm">{address}</div>
        <div className="mt-1 text-sm text-white/60">
          Chain: {chain?.name ?? "Unknown"}
        </div>
        <button
          className="mt-3 rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
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
        className="rounded-2xl bg-white px-5 py-3 font-medium text-black hover:bg-white/80"
        type="button"
        onClick={() => setOpen(true)}>
        Connect Wallet
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-neutral-950 p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Connect wallet</h2>
                <p className="mt-1 text-sm text-white/60">
                  Required wallet compatibility, strict EOA-first identity.
                </p>
              </div>
              <button
                className="rounded-xl px-3 py-1 text-white/60 hover:bg-white/10"
                type="button"
                onClick={() => setOpen(false)}>
                ×
              </button>
            </div>

            <div className="mt-6 grid gap-3">
              {connectors.map((connector) => (
                <button
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left hover:bg-white/10 disabled:opacity-50"
                  disabled={isPending}
                  key={connector.uid}
                  type="button"
                  onClick={() => {
                    connect({ connector });
                    setOpen(false);
                  }}>
                  {connector.name}
                </button>
              ))}
            </div>

            <p className="mt-5 text-xs leading-relaxed text-white/50">
              No email login, no phone login, no passkey login, no social login,
              no embedded wallet, and no smart account in v1.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
