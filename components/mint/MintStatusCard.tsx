"use client";

import type { CollectionConfig } from "@/lib/contracts/collectionConfig";
import { ResponsiveHash } from "@/components/app/ResponsiveHash";
import { useGatedEligibility } from "@/lib/hooks/useGatedEligibility";
import { useMintReadState } from "@/lib/hooks/useMintReadState";
import { formatBool, formatEth, formatNumber } from "@/lib/utils/format";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/10 py-3 last:border-b-0">
      <div className="text-sm text-white/60">{label}</div>
      <div className="text-right font-mono text-sm">{value}</div>
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
      <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6">
        <h2 className="text-xl font-semibold">Contract read failed.</h2>
        <p className="mt-2 wrap-break-word text-sm text-red-100/80">
          {mintState.error.message}
        </p>
      </div>
    );
  }

  return (
    <>
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <p className="text-sm uppercase tracking-[0.25em] text-white/50">
          NFT Mint Card
        </p>
        <h2 className="mt-2 text-2xl font-semibold">{config.name} Mint</h2>
        <p className="mt-2 text-sm text-white/60">
          This card is for the NFT minting. Transaction forms available in the
          write sections.
        </p>
      </section>

      <article className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-white/40">
              Live Contract State
            </p>
            <h2 className="mt-2 text-2xl font-semibold">{config.name}</h2>
            <p className="mt-2 text-sm text-white/60">
              Contract Address:{" "}
              <span className="break-all font-mono text-sm text-white/40">
                <ResponsiveHash value={config.contractAddress} />
              </span>
            </p>
          </div>
          <button
            className="rounded-2xl border border-white/10 px-4 py-2 text-sm hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={isRefreshing}
            type="button"
            onClick={handleRefresh}>
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {mintState.isLoading ? (
          <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4 text-white/60">
            Loading contract state...
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 px-4">
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
          <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/60">
            {eligibility.reason}
          </div>
        ) : null}
      </article>
    </>
  );
}
