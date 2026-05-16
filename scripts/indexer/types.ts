export type IndexerNetworkKey = "baseSepolia" | "ethereumSepolia";

export type CollectionKey = "roty" | "melting" | "amanda";

export type IndexerSourceKey =
  | CollectionKey
  | "staking"
  | "rewardDistributor";

export type DeploymentRecord = {
  network: {
    key: string;
    chainId: number;
    label: string;
  };
  contracts: {
    roty?: `0x${string}`;
    melting?: `0x${string}`;
    amanda?: `0x${string}`;
    staking?: `0x${string}`;
    rewardDistributor?: `0x${string}`;
  };
  tokens: {
    oioi?: `0x${string}`;
  };
  registrations?: Record<string, boolean>;
  metadata?: {
    createdAt?: string;
    updatedAt?: string;
  };
};

export type IndexerNetworkConfig = {
  key: IndexerNetworkKey;
  label: string;
  chainId: number;
  deploymentRecordPath: string;
  outputDir: string;
  rpcEnv: string;
};

export type IndexerSourceCheckpoint = {
  address: `0x${string}`;
  lastSyncedBlock: number;
};

export type IndexerCheckpoints = {
  network: IndexerNetworkKey;
  chainId: number;
  updatedAt: string;
  sources: Record<IndexerSourceKey, IndexerSourceCheckpoint>;
};

export type IndexerMetadata = {
  network: IndexerNetworkKey;
  chainId: number;
  label: string;
  deploymentRecordPath: string;
  outputDir: string;
  createdAt: string;
  updatedAt: string;
};

export type TransferRecord = {
  chainId: number;
  network: IndexerNetworkKey;
  collectionKey: CollectionKey;
  collectionAddress: `0x${string}`;
  tokenId: string;
  from: `0x${string}`;
  to: `0x${string}`;
  txHash: `0x${string}`;
  logIndex: number;
  blockNumber: number;
  blockTimestamp: number;
};

export type StakingEventRecord = {
  chainId: number;
  network: IndexerNetworkKey;
  eventType: "staked" | "unstaked";
  user: `0x${string}`;
  collectionAddress: `0x${string}`;
  collectionKey: CollectionKey;
  tokenId: string;
  txHash: `0x${string}`;
  logIndex: number;
  blockNumber: number;
  blockTimestamp: number;
};

export type RewardEventRecord = {
  chainId: number;
  network: IndexerNetworkKey;
  eventName: string;
  txHash: `0x${string}`;
  logIndex: number;
  blockNumber: number;
  blockTimestamp: number;
  payload: Record<string, string | number | boolean | null>;
};

export type CurrentOwnerRecord = {
  chainId: number;
  network: IndexerNetworkKey;
  collectionKey: CollectionKey;
  collectionAddress: `0x${string}`;
  tokenId: string;
  owner: `0x${string}`;
  updatedBlockNumber: number;
  updatedBlockTimestamp: number;
};

export type CurrentStakeRecord = {
  chainId: number;
  network: IndexerNetworkKey;
  user: `0x${string}`;
  collectionKey: CollectionKey;
  collectionAddress: `0x${string}`;
  tokenId: string;
  active: boolean;
  currentlyOwned: boolean;
  valid: boolean;
  stakedAt: number | null;
  unstakedAt: number | null;
  updatedBlockNumber: number;
  updatedBlockTimestamp: number;
};
