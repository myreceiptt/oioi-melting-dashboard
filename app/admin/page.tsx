import Link from "next/link";
import { ConnectWalletButton } from "@/components/wallet/ConnectWalletButton";

export default function AdminHomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-6 py-10">
      <header className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div>
          <Link className="text-sm text-white/50 underline" href="/">
            ← Back to Home
          </Link>
          <p className="mt-5 text-sm uppercase tracking-[0.3em] text-white/50">
            OiOi Melting Dashboard
          </p>
          <h1 className="mt-3 text-4xl font-semibold">Admin Dashboard</h1>
          <p className="mt-4 max-w-3xl text-white/60">
            Owner-only operational surface for the mint, metadata, staking,
            reward, and emergency controls.
          </p>
        </div>
        <div className="mt-6">
          <ConnectWalletButton />
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <Link
          className="rounded-3xl border border-white/10 bg-white/5 p-6 hover:bg-white/10"
          href="/admin/base">
          <div className="text-xl font-semibold">BASE Admin</div>
          <p className="mt-2 text-sm text-white/60">
            Manage BASE contracts based on the current environment.
          </p>
        </Link>

        <Link
          className="rounded-3xl border border-white/10 bg-white/5 p-6 hover:bg-white/10"
          href="/admin/ethereum">
          <div className="text-xl font-semibold">Ethereum Admin</div>
          <p className="mt-2 text-sm text-white/60">
            Manage Ethereum contracts based on the current environment.
          </p>
        </Link>
      </section>

      <section className="rounded-3xl border border-yellow-500/30 bg-yellow-500/10 p-6">
        <h2 className="font-semibold text-yellow-100">Safety Note:</h2>
        <p className="mt-2 text-sm text-yellow-100/80">
          This skeleton does for execute admin writes. Always pay close
          attention to each write forms, warnings, and confirmation modals
          displayed.
        </p>
      </section>
    </main>
  );
}
