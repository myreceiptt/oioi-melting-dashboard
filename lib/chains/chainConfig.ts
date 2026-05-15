import { base, baseSepolia, mainnet, sepolia } from "wagmi/chains";
import { getAppEnv } from "@/lib/utils/env";

export type ChainSet = "base" | "ethereum";

export function getChainForSet(chainSet: ChainSet) {
  const appEnv = getAppEnv();

  if (appEnv === "mainnet") {
    return chainSet === "base" ? base : mainnet;
  }

  return chainSet === "base" ? baseSepolia : sepolia;
}

export function getExplorerBaseUrl(chainSet: ChainSet) {
  const appEnv = getAppEnv();

  if (appEnv === "mainnet") {
    return chainSet === "base"
      ? "https://basescan.org"
      : "https://etherscan.io";
  }

  return chainSet === "base"
    ? "https://sepolia.basescan.org"
    : "https://sepolia.etherscan.io";
}
