import "dotenv/config";
import fs from "node:fs";
import { createPublicClient, http } from "viem";
import { baseSepolia, sepolia } from "viem/chains";
import { getIndexerNetworkConfig } from "./config.js";
import {
  initializeEmptyDataFiles,
  readDeploymentRecord,
  readOrCreateCheckpoints,
  readOutputJson,
  writeMetadata,
} from "./storage.js";
import type {
  CurrentOwnerRecord,
  CurrentStakeRecord,
  RewardEventRecord,
  StakingEventRecord,
  TransferRecord,
} from "./types.js";

function getViemChain(chainId: number) {
  if (chainId === baseSepolia.id) {
    return baseSepolia;
  }

  if (chainId === sepolia.id) {
    return sepolia;
  }

  throw new Error(`Unsupported chainId for indexer status: ${chainId}`);
}

async function main() {
  const networkKey = process.argv[2];
  const config = getIndexerNetworkConfig(networkKey);
  const deployment = readDeploymentRecord(config);

  writeMetadata({ config });
  initializeEmptyDataFiles(config);

  const checkpoints = readOrCreateCheckpoints({
    config,
    deployment,
  });

  const transfers = readOutputJson<TransferRecord[]>(
    config,
    "transfers.json",
    [],
  );

  const stakingEvents = readOutputJson<StakingEventRecord[]>(
    config,
    "staking-events.json",
    [],
  );

  const rewardEvents = readOutputJson<RewardEventRecord[]>(
    config,
    "reward-events.json",
    [],
  );

  const currentOwners = readOutputJson<CurrentOwnerRecord[]>(
    config,
    "current-owners.json",
    [],
  );

  const currentStakes = readOutputJson<CurrentStakeRecord[]>(
    config,
    "current-stakes.json",
    [],
  );

  const rpcUrl = process.env[config.rpcEnv];

  let latestBlock: string | null = null;

  if (rpcUrl) {
    const client = createPublicClient({
      chain: getViemChain(config.chainId),
      transport: http(rpcUrl),
    });

    latestBlock = (await client.getBlockNumber()).toString();
  }

  console.log("Indexer status");
  console.log({
    network: config.key,
    label: config.label,
    chainId: config.chainId,
    deploymentRecordPath: config.deploymentRecordPath,
    outputDir: config.outputDir,
    outputDirExists: fs.existsSync(config.outputDir),
    rpcEnv: config.rpcEnv,
    rpcConfigured: Boolean(rpcUrl),
    latestBlock,
    contracts: deployment.contracts,
    tokens: deployment.tokens,
    checkpoints,
    counts: {
      transfers: transfers.length,
      stakingEvents: stakingEvents.length,
      rewardEvents: rewardEvents.length,
      currentOwners: currentOwners.length,
      currentStakes: currentStakes.length,
    },
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
