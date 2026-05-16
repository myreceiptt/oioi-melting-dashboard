import fs from "node:fs";
import path from "node:path";
import type {
  CurrentOwnerRecord,
  CurrentStakeRecord,
  DeploymentRecord,
  IndexerCheckpoints,
  IndexerMetadata,
  IndexerNetworkConfig,
  RewardEventRecord,
  StakingEventRecord,
  TransferRecord,
} from "./types.js";
import { validateDeploymentRecord } from "./config.js";

function readJsonFile<T>(filePath: string): T | null {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function writeJsonFile(filePath: string, value: unknown) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

export function ensureOutputDir(config: IndexerNetworkConfig) {
  fs.mkdirSync(config.outputDir, { recursive: true });
}

export function getOutputFile(config: IndexerNetworkConfig, filename: string) {
  return path.join(config.outputDir, filename);
}

export function readDeploymentRecord(
  config: IndexerNetworkConfig,
): DeploymentRecord {
  const record = readJsonFile<DeploymentRecord>(config.deploymentRecordPath);

  if (!record) {
    throw new Error(`Missing deployment record: ${config.deploymentRecordPath}`);
  }

  return validateDeploymentRecord(config, record);
}

export function createEmptyCheckpoints({
  config,
  deployment,
}: {
  config: IndexerNetworkConfig;
  deployment: DeploymentRecord;
}): IndexerCheckpoints {
  const now = new Date().toISOString();

  if (
    !deployment.contracts.roty ||
    !deployment.contracts.melting ||
    !deployment.contracts.amanda ||
    !deployment.contracts.staking ||
    !deployment.contracts.rewardDistributor
  ) {
    throw new Error("Deployment record is incomplete.");
  }

  return {
    network: config.key,
    chainId: config.chainId,
    updatedAt: now,
    sources: {
      roty: {
        address: deployment.contracts.roty,
        lastSyncedBlock: 0,
      },
      melting: {
        address: deployment.contracts.melting,
        lastSyncedBlock: 0,
      },
      amanda: {
        address: deployment.contracts.amanda,
        lastSyncedBlock: 0,
      },
      staking: {
        address: deployment.contracts.staking,
        lastSyncedBlock: 0,
      },
      rewardDistributor: {
        address: deployment.contracts.rewardDistributor,
        lastSyncedBlock: 0,
      },
    },
  };
}

export function readOrCreateCheckpoints({
  config,
  deployment,
}: {
  config: IndexerNetworkConfig;
  deployment: DeploymentRecord;
}) {
  ensureOutputDir(config);

  const file = getOutputFile(config, "checkpoints.json");
  const existing = readJsonFile<IndexerCheckpoints>(file);

  if (existing) {
    return existing;
  }

  const empty = createEmptyCheckpoints({ config, deployment });
  writeJsonFile(file, empty);

  return empty;
}

export function writeMetadata({
  config,
}: {
  config: IndexerNetworkConfig;
}) {
  ensureOutputDir(config);

  const file = getOutputFile(config, "metadata.json");
  const existing = readJsonFile<IndexerMetadata>(file);
  const now = new Date().toISOString();

  const metadata: IndexerMetadata = {
    network: config.key,
    chainId: config.chainId,
    label: config.label,
    deploymentRecordPath: config.deploymentRecordPath,
    outputDir: config.outputDir,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  writeJsonFile(file, metadata);

  return metadata;
}

export function initializeEmptyDataFiles(config: IndexerNetworkConfig) {
  ensureOutputDir(config);

  const emptyFiles: Record<string, unknown[]> = {
    "events.json": [],
    "transfers.json": [] satisfies TransferRecord[],
    "staking-events.json": [] satisfies StakingEventRecord[],
    "reward-events.json": [] satisfies RewardEventRecord[],
    "current-owners.json": [] satisfies CurrentOwnerRecord[],
    "current-stakes.json": [] satisfies CurrentStakeRecord[],
  };

  for (const [filename, value] of Object.entries(emptyFiles)) {
    const file = getOutputFile(config, filename);

    if (!fs.existsSync(file)) {
      writeJsonFile(file, value);
    }
  }
}

export function readOutputJson<T>(
  config: IndexerNetworkConfig,
  filename: string,
  fallback: T,
): T {
  return readJsonFile<T>(getOutputFile(config, filename)) ?? fallback;
}
