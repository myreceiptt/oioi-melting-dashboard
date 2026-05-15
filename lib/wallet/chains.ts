import { base, baseSepolia, mainnet, sepolia } from "wagmi/chains";

export const supportedChains = [base, mainnet, baseSepolia, sepolia] as const;

export function getRequiredChain(chainSet: "base" | "ethereum") {
  const appEnv = process.env.NEXT_PUBLIC_APP_ENV || "sepolia";

  if (appEnv === "mainnet") {
    return chainSet === "base" ? base : mainnet;
  }

  return chainSet === "base" ? baseSepolia : sepolia;
}
