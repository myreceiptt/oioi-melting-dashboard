import type { NetworkConfig } from "./types.ts";
import {
  baseCollections,
  ethereumCollections,
  ZERO_ADDRESS,
} from "./collections.js";

export const OIOI_TOKEN_ADDRESSES = {
  base: "0xba0032620d88D9b16752CbDE75593c080C3d38de",
  ethereum: "0x1C696882b93d7241d09D55f52693cAD367A5bEaf",
} as const;

export const NETWORK_CONFIGS = {
  base: {
    key: "base",
    label: "Base",
    chainId: 8453,
    oioiTokenAddress: OIOI_TOKEN_ADDRESSES.base,
    stakingAddress: ZERO_ADDRESS,
    rewardDistributorAddress: ZERO_ADDRESS,
    collections: baseCollections,
  },

  ethereum: {
    key: "ethereum",
    label: "Ethereum",
    chainId: 1,
    oioiTokenAddress: OIOI_TOKEN_ADDRESSES.ethereum,
    stakingAddress: ZERO_ADDRESS,
    rewardDistributorAddress: ZERO_ADDRESS,
    collections: ethereumCollections,
  },
} satisfies Record<string, NetworkConfig>;
