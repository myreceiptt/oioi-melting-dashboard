import "dotenv/config";
import { createSupabaseServiceClient } from "../../lib/supabase/server.js";
import { createSupabaseIndexerRepository } from "../../lib/supabase/indexerRepository.js";
import { getIndexerNetworkConfig } from "./config.js";

type TransferEventRow = {
  chain_key: string;
  chain_id: number;
  collection_key: "roty" | "melting" | "amanda";
  collection_address: string;
  token_id: string;
  from_address: string;
  to_address: string;
  tx_hash: string;
  log_index: number;
  block_number: number;
  block_timestamp: string;
};

type CurrentOwnerRow = {
  chain_key: string;
  collection_key: "roty" | "melting" | "amanda";
  collection_address: string;
  token_id: string;
  owner_address: string;
  last_transfer_tx_hash: string;
  last_transfer_log_index: number;
  last_transfer_block_number: number;
  last_transfer_block_timestamp: string;
};

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

function ownerKey(
  row: Pick<TransferEventRow, "chain_key" | "collection_key" | "token_id">,
) {
  return `${row.chain_key}:${row.collection_key}:${row.token_id}`;
}

function compareTransfers(a: TransferEventRow, b: TransferEventRow) {
  if (a.block_number !== b.block_number) {
    return a.block_number - b.block_number;
  }

  return a.log_index - b.log_index;
}

async function fetchAllTransferEvents({ chainKey }: { chainKey: string }) {
  const supabase = createSupabaseServiceClient();
  const pageSize = 1000;
  let from = 0;
  const rows: TransferEventRow[] = [];

  while (true) {
    const to = from + pageSize - 1;

    const { data, error } = await supabase
      .from("nft_transfer_events")
      .select(
        "chain_key, chain_id, collection_key, collection_address, token_id, from_address, to_address, tx_hash, log_index, block_number, block_timestamp",
      )
      .eq("chain_key", chainKey)
      .order("block_number", { ascending: true })
      .order("log_index", { ascending: true })
      .range(from, to);

    if (error) {
      throw new Error(`Failed to fetch transfer events: ${error.message}`);
    }

    const batch = (data ?? []) as TransferEventRow[];
    rows.push(...batch);

    if (batch.length < pageSize) {
      break;
    }

    from += pageSize;
  }

  return rows;
}

async function clearCurrentOwnersForChain(chainKey: string) {
  const supabase = createSupabaseServiceClient();

  const { error } = await supabase
    .from("current_nft_owners")
    .delete()
    .eq("chain_key", chainKey);

  if (error) {
    throw new Error(`Failed to clear current_nft_owners: ${error.message}`);
  }
}

async function upsertCurrentOwners(rows: CurrentOwnerRow[]) {
  if (rows.length === 0) {
    return;
  }

  const supabase = createSupabaseServiceClient();
  const pageSize = 500;

  for (let start = 0; start < rows.length; start += pageSize) {
    const batch = rows.slice(start, start + pageSize);

    const { error } = await supabase.from("current_nft_owners").upsert(batch, {
      onConflict: "chain_key,collection_key,token_id",
    });

    if (error) {
      throw new Error(`Failed to upsert current_nft_owners: ${error.message}`);
    }
  }
}

function rebuildCurrentOwners(events: TransferEventRow[]) {
  const latestByToken = new Map<string, TransferEventRow>();

  for (const event of [...events].sort(compareTransfers)) {
    latestByToken.set(ownerKey(event), event);
  }

  const currentOwners: CurrentOwnerRow[] = [];

  for (const event of latestByToken.values()) {
    const ownerAddress = event.to_address.toLowerCase();

    // Burned tokens should not be considered currently owned.
    if (ownerAddress === ZERO_ADDRESS) {
      continue;
    }

    currentOwners.push({
      chain_key: event.chain_key,
      collection_key: event.collection_key,
      collection_address: event.collection_address.toLowerCase(),
      token_id: event.token_id,
      owner_address: ownerAddress,
      last_transfer_tx_hash: event.tx_hash.toLowerCase(),
      last_transfer_log_index: event.log_index,
      last_transfer_block_number: event.block_number,
      last_transfer_block_timestamp: event.block_timestamp,
    });
  }

  currentOwners.sort((a, b) => {
    if (a.collection_key !== b.collection_key) {
      return a.collection_key.localeCompare(b.collection_key);
    }

    return BigInt(a.token_id) < BigInt(b.token_id) ? -1 : 1;
  });

  return currentOwners;
}

async function main() {
  const config = getIndexerNetworkConfig(process.argv[2]);
  const supabase = createSupabaseServiceClient();
  const repository = createSupabaseIndexerRepository(supabase);

  console.log("Rebuilding current NFT owners from Supabase transfers...");
  console.log({
    network: config.key,
    chainId: config.chainId,
    label: config.label,
  });

  const run = await repository.startRun({
    chainKey: config.key,
    runKind: "rebuild",
    metadata: {
      stage: "ownership-rebuild-from-supabase-transfers-v1",
      command: "indexer:rebuild-ownership",
      network: config.key,
    },
  });

  try {
    const transferEvents = await fetchAllTransferEvents({
      chainKey: config.key,
    });

    const currentOwners = rebuildCurrentOwners(transferEvents);

    await clearCurrentOwnersForChain(config.key);
    await upsertCurrentOwners(currentOwners);

    await repository.finishRun({
      runId: run.id,
      status: "success",
      metadata: {
        ...run.metadata,
        transferEventCount: transferEvents.length,
        currentOwnerCount: currentOwners.length,
        collections: {
          roty: currentOwners.filter((row) => row.collection_key === "roty")
            .length,
          melting: currentOwners.filter(
            (row) => row.collection_key === "melting",
          ).length,
          amanda: currentOwners.filter((row) => row.collection_key === "amanda")
            .length,
        },
      },
    });

    console.log("Current NFT owners rebuilt.");
    console.log({
      runId: run.id,
      transferEventCount: transferEvents.length,
      currentOwnerCount: currentOwners.length,
      collections: {
        roty: currentOwners.filter((row) => row.collection_key === "roty")
          .length,
        melting: currentOwners.filter((row) => row.collection_key === "melting")
          .length,
        amanda: currentOwners.filter((row) => row.collection_key === "amanda")
          .length,
      },
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
