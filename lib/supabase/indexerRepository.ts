import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CollectionKey,
  DeploymentRecord,
  IndexerNetworkConfig,
  IndexerSourceKey,
} from "@/scripts/indexer/types.js";

type IndexerRunKind =
  | "sync"
  | "rebuild"
  | "reward_calculation"
  | "proof_generation";
type IndexerRunStatus = "running" | "success" | "failed";
type CheckpointStatus = "idle" | "syncing" | "success" | "failed" | "paused";

export type IndexerRunRecord = {
  id: string;
  chain_key: string;
  run_kind: IndexerRunKind;
  status: IndexerRunStatus;
  started_at: string;
  finished_at: string | null;
  error_message: string | null;
  metadata: Record<string, unknown>;
};

export type IndexerCheckpointRecord = {
  chain_key: string;
  source_key: string;
  contract_key: string;
  contract_address: string;
  from_block: number;
  last_synced_block: number | null;
  latest_safe_block: number | null;
  block_range_size: number | null;
  status: CheckpointStatus;
  updated_at: string;
  metadata: Record<string, unknown>;
};

export type ContractRecord = {
  id: string;
  chain_key: string;
  contract_key: string;
  contract_kind: string;
  address: string;
  deployment_block: number | null;
  indexer_from_block: number | null;
  label: string;
};

const sourceContractKeys: Record<
  IndexerSourceKey,
  keyof DeploymentRecord["contracts"]
> = {
  roty: "roty",
  melting: "melting",
  amanda: "amanda",
  staking: "staking",
  rewardDistributor: "rewardDistributor",
};

const sourceKeys: IndexerSourceKey[] = [
  "roty",
  "melting",
  "amanda",
  "staking",
  "rewardDistributor",
];

export function normalizeAddress(value: string) {
  return value.toLowerCase();
}

export function getSourceKeys() {
  return sourceKeys;
}

export function getCollectionSourceKeys(): CollectionKey[] {
  return ["roty", "melting", "amanda"];
}

export function sourceToContractKey(sourceKey: IndexerSourceKey) {
  return sourceContractKeys[sourceKey];
}

export function getDeploymentAddressForSource({
  deployment,
  sourceKey,
}: {
  deployment: DeploymentRecord;
  sourceKey: IndexerSourceKey;
}) {
  const contractKey = sourceToContractKey(sourceKey);
  const address = deployment.contracts[contractKey];

  if (!address) {
    throw new Error(`Missing deployment contract address for ${sourceKey}`);
  }

  return address;
}

function getRequiredFromBlock({
  config,
  sourceKey,
  contract,
}: {
  config: IndexerNetworkConfig;
  sourceKey: IndexerSourceKey;
  contract?: ContractRecord;
}) {
  if (
    contract?.indexer_from_block !== null &&
    contract?.indexer_from_block !== undefined
  ) {
    return Number(contract.indexer_from_block);
  }

  if (
    contract?.deployment_block !== null &&
    contract?.deployment_block !== undefined
  ) {
    return Number(contract.deployment_block);
  }

  const envName =
    config.key === "baseSepolia"
      ? "BASE_SEPOLIA_INDEXER_FROM_BLOCK"
      : "ETHEREUM_SEPOLIA_INDEXER_FROM_BLOCK";

  const envValue = process.env[envName];

  if (envValue && /^\d+$/.test(envValue)) {
    return Number(envValue);
  }

  throw new Error(
    `Missing indexer from block for ${config.key}:${sourceKey}. Set ${envName} or contracts.indexer_from_block/deployment_block in Supabase.`,
  );
}

export class SupabaseIndexerRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async startRun({
    chainKey,
    runKind,
    metadata = {},
  }: {
    chainKey: string;
    runKind: IndexerRunKind;
    metadata?: Record<string, unknown>;
  }) {
    const { data, error } = await this.supabase
      .from("indexer_runs")
      .insert({
        chain_key: chainKey,
        run_kind: runKind,
        status: "running",
        metadata,
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to start indexer run: ${error.message}`);
    }

    return data as IndexerRunRecord;
  }

  async finishRun({
    runId,
    status,
    errorMessage,
    metadata,
  }: {
    runId: string;
    status: Extract<IndexerRunStatus, "success" | "failed">;
    errorMessage?: string;
    metadata?: Record<string, unknown>;
  }) {
    const update: Record<string, unknown> = {
      status,
      finished_at: new Date().toISOString(),
    };

    if (errorMessage) {
      update.error_message = errorMessage;
    }

    if (metadata) {
      update.metadata = metadata;
    }

    const { data, error } = await this.supabase
      .from("indexer_runs")
      .update(update)
      .eq("id", runId)
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to finish indexer run: ${error.message}`);
    }

    return data as IndexerRunRecord;
  }

  async getContracts(chainKey: string) {
    const { data, error } = await this.supabase
      .from("contracts")
      .select(
        "id, chain_key, contract_key, contract_kind, address, deployment_block, indexer_from_block, label",
      )
      .eq("chain_key", chainKey)
      .order("contract_key", { ascending: true });

    if (error) {
      throw new Error(`Failed to read contracts: ${error.message}`);
    }

    return (data ?? []) as ContractRecord[];
  }

  async assertContractsMatchDeployment({
    config,
    deployment,
  }: {
    config: IndexerNetworkConfig;
    deployment: DeploymentRecord;
  }) {
    const contracts = await this.getContracts(config.key);
    const byKey = new Map(
      contracts.map((contract) => [contract.contract_key, contract]),
    );

    const expected: Record<string, string> = {
      roty: deployment.contracts.roty!,
      melting: deployment.contracts.melting!,
      amanda: deployment.contracts.amanda!,
      staking: deployment.contracts.staking!,
      rewardDistributor: deployment.contracts.rewardDistributor!,
      oioi: deployment.tokens.oioi!,
    };

    const mismatches: string[] = [];

    for (const [contractKey, expectedAddress] of Object.entries(expected)) {
      const contract = byKey.get(contractKey);

      if (!contract) {
        mismatches.push(`${contractKey}: missing in Supabase contracts table`);
        continue;
      }

      if (
        normalizeAddress(contract.address) !== normalizeAddress(expectedAddress)
      ) {
        mismatches.push(
          `${contractKey}: Supabase=${contract.address} deployment=${expectedAddress}`,
        );
      }
    }

    if (mismatches.length > 0) {
      throw new Error(
        `Contract mismatch for ${config.key}:\n${mismatches.join("\n")}`,
      );
    }

    return contracts;
  }

  async getCheckpoint({
    chainKey,
    sourceKey,
  }: {
    chainKey: string;
    sourceKey: IndexerSourceKey;
  }) {
    const { data, error } = await this.supabase
      .from("indexer_checkpoints")
      .select("*")
      .eq("chain_key", chainKey)
      .eq("source_key", sourceKey)
      .maybeSingle();

    if (error) {
      throw new Error(
        `Failed to read checkpoint ${chainKey}:${sourceKey}: ${error.message}`,
      );
    }

    return data as IndexerCheckpointRecord | null;
  }

  async upsertCheckpoint({
    config,
    deployment,
    sourceKey,
    status = "idle",
    blockRangeSize,
    latestSafeBlock,
  }: {
    config: IndexerNetworkConfig;
    deployment: DeploymentRecord;
    sourceKey: IndexerSourceKey;
    status?: CheckpointStatus;
    blockRangeSize?: number;
    latestSafeBlock?: number;
  }) {
    const contracts = await this.getContracts(config.key);
    const contractKey = sourceToContractKey(sourceKey);
    const contract = contracts.find(
      (item) => item.contract_key === contractKey,
    );
    const contractAddress = getDeploymentAddressForSource({
      deployment,
      sourceKey,
    });

    const existing = await this.getCheckpoint({
      chainKey: config.key,
      sourceKey,
    });

    const fromBlock =
      existing?.from_block ??
      getRequiredFromBlock({
        config,
        sourceKey,
        contract,
      });

    const payload = {
      chain_key: config.key,
      source_key: sourceKey,
      contract_key: contractKey,
      contract_address: normalizeAddress(contractAddress),
      from_block: fromBlock,
      last_synced_block: existing?.last_synced_block ?? null,
      latest_safe_block: latestSafeBlock ?? existing?.latest_safe_block ?? null,
      block_range_size: blockRangeSize ?? existing?.block_range_size ?? null,
      status,
      metadata: {
        ...(existing?.metadata ?? {}),
        deploymentRecordAddress: contractAddress,
        updatedBy: "db-backed-indexer-foundation-v1",
      },
    };

    const { data, error } = await this.supabase
      .from("indexer_checkpoints")
      .upsert(payload, {
        onConflict: "chain_key,source_key",
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(
        `Failed to upsert checkpoint ${config.key}:${sourceKey}: ${error.message}`,
      );
    }

    return data as IndexerCheckpointRecord;
  }

  async upsertAllCheckpoints({
    config,
    deployment,
    blockRangeSize,
  }: {
    config: IndexerNetworkConfig;
    deployment: DeploymentRecord;
    blockRangeSize?: number;
  }) {
    const checkpoints: IndexerCheckpointRecord[] = [];

    for (const sourceKey of sourceKeys) {
      checkpoints.push(
        await this.upsertCheckpoint({
          config,
          deployment,
          sourceKey,
          blockRangeSize,
        }),
      );
    }

    return checkpoints;
  }
}

export function createSupabaseIndexerRepository(supabase: SupabaseClient) {
  return new SupabaseIndexerRepository(supabase);
}
