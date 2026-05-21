import "dotenv/config";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServiceClient } from "@/lib/supabase/server.js";
import { createSupabaseIndexerRepository } from "@/lib/supabase/indexerRepository.js";
import { getIndexerNetworkConfig } from "./config.js";

type CollectionKey = "roty" | "melting" | "amanda";
type StakingEventType = "staked" | "unstaked";

type StakingEventRow = {
  chain_key: string;
  event_type: StakingEventType;
  staking_contract_address: string;
  staker_address: string;
  collection_key: CollectionKey;
  collection_address: string;
  token_id: string;
  staking_timestamp_unix: string;
  tx_hash: string;
  log_index: number;
  block_number: number;
  block_timestamp: string;
};

type CurrentOwnerRow = {
  chain_key: string;
  collection_key: CollectionKey;
  collection_address: string;
  token_id: string;
  owner_address: string;
};

type CurrentStakePositionRow = {
  chain_key: string;
  staker_address: string;
  collection_key: CollectionKey;
  collection_address: string;
  token_id: string;
  active: boolean;
  currently_owned: boolean;
  valid: boolean;
  staked_at: string | null;
  unstaked_at: string | null;
  staked_at_unix: string | null;
  unstaked_at_unix: string | null;
  last_event_tx_hash: string;
  last_event_block_number: number;
  last_event_log_index: number;
  last_event_block_timestamp: string;
};

type PositionAccumulator = {
  chain_key: string;
  staker_address: string;
  collection_key: CollectionKey;
  collection_address: string;
  token_id: string;
  active: boolean;
  staked_at: string | null;
  unstaked_at: string | null;
  staked_at_unix: string | null;
  unstaked_at_unix: string | null;
  last_event_tx_hash: string;
  last_event_block_number: number;
  last_event_log_index: number;
  last_event_block_timestamp: string;
};

function positionKey(
  row: Pick<
    StakingEventRow,
    "chain_key" | "staker_address" | "collection_key" | "token_id"
  >,
) {
  return [
    row.chain_key,
    row.staker_address.toLowerCase(),
    row.collection_key,
    row.token_id,
  ].join(":");
}

function ownerKey(
  row: Pick<CurrentOwnerRow, "chain_key" | "collection_key" | "token_id">,
) {
  return [row.chain_key, row.collection_key, row.token_id].join(":");
}

function compareEvents(a: StakingEventRow, b: StakingEventRow) {
  if (a.block_number !== b.block_number) {
    return a.block_number - b.block_number;
  }

  return a.log_index - b.log_index;
}

function normalizeAddress(address: string) {
  return address.toLowerCase();
}

async function fetchAllStakingEvents({
  supabase,
  chainKey,
}: {
  supabase: SupabaseClient;
  chainKey: string;
}) {
  const pageSize = 1000;
  let from = 0;
  const rows: StakingEventRow[] = [];

  while (true) {
    const to = from + pageSize - 1;

    const { data, error } = await supabase
      .from("staking_events")
      .select(
        "chain_key, event_type, staking_contract_address, staker_address, collection_key, collection_address, token_id, staking_timestamp_unix, tx_hash, log_index, block_number, block_timestamp",
      )
      .eq("chain_key", chainKey)
      .order("block_number", { ascending: true })
      .order("log_index", { ascending: true })
      .range(from, to);

    if (error) {
      throw new Error(`Failed to fetch staking_events: ${error.message}`);
    }

    const batch = (data ?? []) as StakingEventRow[];
    rows.push(...batch);

    if (batch.length < pageSize) {
      break;
    }

    from += pageSize;
  }

  return rows;
}

async function fetchCurrentOwners({
  supabase,
  chainKey,
}: {
  supabase: SupabaseClient;
  chainKey: string;
}) {
  const pageSize = 1000;
  let from = 0;
  const rows: CurrentOwnerRow[] = [];

  while (true) {
    const to = from + pageSize - 1;

    const { data, error } = await supabase
      .from("current_nft_owners")
      .select(
        "chain_key, collection_key, collection_address, token_id, owner_address",
      )
      .eq("chain_key", chainKey)
      .order("collection_key", { ascending: true })
      .order("token_id", { ascending: true })
      .range(from, to);

    if (error) {
      throw new Error(`Failed to fetch current_nft_owners: ${error.message}`);
    }

    const batch = (data ?? []) as CurrentOwnerRow[];
    rows.push(...batch);

    if (batch.length < pageSize) {
      break;
    }

    from += pageSize;
  }

  return rows;
}

async function clearCurrentStakePositions({
  supabase,
  chainKey,
}: {
  supabase: SupabaseClient;
  chainKey: string;
}) {
  const { error } = await supabase
    .from("current_stake_positions")
    .delete()
    .eq("chain_key", chainKey);

  if (error) {
    throw new Error(
      `Failed to clear current_stake_positions: ${error.message}`,
    );
  }
}

async function upsertCurrentStakePositions({
  supabase,
  rows,
}: {
  supabase: SupabaseClient;
  rows: CurrentStakePositionRow[];
}) {
  if (rows.length === 0) {
    return;
  }

  const pageSize = 500;

  for (let start = 0; start < rows.length; start += pageSize) {
    const batch = rows.slice(start, start + pageSize);

    const { error } = await supabase
      .from("current_stake_positions")
      .upsert(batch, {
        onConflict: "chain_key,staker_address,collection_key,token_id",
      });

    if (error) {
      throw new Error(
        `Failed to upsert current_stake_positions: ${error.message}`,
      );
    }
  }
}

function rebuildStakePositions({
  stakingEvents,
  currentOwners,
}: {
  stakingEvents: StakingEventRow[];
  currentOwners: CurrentOwnerRow[];
}) {
  const ownerByToken = new Map<string, CurrentOwnerRow>();

  for (const owner of currentOwners) {
    ownerByToken.set(ownerKey(owner), {
      ...owner,
      owner_address: normalizeAddress(owner.owner_address),
      collection_address: normalizeAddress(owner.collection_address),
      token_id: String(owner.token_id),
    });
  }

  const positions = new Map<string, PositionAccumulator>();

  for (const event of [...stakingEvents].sort(compareEvents)) {
    const normalizedEvent: StakingEventRow = {
      ...event,
      staker_address: normalizeAddress(event.staker_address),
      collection_address: normalizeAddress(event.collection_address),
      token_id: String(event.token_id),
      staking_timestamp_unix: String(event.staking_timestamp_unix),
      tx_hash: normalizeAddress(event.tx_hash),
    };

    const key = positionKey(normalizedEvent);
    const existing = positions.get(key);

    const next: PositionAccumulator = {
      chain_key: normalizedEvent.chain_key,
      staker_address: normalizedEvent.staker_address,
      collection_key: normalizedEvent.collection_key,
      collection_address: normalizedEvent.collection_address,
      token_id: normalizedEvent.token_id,
      active: normalizedEvent.event_type === "staked",
      staked_at:
        normalizedEvent.event_type === "staked"
          ? normalizedEvent.block_timestamp
          : (existing?.staked_at ?? null),
      unstaked_at:
        normalizedEvent.event_type === "unstaked"
          ? normalizedEvent.block_timestamp
          : null,
      staked_at_unix:
        normalizedEvent.event_type === "staked"
          ? normalizedEvent.staking_timestamp_unix
          : (existing?.staked_at_unix ?? null),
      unstaked_at_unix:
        normalizedEvent.event_type === "unstaked"
          ? normalizedEvent.staking_timestamp_unix
          : null,
      last_event_tx_hash: normalizedEvent.tx_hash,
      last_event_block_number: normalizedEvent.block_number,
      last_event_log_index: normalizedEvent.log_index,
      last_event_block_timestamp: normalizedEvent.block_timestamp,
    };

    positions.set(key, next);
  }

  const currentStakePositions: CurrentStakePositionRow[] = [];

  for (const position of positions.values()) {
    const owner = ownerByToken.get(
      ownerKey({
        chain_key: position.chain_key,
        collection_key: position.collection_key,
        token_id: position.token_id,
      }),
    );

    const currentlyOwned =
      owner?.owner_address === normalizeAddress(position.staker_address);
    const valid = position.active && currentlyOwned;

    currentStakePositions.push({
      chain_key: position.chain_key,
      staker_address: position.staker_address,
      collection_key: position.collection_key,
      collection_address: position.collection_address,
      token_id: position.token_id,
      active: position.active,
      currently_owned: currentlyOwned,
      valid,
      staked_at: position.staked_at,
      unstaked_at: position.unstaked_at,
      staked_at_unix: position.staked_at_unix,
      unstaked_at_unix: position.unstaked_at_unix,
      last_event_tx_hash: position.last_event_tx_hash,
      last_event_block_number: position.last_event_block_number,
      last_event_log_index: position.last_event_log_index,
      last_event_block_timestamp: position.last_event_block_timestamp,
    });
  }

  currentStakePositions.sort((a, b) => {
    if (a.collection_key !== b.collection_key) {
      return a.collection_key.localeCompare(b.collection_key);
    }

    if (BigInt(a.token_id) !== BigInt(b.token_id)) {
      return BigInt(a.token_id) < BigInt(b.token_id) ? -1 : 1;
    }

    return a.staker_address.localeCompare(b.staker_address);
  });

  return currentStakePositions;
}

function summarize(rows: CurrentStakePositionRow[]) {
  const summary = {
    total: rows.length,
    active: rows.filter((row) => row.active).length,
    currentlyOwned: rows.filter((row) => row.currently_owned).length,
    valid: rows.filter((row) => row.valid).length,
    collections: {
      roty: {
        total: rows.filter((row) => row.collection_key === "roty").length,
        valid: rows.filter((row) => row.collection_key === "roty" && row.valid)
          .length,
      },
      melting: {
        total: rows.filter((row) => row.collection_key === "melting").length,
        valid: rows.filter(
          (row) => row.collection_key === "melting" && row.valid,
        ).length,
      },
      amanda: {
        total: rows.filter((row) => row.collection_key === "amanda").length,
        valid: rows.filter(
          (row) => row.collection_key === "amanda" && row.valid,
        ).length,
      },
    },
  };

  return summary;
}

async function main() {
  const config = getIndexerNetworkConfig(process.argv[2]);
  const supabase = createSupabaseServiceClient();
  const repository = createSupabaseIndexerRepository(supabase);

  console.log("Rebuilding current stake positions from Supabase events...");
  console.log({
    network: config.key,
    chainId: config.chainId,
    label: config.label,
  });

  const run = await repository.startRun({
    chainKey: config.key,
    runKind: "rebuild",
    metadata: {
      stage: "current-stake-position-rebuild-v1",
      command: "indexer:rebuild-stake-positions",
      network: config.key,
    },
  });

  try {
    const [stakingEvents, currentOwners] = await Promise.all([
      fetchAllStakingEvents({
        supabase,
        chainKey: config.key,
      }),
      fetchCurrentOwners({
        supabase,
        chainKey: config.key,
      }),
    ]);

    const currentStakePositions = rebuildStakePositions({
      stakingEvents,
      currentOwners,
    });

    await clearCurrentStakePositions({
      supabase,
      chainKey: config.key,
    });

    await upsertCurrentStakePositions({
      supabase,
      rows: currentStakePositions,
    });

    const summary = summarize(currentStakePositions);

    await repository.finishRun({
      runId: run.id,
      status: "success",
      metadata: {
        ...run.metadata,
        stakingEventCount: stakingEvents.length,
        currentOwnerCount: currentOwners.length,
        currentStakePositionCount: currentStakePositions.length,
        summary,
      },
    });

    console.log("Current stake positions rebuilt.");
    console.log({
      runId: run.id,
      stakingEventCount: stakingEvents.length,
      currentOwnerCount: currentOwners.length,
      currentStakePositionCount: currentStakePositions.length,
      summary,
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
