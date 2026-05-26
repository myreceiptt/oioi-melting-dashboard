"use client";

import { useAccount, useReadContract } from "wagmi";
import type { CollectionConfig } from "@/lib/contracts/collectionConfig";
import { getContractAddresses } from "@/lib/contracts/addresses";
import { stakingAbi } from "@/lib/contracts/abis";

export function useGatedEligibility(config: CollectionConfig) {
  const { address } = useAccount();
  const addresses = getContractAddresses(config.chainSet);

  const rotyEligibility = useReadContract({
    address: config.stakingAddress,
    abi: stakingAbi,
    functionName: "hasValidStake",
    args: address ? [address, addresses.roty] : undefined,
    query: {
      enabled: Boolean(address) && config.collectionKey === "melting",
    },
  });

  const amandaEligibility = useReadContract({
    address: config.stakingAddress,
    abi: stakingAbi,
    functionName: "hasValidStakeInCollections",
    args: address ? [address, [addresses.roty, addresses.melting]] : undefined,
    query: {
      enabled: Boolean(address) && config.collectionKey === "amanda",
    },
  });

  if (config.collectionKey === "roty") {
    return {
      isLoading: false,
      error: null,
      eligible: undefined,
      reason: "ROTY does not require staking eligibility.",
    };
  }

  if (config.collectionKey === "melting") {
    return {
      isLoading: rotyEligibility.isLoading,
      error: rotyEligibility.error,
      eligible: rotyEligibility.data as boolean | undefined,
      reason: "Melting requires a valid ROTY soft stake on the same chain.",
    };
  }

  return {
    isLoading: amandaEligibility.isLoading,
    error: amandaEligibility.error,
    eligible: amandaEligibility.data as boolean | undefined,
    reason:
      "Amanda requires a valid ROTY or Melting soft stake on the same chain.",
  };
}
