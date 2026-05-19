"use client";

import { useMemo } from "react";
import { useAccount } from "wagmi";
import { EXPECTED_ADMIN_OWNER_ADDRESS } from "@/lib/admin/adminContractConfig";
import { shortAddress } from "@/lib/utils/format";

function sameAddress(a: string | undefined, b: string | undefined) {
  if (!a || !b) {
    return false;
  }

  return a.toLowerCase() === b.toLowerCase();
}

export function AdminOwnerGate() {
  const { address, isConnected } = useAccount();

  const isExpectedOwner = useMemo(
    () => sameAddress(address, EXPECTED_ADMIN_OWNER_ADDRESS),
    [address],
  );

  if (!isConnected) {
    return (
      <section className="rounded-3xl border border-yellow-500/30 bg-yellow-500/10 p-6">
        <h2 className="font-semibold text-yellow-100">
          Admin wallet required.
        </h2>
        <p className="mt-2 text-sm text-yellow-100/80">
          Connect the owner/deployer wallet before using admin controls. Admin
          writes actions will stay disabled for this wallet.
        </p>
        <div className="mt-4 grid gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm md:grid-cols-2">
          <div className="text-white/60">Expected Owner</div>
          <div className="mt-1 font-mono">{EXPECTED_ADMIN_OWNER_ADDRESS}</div>
        </div>
      </section>
    );
  }

  if (!isExpectedOwner) {
    return (
      <section className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6">
        <h2 className="font-semibold text-red-100">Read-only admin view.</h2>
        <p className="mt-2 text-sm text-red-100/80">
          The connected wallet is not the expected owner. Admin writes actions
          will stay disabled for this wallet.
        </p>

        <div className="mt-4 grid gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm md:grid-cols-2">
          <div>
            <div className="text-white/60">Connected Wallet</div>
            <div className="mt-1 font-mono">{shortAddress(address)}</div>
          </div>
          <div>
            <div className="text-white/60">Expected Owner</div>
            <div className="mt-1 font-mono">
              {shortAddress(EXPECTED_ADMIN_OWNER_ADDRESS)}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-green-500/30 bg-green-500/10 p-6">
      <h2 className="font-semibold text-green-100">Owner wallet connected.</h2>
      <p className="mt-2 text-sm text-green-100/80">
        Admin write actions will stay enabled for this wallet. Review every
        action carefully before signing.
      </p>

      <div className="mt-4 grid gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm md:grid-cols-2">
        <div>
          <div className="text-white/60">Connected Wallet</div>
          <div className="mt-1 font-mono">{shortAddress(address)}</div>
        </div>
        <div>
          <div className="text-white/60">Expected Owner</div>
          <div className="mt-1 font-mono">
            {shortAddress(EXPECTED_ADMIN_OWNER_ADDRESS)}
          </div>
        </div>
      </div>
    </section>
  );
}
