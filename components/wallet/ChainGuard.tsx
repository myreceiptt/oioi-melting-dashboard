"use client";

import { type ReactNode } from "react";
import { useAccount, useSwitchChain } from "wagmi";
import { getRequiredChain } from "@/lib/wallet/chains";

export function ChainGuard({
  chainSet,
  children,
}: {
  chainSet: "base" | "ethereum";
  children: ReactNode;
}) {
  const requiredChain = getRequiredChain(chainSet);
  const { chain, isConnected } = useAccount();
  const { switchChain, isPending } = useSwitchChain();

  if (!isConnected) {
    return (
      <div className="rounded-2xl border border-white/10 bg-yellow-300 p-5 text-black">
        Connect your wallet to continue.
      </div>
    );
  }

  if (chain?.id !== requiredChain.id) {
    return (
      <div className="rounded-2xl border border-white/10 bg-yellow-300 p-5">
        <div className="font-medium text-black">Wrong chain</div>
        <p className="mt-1 text-sm text-black/70">
          This page requires {requiredChain.name}.
        </p>
        <button
          className="mt-4 rounded-xl bg-white px-4 py-2 text-sm font-medium text-black hover:bg-(--oioi-accent) hover:text-white disabled:opacity-50 cursor-pointer"
          disabled={isPending}
          type="button"
          onClick={() => switchChain({ chainId: requiredChain.id })}
        >
          Switch to {requiredChain.name}
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
