# OiOi Melting Dashboard — Indexer Implementation Plan v3

This document describes the implemented Supabase Postgres-first indexer and reward pipeline.

The earlier Local JSON-first plan is superseded.

---

## 1. Decision Lock

Indexer + Reward MVP uses:

```text
Supabase Postgres-first.
```

Local JSON is not the primary storage for the indexer.

Allowed JSON/static output:

```text
Merkle exports
audit exports
debug backups
whitelist/generated frontend proof data
```

The browser never scans historical blockchain logs.

---

## 2. Current Implementation Status

Completed on testnet:

```text
✅ Supabase schema migrations.
✅ Contract registry and chain metadata.
✅ Checkpoint-backed event sync.
✅ ERC721 Transfer event sync.
✅ Soft staking Staked/Unstaked event sync.
✅ Reward Distributor event sync.
✅ Current ownership rebuild.
✅ Current stake-position rebuild.
✅ Valid staking interval calculation.
✅ Reward allocation calculation.
✅ Merkle root/proof generation.
✅ Reward proof API.
✅ Reward rounds API.
✅ Admin boundary sync job API.
✅ Boundary worker orchestration.
✅ GitHub Actions scheduled worker.
✅ Browser reward claim flow.
✅ Worker jobs / boundary reward flow passed through GitHub Actions.
✅ On-chain reward round creation and user reward claim validated on testnet.
```

Retained legacy/manual tool:

```text
scripts/indexer/sync.ts
```

This file is not the canonical reward pipeline. Keep it for legacy diagnostics only.

---

## 3. Canonical Commands

### Boundary worker

```bash
npm run indexer:boundary-worker
```

This command processes one resumable worker batch. GitHub Actions runs the same command on schedule and by manual dispatch.

### Manual DB commands

```bash
npm run indexer:db-check -- <chain>
npm run indexer:sync-transfers -- <chain>
npm run indexer:rebuild-ownership -- <chain>
npm run indexer:sync-staking -- <chain>
npm run indexer:rebuild-stake-positions -- <chain>
npm run indexer:sync-rewards -- <chain>
npm run indexer:calculate-valid-intervals -- <chain>
npm run rewards:calculate -- <chain>
npm run rewards:merkle-db -- <chain>
```

Use manual commands for diagnostics, recovery, and controlled local runs.

---

## 4. Environment Variables

Required server-side env:

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

BASE_SEPOLIA_RPC_URL=
ETHEREUM_SEPOLIA_RPC_URL=

BASE_SEPOLIA_INDEXER_FROM_BLOCK=
ETHEREUM_SEPOLIA_INDEXER_FROM_BLOCK=

INDEXER_BLOCK_RANGE=10
INDEXER_REQUEST_DELAY_MS=250
INDEXER_WORKER_BLOCK_SPAN=200
INDEXER_WORKER_COMMAND_TIMEOUT_MS=55000
INDEXER_WORKER_RETRY_DELAY_SECONDS=60
INDEXER_WORKER_RATE_LIMIT_DELAY_SECONDS=300
INDEXER_WORKER_LOCK_TTL_SECONDS=120
```

Optional bounded run values:

```env
BASE_SEPOLIA_INDEXER_TO_BLOCK=
ETHEREUM_SEPOLIA_INDEXER_TO_BLOCK=
```

Mainnet values are filled only after mainnet contracts are deployed:

```env
BASE_MAINNET_INDEXER_FROM_BLOCK=
ETHEREUM_MAINNET_INDEXER_FROM_BLOCK=
BASE_MAINNET_INDEXER_TO_BLOCK=
ETHEREUM_MAINNET_INDEXER_TO_BLOCK=
```

Never expose `SUPABASE_SERVICE_ROLE_KEY` to browser code.

---

## 5. Implemented Data Flow

### Reward boundary job

1. Admin submits block tapal batas and reward amount.
2. API creates one `indexer_sync_jobs` row.
3. API creates per-chain/per-task `indexer_sync_job_targets`.
4. API creates per-chain `reward_boundary_snapshots`.
5. Worker processes queued/running targets.
6. Each successful task updates target status and metadata.
7. Final calculation generates reward round rows and Merkle proof rows.

### Event sync

The indexer syncs:

```text
ERC721 Transfer events
OiOiSoftStaking Staked events
OiOiSoftStaking Unstaked events
OiOiRewardDistributor events
```

Event sync is idempotent and checkpointed.

### Derived state

Derived tables are rebuilt from indexed event tables:

```text
current_nft_owners
current_stake_positions
valid_stake_intervals
reward_calculations
reward_rounds
reward_allocations
reward_claims
```

### Dashboard NFT state

Dashboard wallet NFT discovery is separate from reward calculation history.

It uses:

```text
Alchemy NFT data
on-chain staking checks
Supabase dashboard wallet NFT cache
safe API route
```

This avoids coupling routine dashboard display to reward-boundary calculation jobs.

---

## 6. RPC Strategy

Default safe sync range:

```env
INDEXER_BLOCK_RANGE=10
```

Worker batch size:

```env
INDEXER_WORKER_BLOCK_SPAN=200
```

`INDEXER_BLOCK_RANGE` controls individual log query range. `INDEXER_WORKER_BLOCK_SPAN` controls how much work one worker invocation attempts.

If RPC rate limits occur, the worker pauses/retries rather than discarding progress.

---

## 7. GitHub Actions Worker

Workflow:

```text
.github/workflows/boundary-worker.yml
```

Behavior:

```text
runs on schedule
can be manually dispatched
uses npm ci
runs npm run indexer:boundary-worker
uses concurrency group boundary-worker
does not cancel an already running worker
```

GitHub Secrets and Variables must be set one-by-one in repository settings.

Current workflow/configuration is Sepolia-oriented. Mainnet worker operation must be configured after mainnet deployment records, mainnet contract addresses, and mainnet `FROM_BLOCK` values exist.

---

## 8. Stop Conditions

Stop or pause if:

```text
Supabase env missing
service key exposed to frontend
chain ID mismatch
deployment record missing
FROM_BLOCK missing when no checkpoint exists
RPC rate limit persists
event decoding fails
duplicate event insert appears
owner reconstruction mismatches contract reads
stake state mismatches contract reads
reward allocation sum mismatch
Merkle proof verification fails
browser claim fails for known eligible wallet
```

---

## 9. Current Next Step

The indexer/reward worker is implemented and QA-passed for testnet.

Current project next task:

```text
Explicit mainnet deployment approval decision
```

Mainnet indexer operation starts only after mainnet deployment and mainnet env wiring.

Production mainnet reward claim must remain unavailable until:

```text
mainnet indexer support is implemented/configured
mainnet FROM_BLOCK values are recorded
mainnet Supabase contract records are seeded/verified
mainnet reward boundary flow is run
mainnet proof API and browser claim are verified
explicit reward-claim approval is given
```

---

P.S. Read this document freely for information and guidance. Do not redistribute or restate—no quotes, summaries, paraphrases, or derivatives—without prior written permission from [**Prof. NOTA**](https://nota.endhonesa.com/). Sharing the link is allowed. So, share the link, not the text. Do not discuss or re-tell the contents in any form—written, spoken, or recorded—without prior written permission.

---
