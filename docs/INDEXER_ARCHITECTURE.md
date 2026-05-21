# OiOi Melting Dashboard — Indexer Architecture v2

This document defines the indexer/backend architecture for OiOi Melting Dashboard.

The indexer exists because reward calculation must account for both:

1. User staking intent from `OiOiSoftStaking`.
2. Actual NFT ownership from ERC721 `Transfer` events.

The core rule:

```text
valid staking duration = active soft-stake intent ∩ actual NFT ownership duration
```

---

## 1. Purpose

The indexer/backend must support:

1. Owned NFT discovery.
2. Soft staking timeline reconstruction.
3. NFT transfer timeline reconstruction.
4. Valid staking duration calculation.
5. Collection-weighted reward allocation.
6. Merkle reward input generation.
7. Reward proof serving for frontend.
8. Reward round and claim status display.

The indexer is required for fair reward distribution.

The smart contracts do not calculate historical reward allocation.

---

## 2. Current Implementation Status

Current accepted state:

```text
Supabase Postgres schema: migration files implemented.
Transfer sync: implemented for Supabase.
Staking event sync: implemented for Supabase.
Reward event sync: implemented for Supabase.
Derived state rebuilds: implemented.
Valid duration calculator: implemented.
Reward calculator: implemented.
Merkle proof generation: implemented.
Supabase Postgres: locked as primary storage.
Reward proof API: implemented.
Production readiness: pending full testnet validation.
```

Do not treat the pipeline as production-ready until it has completed Base Sepolia and Ethereum Sepolia validation from sync through browser claim.

---

## 3. Non-Goals for v1

The indexer must not:

```text
replace on-chain contract state
custody NFTs
custody $OiOi
calculate rewards on-chain
modify staking contracts
modify NFT contracts
act as user identity provider
use email/phone/social identity
aggregate Base and Ethereum rewards into one claim
run in the user's browser
force deployment script rewrites only for block numbers
```

Rewards remain chain-specific:

```text
Base NFTs → Base staking → Base RewardDistributor → Base $OiOi
Ethereum NFTs → Ethereum staking → Ethereum RewardDistributor → Ethereum $OiOi
```

---

## 4. Storage Decision

Accepted storage:

```text
Supabase Postgres-first.
```

Supabase Postgres is the primary storage for:

```text
chains
contracts
sync checkpoints
indexed events
NFT transfers
staking events
reward events
current NFT owners
current stake positions
reward rounds
reward allocations
reward proofs
claim status snapshots
```

Local JSON is not the primary indexer storage.

Allowed JSON/static outputs:

```text
Merkle output files
public proof snapshots
audit exports
debug backups
```

---

## 5. Operational Model

The operational model is documented in:

```text
docs/INDEXER_OPERATIONAL_MODEL.md
```

Key rules:

```text
Indexer does not run in browser.
Frontend never scans blockchain history.
Indexer runs as backend/admin worker or CLI.
Deployment scripts do not need to be rewritten only to capture block numbers.
FROM_BLOCK is manually read from block explorer and stored in .env.
TO_BLOCK is optional and only for bounded backfill/testing.
Checkpoint controls resume after successful sync.
```

---

## 6. Chain Sets

### Base Set

```text
Chain: Base
Testnet: Base Sepolia
Collections:
- ROTY BASE
- Melting BASE
- Amanda BASE

Contracts:
- TheRotyMemorial
- MeltingMemorial
- AmandaMemorial
- OiOiSoftStaking
- OiOiRewardDistributor
- Base $OiOi
```

### Ethereum Set

```text
Chain: Ethereum
Testnet: Ethereum Sepolia
Collections:
- ROTY dETH
- Melting dETH
- Amanda dETH

Contracts:
- TheRotyMemorial
- MeltingMemorial
- AmandaMemorial
- OiOiSoftStaking
- OiOiRewardDistributor
- Ethereum $OiOi
```

---

## 7. Data Sources

### 7.1 On-chain events

#### ERC721 NFT contracts

```text
Transfer(from, to, tokenId)
```

For:

```text
ROTY
Melting
Amanda
```

#### OiOi Soft Staking

```text
Staked(user, collection, tokenId, timestamp)
Unstaked(user, collection, tokenId, timestamp)
CollectionApprovalUpdated(collection, approved)
```

#### OiOi Reward Distributor

```text
RewardRoundCreated(roundId, periodStart, periodEnd, rewardAmount, merkleRoot)
RewardRoundFunded(roundId, funder, amount, fundedAmount)
Claimed(roundId, account, amount)
ClaimPausedUpdated(roundId, paused)
MerkleRootUpdated(roundId, oldMerkleRoot, newMerkleRoot)
```

### 7.2 Direct on-chain reads

The indexer may use direct reads for sanity checks:

```text
ownerOf(tokenId)
totalMinted()
maxSupply()
isStakeActive(user, collection, tokenId)
isStakeValid(user, collection, tokenId)
hasValidStake(user, collection)
getRewardRound(roundId)
hasClaimed(roundId, account)
```

### 7.3 Deployment records

The indexer reads deployment addresses from:

```text
deployments/base-sepolia/deployment.json
deployments/ethereum-sepolia/deployment.json
deployments/base-mainnet/deployment.json
deployments/ethereum-mainnet/deployment.json
```

Block start values are read from `.env`.

---

## 8. Event Sync Strategy

Each sync run should:

1. Load network config.
2. Load deployment record.
3. Load Supabase connection.
4. Load last synced block from `sync_checkpoints`.
5. If no checkpoint exists, use manual `*_INDEXER_FROM_BLOCK`.
6. Respect optional `*_INDEXER_TO_BLOCK`.
7. Fetch logs in safe block ranges.
8. Decode events.
9. Upsert normalized rows.
10. Rebuild or update derived state.
11. Update checkpoint only after successful sync.
12. Re-run safely if interrupted.

The sync must be idempotent.

Unique event key:

```text
chainId + txHash + logIndex
```

---

## 9. Finality and Reorg Handling

For v1, use confirmation delay:

```text
Base / Base Sepolia: 20 blocks
Ethereum / Sepolia: 20 blocks
```

The indexer should sync only up to:

```text
latestBlock - confirmationDelay
```

Future improvement:

```text
reorg detection by blockHash comparison
```

---

## 10. Supabase Schema v1

### 10.1 chains

```sql
create table if not exists chains (
  chain_id bigint primary key,
  chain_key text not null unique,
  name text not null,
  is_testnet boolean not null,
  created_at timestamptz not null default now()
);
```

### 10.2 contracts

```sql
create table if not exists contracts (
  id uuid primary key default gen_random_uuid(),
  chain_id bigint not null references chains(chain_id),
  contract_key text not null,
  address text not null,
  created_at timestamptz not null default now(),
  unique(chain_id, contract_key),
  unique(chain_id, address)
);
```

### 10.3 sync_checkpoints

```sql
create table if not exists sync_checkpoints (
  chain_id bigint not null references chains(chain_id),
  source_key text not null,
  last_synced_block bigint not null,
  updated_at timestamptz not null default now(),
  primary key(chain_id, source_key)
);
```

### 10.4 indexed_events

```sql
create table if not exists indexed_events (
  chain_id bigint not null,
  tx_hash text not null,
  log_index integer not null,
  block_number bigint not null,
  block_timestamp bigint not null,
  contract_address text not null,
  event_name text not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  primary key(chain_id, tx_hash, log_index)
);
```

### 10.5 nft_transfers

```sql
create table if not exists nft_transfers (
  chain_id bigint not null,
  collection_address text not null,
  collection_key text not null,
  token_id numeric not null,
  from_address text not null,
  to_address text not null,
  tx_hash text not null,
  log_index integer not null,
  block_number bigint not null,
  block_timestamp bigint not null,
  primary key(chain_id, tx_hash, log_index)
);
```

### 10.6 staking_events

```sql
create table if not exists staking_events (
  chain_id bigint not null,
  event_type text not null,
  user_address text not null,
  collection_address text not null,
  collection_key text not null,
  token_id numeric not null,
  tx_hash text not null,
  log_index integer not null,
  block_number bigint not null,
  block_timestamp bigint not null,
  primary key(chain_id, tx_hash, log_index)
);
```

### 10.7 reward_events

```sql
create table if not exists reward_events (
  chain_id bigint not null,
  event_name text not null,
  round_id numeric,
  tx_hash text not null,
  log_index integer not null,
  block_number bigint not null,
  block_timestamp bigint not null,
  payload jsonb not null,
  primary key(chain_id, tx_hash, log_index)
);
```

### 10.8 current_nft_owners

```sql
create table if not exists current_nft_owners (
  chain_id bigint not null,
  collection_address text not null,
  collection_key text not null,
  token_id numeric not null,
  owner_address text not null,
  updated_block_number bigint not null,
  updated_block_timestamp bigint not null,
  primary key(chain_id, collection_address, token_id)
);
```

### 10.9 current_stake_positions

```sql
create table if not exists current_stake_positions (
  chain_id bigint not null,
  user_address text not null,
  collection_address text not null,
  collection_key text not null,
  token_id numeric not null,
  active boolean not null,
  currently_owned boolean not null,
  valid boolean not null,
  staked_at bigint,
  unstaked_at bigint,
  updated_block_number bigint not null,
  updated_block_timestamp bigint not null,
  primary key(chain_id, user_address, collection_address, token_id)
);
```

### 10.10 reward_rounds

```sql
create table if not exists reward_rounds (
  chain_id bigint not null,
  round_id numeric not null,
  period_start bigint not null,
  period_end bigint not null,
  reward_amount_wei numeric not null,
  merkle_root text,
  funded_amount_wei numeric not null default 0,
  claimed_amount_wei numeric not null default 0,
  claim_paused boolean not null default false,
  created_tx_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key(chain_id, round_id)
);
```

### 10.11 reward_allocations

```sql
create table if not exists reward_allocations (
  chain_id bigint not null,
  round_id numeric not null,
  wallet_address text not null,
  amount_wei numeric not null,
  weighted_duration numeric not null,
  proof jsonb not null,
  claimed boolean not null default false,
  created_at timestamptz not null default now(),
  primary key(chain_id, round_id, wallet_address)
);
```

---

## 11. Ownership Reconstruction

NFT ownership is reconstructed from ERC721 `Transfer` events.

Rules:

```text
Transfer(0x0, to, tokenId) = mint
Transfer(from, 0x0, tokenId) = burn, if ever supported
Transfer(from, to, tokenId) = ownership change
```

Current owner:

```text
latest Transfer.to for chain + collection + tokenId
```

---

## 12. Stake Intent Reconstruction

Stake intent is reconstructed from staking events.

Rules:

```text
Staked(user, collection, tokenId)   → active intent starts
Unstaked(user, collection, tokenId) → active intent ends
```

Soft staking does not move the NFT.

Stake is valid only when:

```text
stake intent is active
AND
current owner of NFT == staker
```

---

## 13. Valid Duration Calculation

For a reward period:

```text
periodStart
periodEnd
```

Compute valid duration per NFT:

```text
stake windows ∩ ownership windows ∩ reward period
```

Formula:

```text
validDurationSeconds = sum(duration(valid windows))
```

---

## 14. Collection Weights

```text
DENOMINATOR = 1,000,000

ROTY     = 217,491
MELTING  = 362,900
AMANDA   = 419,609
```

Weighted duration:

```text
weightedDuration = validDurationSeconds * collectionWeight
```

Wallet total:

```text
walletWeightedDuration = sum(weightedDuration for all valid staked NFTs)
```

---

## 15. Reward Allocation Formula

```text
walletAmountWei = floor(rewardAmountWei * walletWeightedDuration / totalWeightedDuration)
```

Dust policy:

```text
assign dust to treasury/admin allocation explicitly
```

This ensures:

```text
sum(allocation.amountWei) == rewardAmountWei
```

---

## 16. API Surface for Frontend

### Owned NFTs

```http
GET /api/:chain/wallet/:address/nfts
```

### Stake Status

```http
GET /api/:chain/wallet/:address/stakes
```

### Reward Rounds

```http
GET /api/:chain/rewards/rounds
```

### Wallet Reward Proof

```http
GET /api/:chain/rewards/:roundId/:address
```

---

## 17. Implementation Order

1. Supabase project setup.
2. Environment variables.
3. SQL migrations.
4. Database client/service role setup.
5. Chain and contract seed.
6. Checkpoint read/write.
7. Event ABI definitions.
8. Bounded Transfer sync.
9. Bounded Staked/Unstaked sync.
10. Reward event sync.
11. Current owner builder.
12. Current stake builder.
13. Duration calculator.
14. Reward allocation calculator.
15. Merkle proof generator integration.
16. API routes.
17. Frontend reward claim integration.
18. Testnet E2E.
19. Mainnet switch after Testnet RC.

---

## 18. Testing Strategy

Unit tests:

```text
interval intersection
ownership windows
stake windows
valid duration
collection weights
reward allocation
dust handling
```

Integration tests:

```text
NFT staked
NFT transferred out
NFT transferred back
NFT unstaked
```

Sepolia tests:

```text
sync real events
compare current owners to contract reads
compare stake validity to contract reads
generate reward allocation
generate Merkle proof
claim via browser
```

---

## 19. Stop Conditions

Stop reward distribution if:

```text
sync checkpoint is stale
event decoding fails
ownership reconstruction is inconsistent
stake state differs from contract reads
total allocation does not equal reward amount
Merkle root does not match generated proof file
frontend proof endpoint returns wrong proof
claimable check fails for known eligible wallet
claimed status is inconsistent with contract state
```

---

## 20. Readiness Status

```text
INDEXER ARCHITECTURE: UPDATED FOR SUPABASE POSTGRES-FIRST
INDEXER IMPLEMENTATION: SUPABASE PIPELINE IMPLEMENTED
TRANSFER / STAKING / REWARD SYNC: IMPLEMENTED, TESTNET VALIDATION PENDING
REWARD AUTOMATION: MANUAL OPERATOR PIPELINE
FRONTEND REWARD CLAIM: IMPLEMENTED, BROWSER CLAIM QA PENDING
PUBLIC REWARD LAUNCH: NOT READY
```

---

P.S. Read this document freely for information and guidance. Do not redistribute or restate—no quotes, summaries, paraphrases, or derivatives—without prior written permission from [**Prof. NOTA**](https://nota.endhonesa.com/). Sharing the link is allowed. So, share the link, not the text. Do not discuss or re-tell the contents in any form—written, spoken, or recorded—without prior written permission.

---
