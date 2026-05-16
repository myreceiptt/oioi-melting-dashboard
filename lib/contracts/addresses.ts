import type { Address } from "viem";
import type { ChainSet } from "@/lib/chains/chainConfig";
import { parseAddress } from "@/lib/utils/address";
import { getAppEnv } from "@/lib/utils/env";

export type ContractAddressSet = {
  roty: Address;
  melting: Address;
  amanda: Address;
  staking: Address;
  rewardDistributor: Address;
  oioi: Address;
};

function requiredAddress(label: string, value: string | undefined) {
  if (!value || value.trim() === "") {
    throw new Error(`Missing required environment variable: ${label}`);
  }

  return parseAddress(label, value.trim());
}

function getBaseSepoliaAddressSet(): ContractAddressSet {
  return {
    roty: requiredAddress(
      "NEXT_PUBLIC_BASE_SEPOLIA_ROTY_CONTRACT",
      process.env.NEXT_PUBLIC_BASE_SEPOLIA_ROTY_CONTRACT,
    ),
    melting: requiredAddress(
      "NEXT_PUBLIC_BASE_SEPOLIA_MELTING_CONTRACT",
      process.env.NEXT_PUBLIC_BASE_SEPOLIA_MELTING_CONTRACT,
    ),
    amanda: requiredAddress(
      "NEXT_PUBLIC_BASE_SEPOLIA_AMANDA_CONTRACT",
      process.env.NEXT_PUBLIC_BASE_SEPOLIA_AMANDA_CONTRACT,
    ),
    staking: requiredAddress(
      "NEXT_PUBLIC_BASE_SEPOLIA_STAKING_CONTRACT",
      process.env.NEXT_PUBLIC_BASE_SEPOLIA_STAKING_CONTRACT,
    ),
    rewardDistributor: requiredAddress(
      "NEXT_PUBLIC_BASE_SEPOLIA_REWARD_DISTRIBUTOR",
      process.env.NEXT_PUBLIC_BASE_SEPOLIA_REWARD_DISTRIBUTOR,
    ),
    oioi: requiredAddress(
      "NEXT_PUBLIC_BASE_SEPOLIA_OIOI_TOKEN",
      process.env.NEXT_PUBLIC_BASE_SEPOLIA_OIOI_TOKEN,
    ),
  };
}

function getEthereumSepoliaAddressSet(): ContractAddressSet {
  return {
    roty: requiredAddress(
      "NEXT_PUBLIC_ETHEREUM_SEPOLIA_ROTY_CONTRACT",
      process.env.NEXT_PUBLIC_ETHEREUM_SEPOLIA_ROTY_CONTRACT,
    ),
    melting: requiredAddress(
      "NEXT_PUBLIC_ETHEREUM_SEPOLIA_MELTING_CONTRACT",
      process.env.NEXT_PUBLIC_ETHEREUM_SEPOLIA_MELTING_CONTRACT,
    ),
    amanda: requiredAddress(
      "NEXT_PUBLIC_ETHEREUM_SEPOLIA_AMANDA_CONTRACT",
      process.env.NEXT_PUBLIC_ETHEREUM_SEPOLIA_AMANDA_CONTRACT,
    ),
    staking: requiredAddress(
      "NEXT_PUBLIC_ETHEREUM_SEPOLIA_STAKING_CONTRACT",
      process.env.NEXT_PUBLIC_ETHEREUM_SEPOLIA_STAKING_CONTRACT,
    ),
    rewardDistributor: requiredAddress(
      "NEXT_PUBLIC_ETHEREUM_SEPOLIA_REWARD_DISTRIBUTOR",
      process.env.NEXT_PUBLIC_ETHEREUM_SEPOLIA_REWARD_DISTRIBUTOR,
    ),
    oioi: requiredAddress(
      "NEXT_PUBLIC_ETHEREUM_SEPOLIA_OIOI_TOKEN",
      process.env.NEXT_PUBLIC_ETHEREUM_SEPOLIA_OIOI_TOKEN,
    ),
  };
}

function getBaseMainnetAddressSet(): ContractAddressSet {
  return {
    roty: requiredAddress(
      "NEXT_PUBLIC_BASE_ROTY_CONTRACT",
      process.env.NEXT_PUBLIC_BASE_ROTY_CONTRACT,
    ),
    melting: requiredAddress(
      "NEXT_PUBLIC_BASE_MELTING_CONTRACT",
      process.env.NEXT_PUBLIC_BASE_MELTING_CONTRACT,
    ),
    amanda: requiredAddress(
      "NEXT_PUBLIC_BASE_AMANDA_CONTRACT",
      process.env.NEXT_PUBLIC_BASE_AMANDA_CONTRACT,
    ),
    staking: requiredAddress(
      "NEXT_PUBLIC_BASE_STAKING_CONTRACT",
      process.env.NEXT_PUBLIC_BASE_STAKING_CONTRACT,
    ),
    rewardDistributor: requiredAddress(
      "NEXT_PUBLIC_BASE_REWARD_DISTRIBUTOR",
      process.env.NEXT_PUBLIC_BASE_REWARD_DISTRIBUTOR,
    ),
    oioi: requiredAddress(
      "NEXT_PUBLIC_BASE_OIOI_TOKEN",
      process.env.NEXT_PUBLIC_BASE_OIOI_TOKEN,
    ),
  };
}

function getEthereumMainnetAddressSet(): ContractAddressSet {
  return {
    roty: requiredAddress(
      "NEXT_PUBLIC_ETH_ROTY_CONTRACT",
      process.env.NEXT_PUBLIC_ETH_ROTY_CONTRACT,
    ),
    melting: requiredAddress(
      "NEXT_PUBLIC_ETH_MELTING_CONTRACT",
      process.env.NEXT_PUBLIC_ETH_MELTING_CONTRACT,
    ),
    amanda: requiredAddress(
      "NEXT_PUBLIC_ETH_AMANDA_CONTRACT",
      process.env.NEXT_PUBLIC_ETH_AMANDA_CONTRACT,
    ),
    staking: requiredAddress(
      "NEXT_PUBLIC_ETH_STAKING_CONTRACT",
      process.env.NEXT_PUBLIC_ETH_STAKING_CONTRACT,
    ),
    rewardDistributor: requiredAddress(
      "NEXT_PUBLIC_ETH_REWARD_DISTRIBUTOR",
      process.env.NEXT_PUBLIC_ETH_REWARD_DISTRIBUTOR,
    ),
    oioi: requiredAddress(
      "NEXT_PUBLIC_ETH_OIOI_TOKEN",
      process.env.NEXT_PUBLIC_ETH_OIOI_TOKEN,
    ),
  };
}

export function getContractAddresses(chainSet: ChainSet): ContractAddressSet {
  const appEnv = getAppEnv();

  if (appEnv === "mainnet") {
    return chainSet === "base"
      ? getBaseMainnetAddressSet()
      : getEthereumMainnetAddressSet();
  }

  return chainSet === "base"
    ? getBaseSepoliaAddressSet()
    : getEthereumSepoliaAddressSet();
}
