export type SupportedRewardChain =
  | "base"
  | "ethereum";

export type RewardCollectionKey =
  | "roty"
  | "melting"
  | "amanda";

export type HexAddress = `0x${string}`;

export type RewardRoundInput = {
  chain: SupportedRewardChain;
  roundId: number;
  periodStartTimestamp: number;
  periodEndTimestamp: number;
  rewardAmountWei: string;
  stakingContract: HexAddress;
  rewardDistributor: HexAddress;
  collections: {
    key: RewardCollectionKey;
    address: HexAddress;
    weight: number;
  }[];
};

export type StakeEventRecord = {
  wallet: HexAddress;
  collection: HexAddress;
  tokenId: string;
  timestamp: number;
  txHash: HexAddress;
};

export type UnstakeEventRecord = {
  wallet: HexAddress;
  collection: HexAddress;
  tokenId: string;
  timestamp: number;
  txHash: HexAddress;
};

export type TransferEventRecord = {
  collection: HexAddress;
  tokenId: string;
  from: HexAddress;
  to: HexAddress;
  timestamp: number;
  txHash: HexAddress;
};

export type RewardAllocation = {
  wallet: HexAddress;
  weightedDuration: string;
  amountWei: string;
};
