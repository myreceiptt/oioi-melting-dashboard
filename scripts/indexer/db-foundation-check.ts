import "dotenv/config";
import { createSupabaseServiceClient } from "../../lib/supabase/server.js";
import { createSupabaseIndexerRepository } from "../../lib/supabase/indexerRepository.js";
import { getIndexerNetworkConfig } from "./config.js";
import { readDeploymentRecord } from "./storage.js";

function parseOptionalPositiveInt(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  if (!/^\d+$/.test(value)) {
    throw new Error(`Invalid positive integer: ${value}`);
  }

  return Number(value);
}

async function main() {
  const config = getIndexerNetworkConfig(process.argv[2]);
  const deployment = readDeploymentRecord(config);
  const supabase = createSupabaseServiceClient();
  const repository = createSupabaseIndexerRepository(supabase);

  const blockRangeSize = parseOptionalPositiveInt(
    process.env.INDEXER_BLOCK_RANGE,
  );

  console.log("Running DB-backed indexer foundation check...");
  console.log({
    network: config.key,
    chainId: config.chainId,
    label: config.label,
    blockRangeSize: blockRangeSize ?? null,
  });

  const run = await repository.startRun({
    chainKey: config.key,
    runKind: "sync",
    metadata: {
      stage: "db-backed-indexer-foundation-v1",
      command: "indexer:db-check",
      network: config.key,
    },
  });

  try {
    const contracts = await repository.assertContractsMatchDeployment({
      config,
      deployment,
    });

    const checkpoints = await repository.upsertAllCheckpoints({
      config,
      deployment,
      blockRangeSize,
    });

    await repository.finishRun({
      runId: run.id,
      status: "success",
      metadata: {
        ...run.metadata,
        contractCount: contracts.length,
        checkpointCount: checkpoints.length,
      },
    });

    console.log("DB-backed indexer foundation OK.");
    console.log({
      runId: run.id,
      contracts: contracts.map((contract) => ({
        contractKey: contract.contract_key,
        address: contract.address,
        indexerFromBlock: contract.indexer_from_block,
        deploymentBlock: contract.deployment_block,
      })),
      checkpoints: checkpoints.map((checkpoint) => ({
        sourceKey: checkpoint.source_key,
        contractAddress: checkpoint.contract_address,
        fromBlock: checkpoint.from_block,
        lastSyncedBlock: checkpoint.last_synced_block,
        blockRangeSize: checkpoint.block_range_size,
        status: checkpoint.status,
      })),
    });
  } catch (error) {
    await repository.finishRun({
      runId: run.id,
      status: "failed",
      errorMessage: error instanceof Error ? error.message : String(error),
      metadata: {
        ...run.metadata,
        failedAt: new Date().toISOString(),
      },
    });

    throw error;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
