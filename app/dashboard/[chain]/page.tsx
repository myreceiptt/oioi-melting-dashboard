import { ConnectWalletButton } from "@/components/wallet/ConnectWalletButton";
import { ChainGuard } from "@/components/wallet/ChainGuard";
import type { ChainSet } from "@/lib/chains/chainConfig";
import { getChainCollections } from "@/lib/contracts/collectionConfig";

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
        <h1 className="text-3xl font-semibold">Invalid dashboard chain</h1>
      </main>
    );
  }

  const collections = getChainCollections(chain);

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-6 py-10">
      <header className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <p className="text-sm uppercase tracking-[0.3em] text-white/50">
          Soft Staking
        </p>
        <h1 className="mt-3 text-4xl font-semibold">
          {chain.toUpperCase()} Dashboard
        </h1>
        <div className="mt-6">
          <ConnectWalletButton />
        </div>
      </header>

      <ChainGuard chainSet={chain}>
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold">Supported collections</h2>
          <div className="mt-4 grid gap-3">
            {collections.map((collection) => (
              <div
                className="rounded-2xl border border-white/10 bg-black/20 p-4"
                key={collection.contractAddress}>
                <div className="font-medium">{collection.name}</div>
                <div className="mt-1 text-sm text-white/60">
                  {collection.symbol}
                </div>
                <div className="mt-2 break-all font-mono text-xs text-white/40">
                  {collection.contractAddress}
                </div>
              </div>
            ))}
          </div>
        </section>
      </ChainGuard>
    </main>
  );
}
