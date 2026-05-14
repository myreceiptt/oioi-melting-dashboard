import type { CollectionConfig } from "./types.ts";

export const COLLECTION_WEIGHT_DENOMINATOR = 1_000_000;

export const COLLECTION_WEIGHTS = {
  roty: 217_491,
  melting: 362_900,
  amanda: 419_609,
} as const;

export const ZERO_ADDRESS =
  "0x0000000000000000000000000000000000000000" as const;

export const baseCollections = {
  roty: {
    key: "roty",
    name: "The ROTY BASE",
    symbol: "ROTYBASE",
    chainId: 8453,
    contractAddress: ZERO_ADDRESS,
    maxSupply: 1047,
    mintPriceEth: "0.001047",
    mintMode: "merkle-free-plus-public-paid",
    weight: COLLECTION_WEIGHTS.roty,
    mintPageUrl: "https://rotybase.endhonesa.com/",
  },

  melting: {
    key: "melting",
    name: "Melting BASE",
    symbol: "MELTBASE",
    chainId: 8453,
    contractAddress: ZERO_ADDRESS,
    maxSupply: 1747,
    mintPriceEth: "0.001747",
    mintMode: "staking-gated-paid",
    weight: COLLECTION_WEIGHTS.melting,
    mintPageUrl: "https://meltingbase.endhonesa.com/",
  },

  amanda: {
    key: "amanda",
    name: "Amanda BASE",
    symbol: "AMANBASE",
    chainId: 8453,
    contractAddress: ZERO_ADDRESS,
    maxSupply: 2020,
    mintPriceEth: "0.002020",
    mintMode: "staking-gated-paid",
    weight: COLLECTION_WEIGHTS.amanda,
    mintPageUrl: "https://amandabase.endhonesa.com/",
  },
} satisfies Record<string, CollectionConfig>;

export const ethereumCollections = {
  roty: {
    key: "roty",
    name: "The ROTY dETH",
    symbol: "ROTYDETH",
    chainId: 1,
    contractAddress: ZERO_ADDRESS,
    maxSupply: 1047,
    mintPriceEth: "0.01047",
    mintMode: "merkle-free-plus-public-paid",
    weight: COLLECTION_WEIGHTS.roty,
    mintPageUrl: "https://rotydeth.endhonesa.com/",
  },

  melting: {
    key: "melting",
    name: "MELTING dETH",
    symbol: "MELTDETH",
    chainId: 1,
    contractAddress: ZERO_ADDRESS,
    maxSupply: 1747,
    mintPriceEth: "0.01747",
    mintMode: "staking-gated-paid",
    weight: COLLECTION_WEIGHTS.melting,
    mintPageUrl: "https://meltingdeth.endhonesa.com/",
  },

  amanda: {
    key: "amanda",
    name: "Amanda dETH",
    symbol: "AMANDETH",
    chainId: 1,
    contractAddress: ZERO_ADDRESS,
    maxSupply: 2020,
    mintPriceEth: "0.02020",
    mintMode: "staking-gated-paid",
    weight: COLLECTION_WEIGHTS.amanda,
    mintPageUrl: "https://amandadeth.endhonesa.com/",
  },
} satisfies Record<string, CollectionConfig>;
