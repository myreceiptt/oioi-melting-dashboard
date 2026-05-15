import Link from "next/link";
import { ConnectWalletButton } from "@/components/wallet/ConnectWalletButton";

export default function DashboardPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-6 py-10">
      <header className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <p className="text-sm uppercase tracking-[0.3em] text-white/50">
          Dashboard
        </p>
        <h1 className="mt-3 text-4xl font-semibold">OiOi Melting Dashboard</h1>
        <div className="mt-6">
          <ConnectWalletButton />
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <Link
          className="rounded-3xl border border-white/10 p-6 hover:bg-white/5"
          href="/dashboard/base">
          Base Dashboard
        </Link>
        <Link
          className="rounded-3xl border border-white/10 p-6 hover:bg-white/5"
          href="/dashboard/ethereum">
          Ethereum Dashboard
        </Link>
      </section>
    </main>
  );
}
