"use client";

import { http, createConfig } from "wagmi";
import { base, baseSepolia, mainnet, sepolia } from "wagmi/chains";
import {
  coinbaseWallet,
  injected,
  metaMask,
  walletConnect,
} from "wagmi/connectors";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

if (!projectId) {
  console.warn("Missing NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID");
}

export const wagmiConfig = createConfig({
  chains: [base, mainnet, baseSepolia, sepolia],
  connectors: [
    injected(),
    metaMask(),
    walletConnect({
      projectId: projectId || "MISSING_PROJECT_ID",
    }),
    coinbaseWallet({
      appName: "OiOi Melting Dashboard",
      preference: "eoaOnly",
    }),
  ],
  transports: {
    [base.id]: http(),
    [mainnet.id]: http(),
    [baseSepolia.id]: http(),
    [sepolia.id]: http(),
  },
  ssr: true,
});
