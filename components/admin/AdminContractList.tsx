import type { AdminContractConfig } from "@/lib/admin/adminTypes";
import type { ChainSet } from "@/lib/chains/chainConfig";
import { ResponsiveHash } from "@/components/app/ResponsiveHash";
import { getAddressUrl } from "@/lib/services/explorer";
import { shortAddress } from "@/lib/utils/format";

function riskBadgeClass(risk: string) {
  if (risk === "critical") {
    return "border-red-500/30 bg-red-500/10 text-red-100";
  }

  if (risk === "high") {
    return "border-orange-500/30 bg-orange-500/10 text-orange-100";
  }

  if (risk === "medium") {
    return "border-yellow-500/30 bg-yellow-500/10 text-yellow-100";
  }

  if (risk === "low") {
    return "border-blue-500/30 bg-blue-500/10 text-blue-100";
  }

  return "border-white/10 bg-white/5 text-white/70";
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
    <section className="grid gap-5" id="contract-list">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <p className="text-sm uppercase tracking-[0.25em] text-white/50">
          Contract List
        </p>
        <h2 className="mt-2 text-2xl font-semibold">Admin Contract List</h2>
        <p className="mt-2 text-sm text-white/60">
          Owner-only controls all these contracs. Every action requires
          confirmation and should be tested before implementing.
        </p>
      </section>

      {contracts.map((contract) => (
        <article
          className="rounded-3xl border border-white/10 bg-white/5 p-6"
          key={contract.key}>
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-white/40">
                {contract.kind}
              </p>
              <h2 className="mt-2 text-2xl font-semibold">{contract.label}</h2>
              <p className="mt-2 max-w-2xl text-sm text-white/60">
                {contract.description}
              </p>
            </div>

            <a
              className="rounded-2xl border border-white/10 px-4 py-2 text-sm hover:bg-white/5"
              href={getAddressUrl(chainSet, contract.address)}
              rel="noreferrer"
              target="_blank">
              View {contract.explorerLabel}
            </a>
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-sm text-white/60">Contract address</div>
            <div className="mt-1 break-all font-mono text-sm">
              <ResponsiveHash value={contract.address} />
            </div>
            <div className="mt-2 text-xs text-white/40">
              {shortAddress(contract.address)}
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="font-medium">Read actions</div>
              <p className="mt-1 text-sm text-white/50">
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

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="font-medium">Write actions</div>
              <p className="mt-1 text-sm text-white/50">
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
