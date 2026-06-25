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

const rpcUrls = {
  [base.id]:
    process.env.NEXT_PUBLIC_ALCHEMY_BASE_MAINNET_RPC_URL ||
    "https://base-rpc.publicnode.com",
  [mainnet.id]:
    process.env.NEXT_PUBLIC_ALCHEMY_ETHEREUM_MAINNET_RPC_URL ||
    "https://ethereum-rpc.publicnode.com",
  [baseSepolia.id]:
    process.env.NEXT_PUBLIC_ALCHEMY_BASE_SEPOLIA_RPC_URL ||
    "https://base-sepolia-rpc.publicnode.com",
  [sepolia.id]:
    process.env.NEXT_PUBLIC_ALCHEMY_ETHEREUM_SEPOLIA_RPC_URL ||
    "https://ethereum-sepolia-rpc.publicnode.com",
} as const;

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
    [base.id]: http(rpcUrls[base.id]),
    [mainnet.id]: http(rpcUrls[mainnet.id]),
    [baseSepolia.id]: http(rpcUrls[baseSepolia.id]),
    [sepolia.id]: http(rpcUrls[sepolia.id]),
  },
  ssr: true,
});
