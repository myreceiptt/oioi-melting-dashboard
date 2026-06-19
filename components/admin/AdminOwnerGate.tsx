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
      <section className="rounded-3xl border border-white/10 bg-yellow-300 p-6 text-black">
        <h2 className="font-semibold">Admin wallet required.</h2>
        <p className="mt-2 text-sm text-black/70">
          Connect the owner/deployer wallet before using admin controls. Admin
          writes actions will stay disabled for this wallet.
        </p>
        <div className="mt-5 grid gap-4 rounded-2xl border border-white/10 bg-white/70 p-4 text-sm md:grid-cols-2">
          <div className="text-black/70">Expected Owner</div>
          <div className="mt-1 break-all font-mono">
            {EXPECTED_ADMIN_OWNER_ADDRESS}
          </div>
        </div>
      </section>
    );
  }

  if (!isExpectedOwner) {
    return (
      <section className="rounded-3xl border border-white/10 bg-[#ff9b4a] p-6 text-black">
        <h2 className="font-semibold">Read-only admin view.</h2>
        <p className="mt-2 text-sm text-black/70">
          The connected wallet is not the expected owner. Admin writes actions
          will stay disabled for this wallet.
        </p>

        <div className="mt-5 grid gap-4 rounded-2xl border border-white/10 bg-white/70 p-4 text-sm md:grid-cols-2">
          <div>
            <div className="text-black/70">Connected Wallet</div>
            <div className="mt-1 font-mono">{shortAddress(address)}</div>
          </div>
          <div>
            <div className="text-black/70">Expected Owner</div>
            <div className="mt-1 font-mono">
              {shortAddress(EXPECTED_ADMIN_OWNER_ADDRESS)}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-[#b7f56d] p-6 text-black">
      <h2 className="font-semibold">Owner wallet connected.</h2>
      <p className="mt-2 text-sm text-black/70">
        Admin write actions will stay enabled for this wallet. Review every
        action carefully before signing.
      </p>

      <div className="mt-5 grid gap-4 rounded-2xl border border-white/10 bg-white/70 p-4 text-sm md:grid-cols-2">
        <div>
          <div className="text-black/70">Connected Wallet</div>
          <div className="mt-1 font-mono">{shortAddress(address)}</div>
        </div>
        <div>
          <div className="text-black/70">Expected Owner</div>
          <div className="mt-1 font-mono">
            {shortAddress(EXPECTED_ADMIN_OWNER_ADDRESS)}
          </div>
        </div>
      </div>
    </section>
  );
}
