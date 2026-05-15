import type { Address } from "viem";
import type { ChainSet } from "@/lib/chains/chainConfig";
import { parseAddress } from "@/lib/utils/address";
import { getAppEnv, getRequiredEnv } from "@/lib/utils/env";

export type ContractAddressSet = {
  roty: Address;
  melting: Address;
  amanda: Address;
  staking: Address;
  rewardDistributor: Address;
  oioi: Address;
};

function fromEnv(label: string, name: string) {
  return parseAddress(label, getRequiredEnv(name));
}

function getSepoliaAddressSet(chainSet: ChainSet): ContractAddressSet {
  if (chainSet === "base") {
    return {
      roty: fromEnv("Base Sepolia ROTY", "NEXT_PUBLIC_BASE_SEPOLIA_ROTY_CONTRACT"),
      melting: fromEnv("Base Sepolia Melting", "NEXT_PUBLIC_BASE_SEPOLIA_MELTING_CONTRACT"),
      amanda: fromEnv("Base Sepolia Amanda", "NEXT_PUBLIC_BASE_SEPOLIA_AMANDA_CONTRACT"),
      staking: fromEnv("Base Sepolia Staking", "NEXT_PUBLIC_BASE_SEPOLIA_STAKING_CONTRACT"),
      rewardDistributor: fromEnv(
        "Base Sepolia RewardDistributor",
        "NEXT_PUBLIC_BASE_SEPOLIA_REWARD_DISTRIBUTOR",
      ),
      oioi: fromEnv("Base Sepolia $OiOi", "NEXT_PUBLIC_BASE_SEPOLIA_OIOI_TOKEN"),
    };
  }

  return {
    roty: fromEnv("Ethereum Sepolia ROTY", "NEXT_PUBLIC_ETHEREUM_SEPOLIA_ROTY_CONTRACT"),
    melting: fromEnv(
      "Ethereum Sepolia Melting",
      "NEXT_PUBLIC_ETHEREUM_SEPOLIA_MELTING_CONTRACT",
    ),
    amanda: fromEnv(
      "Ethereum Sepolia Amanda",
      "NEXT_PUBLIC_ETHEREUM_SEPOLIA_AMANDA_CONTRACT",
    ),
    staking: fromEnv(
      "Ethereum Sepolia Staking",
      "NEXT_PUBLIC_ETHEREUM_SEPOLIA_STAKING_CONTRACT",
    ),
    rewardDistributor: fromEnv(
      "Ethereum Sepolia RewardDistributor",
      "NEXT_PUBLIC_ETHEREUM_SEPOLIA_REWARD_DISTRIBUTOR",
    ),
    oioi: fromEnv("Ethereum Sepolia $OiOi", "NEXT_PUBLIC_ETHEREUM_SEPOLIA_OIOI_TOKEN"),
  };
}

function getMainnetAddressSet(chainSet: ChainSet): ContractAddressSet {
  if (chainSet === "base") {
    return {
      roty: fromEnv("Base ROTY", "NEXT_PUBLIC_BASE_ROTY_CONTRACT"),
      melting: fromEnv("Base Melting", "NEXT_PUBLIC_BASE_MELTING_CONTRACT"),
      amanda: fromEnv("Base Amanda", "NEXT_PUBLIC_BASE_AMANDA_CONTRACT"),
      staking: fromEnv("Base Staking", "NEXT_PUBLIC_BASE_STAKING_CONTRACT"),
      rewardDistributor: fromEnv(
        "Base RewardDistributor",
        "NEXT_PUBLIC_BASE_REWARD_DISTRIBUTOR",
      ),
      oioi: fromEnv("Base $OiOi", "NEXT_PUBLIC_BASE_OIOI_TOKEN"),
    };
  }

  return {
    roty: fromEnv("Ethereum ROTY", "NEXT_PUBLIC_ETH_ROTY_CONTRACT"),
    melting: fromEnv("Ethereum Melting", "NEXT_PUBLIC_ETH_MELTING_CONTRACT"),
    amanda: fromEnv("Ethereum Amanda", "NEXT_PUBLIC_ETH_AMANDA_CONTRACT"),
    staking: fromEnv("Ethereum Staking", "NEXT_PUBLIC_ETH_STAKING_CONTRACT"),
    rewardDistributor: fromEnv(
      "Ethereum RewardDistributor",
      "NEXT_PUBLIC_ETH_REWARD_DISTRIBUTOR",
    ),
    oioi: fromEnv("Ethereum $OiOi", "NEXT_PUBLIC_ETH_OIOI_TOKEN"),
  };
}

export function getContractAddresses(chainSet: ChainSet): ContractAddressSet {
  return getAppEnv() === "mainnet"
    ? getMainnetAddressSet(chainSet)
    : getSepoliaAddressSet(chainSet);
}
