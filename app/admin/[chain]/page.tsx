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
import { AdminRewardRoundControls } from "@/components/admin/AdminRewardRoundControls";
import { AdminEmergencyRescueControls } from "@/components/admin/AdminEmergencyRescueControls";
import { InvalidPage } from "@/components/app/InvalidPage";

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
      <InvalidPage
        actionLabel="Back to Admin Home"
        eyebrow="Admin Dashboard"
        href="/admin"
        message="This admin chain does not exist. Please choose BASE or Ethereum from the admin home."
        title="Invalid admin page"
      />
    );
  }

  let adminConfig;

  try {
    adminConfig = getAdminChainConfig(chain);
  } catch (error) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-10">
        <Link className="text-sm text-white/70 underline" href="/admin">
          ← Back to Admin Home
        </Link>
        <section className="mt-6 rounded-3xl border border-white/10 bg-[#ff9b4a] p-6 text-black">
          <p className="text-sm uppercase tracking-[0.25em] text-black/70">
            Admin Configuration
          </p>
          <h1 className="mt-3 text-3xl font-semibold">
            Admin page cannot load this chain.
          </h1>
          <p className="mt-4 text-sm text-black/70">
            {error instanceof Error
              ? error.message
              : "Unexpected admin configuration error."}
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">
      <header className="rounded-3xl border border-white/10 bg-black p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <Link className="text-sm text-white/70 underline" href="/admin">
              ← Admin Home
            </Link>
            <p className="mt-5 text-sm uppercase tracking-[0.3em] text-white/70">
              Admin Dashboard
            </p>
            <h1 className="mt-3 text-4xl font-semibold">{adminConfig.label}</h1>
            <p className="mt-4 max-w-3xl text-white/70">
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
        <AdminRewardRoundControls chainSet={chain} />
        <AdminEmergencyRescueControls chainSet={chain} />
      </ChainGuard>
    </main>
  );
}
