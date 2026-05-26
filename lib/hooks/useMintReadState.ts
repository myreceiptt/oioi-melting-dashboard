"use client";

import { useAccount, useReadContract } from "wagmi";
import type { CollectionConfig } from "@/lib/contracts/collectionConfig";
import { gatedMintAbi, rotyAbi } from "@/lib/contracts/abis";

export function useMintReadState(config: CollectionConfig) {
  const { address } = useAccount();

  const nftAbi = config.mintType === "roty" ? rotyAbi : gatedMintAbi;

  const totalMinted = useReadContract({
    address: config.contractAddress,
    abi: nftAbi,
    functionName: "totalMinted",
  });

  const remainingSupply = useReadContract({
    address: config.contractAddress,
    abi: nftAbi,
    functionName: "remainingSupply",
  });

  const maxSupply = useReadContract({
    address: config.contractAddress,
    abi: nftAbi,
    functionName: "maxSupply",
  });

  const maxMintPerTx = useReadContract({
    address: config.contractAddress,
    abi: nftAbi,
    functionName: "maxMintPerTx",
  });

  const mintPrice = useReadContract({
    address: config.contractAddress,
    abi: nftAbi,
    functionName: "mintPrice",
  });

  const revealed = useReadContract({
    address: config.contractAddress,
    abi: nftAbi,
    functionName: "revealed",
  });

  const metadataLocked = useReadContract({
    address: config.contractAddress,
    abi: nftAbi,
    functionName: "metadataLocked",
  });

  const whitelistMintEnabled = useReadContract({
    address: config.contractAddress,
    abi: rotyAbi,
    functionName: "whitelistMintEnabled",
    query: {
      enabled: config.mintType === "roty",
    },
  });

  const publicMintEnabled = useReadContract({
    address: config.contractAddress,
    abi: rotyAbi,
    functionName: "publicMintEnabled",
    query: {
      enabled: config.mintType === "roty",
    },
  });

  const whitelistClaimed = useReadContract({
    address: config.contractAddress,
    abi: rotyAbi,
    functionName: "whitelistClaimed",
    args: address ? [address] : undefined,
    query: {
      enabled: config.mintType === "roty" && Boolean(address),
    },
  });

  const gatedMintEnabled = useReadContract({
    address: config.contractAddress,
    abi: gatedMintAbi,
    functionName: "gatedMintEnabled",
    query: {
      enabled: config.mintType === "gated",
    },
  });

  const isLoading =
    totalMinted.isLoading ||
    remainingSupply.isLoading ||
    maxSupply.isLoading ||
    maxMintPerTx.isLoading ||
    mintPrice.isLoading ||
    revealed.isLoading ||
    metadataLocked.isLoading ||
    whitelistMintEnabled.isLoading ||
    publicMintEnabled.isLoading ||
    whitelistClaimed.isLoading ||
    gatedMintEnabled.isLoading;

  const isFetching =
    totalMinted.isFetching ||
    remainingSupply.isFetching ||
    maxSupply.isFetching ||
    maxMintPerTx.isFetching ||
    mintPrice.isFetching ||
    revealed.isFetching ||
    metadataLocked.isFetching ||
    whitelistMintEnabled.isFetching ||
    publicMintEnabled.isFetching ||
    whitelistClaimed.isFetching ||
    gatedMintEnabled.isFetching;

  const error =
    totalMinted.error ||
    remainingSupply.error ||
    maxSupply.error ||
    maxMintPerTx.error ||
    mintPrice.error ||
    revealed.error ||
    metadataLocked.error ||
    whitelistMintEnabled.error ||
    publicMintEnabled.error ||
    whitelistClaimed.error ||
    gatedMintEnabled.error;

  function refetch() {
    void totalMinted.refetch();
    void remainingSupply.refetch();
    void maxSupply.refetch();
    void maxMintPerTx.refetch();
    void mintPrice.refetch();
    void revealed.refetch();
    void metadataLocked.refetch();

    if (config.mintType === "roty") {
      void whitelistMintEnabled.refetch();
      void publicMintEnabled.refetch();

      if (address) {
        void whitelistClaimed.refetch();
      }
    }

    if (config.mintType === "gated") {
      void gatedMintEnabled.refetch();
    }
  }

  return {
    isLoading,
    isFetching,
    error,
    refetch,
    totalMinted: totalMinted.data as bigint | undefined,
    remainingSupply: remainingSupply.data as bigint | undefined,
    maxSupply: maxSupply.data as bigint | undefined,
    maxMintPerTx: maxMintPerTx.data as bigint | undefined,
    mintPrice: mintPrice.data as bigint | undefined,
    revealed: revealed.data as boolean | undefined,
    metadataLocked: metadataLocked.data as boolean | undefined,
    whitelistMintEnabled: whitelistMintEnabled.data as boolean | undefined,
    publicMintEnabled: publicMintEnabled.data as boolean | undefined,
    whitelistClaimed: whitelistClaimed.data as boolean | undefined,
    gatedMintEnabled: gatedMintEnabled.data as boolean | undefined,
  };
}
