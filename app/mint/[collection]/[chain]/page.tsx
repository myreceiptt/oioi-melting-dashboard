import { ConnectWalletButton } from "@/components/wallet/ConnectWalletButton";
import { ChainGuard } from "@/components/wallet/ChainGuard";

const allowedCollections = ["roty", "melting", "amanda"] as const;
const allowedChains = ["base", "ethereum"] as const;

type Collection = (typeof allowedCollections)[number];
type ChainSet = (typeof allowedChains)[number];

function isCollection(value: string): value is Collection {
  return allowedCollections.includes(value as Collection);
}

function isChainSet(value: string): value is ChainSet {
  return allowedChains.includes(value as ChainSet);
}

export default async function MintPage({
  params,
}: {
  params: Promise<{ collection: string; chain: string }>;
}) {
  const { collection, chain } = await params;

  if (!isCollection(collection) || !isChainSet(chain)) {
    return (
      <main className="mx-auto min-h-screen max-w-4xl px-6 py-10">
        <h1 className="text-3xl font-semibold">Invalid mint page</h1>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-6 py-10">
      <header className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <p className="text-sm uppercase tracking-[0.3em] text-white/50">
          Mint Page
        </p>
        <h1 className="mt-3 text-4xl font-semibold">
          {collection.toUpperCase()} / {chain.toUpperCase()}
        </h1>
        <div className="mt-6">
          <ConnectWalletButton />
        </div>
      </header>

      <ChainGuard chainSet={chain}>
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold">Mint panel placeholder</h2>
          <p className="mt-2 text-white/60">
            Contract reads and mint actions will be added in the next phase.
          </p>
        </section>
      </ChainGuard>
    </main>
  );
}
