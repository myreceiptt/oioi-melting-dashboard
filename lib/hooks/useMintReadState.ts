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

  return {
    isLoading,
    error,
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
