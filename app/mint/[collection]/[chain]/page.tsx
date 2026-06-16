import { ConnectWalletButton } from "@/components/wallet/ConnectWalletButton";
import { ChainGuard } from "@/components/wallet/ChainGuard";
import { GatedMintPanel } from "@/components/mint/GatedMintPanel";
import { MintStatusCard } from "@/components/mint/MintStatusCard";
import { RotyMintPanel } from "@/components/mint/RotyMintPanel";
import { ResponsiveHash } from "@/components/app/ResponsiveHash";
import { StakeActionPanel } from "@/components/dashboard/StakeActionPanel";
import {
  getCollectionConfig,
  type CollectionKey,
} from "@/lib/contracts/collectionConfig";
import type { ChainSet } from "@/lib/chains/chainConfig";
import { InvalidMintPage } from "../../InvalidMintPage";

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
    return <InvalidMintPage />;
  }

  const config = getCollectionConfig(chain, collection);

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-6 py-10">
      <header className="rounded-3xl border border-white/10 bg-black p-6">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-white/70">
            NFT Mint Page
          </p>
          <h1 className="mt-3 text-4xl font-semibold">{config.judul}</h1>
          <p className="mt-4 max-w-3xl text-white/70">
            Symbol:{" "}
            <span className="font-mono text-sm text-white/70">
              {config.symbol}
            </span>
            · Chain:{" "}
            <span className="font-mono text-sm text-white/70">
              {config.requiredChainName}
            </span>
          </p>
          <p className="mt-4 max-w-3xl text-white/70">
            Contract Address:{" "}
            <span className="break-all font-mono text-sm text-white/70">
              <ResponsiveHash value={config.contractAddress} />
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
        <StakeActionPanel chainSet={chain} collectionKey={collection} />
      </ChainGuard>
    </main>
  );
}
