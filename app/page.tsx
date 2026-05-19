import Link from "next/link";
import { ConnectWalletButton } from "@/components/wallet/ConnectWalletButton";

const mintLinks = [
  {
    // href: "/mint/roty/base",
    href: "https://rotybase.endhonesa.com/",
    target: "_blank",
    title: "ROTY BASE Mint",
    description: "Mint ROTY BASE on BASE blockchain.",
  },
  {
    // href: "/mint/roty/ethereum",
    href: "https://rotydeth.endhonesa.com/",
    target: "_blank",
    title: "ROTY dETH Mint",
    description: "Mint ROTY dETH on Ethereum blockchain.",
  },
  {
    // href: "/mint/melting/base",
    href: "https://meltingbase.endhonesa.com/",
    target: "_blank",
    title: "Melting BASE Mint",
    description: "Mint Melting BASE on BASE blockchain.",
  },
  {
    // href: "/mint/melting/ethereum",
    href: "https://meltingdeth.endhonesa.com/",
    target: "_blank",
    title: "Melting dETH Mint",
    description: "Mint Melting dETH on Ethereum blockchain.",
  },
  {
    // href: "/mint/amanda/base",
    href: "https://amandabase.endhonesa.com/",
    target: "_blank",
    title: "Amanda BASE Mint",
    description: "Mint Amanda BASE on BASE blockchain.",
  },
  {
    // href: "/mint/amanda/ethereum",
    href: "https://amandadeth.endhonesa.com/",
    target: "_blank",
    title: "Amanda dETH Mint",
    description: "Mint Amanda dETH on Ethereum blockchain.",
  },
];

const dashboardLinks = [
  {
    href: "/dashboard",
    title: "Dashboard Home",
    description: "Choose BASE or Ethereum dashboard.",
  },
  {
    href: "/dashboard/base",
    title: "BASE Dashboard",
    description: "Stake NFTs and claim $OiOi on BASE.",
  },
  {
    href: "/dashboard/ethereum",
    title: "Ethereum Dashboard",
    description: "Stake NFTs and claim $OiOi on Ethereum.",
  },
];

const adminLinks = [
  {
    href: "/admin",
    title: "Admin Home",
    description: "Owner-only operational overview for all admin surfaces.",
  },
  {
    href: "/admin/base",
    title: "BASE Admin",
    description: "Manage BASE contracts, mint phases, staking, and rewards.",
  },
  {
    href: "/admin/ethereum",
    title: "Ethereum Admin",
    description:
      "Manage Ethereum contracts, mint phases, staking, and rewards.",
  },
];

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-6 py-10">
      <header className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-white/50">
            NFT Minting, Soft Staking, and Claim Rewards.
          </p>
          <h1 className="mt-3 text-4xl font-semibold">
            OiOi Melting Dashboard
          </h1>
          <p className="mt-4 max-w-3xl text-white/60">
            Use only your Web3 wallet (EOA) to mint, stake, unstake, and claim
            rewards. Your key, your asset, OiOi!
          </p>
        </div>
        <div className="mt-6">
          <ConnectWalletButton />
        </div>
      </header>

      <section>
        <div className="mb-4">
          <h2 className="text-2xl font-semibold">NFT Mint Pages</h2>
          <p className="mt-2 text-sm text-white/60">
            Choose an NFT collection and its chain.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {mintLinks.map((link) => (
            <Link
              className="rounded-3xl border border-white/10 p-6 hover:bg-white/5"
              href={link.href}
              target={link.target}
              key={link.href}>
              <div className="text-lg font-semibold">{link.title}</div>
              <p className="mt-2 text-sm text-white/60">{link.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4">
          <h2 className="text-2xl font-semibold">User Dashboard</h2>
          <p className="mt-2 text-sm text-white/60">
            Stake, unstake, check valid stake status, review reward readiness,
            and claim it.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {dashboardLinks.map((link) => (
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
          <h2 className="text-2xl font-semibold">User Admin</h2>
          <p className="mt-2 text-sm text-white/60">
            Owner-only controls for mint phases, metadata, staking registry,
            reward rounds, and emergency actions.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {adminLinks.map((link) => (
            <Link
              className="rounded-3xl border border-yellow-500/30 bg-yellow-500/10 p-6 hover:bg-yellow-500/15"
              href={link.href}
              key={link.href}>
              <div className="text-lg font-semibold text-yellow-100">
                {link.title}
              </div>
              <p className="mt-2 text-sm text-yellow-100/70">
                {link.description}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
