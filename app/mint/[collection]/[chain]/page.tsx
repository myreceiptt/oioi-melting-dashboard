import Link from "next/link";
import { ConnectWalletButton } from "@/components/wallet/ConnectWalletButton";
import { ChainGuard } from "@/components/wallet/ChainGuard";
import { GatedMintPanel } from "@/components/mint/GatedMintPanel";
import { MintStatusCard } from "@/components/mint/MintStatusCard";
import { RotyMintPanel } from "@/components/mint/RotyMintPanel";
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
        <h1 className="text-3xl font-semibold">Invalid mint page.</h1>
        <Link
          className="mt-4 inline-block underline"
          href="https://softstaking.endhonesa.com/">
          Go to Dashboard
        </Link>
      </main>
    );
  }

  const config = getCollectionConfig(chain, collection);

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-6 py-10">
      <header className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-white/50">
            NFT Mint Page
          </p>
          <h1 className="mt-3 text-4xl font-semibold">{config.judul}</h1>
          <p className="mt-4 max-w-3xl text-white/60">
            Symbol:{" "}
            <span className="mt-4 font-mono text-sm text-white/40">
              {config.symbol}
            </span>
            · Chain:{" "}
            <span className="mt-4 font-mono text-sm text-white/40">
              {config.requiredChainName}
            </span>
          </p>
          <p className="mt-4 max-w-3xl text-white/60">
            Contract Address:{" "}
            <span className="mt-4 break-all font-mono text-sm text-white/40">
              {config.contractAddress}
            </span>
          </p>
        </div>
        <div className="mt-6">
          <ConnectWalletButton />
        </div>
      </header>

      <ChainGuard chainSet={chain}>
        <section className="grid gap-5">
          <MintStatusCard config={config} />
          {config.collectionKey === "roty" ? (
            <RotyMintPanel config={config} />
          ) : (
            <GatedMintPanel config={config} />
          )}
        </section>
      </ChainGuard>
    </main>
  );
}
