import Link from "next/link";
import { AdminContractList } from "@/components/admin/AdminContractList";
import { AdminOwnerGate } from "@/components/admin/AdminOwnerGate";
import { ConnectWalletButton } from "@/components/wallet/ConnectWalletButton";
import { ChainGuard } from "@/components/wallet/ChainGuard";
import { getAdminChainConfig } from "@/lib/admin/adminContractConfig";
import type { ChainSet } from "@/lib/chains/chainConfig";
import { AdminReadCards } from "@/components/admin/AdminReadCards";
import { AdminMintPhaseControls } from "@/components/admin/AdminMintPhaseControls";
import { AdminRewardRoundControls } from "@/components/admin/AdminRewardRoundControls";

const allowedChains = ["base", "ethereum"] as const;

function isChainSet(value: string): value is ChainSet {
  return allowedChains.includes(value as ChainSet);
}

export default async function AdminChainPage({
  params,
}: {
  params: Promise<{ chain: string }>;
}) {
  const { chain } = await params;

  if (!isChainSet(chain)) {
    return (
      <main className="mx-auto min-h-screen max-w-4xl px-6 py-10">
        <h1 className="text-3xl font-semibold">Invalid admin chain</h1>
        <Link className="mt-4 inline-block underline" href="/admin">
          Back to admin home
        </Link>
      </main>
    );
  }

  const adminConfig = getAdminChainConfig(chain);

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-6 py-10">
      <header className="rounded-3xl border border-white/10 bg-white/5 p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <Link className="text-sm text-white/50 underline" href="/admin">
              ← Admin home
            </Link>
            <p className="mt-5 text-sm uppercase tracking-[0.3em] text-white/50">
              Admin Dashboard
            </p>
            <h1 className="mt-3 text-4xl font-semibold">{adminConfig.label}</h1>
            <p className="mt-4 max-w-3xl text-white/60">
              Review contract state, risk levels, and available admin actions.
              Write forms are intentionally not active in this skeleton phase.
            </p>
          </div>

          <ConnectWalletButton />
        </div>
      </header>

      <ChainGuard chainSet={chain}>
        <AdminOwnerGate />
        <AdminReadCards chainSet={chain} />
        <AdminMintPhaseControls chainSet={chain} />
        <AdminRewardRoundControls chainSet={chain} />

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-semibold">Admin action map</h2>
          <p className="mt-2 text-sm text-white/60">
            This page maps every planned admin contract surface. Later stages
            will add read cards, transaction forms, warning tooltips, and
            confirmation modals.
          </p>
        </section>

        <AdminContractList chainSet={chain} contracts={adminConfig.contracts} />
      </ChainGuard>
    </main>
  );
}
