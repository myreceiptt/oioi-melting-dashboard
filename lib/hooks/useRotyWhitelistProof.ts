"use client";

import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import type { ChainSet } from "@/lib/chains/chainConfig";
import { fetchRotyWhitelistProof } from "@/lib/services/whitelistProofs";

export function useRotyWhitelistProof(chainSet: ChainSet) {
  const { address } = useAccount();

  return useQuery({
    queryKey: ["roty-whitelist-proof", chainSet, address],
    queryFn: () => {
      if (!address) {
        throw new Error("Missing wallet address.");
      }

      return fetchRotyWhitelistProof({
        chainSet,
        address,
      });
    },
    enabled: Boolean(address),
  });
}
