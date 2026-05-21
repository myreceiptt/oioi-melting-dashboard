import Link from "next/link";
import { AdminContractList } from "@/components/admin/AdminContractList";
import { AdminOwnerGate } from "@/components/admin/AdminOwnerGate";
import { ConnectWalletButton } from "@/components/wallet/ConnectWalletButton";
import { ChainGuard } from "@/components/wallet/ChainGuard";
import { getAdminChainConfig } from "@/lib/admin/adminContractConfig";
import type { ChainSet } from "@/lib/chains/chainConfig";
import { AdminReadCards } from "@/components/admin/AdminReadCards";
import { AdminStakingRegistryControls } from "@/components/admin/AdminStakingRegistryControls";
import { AdminMintPhaseControls } from "@/components/admin/AdminMintPhaseControls";
import { AdminPricingTreasuryRoyaltyControls } from "@/components/admin/AdminPricingTreasuryRoyaltyControls";
import { AdminMetadataControls } from "@/components/admin/AdminMetadataControls";
import { AdminRewardRoundSupabasePanel } from "@/components/admin/AdminRewardRoundSupabasePanel";
import { AdminRewardRoundControls } from "@/components/admin/AdminRewardRoundControls";
import { AdminEmergencyRescueControls } from "@/components/admin/AdminEmergencyRescueControls";

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
        <h1 className="text-3xl font-semibold">Invalid admin chain.</h1>
        <Link className="mt-4 inline-block underline" href="/admin">
          Back to Admin Home.
        </Link>
      </main>
    );
  }

  const adminConfig = getAdminChainConfig(chain);

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-6 py-10">
      <header className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <Link className="text-sm text-white/50 underline" href="/admin">
              ← Admin Home
            </Link>
            <p className="mt-5 text-sm uppercase tracking-[0.3em] text-white/50">
              Admin Dashboard
            </p>
            <h1 className="mt-3 text-4xl font-semibold">{adminConfig.label}</h1>
            <p className="mt-4 max-w-3xl text-white/60">
              Review contract state, risk levels, and available admin actions.
              Write forms are intentionally provided only for the expected
              owner.
            </p>
          </div>

          <ConnectWalletButton />
        </div>
      </header>

      <ChainGuard chainSet={chain}>
        <AdminOwnerGate />
        <AdminContractList chainSet={chain} contracts={adminConfig.contracts} />
        <AdminReadCards chainSet={chain} />
        <AdminStakingRegistryControls chainSet={chain} />
        <AdminMintPhaseControls chainSet={chain} />
        <AdminPricingTreasuryRoyaltyControls chainSet={chain} />
        <AdminMetadataControls chainSet={chain} />
        <AdminRewardRoundSupabasePanel chainSet={chain} />
        <AdminRewardRoundControls chainSet={chain} />
        <AdminEmergencyRescueControls chainSet={chain} />
      </ChainGuard>
    </main>
  );
}
