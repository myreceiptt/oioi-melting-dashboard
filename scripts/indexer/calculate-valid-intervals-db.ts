import "dotenv/config";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServiceClient } from "../../lib/supabase/server.js";
import { createSupabaseIndexerRepository } from "../../lib/supabase/indexerRepository.js";
import { getIndexerNetworkConfig } from "./config.js";

type CollectionKey = "roty" | "melting" | "amanda";
type StakingEventType = "staked" | "unstaked";

type StakingEventRow = {
  chain_key: string;
  event_type: StakingEventType;
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

type TransferEventRow = {
  chain_key: string;
  collection_key: CollectionKey;
  collection_address: string;
  token_id: string;
  from_address: string;
  to_address: string;
  tx_hash: string;
  log_index: number;
  block_number: number;
  block_timestamp: string;
};

type OwnershipInterval = {
  chain_key: string;
  collection_key: CollectionKey;
  collection_address: string;
  token_id: string;
  owner_address: string;
  start_unix: bigint;
  end_unix: bigint;
  start_iso: string;
  end_iso: string;
  start_tx_hash: string;
  end_tx_hash: string | null;
  start_block_number: number;
  end_block_number: number | null;
};

type StakeInterval = {
  chain_key: string;
  collection_key: CollectionKey;
  collection_address: string;
  token_id: string;
  staker_address: string;
  start_unix: bigint;
  end_unix: bigint;
  start_iso: string;
  end_iso: string;
  staked_tx_hash: string;
  unstaked_tx_hash: string | null;
  staked_block_number: number;
  unstaked_block_number: number | null;
};

type ValidStakeIntervalRow = {
  chain_key: string;
  staker_address: string;
  collection_key: CollectionKey;
  collection_address: string;
  token_id: string;
  interval_start: string;
  interval_end: string;
  interval_start_unix: string;
  interval_end_unix: string;
  duration_seconds: number;
  valid: boolean;
  invalid_reason: string | null;
  source: Record<string, unknown>;
};

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

function normalizeAddress(address: string) {
  return address.toLowerCase();
}

function tokenKey(row: {
  chain_key: string;
  collection_key: CollectionKey;
  token_id: string;
}) {
  return [row.chain_key, row.collection_key, String(row.token_id)].join(":");
}

function stakeKey(row: {
  chain_key: string;
  staker_address: string;
  collection_key: CollectionKey;
  token_id: string;
}) {
  return [
    row.chain_key,
    normalizeAddress(row.staker_address),
    row.collection_key,
    String(row.token_id),
  ].join(":");
}

function compareTransfers(a: TransferEventRow, b: TransferEventRow) {
  if (a.block_number !== b.block_number) {
    return a.block_number - b.block_number;
  }

  return a.log_index - b.log_index;
}

function compareStakingEvents(a: StakingEventRow, b: StakingEventRow) {
  if (a.block_number !== b.block_number) {
    return a.block_number - b.block_number;
  }

  return a.log_index - b.log_index;
}

function isoFromUnix(unix: bigint) {
  return new Date(Number(unix) * 1000).toISOString();
}

function unixFromIso(value: string) {
  const parsed = Date.parse(value);

  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid ISO timestamp: ${value}`);
  }

  return BigInt(Math.floor(parsed / 1000));
}

function parseUnixEnv(name: string) {
  const value = process.env[name];

  if (!value || value.trim() === "") {
    return null;
  }

  if (!/^\d+$/.test(value.trim())) {
    throw new Error(`${name} must be a Unix timestamp in seconds.`);
  }

  return BigInt(value.trim());
}

function maxBigInt(a: bigint, b: bigint) {
  return a > b ? a : b;
}

function minBigInt(a: bigint, b: bigint) {
  return a < b ? a : b;
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
        "chain_key, event_type, staker_address, collection_key, collection_address, token_id, staking_timestamp_unix, tx_hash, log_index, block_number, block_timestamp",
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

async function fetchAllTransferEvents({
  supabase,
  chainKey,
}: {
  supabase: SupabaseClient;
  chainKey: string;
}) {
  const pageSize = 1000;
  let from = 0;
  const rows: TransferEventRow[] = [];

  while (true) {
    const to = from + pageSize - 1;

    const { data, error } = await supabase
      .from("nft_transfer_events")
      .select(
        "chain_key, collection_key, collection_address, token_id, from_address, to_address, tx_hash, log_index, block_number, block_timestamp",
      )
      .eq("chain_key", chainKey)
      .order("block_number", { ascending: true })
      .order("log_index", { ascending: true })
      .range(from, to);

    if (error) {
      throw new Error(`Failed to fetch nft_transfer_events: ${error.message}`);
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

function inferCalculationPeriod({
  stakingEvents,
  transferEvents,
}: {
  stakingEvents: StakingEventRow[];
  transferEvents: TransferEventRow[];
}) {
  const envStart = parseUnixEnv("VALID_INTERVAL_PERIOD_START_UNIX");
  const envEnd = parseUnixEnv("VALID_INTERVAL_PERIOD_END_UNIX");

  if ((envStart === null) !== (envEnd === null)) {
    throw new Error(
      "VALID_INTERVAL_PERIOD_START_UNIX and VALID_INTERVAL_PERIOD_END_UNIX must be set together.",
    );
  }

  if (envStart !== null && envEnd !== null) {
    if (envEnd <= envStart) {
      throw new Error(
        "VALID_INTERVAL_PERIOD_END_UNIX must be greater than start.",
      );
    }

    return {
      periodStartUnix: envStart,
      periodEndUnix: envEnd,
      source: "env",
    };
  }

  const timestamps: bigint[] = [];

  for (const event of stakingEvents) {
    timestamps.push(BigInt(event.staking_timestamp_unix));
  }

  for (const event of transferEvents) {
    timestamps.push(unixFromIso(event.block_timestamp));
  }

  if (timestamps.length === 0) {
    throw new Error(
      "Cannot infer calculation period because there are no staking or transfer events.",
    );
  }

  const minTimestamp = timestamps.reduce((min, value) =>
    value < min ? value : min,
  );
  const maxTimestamp = timestamps.reduce((max, value) =>
    value > max ? value : max,
  );

  // Add 1 second so single-event datasets can still produce a bounded period.
  return {
    periodStartUnix: minTimestamp,
    periodEndUnix: maxTimestamp + 1n,
    source: "inferred_from_events",
  };
}

function buildOwnershipIntervals({
  transferEvents,
  periodStartUnix,
  periodEndUnix,
}: {
  transferEvents: TransferEventRow[];
  periodStartUnix: bigint;
  periodEndUnix: bigint;
}) {
  const transfersByToken = new Map<string, TransferEventRow[]>();

  for (const event of transferEvents) {
    const normalizedEvent: TransferEventRow = {
      ...event,
      collection_address: normalizeAddress(event.collection_address),
      token_id: String(event.token_id),
      from_address: normalizeAddress(event.from_address),
      to_address: normalizeAddress(event.to_address),
      tx_hash: normalizeAddress(event.tx_hash),
    };

    const key = tokenKey(normalizedEvent);
    const existing = transfersByToken.get(key) ?? [];
    existing.push(normalizedEvent);
    transfersByToken.set(key, existing);
  }

  const intervals: OwnershipInterval[] = [];

  for (const events of transfersByToken.values()) {
    const sorted = [...events].sort(compareTransfers);

    for (let index = 0; index < sorted.length; index += 1) {
      const current = sorted[index];
      const next = sorted[index + 1];

      const ownerAddress = current.to_address;

      if (ownerAddress === ZERO_ADDRESS) {
        continue;
      }

      const rawStartUnix = unixFromIso(current.block_timestamp);
      const rawEndUnix = next
        ? unixFromIso(next.block_timestamp)
        : periodEndUnix;

      const startUnix = maxBigInt(rawStartUnix, periodStartUnix);
      const endUnix = minBigInt(rawEndUnix, periodEndUnix);

      if (endUnix <= startUnix) {
        continue;
      }

      intervals.push({
        chain_key: current.chain_key,
        collection_key: current.collection_key,
        collection_address: current.collection_address,
        token_id: current.token_id,
        owner_address: ownerAddress,
        start_unix: startUnix,
        end_unix: endUnix,
        start_iso: isoFromUnix(startUnix),
        end_iso: isoFromUnix(endUnix),
        start_tx_hash: current.tx_hash,
        end_tx_hash: next?.tx_hash ?? null,
        start_block_number: current.block_number,
        end_block_number: next?.block_number ?? null,
      });
    }
  }

  return intervals;
}

function buildStakeIntervals({
  stakingEvents,
  periodStartUnix,
  periodEndUnix,
}: {
  stakingEvents: StakingEventRow[];
  periodStartUnix: bigint;
  periodEndUnix: bigint;
}) {
  const activePositions = new Map<string, StakingEventRow>();
  const intervals: StakeInterval[] = [];

  for (const event of [...stakingEvents].sort(compareStakingEvents)) {
    const normalizedEvent: StakingEventRow = {
      ...event,
      staker_address: normalizeAddress(event.staker_address),
      collection_address: normalizeAddress(event.collection_address),
      token_id: String(event.token_id),
      staking_timestamp_unix: String(event.staking_timestamp_unix),
      tx_hash: normalizeAddress(event.tx_hash),
    };

    const key = stakeKey(normalizedEvent);

    if (normalizedEvent.event_type === "staked") {
      activePositions.set(key, normalizedEvent);
      continue;
    }

    const startEvent = activePositions.get(key);

    if (!startEvent) {
      continue;
    }

    const rawStartUnix = BigInt(startEvent.staking_timestamp_unix);
    const rawEndUnix = BigInt(normalizedEvent.staking_timestamp_unix);

    const startUnix = maxBigInt(rawStartUnix, periodStartUnix);
    const endUnix = minBigInt(rawEndUnix, periodEndUnix);

    if (endUnix > startUnix) {
      intervals.push({
        chain_key: startEvent.chain_key,
        collection_key: startEvent.collection_key,
        collection_address: normalizeAddress(startEvent.collection_address),
        token_id: String(startEvent.token_id),
        staker_address: normalizeAddress(startEvent.staker_address),
        start_unix: startUnix,
        end_unix: endUnix,
        start_iso: isoFromUnix(startUnix),
        end_iso: isoFromUnix(endUnix),
        staked_tx_hash: normalizeAddress(startEvent.tx_hash),
        unstaked_tx_hash: normalizeAddress(normalizedEvent.tx_hash),
        staked_block_number: startEvent.block_number,
        unstaked_block_number: normalizedEvent.block_number,
      });
    }

    activePositions.delete(key);
  }

  // Close still-active stake intervals at calculation period end.
  for (const startEvent of activePositions.values()) {
    const rawStartUnix = BigInt(startEvent.staking_timestamp_unix);
    const startUnix = maxBigInt(rawStartUnix, periodStartUnix);
    const endUnix = periodEndUnix;

    if (endUnix <= startUnix) {
      continue;
    }

    intervals.push({
      chain_key: startEvent.chain_key,
      collection_key: startEvent.collection_key,
      collection_address: normalizeAddress(startEvent.collection_address),
      token_id: String(startEvent.token_id),
      staker_address: normalizeAddress(startEvent.staker_address),
      start_unix: startUnix,
      end_unix: endUnix,
      start_iso: isoFromUnix(startUnix),
      end_iso: isoFromUnix(endUnix),
      staked_tx_hash: normalizeAddress(startEvent.tx_hash),
      unstaked_tx_hash: null,
      staked_block_number: startEvent.block_number,
      unstaked_block_number: null,
    });
  }

  return intervals;
}

function calculateValidIntervals({
  ownershipIntervals,
  stakeIntervals,
  periodStartUnix,
  periodEndUnix,
  periodSource,
}: {
  ownershipIntervals: OwnershipInterval[];
  stakeIntervals: StakeInterval[];
  periodStartUnix: bigint;
  periodEndUnix: bigint;
  periodSource: string;
}) {
  const ownershipByTokenAndOwner = new Map<string, OwnershipInterval[]>();

  for (const ownership of ownershipIntervals) {
    const key = [
      ownership.chain_key,
      ownership.owner_address,
      ownership.collection_key,
      ownership.token_id,
    ].join(":");

    const existing = ownershipByTokenAndOwner.get(key) ?? [];
    existing.push(ownership);
    ownershipByTokenAndOwner.set(key, existing);
  }

  const rows: ValidStakeIntervalRow[] = [];

  for (const stake of stakeIntervals) {
    const key = [
      stake.chain_key,
      stake.staker_address,
      stake.collection_key,
      stake.token_id,
    ].join(":");

    const matchingOwnershipIntervals = ownershipByTokenAndOwner.get(key) ?? [];

    for (const ownership of matchingOwnershipIntervals) {
      const intervalStartUnix = maxBigInt(
        stake.start_unix,
        ownership.start_unix,
      );
      const intervalEndUnix = minBigInt(stake.end_unix, ownership.end_unix);

      if (intervalEndUnix <= intervalStartUnix) {
        continue;
      }

      rows.push({
        chain_key: stake.chain_key,
        staker_address: stake.staker_address,
        collection_key: stake.collection_key,
        collection_address: stake.collection_address,
        token_id: stake.token_id,
        interval_start: isoFromUnix(intervalStartUnix),
        interval_end: isoFromUnix(intervalEndUnix),
        interval_start_unix: intervalStartUnix.toString(),
        interval_end_unix: intervalEndUnix.toString(),
        duration_seconds: Number(intervalEndUnix - intervalStartUnix),
        valid: true,
        invalid_reason: null,
        source: {
          stage: "valid-stake-interval-calculator-v1",
          periodSource,
          periodStartUnix: periodStartUnix.toString(),
          periodEndUnix: periodEndUnix.toString(),
          stake: {
            startUnix: stake.start_unix.toString(),
            endUnix: stake.end_unix.toString(),
            stakedTxHash: stake.staked_tx_hash,
            unstakedTxHash: stake.unstaked_tx_hash,
            stakedBlockNumber: stake.staked_block_number,
            unstakedBlockNumber: stake.unstaked_block_number,
          },
          ownership: {
            startUnix: ownership.start_unix.toString(),
            endUnix: ownership.end_unix.toString(),
            startTxHash: ownership.start_tx_hash,
            endTxHash: ownership.end_tx_hash,
            startBlockNumber: ownership.start_block_number,
            endBlockNumber: ownership.end_block_number,
          },
        },
      });
    }
  }

  rows.sort((a, b) => {
    if (a.collection_key !== b.collection_key) {
      return a.collection_key.localeCompare(b.collection_key);
    }

    if (BigInt(a.token_id) !== BigInt(b.token_id)) {
      return BigInt(a.token_id) < BigInt(b.token_id) ? -1 : 1;
    }

    if (BigInt(a.interval_start_unix) !== BigInt(b.interval_start_unix)) {
      return BigInt(a.interval_start_unix) < BigInt(b.interval_start_unix)
        ? -1
        : 1;
    }

    return a.staker_address.localeCompare(b.staker_address);
  });

  return rows;
}

async function clearValidStakeIntervals({
  supabase,
  chainKey,
}: {
  supabase: SupabaseClient;
  chainKey: string;
}) {
  const { error } = await supabase
    .from("valid_stake_intervals")
    .delete()
    .eq("chain_key", chainKey);

  if (error) {
    throw new Error(`Failed to clear valid_stake_intervals: ${error.message}`);
  }
}

async function insertValidStakeIntervals({
  supabase,
  rows,
}: {
  supabase: SupabaseClient;
  rows: ValidStakeIntervalRow[];
}) {
  if (rows.length === 0) {
    return;
  }

  const pageSize = 500;

  for (let start = 0; start < rows.length; start += pageSize) {
    const batch = rows.slice(start, start + pageSize);

    const { error } = await supabase
      .from("valid_stake_intervals")
      .insert(batch);

    if (error) {
      throw new Error(
        `Failed to insert valid_stake_intervals: ${error.message}`,
      );
    }
  }
}

function summarize(rows: ValidStakeIntervalRow[]) {
  const byCollection = {
    roty: rows.filter((row) => row.collection_key === "roty"),
    melting: rows.filter((row) => row.collection_key === "melting"),
    amanda: rows.filter((row) => row.collection_key === "amanda"),
  };

  return {
    totalIntervals: rows.length,
    totalDurationSeconds: rows.reduce(
      (sum, row) => sum + row.duration_seconds,
      0,
    ),
    collections: {
      roty: {
        intervals: byCollection.roty.length,
        durationSeconds: byCollection.roty.reduce(
          (sum, row) => sum + row.duration_seconds,
          0,
        ),
      },
      melting: {
        intervals: byCollection.melting.length,
        durationSeconds: byCollection.melting.reduce(
          (sum, row) => sum + row.duration_seconds,
          0,
        ),
      },
      amanda: {
        intervals: byCollection.amanda.length,
        durationSeconds: byCollection.amanda.reduce(
          (sum, row) => sum + row.duration_seconds,
          0,
        ),
      },
    },
  };
}

async function main() {
  const config = getIndexerNetworkConfig(process.argv[2]);
  const supabase = createSupabaseServiceClient();
  const repository = createSupabaseIndexerRepository(supabase);

  console.log("Calculating valid stake intervals...");
  console.log({
    network: config.key,
    chainId: config.chainId,
    label: config.label,
  });

  const run = await repository.startRun({
    chainKey: config.key,
    runKind: "rebuild",
    metadata: {
      stage: "valid-stake-interval-calculator-v1",
      command: "indexer:calculate-valid-intervals",
      network: config.key,
    },
  });

  try {
    const [stakingEvents, transferEvents] = await Promise.all([
      fetchAllStakingEvents({
        supabase,
        chainKey: config.key,
      }),
      fetchAllTransferEvents({
        supabase,
        chainKey: config.key,
      }),
    ]);

    const {
      periodStartUnix,
      periodEndUnix,
      source: periodSource,
    } = inferCalculationPeriod({
      stakingEvents,
      transferEvents,
    });

    const ownershipIntervals = buildOwnershipIntervals({
      transferEvents,
      periodStartUnix,
      periodEndUnix,
    });

    const stakeIntervals = buildStakeIntervals({
      stakingEvents,
      periodStartUnix,
      periodEndUnix,
    });

    const validIntervals = calculateValidIntervals({
      ownershipIntervals,
      stakeIntervals,
      periodStartUnix,
      periodEndUnix,
      periodSource,
    });

    await clearValidStakeIntervals({
      supabase,
      chainKey: config.key,
    });

    await insertValidStakeIntervals({
      supabase,
      rows: validIntervals,
    });

    const summary = summarize(validIntervals);

    await repository.finishRun({
      runId: run.id,
      status: "success",
      metadata: {
        ...run.metadata,
        periodSource,
        periodStartUnix: periodStartUnix.toString(),
        periodEndUnix: periodEndUnix.toString(),
        stakingEventCount: stakingEvents.length,
        transferEventCount: transferEvents.length,
        ownershipIntervalCount: ownershipIntervals.length,
        stakeIntervalCount: stakeIntervals.length,
        validIntervalCount: validIntervals.length,
        summary,
      },
    });

    console.log("Valid stake intervals calculated.");
    console.log({
      runId: run.id,
      periodSource,
      periodStartUnix: periodStartUnix.toString(),
      periodStart: isoFromUnix(periodStartUnix),
      periodEndUnix: periodEndUnix.toString(),
      periodEnd: isoFromUnix(periodEndUnix),
      stakingEventCount: stakingEvents.length,
      transferEventCount: transferEvents.length,
      ownershipIntervalCount: ownershipIntervals.length,
      stakeIntervalCount: stakeIntervals.length,
      validIntervalCount: validIntervals.length,
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
