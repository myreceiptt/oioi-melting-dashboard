# OiOi Melting Dashboard — Indexer Implementation Plan v2

This document defines the practical implementation plan for the Supabase Postgres-first indexer and reward pipeline.

The previous Local JSON-first plan is superseded.

---

## 1. Decision Lock

Indexer + Reward MVP uses:

```text
Supabase Postgres-first.
```

Local JSON is not the primary storage for the indexer.

Allowed JSON/static output:

```text
Merkle proof exports
public proof snapshots
audit exports
backup snapshots
```

Reason:

```text
The project should avoid rebuilding indexer storage later.
Reward allocation needs durable queryable history.
Frontend/API will need stable indexed data.
Supabase Postgres is fast to set up and still production-realistic.
```

---

## 2. Operational Lock

Accepted decisions:

```text
Indexer does not run in browser.
Frontend never scans blockchain history.
Indexer runs as backend/admin worker or CLI.
Do not rewrite deployment scripts only to capture block numbers.
FROM_BLOCK is manually read from block explorer and stored in .env.
TO_BLOCK is optional and only for bounded backfill/testing.
Checkpoint is written after successful sync and controls resume.
Transfer sync draft is paused/experimental until Supabase-first plan is implemented.
```

---

## 3. Current Status

Completed:

```text
Indexer skeleton implemented.
indexer:status command exists.
indexer:rebuild skeleton exists.
Generated output is ignored except .gitkeep.
```

Paused / Experimental:

```text
Transfer sync draft may exist in scripts/indexer/sync.ts.
ownership calculator draft may exist in scripts/indexer/calculators/ownership.ts.
Do not treat this as accepted production sync.
```

Next accepted step:

```text
Supabase Postgres schema and indexer architecture implementation.
```

---

## 4. Scope

Indexer MVP supports:

```text
Base Sepolia
Ethereum Sepolia
```

Mainnet support is added after Testnet Release Candidate and mainnet deployment.

MVP reads:

```text
ERC721 Transfer events
OiOi Soft Staking Staked events
OiOi Soft Staking Unstaked events
OiOi Reward Distributor reward events
```

MVP produces:

```text
current NFT ownership state
current stake position state
staking timeline
transfer timeline
valid staking duration report
reward allocation records
Merkle proof records
reward proof API
```

---

## 5. Non-Goals for This Stage

Do not build yet:

```text
mainnet reward distribution
fully automated public reward distribution
smart account support
email/social identity
cross-chain merged rewards
browser-side getLogs sync
```

Do not rely on indexer as the only source of truth for write permissions.

Contract reads remain authoritative for live transactions.

---

## 6. Environment Variables

Required server-side env:

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_ANON_KEY=

BASE_SEPOLIA_RPC_URL=
ETHEREUM_SEPOLIA_RPC_URL=

BASE_SEPOLIA_INDEXER_FROM_BLOCK=
BASE_SEPOLIA_INDEXER_TO_BLOCK=

ETHEREUM_SEPOLIA_INDEXER_FROM_BLOCK=
ETHEREUM_SEPOLIA_INDEXER_TO_BLOCK=

INDEXER_BLOCK_RANGE=10
INDEXER_REQUEST_DELAY_MS=250
```

Mainnet values later:

```env
BASE_MAINNET_INDEXER_FROM_BLOCK=
BASE_MAINNET_INDEXER_TO_BLOCK=
ETHEREUM_MAINNET_INDEXER_FROM_BLOCK=
ETHEREUM_MAINNET_INDEXER_TO_BLOCK=
```

Do not expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.

---

## 7. Folder Structure

Proposed:

```text
scripts/indexer/
  config.ts
  types.ts
  db.ts
  schema/
    001_init.sql
  seed-contracts.ts
  sync.ts
  status.ts
  rebuild.ts
  calculators/
    ownership.ts
    staking.ts
    duration.ts
    rewards.ts

lib/server/
  supabaseAdmin.ts

app/api/
  base/
    wallet/[address]/nfts/route.ts
    wallet/[address]/stakes/route.ts
    rewards/rounds/route.ts
    rewards/[roundId]/[address]/route.ts
  ethereum/
    wallet/[address]/nfts/route.ts
    wallet/[address]/stakes/route.ts
    rewards/rounds/route.ts
    rewards/[roundId]/[address]/route.ts
```

---

## 8. Database Schema

Use the schema defined in:

```text
docs/INDEXER_ARCHITECTURE.md
```

Required tables:

```text
chains
contracts
sync_checkpoints
indexed_events
nft_transfers
staking_events
reward_events
current_nft_owners
current_stake_positions
reward_rounds
reward_allocations
```

---

## 9. Implementation Order

### Step 1 — Supabase Setup

Tasks:

```text
create Supabase project
add env variables
create SQL migration
run migration
verify tables
```

Testing:

```text
migration runs
tables exist
service role can write
anon role cannot write unsafe tables unless explicitly allowed
```

### Step 2 — Contract Registry Seed

Tasks:

```text
read deployment records
seed chains
seed contracts
seed $OiOi addresses
```

Testing:

```text
baseSepolia contracts seeded
ethereumSepolia contracts seeded
addresses match deployment.json
```

### Step 3 — Checkpoint Layer

Tasks:

```text
read checkpoint
write checkpoint
resume from checkpoint + 1
fallback to FROM_BLOCK when no checkpoint exists
respect optional TO_BLOCK
```

Testing:

```text
no checkpoint uses FROM_BLOCK
after sync checkpoint exists
next run starts from checkpoint + 1
TO_BLOCK creates bounded run
```

### Step 4 — Transfer Sync

Tasks:

```text
sync ERC721 Transfer events
upsert indexed_events
upsert nft_transfers
build current_nft_owners
```

Testing:

```text
bounded Base Sepolia sync works
bounded Ethereum Sepolia sync works
no duplicate events
current owner matches ownerOf
```

### Step 5 — Staking Sync

Tasks:

```text
sync Staked events
sync Unstaked events
upsert staking_events
build current_stake_positions
```

Testing:

```text
stake active matches contract
stake valid matches contract
unstake updates state
```

### Step 6 — Reward Event Sync

Tasks:

```text
sync RewardRoundCreated
sync RewardRoundFunded
sync Claimed
sync ClaimPausedUpdated
sync MerkleRootUpdated
update reward_rounds
```

Testing:

```text
round appears in DB
funded amount appears
claimed state appears
claim paused state appears
```

### Step 7 — Duration Calculator

Tasks:

```text
build ownership windows
build stake windows
intersect with reward period
compute valid duration seconds
```

Testing:

```text
transfer-out period excluded
transfer-back period included
unstaked period excluded
period boundaries handled correctly
```

### Step 8 — Reward Calculator

Tasks:

```text
apply collection weights
sum wallet weighted duration
calculate amountWei
handle dust
write reward_allocations
generate Merkle input
```

Testing:

```text
allocation sum equals reward amount
wallets with no valid duration receive zero/no allocation
dust assigned explicitly
```

### Step 9 — Merkle Integration

Tasks:

```text
generate root
generate proofs
store proofs in reward_allocations
support proof lookup API
```

Testing:

```text
proof verifies locally
on-chain claim succeeds on testnet
double claim prevented
```

### Step 10 — API Routes

Tasks:

```text
owned NFTs API
stake status API
reward rounds API
reward proof API
```

Testing:

```text
wallet NFT list returns correct tokens
stake list returns active/valid state
reward proof returns correct amount/proof
non-eligible wallet gets safe empty state
```

### Step 11 — Frontend Claim Integration

Tasks:

```text
active reward claim UI implemented
fetch reward rounds
fetch wallet proof
submit claim transaction
refresh claimed state
```

Testing:

```text
claim via browser succeeds
claimed status updates
already claimed state is blocked
```

---

## 10. Start Block Strategy

The indexer should not guess block numbers.

For v1:

```text
FROM_BLOCK is manually read from block explorer.
```

Use earliest contract creation block for the chain.

Rules:

```text
FROM_BLOCK is used only when no checkpoint exists.
TO_BLOCK limits one sync/backfill run.
After successful sync, checkpoint stores last synced block.
Later runs resume from checkpoint + 1.
If TO_BLOCK remains set and checkpoint already passed it, sync becomes no-op.
```

---

## 11. RPC Range / Rate Limit Strategy

Default safe values:

```env
INDEXER_BLOCK_RANGE=10
INDEXER_REQUEST_DELAY_MS=250
```

Do not run unbounded sync on a free RPC without understanding request volume.

Bounded sync is preferred during development.

---

## 12. Testing Strategy

### Unit Tests

```text
interval intersection
ownership window builder
stake window builder
valid duration
weight calculation
reward allocation
dust handling
Merkle proof generation
```

### Integration Tests

```text
sync bounded event window
resume from checkpoint
prevent duplicate inserts
compare DB state to contract reads
```

### Browser Tests

```text
reward round appears
claimable amount appears
claim succeeds
claimed status updates
```

---

## 13. Stop Conditions

Stop if:

```text
Supabase env missing
service key exposed to browser
chain ID mismatch
deployment record missing
FROM_BLOCK missing when no checkpoint exists
event decoding fails
duplicate events appear
owner reconstruction mismatches contract
stake state mismatches contract
reward allocation sum mismatch
proof verification fails
browser claim fails for known eligible wallet
```

---

## 14. Done Criteria

Indexer + Reward MVP is done when:

```text
Supabase schema exists
Base Sepolia events sync
Ethereum Sepolia events sync
current owners/stakes match contract reads
reward duration calculator passes
reward allocation generated
Merkle proof generated
proof API works
browser claim works
claimed status updates
```

---

## 15. Current Next Step

```text
Admin Dashboard Architecture v1
```

Indexer implementation begins after Admin Dashboard Architecture is planned, unless the execution plan is explicitly adjusted.

---

P.S. Read this document freely for information and guidance. Do not redistribute or restate—no quotes, summaries, paraphrases, or derivatives—without prior written permission from [**Prof. NOTA**](https://nota.endhonesa.com/). Sharing the link is allowed. So, share the link, not the text. Do not discuss or re-tell the contents in any form—written, spoken, or recorded—without prior written permission.

---
