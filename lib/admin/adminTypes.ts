import type { Address } from "viem";
import type { ChainSet } from "@/lib/chains/chainConfig";

export type AdminRiskLevel = "info" | "low" | "medium" | "high" | "critical";

export type AdminConfirmationType =
  | "none"
  | "confirm"
  | "typed-confirmation";

export type AdminContractGroup =
  | "roty"
  | "melting"
  | "amanda"
  | "staking"
  | "rewardDistributor"
  | "oioi";

export type AdminContractKind =
  | "nft-roty"
  | "nft-gated"
  | "staking"
  | "reward-distributor"
  | "erc20";

export type AdminActionMode = "read" | "write";

export type AdminAction = {
  key: string;
  label: string;
  mode: AdminActionMode;
  functionName: string;
  risk: AdminRiskLevel;
  confirmation: AdminConfirmationType;
  description: string;
  warning?: string;
  typedConfirmationText?: string;
};

export type AdminContractConfig = {
  key: AdminContractGroup;
  kind: AdminContractKind;
  chainSet: ChainSet;
  label: string;
  description: string;
  address: Address;
  explorerLabel: string;
  readActions: AdminAction[];
  writeActions: AdminAction[];
};

export type AdminChainConfig = {
  chainSet: ChainSet;
  label: string;
  expectedOwner: Address;
  contracts: AdminContractConfig[];
};
