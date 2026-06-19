import Link from "next/link";
import { ConnectWalletButton } from "@/components/wallet/ConnectWalletButton";
import { ChainGuard } from "@/components/wallet/ChainGuard";
import { DashboardReadPanel } from "@/components/dashboard/DashboardReadPanel";
import { RewardClaimPanel } from "@/components/dashboard/RewardClaimPanel";
import { StakeActionPanel } from "@/components/dashboard/StakeActionPanel";
import type { ChainSet } from "@/lib/chains/chainConfig";
import { InvalidPage } from "@/components/app/InvalidPage";

const allowedChains = ["base", "ethereum"] as const;

function isChainSet(value: string): value is ChainSet {
  return allowedChains.includes(value as ChainSet);
}

export default async function ChainDashboardPage({
  params,
}: {
  params: Promise<{ chain: string }>;
}) {
  const { chain } = await params;

  if (!isChainSet(chain)) {
    return (
      <InvalidPage
        actionLabel="Back to Dashboard Home"
        eyebrow="User Dashboard"
        href="/dashboard"
        message="This dashboard chain does not exist. Please choose BASE or Ethereum from the dashboard home."
        title="Invalid dashboard page"
      />
    );
  }

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">
      <header className="rounded-3xl border border-white/10 bg-black p-6">
        <div>
          <Link className="text-sm text-white/70 underline" href="/dashboard">
            ← Dashboard Home
          </Link>
          <p className="mt-5 text-sm uppercase tracking-[0.3em] text-white/70">
            User Dashboard
          </p>
          <h1 className="mt-3 text-4xl font-semibold">
            {chain.toUpperCase()} Dashboard
          </h1>
          <p className="mt-4 max-w-3xl text-white/70">
            All only for the expected holder.
          </p>
        </div>

        <div className="mt-6">
          <ConnectWalletButton />
        </div>
      </header>

      <ChainGuard chainSet={chain}>
        <section className="grid gap-5" id="read-panel">
          <DashboardReadPanel chainSet={chain} />
        </section>
        <StakeActionPanel chainSet={chain} />
        <RewardClaimPanel chainSet={chain} />
      </ChainGuard>
    </main>
  );
}
