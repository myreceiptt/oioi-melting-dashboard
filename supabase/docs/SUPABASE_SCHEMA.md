# Supabase Schema

This document describes the database foundation for the OiOi Melting Dashboard indexer, reward pipeline, boundary worker, and dashboard wallet NFT cache.

---

## Scope

The current schema supports:

```text
DB-backed indexer checkpoints
ERC721 Transfer event storage
Soft staking event storage
Reward distributor event storage
Current ownership rebuild
Current staking state rebuild
Valid staking duration calculation
Reward calculation
Merkle allocation/proof storage
Reward claim tracking
Boundary sync job orchestration
Boundary snapshot tracking
Indexer locks
Dashboard wallet NFT cache
NFT media HTML support
```

The schema does not change deployed smart contracts.

---

## Migrations

Apply migrations in order:

```text
001_initial_schema.sql
002_reward_amount_columns_as_text.sql
003_boundary_sync_orchestration.sql
004_dashboard_wallet_nft_cache.sql
005_dashboard_wallet_nft_media_html.sql
```

Migration purpose:

```text
001 initial indexer/reward tables
002 reward amount text precision compatibility
003 boundary sync jobs, targets, snapshots, locks, boundary metadata columns
004 dashboard wallet NFT cache
005 dashboard NFT media HTML support
```

---

## Security Model

Server-side writes use:

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

Do not expose `SUPABASE_SERVICE_ROLE_KEY` in browser code.

Browser-facing reads should go through safe Next.js API routes or explicitly safe RLS policies.

Current important API routes:

```text
app/api/admin/boundary-sync/route.ts
app/api/admin/reward-rounds/route.ts
app/api/cron/boundary-sync/route.ts
app/api/dashboard/wallet-nfts/route.ts
app/api/rewards/proof/route.ts
app/api/rewards/rounds/route.ts
```

---

## Core Tables

### `chains`

Stores chain metadata.

Current seeded chains:

```text
baseSepolia
ethereumSepolia
```

### `contracts`

Stores deployed contract addresses per chain.

Seeded contract keys:

```text
roty
melting
amanda
staking
rewardDistributor
oioi
```

### `indexer_checkpoints`

Stores source-specific sync progress.

Common source keys:

```text
nft_transfers:roty
nft_transfers:melting
nft_transfers:amanda
staking_events
reward_events
```

### `nft_transfer_events`

Stores ERC721 `Transfer` logs for ROTY, Melting, and Amanda collections.

### `staking_events`

Stores `Staked` and `Unstaked` events from `OiOiSoftStaking`.

### `collection_approval_events`

Stores `CollectionApprovalUpdated` events from `OiOiSoftStaking`.

### `reward_round_events`

Stores Reward Distributor events:

```text
RewardRoundCreated
RewardRoundFunded
MerkleRootUpdated
ClaimPausedUpdated
Claimed
rescue events if needed
```

### `current_nft_owners`

Derived table rebuilt from `nft_transfer_events`.

### `current_stake_positions`

Derived table rebuilt from `staking_events` and current NFT ownership.

```text
valid = active && currently_owned
```

### `valid_stake_intervals`

Derived table for reward calculation.

Stores valid holding/staking intervals per staker, collection, and token.

### `reward_calculations`

Stores calculation runs before a reward round is created/funded on-chain.

Boundary metadata links the calculation to its submitted tapal batas.

### `reward_rounds`

Stores planned/generated reward round metadata and synced on-chain state.

Important convention:

```text
roundId = timestamp periodEnd
```

The smart contract does not auto-generate round IDs. The backend/Admin UI generates the round ID.

### `reward_allocations`

Stores Merkle allocation rows and proofs.

This table powers the reward proof API and user claim UI.

### `reward_claims`

Stores synced `Claimed` events.

---

## Boundary Sync Orchestration Tables

### `indexer_sync_jobs`

Stores top-level worker jobs.

Current job kind:

```text
reward_boundary_sync
```

Statuses:

```text
queued
running
paused
success
failed
cancelled
```

### `indexer_sync_job_targets`

Stores per-chain/per-task worker targets.

Task keys:

```text
roty
melting
amanda
staking
rewardDistributor
rebuildOwnership
rebuildStakePositions
calculateValidIntervals
calculateRewards
generateMerkle
```

### `reward_boundary_snapshots`

Stores the submitted reward period boundaries per chain.

Each snapshot records:

```text
from_block
to_block
from/to timestamps
reward amount
sync job id
status
```

### `indexer_locks`

Prevents overlapping worker execution for the same lock scope.

---

## Dashboard Wallet NFT Cache

Dashboard NFT display is intentionally separate from reward-boundary calculation state.

The dashboard wallet NFT cache stores fetched/enriched NFT data for:

```text
wallet
chain
collection
token id
metadata
image media
animation media
staking state
source diagnostics
```

The dashboard cache is refreshed by `app/api/dashboard/wallet-nfts/route.ts`.

It uses Alchemy NFT data plus on-chain staking reads.

---

## Canonical Stage Sequence

Reward-boundary flow:

1. Apply migrations.
2. Set Supabase and RPC env.
3. Submit tapal batas + reward amount from Admin Reward Operations.
4. Run `npm run indexer:boundary-worker` locally or through GitHub Actions.
5. Worker syncs events.
6. Worker rebuilds ownership/stake state.
7. Worker calculates valid stake intervals.
8. Worker calculates reward allocations.
9. Worker generates Merkle proof rows.
10. Admin creates reward round on-chain.
11. Admin approves and funds $OiOi.
12. Users claim from Reward Claim Panel.

---

P.S. Read this document freely for information and guidance. Do not redistribute or restate—no quotes, summaries, paraphrases, or derivatives—without prior written permission from [**Prof. NOTA**](https://nota.endhonesa.com/). Sharing the link is allowed. So, share the link, not the text. Do not discuss or re-tell the contents in any form—written, spoken, or recorded—without prior written permission.
