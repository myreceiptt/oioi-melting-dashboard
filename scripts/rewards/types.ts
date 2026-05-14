export type SupportedRewardChain = "base" | "ethereum";

export type CollectionKey = "roty" | "melting" | "amanda";

export type RewardRoundInput = {
  chain: SupportedRewardChain;
  roundId: number;
  periodStartTimestamp: number;
  periodEndTimestamp: number;
  rewardAmountWei: string;
  stakingContract: `0x${string}`;
  rewardDistributor: `0x${string}`;
  collections: {
    key: CollectionKey;
    address: `0x${string}`;
    weight: number;
  }[];
};

export type RewardAllocation = {
  wallet: `0x${string}`;
  amountWei: string;
  weightedDuration?: string;
};

export type RewardMerkleInput = {
  chain: SupportedRewardChain;
  roundId: number;
  rewardAmountWei: string;
  allocations: RewardAllocation[];
};

export type RewardProofEntry = {
  wallet: `0x${string}`;
  amountWei: string;
  proof: `0x${string}`[];
};

export type RewardMerkleOutput = {
  chain: SupportedRewardChain;
  roundId: number;
  rewardAmountWei: string;
  totalAllocatedWei: string;
  merkleRoot: `0x${string}`;
  proofs: RewardProofEntry[];
};
