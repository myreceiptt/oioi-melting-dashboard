import path from "node:path";
import { getAddress, isAddress } from "viem";
import type {
  DeploymentRecord,
  IndexerNetworkConfig,
  IndexerNetworkKey,
} from "./types.js";

export const INDEXER_NETWORKS: Record<IndexerNetworkKey, IndexerNetworkConfig> =
  {
    baseSepolia: {
      key: "baseSepolia",
      label: "Base Sepolia",
      chainId: 84532,
      deploymentRecordPath: path.join(
        process.cwd(),
        "deployments/base-sepolia/deployment.json",
      ),
      outputDir: path.join(
        process.cwd(),
        "scripts/indexer/output/base-sepolia",
      ),
      rpcEnv: "BASE_SEPOLIA_RPC_URL",
    },
    ethereumSepolia: {
      key: "ethereumSepolia",
      label: "Ethereum Sepolia",
      chainId: 11155111,
      deploymentRecordPath: path.join(
        process.cwd(),
        "deployments/ethereum-sepolia/deployment.json",
      ),
      outputDir: path.join(
        process.cwd(),
        "scripts/indexer/output/ethereum-sepolia",
      ),
      rpcEnv: "ETHEREUM_SEPOLIA_RPC_URL",
    },
    baseMainnet: {
      key: "baseMainnet",
      label: "Base Mainnet",
      chainId: 8453,
      deploymentRecordPath: path.join(
        process.cwd(),
        "deployments/base-mainnet/deployment.json",
      ),
      outputDir: path.join(
        process.cwd(),
        "scripts/indexer/output/base-mainnet",
      ),
      rpcEnv: "BASE_MAINNET_RPC_URL",
    },
    ethereumMainnet: {
      key: "ethereumMainnet",
      label: "Ethereum Mainnet",
      chainId: 1,
      deploymentRecordPath: path.join(
        process.cwd(),
        "deployments/ethereum-mainnet/deployment.json",
      ),
      outputDir: path.join(
        process.cwd(),
        "scripts/indexer/output/ethereum-mainnet",
      ),
      rpcEnv: "ETHEREUM_MAINNET_RPC_URL",
    },
  };

const SUPPORTED_NETWORK_KEYS = Object.keys(INDEXER_NETWORKS).join(", ");

export function getIndexerNetworkConfig(
  networkKey: string | undefined,
): IndexerNetworkConfig {
  if (!networkKey) {
    throw new Error(
      `Missing indexer network key. Use: ${SUPPORTED_NETWORK_KEYS}.`,
    );
  }

  if (!(networkKey in INDEXER_NETWORKS)) {
    throw new Error(
      `Unsupported indexer network "${networkKey}". Use: ${SUPPORTED_NETWORK_KEYS}.`,
    );
  }

  return INDEXER_NETWORKS[networkKey as IndexerNetworkKey];
}

function requireAddress(label: string, value: unknown): `0x${string}` {
  if (typeof value !== "string" || !isAddress(value)) {
    throw new Error(`${label} is missing or invalid: ${String(value)}`);
  }

  return getAddress(value);
}

export function validateDeploymentRecord(
  config: IndexerNetworkConfig,
  record: DeploymentRecord,
): DeploymentRecord {
  if (record.network.chainId !== config.chainId) {
    throw new Error(
      `Deployment chainId mismatch. Expected ${config.chainId}, got ${record.network.chainId}.`,
    );
  }

  return {
    ...record,
    contracts: {
      roty: requireAddress("contracts.roty", record.contracts.roty),
      melting: requireAddress("contracts.melting", record.contracts.melting),
      amanda: requireAddress("contracts.amanda", record.contracts.amanda),
      staking: requireAddress("contracts.staking", record.contracts.staking),
      rewardDistributor: requireAddress(
        "contracts.rewardDistributor",
        record.contracts.rewardDistributor,
      ),
    },
    tokens: {
      oioi: requireAddress("tokens.oioi", record.tokens.oioi),
    },
  };
}
