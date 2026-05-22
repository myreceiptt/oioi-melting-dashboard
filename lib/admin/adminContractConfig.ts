import type { Address } from "viem";
import type { ChainSet } from "@/lib/chains/chainConfig";
import { getContractAddresses } from "@/lib/contracts/addresses";
import type {
  AdminChainConfig,
  AdminContractConfig,
} from "@/lib/admin/adminTypes";
import {
  erc20ReadActions,
  erc20WriteActions,
  gatedMintReadActions,
  gatedMintWriteActions,
  rewardDistributorReadActions,
  rewardDistributorWriteActions,
  rotyReadActions,
  rotyWriteActions,
  stakingReadActions,
  stakingWriteActions,
} from "@/lib/admin/adminActions";

export const EXPECTED_ADMIN_OWNER_ADDRESS =
  "0x29bF68E3969E0b6686ea55B7C48241ba3f6B9bA0" as Address;

function createAdminContractConfig({
  key,
  kind,
  chainSet,
  label,
  description,
  address,
  explorerLabel,
  readActions,
  writeActions,
}: AdminContractConfig): AdminContractConfig {
  return {
    key,
    kind,
    chainSet,
    label,
    description,
    address,
    explorerLabel,
    readActions,
    writeActions,
  };
}

export function getAdminChainConfig(chainSet: ChainSet): AdminChainConfig {
  const addresses = getContractAddresses(chainSet);
  const chainLabel = chainSet === "base" ? "BASE" : "Ethereum";

  return {
    chainSet,
    label: `${chainLabel} Admin`,
    expectedOwner: EXPECTED_ADMIN_OWNER_ADDRESS,
    contracts: [
      createAdminContractConfig({
        key: "roty",
        kind: "roty base deth",
        chainSet,
        label: chainSet === "base" ? "ROTY BASE" : "ROTY dETH",
        description:
          "ROTY collection mint phases, metadata, pricing, treasury, and royalties.",
        address: addresses.roty,
        explorerLabel: "ROTY",
        readActions: rotyReadActions,
        writeActions: rotyWriteActions,
      }),
      createAdminContractConfig({
        key: "melting",
        kind: "the melting land",
        chainSet,
        label: chainSet === "base" ? "Melting BASE" : "Melting dETH",
        description:
          "Melting collection gated mint, metadata, pricing, treasury, and royalties.",
        address: addresses.melting,
        explorerLabel: "Melting",
        readActions: gatedMintReadActions,
        writeActions: gatedMintWriteActions,
      }),
      createAdminContractConfig({
        key: "amanda",
        kind: "amanda wives",
        chainSet,
        label: chainSet === "base" ? "Amanda BASE" : "Amanda dETH",
        description:
          "Amanda collection gated mint, metadata, pricing, treasury, and royalties.",
        address: addresses.amanda,
        explorerLabel: "Amanda",
        readActions: gatedMintReadActions,
        writeActions: gatedMintWriteActions,
      }),
      createAdminContractConfig({
        key: "staking",
        kind: "soft staking",
        chainSet,
        label: "OiOi Soft Staking",
        description: "Soft staking registry and collection approval controls.",
        address: addresses.staking,
        explorerLabel: "Staking",
        readActions: stakingReadActions,
        writeActions: stakingWriteActions,
      }),
      createAdminContractConfig({
        key: "rewardDistributor",
        kind: "reward distributor",
        chainSet,
        label: "OiOi Reward Distributor",
        description:
          "Reward round creation, funding, claim pause, and reward accounting.",
        address: addresses.rewardDistributor,
        explorerLabel: "RewardDistributor",
        readActions: rewardDistributorReadActions,
        writeActions: rewardDistributorWriteActions,
      }),
      createAdminContractConfig({
        key: "oioi",
        kind: "erc20",
        chainSet,
        label: "$OiOi Token",
        description: "Reward token balance, allowance, and funding approval.",
        address: addresses.oioi,
        explorerLabel: "$OiOi",
        readActions: erc20ReadActions,
        writeActions: erc20WriteActions,
      }),
    ],
  };
}

export function getAdminContractConfig({
  chainSet,
  contractKey,
}: {
  chainSet: ChainSet;
  contractKey: AdminContractConfig["key"];
}) {
  const config = getAdminChainConfig(chainSet);
  const contract = config.contracts.find((item) => item.key === contractKey);

  if (!contract) {
    throw new Error(
      `Missing admin contract config for ${chainSet}:${contractKey}`,
    );
  }

  return contract;
}
