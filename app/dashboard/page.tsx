import Link from "next/link";
import { ConnectWalletButton } from "@/components/wallet/ConnectWalletButton";

export default function DashboardPage() {
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">
      <header className="rounded-3xl border border-white/10 bg-black p-6">
        <div>
          <Link className="text-sm text-white/70 underline" href="/">
            ← Back to Home
          </Link>
          <p className="mt-5 text-sm uppercase tracking-[0.3em] text-white/70">
            OiOi Melting Dashboard
          </p>
          <h1 className="mt-3 text-4xl font-semibold">User Dashboard</h1>
          <p className="mt-4 max-w-3xl text-white/70">
            The holder-only operational surface for soft staking, unstaking, and
            claiming their OiOi rewards.
          </p>
        </div>
        <div className="mt-6">
          <ConnectWalletButton />
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-black p-2">
          <Link
            className="block w-full rounded-2xl p-4 hover:bg-(--oioi-accent)"
            href="/dashboard/base">
            <div className="text-xl font-semibold">BASE Dashboard</div>
            <p className="mt-2 text-sm text-white/70">
              Manage BASE assets based on the current reward round.
            </p>
          </Link>
        </div>

        <div className="rounded-3xl border border-white/10 bg-black p-2">
          <Link
            className="block w-full rounded-2xl p-4 hover:bg-(--oioi-accent)"
            href="/dashboard/ethereum">
            <div className="text-xl font-semibold">Ethereum Dashboard</div>
            <p className="mt-2 text-sm text-white/70">
              Manage Ethereum assets based on the current reward round.
            </p>
          </Link>
        </div>
      </section>
    </main>
  );
}
