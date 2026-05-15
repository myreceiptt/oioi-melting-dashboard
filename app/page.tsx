import Link from "next/link";
import { ConnectWalletButton } from "@/components/wallet/ConnectWalletButton";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-white/5 p-8">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-white/50">
            OiOi Melting Dashboard
          </p>
          <h1 className="mt-3 text-4xl font-semibold">
            Wallet-first minting, soft staking, and $OiOi rewards.
          </h1>
        </div>
        <ConnectWalletButton />
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <Link
          className="rounded-3xl border border-white/10 p-6 hover:bg-white/5"
          href="/mint/roty/base">
          ROTY BASE Mint
        </Link>
        <Link
          className="rounded-3xl border border-white/10 p-6 hover:bg-white/5"
          href="/mint/roty/ethereum">
          ROTY dETH Mint
        </Link>
        <Link
          className="rounded-3xl border border-white/10 p-6 hover:bg-white/5"
          href="/dashboard">
          Dashboard
        </Link>
      </section>
    </main>
  );
}
