import { ConnectWalletButton } from "@/components/wallet/ConnectWalletButton";
import { ChainGuard } from "@/components/wallet/ChainGuard";
import { MintStatusCard } from "@/components/mint/MintStatusCard";
import {
  getCollectionConfig,
  type CollectionKey,
} from "@/lib/contracts/collectionConfig";
import type { ChainSet } from "@/lib/chains/chainConfig";

const allowedCollections = ["roty", "melting", "amanda"] as const;
const allowedChains = ["base", "ethereum"] as const;

function isCollection(value: string): value is CollectionKey {
  return allowedCollections.includes(value as CollectionKey);
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

  const config = getCollectionConfig(chain, collection);

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-6 py-10">
      <header className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <p className="text-sm uppercase tracking-[0.3em] text-white/50">
          Mint Page
        </p>
        <h1 className="mt-3 text-4xl font-semibold">{config.name}</h1>
        <p className="mt-2 font-mono text-sm text-white/50">
          {config.symbol} · {config.requiredChainName}
        </p>
        <p className="mt-2 break-all font-mono text-xs text-white/40">
          {config.contractAddress}
        </p>
        <div className="mt-6">
          <ConnectWalletButton />
        </div>
      </header>

      <ChainGuard chainSet={chain}>
        <MintStatusCard config={config} />
      </ChainGuard>
    </main>
  );
}
