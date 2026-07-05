import { getAppEnv, getRequiredEnv, type AppEnv } from "@/lib/utils/env";

export type RewardChainKey =
  | "baseSepolia"
  | "ethereumSepolia"
  | "baseMainnet"
  | "ethereumMainnet";

export type RewardChainParam = "base" | "ethereum";

const CHAIN_KEYS_BY_ENV: Record<
  AppEnv,
  Record<RewardChainParam, RewardChainKey>
> = {
  sepolia: {
    base: "baseSepolia",
    ethereum: "ethereumSepolia",
  },
  mainnet: {
    base: "baseMainnet",
    ethereum: "ethereumMainnet",
  },
};

const BOUNDARY_CHAIN_KEYS_BY_ENV: Record<AppEnv, RewardChainKey[]> = {
  sepolia: ["baseSepolia", "ethereumSepolia"],
  mainnet: ["baseMainnet", "ethereumMainnet"],
};

export function getRewardChainKey(
  chain: string | null,
  appEnv = getAppEnv(),
): RewardChainKey | null {
  if (chain !== "base" && chain !== "ethereum") {
    return null;
  }

  return CHAIN_KEYS_BY_ENV[appEnv][chain];
}

export function getBoundaryChainKeys(appEnv = getAppEnv()) {
  return BOUNDARY_CHAIN_KEYS_BY_ENV[appEnv];
}

export function getRewardSupabaseEnv(appEnv = getAppEnv()) {
  if (appEnv === "mainnet") {
    return {
      url: getRequiredEnv("MAINNET_SUPABASE_URL"),
      serviceRoleKey: getRequiredEnv("MAINNET_SUPABASE_SERVICE_ROLE_KEY"),
      dataPlane: "mainnet" as const,
    };
  }

  return {
    url: getRequiredEnv("SUPABASE_URL"),
    serviceRoleKey: getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    dataPlane: "sepolia" as const,
  };
}

export function isRewardClaimEnabled(appEnv = getAppEnv()) {
  const envName =
    appEnv === "mainnet"
      ? "NEXT_PUBLIC_MAINNET_REWARD_CLAIM_ENABLED"
      : "NEXT_PUBLIC_SEPOLIA_REWARD_CLAIM_ENABLED";
  const value = process.env[envName];

  return value === "true";
}
