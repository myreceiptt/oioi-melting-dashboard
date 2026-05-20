import type { Address } from "viem";
import type { ChainSet } from "@/lib/chains/chainConfig";
import { getChainForSet } from "@/lib/chains/chainConfig";
import { getContractAddresses } from "./addresses";

export type CollectionKey = "roty" | "melting" | "amanda";
export type MintType = "roty" | "gated";

export type CollectionConfig = {
  chainSet: ChainSet;
  collectionKey: CollectionKey;
  mintType: MintType;
  judul: string;
  name: string;
  symbol: string;
  contractAddress: Address;
  stakingAddress: Address;
  rewardDistributorAddress: Address;
  oioiTokenAddress: Address;
  requiredChainId: number;
  requiredChainName: string;
  mintPagePath: string;
};

export function getCollectionConfig(
  chainSet: ChainSet,
  collectionKey: CollectionKey,
): CollectionConfig {
  const addresses = getContractAddresses(chainSet);
  const chain = getChainForSet(chainSet);

  const common = {
    chainSet,
    collectionKey,
    stakingAddress: addresses.staking,
    rewardDistributorAddress: addresses.rewardDistributor,
    oioiTokenAddress: addresses.oioi,
    requiredChainId: chain.id,
    requiredChainName: chain.name,
    mintPagePath: `/mint/${collectionKey}/${chainSet}`,
  };

  if (chainSet === "base" && collectionKey === "roty") {
    return {
      ...common,
      mintType: "roty",
      judul: "The ROTY BASE dETH",
      name: "ROTY BASE",
      symbol: "ROTYBASE",
      contractAddress: addresses.roty,
    };
  }

  if (chainSet === "ethereum" && collectionKey === "roty") {
    return {
      ...common,
      mintType: "roty",
      judul: "The ROTY BASE dETH",
      name: "ROTY dETH",
      symbol: "ROTYDETH",
      contractAddress: addresses.roty,
    };
  }

  if (chainSet === "base" && collectionKey === "melting") {
    return {
      ...common,
      mintType: "gated",
      judul: "The Melting Land",
      name: "Melting BASE",
      symbol: "MELTBASE",
      contractAddress: addresses.melting,
    };
  }

  if (chainSet === "ethereum" && collectionKey === "melting") {
    return {
      ...common,
      mintType: "gated",
      judul: "The Melting Land",
      name: "Melting dETH",
      symbol: "MELTDETH",
      contractAddress: addresses.melting,
    };
  }

  if (chainSet === "base" && collectionKey === "amanda") {
    return {
      ...common,
      mintType: "gated",
      judul: "Amanda Wives",
      name: "Amanda BASE",
      symbol: "AMANBASE",
      contractAddress: addresses.amanda,
    };
  }

  return {
    ...common,
    mintType: "gated",
    judul: "Amanda Wives",
    name: "Amanda dETH",
    symbol: "AMANDETH",
    contractAddress: addresses.amanda,
  };
}

export function getChainCollections(chainSet: ChainSet) {
  return [
    getCollectionConfig(chainSet, "roty"),
    getCollectionConfig(chainSet, "melting"),
    getCollectionConfig(chainSet, "amanda"),
  ];
}
