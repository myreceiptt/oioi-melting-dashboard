export type SupportedNetworkKey =
  | "base"
  | "ethereum";

export type CollectionKey =
  | "roty"
  | "melting"
  | "amanda";

export type MintMode =
  | "merkle-free-plus-public-paid"
  | "staking-gated-paid";

export type CollectionConfig = {
  key: CollectionKey;
  name: string;
  symbol: string;
  chainId: number;
  contractAddress: `0x${string}`;
  maxSupply: number;
  mintPriceEth: string;
  mintMode: MintMode;
  weight: number;
  mintPageUrl: string;
};

export type NetworkConfig = {
  key: SupportedNetworkKey;
  label: string;
  chainId: number;
  oioiTokenAddress: `0x${string}`;
  stakingAddress: `0x${string}`;
  rewardDistributorAddress: `0x${string}`;
  collections: Record<CollectionKey, CollectionConfig>;
};
