import type { AdminContractConfig } from "@/lib/admin/adminTypes";
import type { ChainSet } from "@/lib/chains/chainConfig";
import { ResponsiveHash } from "@/components/app/ResponsiveHash";
import { getAddressUrl } from "@/lib/services/explorer";
import { shortAddress } from "@/lib/utils/format";

function riskBadgeClass(risk: string) {
  if (risk === "critical") {
    return "border-white/10 bg-[#ff9b4a] text-black";
  }

  if (risk === "high") {
    return "border-white/10 bg-yellow-300 text-black";
  }

  if (risk === "medium") {
    return "border-white/10 bg-white text-black";
  }

  if (risk === "low") {
    return "border-white/10 bg-[#b7f56d] text-black";
  }

  return "border-white/10 bg-white/70 text-black";
}

function ActionPill({ label, risk }: { label: string; risk: string }) {
  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs ${riskBadgeClass(risk)}`}>
      {label}
    </span>
  );
}

export function AdminContractList({
  chainSet,
  contracts,
}: {
  chainSet: ChainSet;
  contracts: AdminContractConfig[];
}) {
  return (
    <section className="grid gap-5 scroll-mt-30" id="contract-list">
      <section className="rounded-3xl border border-white/10 bg-black p-6">
        <p className="text-sm uppercase tracking-[0.25em] text-white/70">
          Contract List
        </p>
        <h2 className="mt-2 text-2xl font-semibold">Admin Contract List</h2>
        <p className="mt-2 text-sm text-white/70">
          Owner-only controls all these contracs. Every action requires
          confirmation and should be tested before implementing.
        </p>
      </section>

      {contracts.map((contract) => (
        <article
          className="min-w-0 rounded-3xl border border-white/10 bg-black p-6"
          key={contract.key}>
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-white/70">
                {contract.kind}
              </p>
              <h2 className="mt-2 text-2xl font-semibold">{contract.label}</h2>
              <p className="mt-2 max-w-2xl text-sm text-white/70">
                {contract.description}
              </p>
            </div>

            <div className="grid rounded-2xl border border-white/10 bg-black p-1">
              <a
                className="grid rounded-xl px-4 py-2 text-center text-sm hover:bg-(--oioi-accent)"
                href={getAddressUrl(chainSet, contract.address)}
                rel="noreferrer"
                target="_blank">
                View {contract.explorerLabel}
              </a>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-white/70 p-4 text-black">
            <div className="text-sm text-black/70">Contract address</div>
            <div className="mt-1 break-all font-mono text-sm text-black">
              <ResponsiveHash value={contract.address} />
            </div>
            <div className="mt-2 text-xs text-black/60">
              {shortAddress(contract.address)}
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/70 p-4 text-black">
              <div className="font-medium">Read actions</div>
              <p className="mt-1 text-sm text-black/70">
                Diagnostic state available to admin UI.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {contract.readActions.map((action) => (
                  <ActionPill
                    key={action.key}
                    label={action.label}
                    risk={action.risk}
                  />
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/70 p-4 text-black">
              <div className="font-medium">Write actions</div>
              <p className="mt-1 text-sm text-black/70">
                Transaction forms available in the write sections.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {contract.writeActions.map((action) => (
                  <ActionPill
                    key={action.key}
                    label={action.label}
                    risk={action.risk}
                  />
                ))}
              </div>
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}
