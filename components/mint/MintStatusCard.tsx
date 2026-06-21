"use client";

import type { CollectionConfig } from "@/lib/contracts/collectionConfig";
import { ResponsiveHash } from "@/components/app/ResponsiveHash";
import { useGatedEligibility } from "@/lib/hooks/useGatedEligibility";
import { useMintReadState } from "@/lib/hooks/useMintReadState";
import { formatBool, formatEth, formatNumber } from "@/lib/utils/format";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-black/40 py-3 last:border-b-0">
      <div className="text-sm text-black/70">{label}</div>
      <div className="text-right font-mono text-sm text-black">{value}</div>
    </div>
  );
}

export function MintStatusCard({ config }: { config: CollectionConfig }) {
  const mintState = useMintReadState(config);
  const eligibility = useGatedEligibility(config);
  const isRefreshing =
    mintState.isFetching ||
    (config.mintType === "gated" && eligibility.isFetching);

  function handleRefresh() {
    mintState.refetch();

    if (config.mintType === "gated") {
      void eligibility.refetch();
    }
  }

  if (mintState.error) {
    return (
      <div className="min-w-0 overflow-hidden rounded-3xl border border-white/10 bg-yellow-300 p-6">
        <h2 className="text-xl font-semibold text-black">
          Contract read failed.
        </h2>
        <p className="mt-2 max-w-full break-all whitespace-pre-wrap text-sm text-black/70">
          {mintState.error.message}
        </p>
      </div>
    );
  }

  return (
    <>
      <section className="rounded-3xl border border-white/10 bg-black p-6">
        <p className="text-sm uppercase tracking-[0.25em] text-white/70">
          NFT Mint Card
        </p>
        <h2 className="mt-2 text-2xl font-semibold">{config.name} Mint</h2>
        <p className="mt-2 text-sm text-white/70">
          This card is for the NFT minting. Transaction forms available in the
          write sections.
        </p>
      </section>

      <article className="min-w-0 rounded-3xl border border-white/10 bg-black p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-white/70">
              Live Contract State
            </p>
            <h2 className="mt-2 text-2xl font-semibold">{config.name}</h2>
            <p className="mt-2 text-sm text-white/70">
              Contract Address:{" "}
              <span className="break-all font-mono text-sm text-white/70">
                <ResponsiveHash value={config.contractAddress} />
              </span>
            </p>
          </div>
          <div className="grid rounded-2xl border border-white/10 bg-black p-1">
            <button
              className="cursor-pointer rounded-xl px-4 py-2 text-sm hover:bg-(--oioi-accent) disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-black"
              disabled={isRefreshing}
              type="button"
              onClick={handleRefresh}>
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        {mintState.isLoading ? (
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/70 p-4 text-black">
            Loading contract state...
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/70 px-4 text-black">
            <Row
              label="Total minted"
              value={formatNumber(mintState.totalMinted)}
            />
            <Row
              label="Remaining supply"
              value={formatNumber(mintState.remainingSupply)}
            />
            <Row label="Max supply" value={formatNumber(mintState.maxSupply)} />
            <Row
              label="Max mint per tx"
              value={formatNumber(mintState.maxMintPerTx)}
            />
            <Row label="Mint price" value={formatEth(mintState.mintPrice)} />
            <Row label="Revealed" value={formatBool(mintState.revealed)} />
            <Row
              label="Metadata locked"
              value={formatBool(mintState.metadataLocked)}
            />

            {config.mintType === "roty" ? (
              <>
                <Row
                  label="Whitelist mint enabled"
                  value={formatBool(mintState.whitelistMintEnabled)}
                />
                <Row
                  label="Public mint enabled"
                  value={formatBool(mintState.publicMintEnabled)}
                />
                <Row
                  label="This wallet whitelist claimed"
                  value={formatBool(mintState.whitelistClaimed)}
                />
              </>
            ) : (
              <>
                <Row
                  label="Gated mint enabled"
                  value={formatBool(mintState.gatedMintEnabled)}
                />
                <Row
                  label="This wallet eligible"
                  value={formatBool(eligibility.eligible)}
                />
              </>
            )}
          </div>
        )}

        {config.mintType === "gated" ? (
          <div className="mt-4 rounded-2xl border border-white/10 bg-yellow-300 p-4 text-sm text-black">
            {eligibility.reason}
          </div>
        ) : null}
      </article>
    </>
  );
}
