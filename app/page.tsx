import Link from "next/link";
import { ConnectWalletButton } from "@/components/wallet/ConnectWalletButton";

const mintLinks = [
  {
    href: "/mint/roty/base",
    title: "ROTY BASE Mint",
    description: "Mint The ROTY BASE on Base Sepolia.",
  },
  {
    href: "/mint/roty/ethereum",
    title: "ROTY dETH Mint",
    description: "Mint The ROTY dETH on Ethereum Sepolia.",
  },
  {
    href: "/mint/melting/base",
    title: "The Melting Land BASE Mint",
    description: "Mint Melting BASE through valid ROTY soft staking.",
  },
  {
    href: "/mint/melting/ethereum",
    title: "The Melting Land dETH Mint",
    description: "Mint MELTING dETH through valid ROTY soft staking.",
  },
  {
    href: "/mint/amanda/base",
    title: "Amanda Wives BASE Mint",
    description: "Mint Amanda BASE through valid ROTY or Melting soft staking.",
  },
  {
    href: "/mint/amanda/ethereum",
    title: "Amanda Wives dETH Mint",
    description: "Mint Amanda dETH through valid ROTY or Melting soft staking.",
  },
];

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-white/5 p-8">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-white/50">
            OiOi Melting Dashboard
          </p>
          <h1 className="mt-3 text-4xl font-semibold">
            Wallet-first minting, soft staking, and $OiOi rewards.
          </h1>
          <p className="mt-4 max-w-3xl text-white/60">
            Connect your existing Web3 wallet. The same wallet is used to mint,
            stake, unstake, and claim.
          </p>
        </div>
        <ConnectWalletButton />
      </header>

      <section>
        <div className="mb-4">
          <h2 className="text-2xl font-semibold">Mint Pages</h2>
          <p className="mt-2 text-sm text-white/60">
            Choose a collection and chain.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {mintLinks.map((link) => (
            <Link
              className="rounded-3xl border border-white/10 p-6 hover:bg-white/5"
              href={link.href}
              key={link.href}>
              <div className="text-lg font-semibold">{link.title}</div>
              <p className="mt-2 text-sm text-white/60">{link.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4">
          <h2 className="text-2xl font-semibold">Dashboard</h2>
          <p className="mt-2 text-sm text-white/60">
            Stake, unstake, check valid stake status, and review $OiOi reward
            readiness.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Link
            className="rounded-3xl border border-white/10 p-6 hover:bg-white/5"
            href="/dashboard">
            <div className="text-lg font-semibold">Dashboard Home</div>
            <p className="mt-2 text-sm text-white/60">
              Choose Base or Ethereum dashboard.
            </p>
          </Link>

          <Link
            className="rounded-3xl border border-white/10 p-6 hover:bg-white/5"
            href="/dashboard/base">
            <div className="text-lg font-semibold">Base Dashboard</div>
            <p className="mt-2 text-sm text-white/60">
              Stake Base NFTs and review Base $OiOi reward status.
            </p>
          </Link>

          <Link
            className="rounded-3xl border border-white/10 p-6 hover:bg-white/5"
            href="/dashboard/ethereum">
            <div className="text-lg font-semibold">Ethereum Dashboard</div>
            <p className="mt-2 text-sm text-white/60">
              Stake Ethereum NFTs and review Ethereum $OiOi reward status.
            </p>
          </Link>
        </div>
      </section>
    </main>
  );
}
