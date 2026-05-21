import Link from "next/link";
import { ConnectWalletButton } from "@/components/wallet/ConnectWalletButton";
import { ChainGuard } from "@/components/wallet/ChainGuard";
import { DashboardReadPanel } from "@/components/dashboard/DashboardReadPanel";
import { RewardClaimPlaceholder } from "@/components/dashboard/RewardClaimPlaceholder";
import { RewardClaimPanel } from "@/components/dashboard/RewardClaimPanel";
import { StakeActionPanel } from "@/components/dashboard/StakeActionPanel";
import type { ChainSet } from "@/lib/chains/chainConfig";

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
      <main className="mx-auto min-h-screen max-w-4xl px-6 py-10">
        <h1 className="text-3xl font-semibold">Invalid dashboard chain.</h1>
        <Link className="mt-4 inline-block underline" href="/dashboard">
          Back to Dashboard Home.
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-6 py-10">
      <header className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <Link className="text-sm text-white/50 underline" href="/dashboard">
              ← Dashboard Home
            </Link>
            <p className="mt-5 text-sm uppercase tracking-[0.3em] text-white/50">
              User Dashboard
            </p>
            <h1 className="mt-3 text-4xl font-semibold">
              {chain.toUpperCase()} Dashboard
            </h1>
            <p className="mt-4 max-w-3xl text-white/60">
              Read-only staking summary, and stake or unstake owned NFT, also
              claim the OiOi rewards, all only for the expected holder.
            </p>
          </div>

          <ConnectWalletButton />
        </div>
      </header>

      <ChainGuard chainSet={chain}>
        <DashboardReadPanel chainSet={chain} />
        <StakeActionPanel chainSet={chain} />
        <RewardClaimPanel chainSet={chain} />
        <RewardClaimPlaceholder chainSet={chain} />
      </ChainGuard>
    </main>
  );
}
