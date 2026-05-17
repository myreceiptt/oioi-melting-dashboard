# OiOi Melting Dashboard — Indexer Architecture v1

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

The indexer/backend must eventually support:

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
Indexer skeleton: implemented.
Indexer Transfer Sync: paused / experimental draft.
Indexer Operational Model: required before continuing implementation.
```

Do not treat raw `getLogs` sync as production-ready.

Do not continue staking sync, reward sync, duration calculator, or reward automation until the operational model is accepted.

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

## 4. Chain Sets

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
- MELTING dETH
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

## 5. Operational Model v1

The v1 operational model is documented in:

```text
docs/INDEXER_OPERATIONAL_MODEL.md
```

Key decisions:

```text
Indexer does not run in browser.
Frontend never scans blockchain history.
Indexer runs as backend/admin worker or CLI.
Deployment scripts do not need to be rewritten only to capture block numbers.
For v1, FROM_BLOCK is manually read from block explorer and stored in .env.
TO_BLOCK is optional and only for bounded backfill/testing.
Checkpoint controls resume after successful sync.
Transfer sync remains paused/experimental until operational model is accepted.
```

---

## 6. Data Sources

### 6.1 On-chain events

The indexer must eventually read events from:

#### OiOiSoftStaking

```text
Staked(user, collection, tokenId, timestamp)
Unstaked(user, collection, tokenId, timestamp)
CollectionApprovalUpdated(collection, approved)
```

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

#### OiOiRewardDistributor

```text
RewardRoundCreated(roundId, periodStart, periodEnd, rewardAmount, merkleRoot)
RewardRoundFunded(roundId, funder, amount, fundedAmount)
Claimed(roundId, account, amount)
ClaimPausedUpdated(roundId, paused)
MerkleRootUpdated(roundId, oldMerkleRoot, newMerkleRoot)
```

### 6.2 Direct on-chain reads

The indexer may also use contract reads for sanity checks:

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

### 6.3 Deployment records

The indexer should read deployment addresses from:

```text
deployments/base-sepolia/deployment.json
deployments/ethereum-sepolia/deployment.json
deployments/base-mainnet/deployment.json
deployments/ethereum-mainnet/deployment.json
```

Block start values are read from `.env`, not deployment records, for v1.

---

## 7. Event Sync Strategy

The indexer should sync by chain.

Potential future commands:

```bash
npm run indexer:sync -- baseSepolia
npm run indexer:sync -- ethereumSepolia
npm run indexer:sync -- baseMainnet
npm run indexer:sync -- ethereumMainnet
```

Each sync run should:

1. Load network config.
2. Load deployment record.
3. Determine last synced block from checkpoint.
4. If no checkpoint exists, use manual `*_INDEXER_FROM_BLOCK`.
5. Respect optional `*_INDEXER_TO_BLOCK`.
6. Fetch logs in safe block ranges.
7. Decode events.
8. Upsert normalized rows.
9. Update checkpoint only after successful sync.
10. Re-run safely if interrupted.

The sync must be idempotent.

If the same event is encountered twice, it must not duplicate state.

Unique event key:

```text
chainId + txHash + logIndex
```

---

## 8. Finality and Reorg Handling

For v1, use a confirmation delay.

Suggested confirmation delay:

```text
Base / Base Sepolia: 20 blocks
Ethereum / Sepolia: 20 blocks
```

The indexer should sync only up to:

```text
latestBlock - confirmationDelay
```

This reduces reorg risk.

Future improvement:

```text
reorg detection by blockHash comparison
```

---

## 9. Storage Choice

Accepted MVP storage:

```text
Local JSON storage first.
```

Future production storage:

```text
PostgreSQL / Supabase Postgres
or managed indexing service
```

Reason for local JSON first:

- faster to debug
- easier to inspect
- no database setup needed
- suitable for Sepolia proof-of-concept
- can be replaced via storage adapter later

Reason production should upgrade:

- reward calculation requires historical data
- event history must be queryable
- dashboard needs reliable API reads
- reward proofs need persistent round records

---

## 10. Storage Adapter Principle

Do not hardwire reward logic directly to JSON.

Use a boundary like:

```text
readEvents()
writeEvents()
readCheckpoint()
writeCheckpoint()
readCurrentOwners()
writeCurrentOwners()
readCurrentStakes()
writeCurrentStakes()
```

Then future upgrade changes only storage implementation:

```text
Local JSON → Postgres/Supabase/managed indexer
```

Core logic should remain reusable:

```text
event decoder
ownership builder
staking builder
duration calculator
reward calculator
Merkle input generator
```

---

## 11. Future Database Schema v1

Production may use the following schema.

### 11.1 chains

```sql
chain_id BIGINT PRIMARY KEY,
chain_key TEXT NOT NULL,
name TEXT NOT NULL,
is_testnet BOOLEAN NOT NULL
```

### 11.2 contracts

```sql
id UUID PRIMARY KEY,
chain_id BIGINT NOT NULL,
contract_key TEXT NOT NULL,
address TEXT NOT NULL,
created_at TIMESTAMP NOT NULL DEFAULT NOW(),
UNIQUE(chain_id, contract_key),
UNIQUE(chain_id, address)
```

Contract keys:

```text
roty
melting
amanda
staking
rewardDistributor
oioi
```

### 11.3 sync_checkpoints

```sql
chain_id BIGINT NOT NULL,
source_key TEXT NOT NULL,
last_synced_block BIGINT NOT NULL,
updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
PRIMARY KEY(chain_id, source_key)
```

Source keys:

```text
staking
roty
melting
amanda
rewardDistributor
```

### 11.4 indexed_events

```sql
chain_id BIGINT NOT NULL,
tx_hash TEXT NOT NULL,
log_index INTEGER NOT NULL,
block_number BIGINT NOT NULL,
block_timestamp BIGINT NOT NULL,
contract_address TEXT NOT NULL,
event_name TEXT NOT NULL,
payload JSONB NOT NULL,
created_at TIMESTAMP NOT NULL DEFAULT NOW(),
PRIMARY KEY(chain_id, tx_hash, log_index)
```

### 11.5 nft_transfers

```sql
chain_id BIGINT NOT NULL,
collection_address TEXT NOT NULL,
token_id NUMERIC NOT NULL,
from_address TEXT NOT NULL,
to_address TEXT NOT NULL,
tx_hash TEXT NOT NULL,
log_index INTEGER NOT NULL,
block_number BIGINT NOT NULL,
block_timestamp BIGINT NOT NULL,
PRIMARY KEY(chain_id, tx_hash, log_index)
```

### 11.6 staking_events

```sql
chain_id BIGINT NOT NULL,
event_type TEXT NOT NULL,
user_address TEXT NOT NULL,
collection_address TEXT NOT NULL,
token_id NUMERIC NOT NULL,
tx_hash TEXT NOT NULL,
log_index INTEGER NOT NULL,
block_number BIGINT NOT NULL,
block_timestamp BIGINT NOT NULL,
PRIMARY KEY(chain_id, tx_hash, log_index)
```

Event types:

```text
staked
unstaked
```

### 11.7 current_nft_owners

```sql
chain_id BIGINT NOT NULL,
collection_address TEXT NOT NULL,
token_id NUMERIC NOT NULL,
owner_address TEXT NOT NULL,
updated_block_number BIGINT NOT NULL,
updated_block_timestamp BIGINT NOT NULL,
PRIMARY KEY(chain_id, collection_address, token_id)
```

### 11.8 current_stake_positions

```sql
chain_id BIGINT NOT NULL,
user_address TEXT NOT NULL,
collection_address TEXT NOT NULL,
token_id NUMERIC NOT NULL,
active BOOLEAN NOT NULL,
currently_owned BOOLEAN NOT NULL,
valid BOOLEAN NOT NULL,
staked_at BIGINT,
unstaked_at BIGINT,
updated_block_number BIGINT NOT NULL,
updated_block_timestamp BIGINT NOT NULL,
PRIMARY KEY(chain_id, user_address, collection_address, token_id)
```

### 11.9 reward_rounds

```sql
chain_id BIGINT NOT NULL,
round_id NUMERIC NOT NULL,
period_start BIGINT NOT NULL,
period_end BIGINT NOT NULL,
reward_amount_wei NUMERIC NOT NULL,
merkle_root TEXT,
funded_amount_wei NUMERIC NOT NULL DEFAULT 0,
claimed_amount_wei NUMERIC NOT NULL DEFAULT 0,
claim_paused BOOLEAN NOT NULL DEFAULT FALSE,
created_tx_hash TEXT,
created_at TIMESTAMP NOT NULL DEFAULT NOW(),
PRIMARY KEY(chain_id, round_id)
```

### 11.10 reward_allocations

```sql
chain_id BIGINT NOT NULL,
round_id NUMERIC NOT NULL,
wallet_address TEXT NOT NULL,
amount_wei NUMERIC NOT NULL,
weighted_duration NUMERIC NOT NULL,
proof JSONB NOT NULL,
claimed BOOLEAN NOT NULL DEFAULT FALSE,
created_at TIMESTAMP NOT NULL DEFAULT NOW(),
PRIMARY KEY(chain_id, round_id, wallet_address)
```

---

## 12. Ownership Reconstruction

NFT ownership is reconstructed from ERC721 `Transfer` events.

Rules:

```text
Transfer(0x0, to, tokenId) = mint
Transfer(from, 0x0, tokenId) = burn, if ever supported
Transfer(from, to, tokenId) = ownership change
```

For each NFT:

```text
current owner = latest Transfer.to for that chain + collection + tokenId
```

The indexer should update current ownership after each Transfer.

---

## 13. Stake Intent Reconstruction

Stake intent is reconstructed from staking events.

Rules:

```text
Staked(user, collection, tokenId)   → active intent starts
Unstaked(user, collection, tokenId) → active intent ends
```

Soft staking does not move the NFT.

Therefore, stake intent alone is not enough.

A stake is valid only when:

```text
stake intent is active
AND
current owner of NFT == staker
```

---

## 14. Valid Duration Calculation

For a reward period:

```text
periodStart
periodEnd
```

The indexer must compute valid duration per NFT.

For each stake position:

```text
stake windows:
[stakedAt, unstakedAt or periodEnd]

ownership windows:
intervals where owner == staker

valid windows:
intersection(stake windows, ownership windows, reward period)
```

Formula:

```text
validDurationSeconds = sum(duration(valid windows))
```

Example:

```text
Reward period:
1 May → 31 May

Stake intent:
1 May → 31 May

Ownership:
1 May → 10 May
20 May → 31 May

Valid duration:
1 May → 10 May
20 May → 31 May
```

The invalid period:

```text
11 May → 19 May
```

is excluded because the NFT left the wallet.

---

## 15. Collection Weights

Weights are chain-specific but currently identical for Base and Ethereum.

```text
DENOMINATOR = 1,000,000

ROTY     = 217,491
MELTING  = 362,900
AMANDA   = 419,609
```

Weighted duration per NFT:

```text
weightedDuration = validDurationSeconds * collectionWeight
```

Wallet total:

```text
walletWeightedDuration = sum(weightedDuration for all valid staked NFTs)
```

---

## 16. Reward Allocation Formula

For a reward round:

```text
rewardAmountWei
totalWeightedDuration
walletWeightedDuration
```

Allocation:

```text
walletAmountWei = floor(
  rewardAmountWei * walletWeightedDuration / totalWeightedDuration
)
```

Dust handling:

```text
dust = rewardAmountWei - sum(walletAmountWei)
```

Preferred v1:

```text
assign dust to treasury/admin wallet explicitly in allocation output
```

This makes:

```text
sum(allocation.amountWei) == rewardAmountWei
```

which is required by the Merkle generator.

---

## 17. Reward Round Output

The reward calculator should generate a Merkle input file:

```json
{
  "chain": "base",
  "roundId": 1,
  "rewardAmountWei": "11000000000000000000",
  "allocations": [
    {
      "wallet": "0x...",
      "amountWei": "1000000000000000000",
      "weightedDuration": "123456789"
    }
  ]
}
```

Then run:

```bash
npm run reward:merkle -- --input scripts/rewards/input/<round-file>.json
```

Generated output:

```text
scripts/rewards/output/<chain>-round-<id>.root.txt
scripts/rewards/output/<chain>-round-<id>.merkle.json
scripts/rewards/output/<chain>-round-<id>.proofs.json
scripts/rewards/output/<chain>-round-<id>.tree.json
```

Generated output should not be committed unless intentionally published as public claim data.

---

## 18. API Surface for Frontend

### 18.1 Owned NFTs

```http
GET /api/:chain/wallet/:address/nfts
```

### 18.2 Stake Status

```http
GET /api/:chain/wallet/:address/stakes
```

### 18.3 Reward Rounds

```http
GET /api/:chain/rewards/rounds
```

### 18.4 Wallet Reward Proof

```http
GET /api/:chain/rewards/:roundId/:address
```

These APIs are future surfaces.

Current frontend only has:

```text
/api/whitelist/roty/[chain]/[address]
```

Reward claim is placeholder only.

---

## 19. CLI Commands v1

Accepted current commands:

```json
{
  "indexer:status": "tsx scripts/indexer/status.ts",
  "indexer:rebuild": "tsx scripts/indexer/rebuild.ts"
}
```

Potential future commands:

```json
{
  "indexer:sync": "tsx scripts/indexer/sync.ts",
  "rewards:calculate": "tsx scripts/rewards/calculate-round.ts"
}
```

Do not treat `indexer:sync` as production-ready until operational model is accepted and rate-limit/backfill behavior is validated.

---

## 20. Indexer Implementation Order

Recommended order:

1. Commit Indexer Operational Model v1.
2. Decide whether paused transfer sync draft is kept, cleaned, or rewritten.
3. Define storage adapter boundary.
4. Stabilize event ABI definitions.
5. Implement safe bounded `getLogs` range sync.
6. Sync NFT Transfer events.
7. Build current ownership snapshot.
8. Sync staking events.
9. Build current stake position snapshot.
10. Sync reward distributor events.
11. Build valid duration calculator.
12. Build reward allocation calculator.
13. Generate Merkle input JSON.
14. Connect to existing reward Merkle generator.
15. Add API route/static data for owned NFTs.
16. Add API route/static data for stake status.
17. Add API route/static data for reward rounds.
18. Add API route/static data for reward proof.
19. Test on Base Sepolia.
20. Test on Ethereum Sepolia.
21. Decide production storage upgrade path.

---

## 21. MVP Simplification Option

If full backend is too heavy for initial mint launch:

```text
Minting can launch without reward automation.
Soft staking can launch with direct contract reads.
Reward distribution can remain manual/admin-operated.
Indexer can be added before the first public reward round.
```

But:

```text
Do not announce full reward automation until indexer/reward calculation is tested.
```

---

## 22. Testing Strategy

### 22.1 Unit tests

Test:

- interval intersection
- ownership windows
- stake windows
- valid duration
- collection weights
- reward allocation
- dust handling

### 22.2 Integration tests

Use known synthetic event timelines:

```text
NFT staked
NFT transferred out
NFT transferred back
NFT unstaked
```

Expected:

```text
valid duration excludes period when NFT is outside wallet
```

### 22.3 Sepolia test

Use deployed Sepolia contracts.

Confirm:

- real events sync
- minted NFT detected
- stake detected
- transfer detected
- reward allocation generated
- Merkle root generated
- claim succeeds

This is not yet complete.

---

## 23. Operational Notes

Before creating a real reward round:

1. Sync chain events or prepare approved event data.
2. Confirm sync is up to safe block.
3. Calculate allocation.
4. Review allocation summary.
5. Confirm total allocation equals reward amount.
6. Generate Merkle root/proofs.
7. Create reward round on-chain.
8. Fund reward round.
9. Publish claim data.
10. Monitor claims.

---

## 24. Stop Conditions

Stop reward distribution if:

- sync checkpoint is stale
- event decoding fails
- ownership reconstruction is inconsistent
- total allocation does not equal reward amount
- Merkle root does not match generated proof file
- frontend proof endpoint returns wrong proof
- claimable check fails for known eligible wallet
- claimed status is inconsistent with contract state
- indexer operational model is unclear or contradicted

---

## 25. Open Items Before Continuing Implementation

Before continuing indexer implementation, confirm:

1. Indexer Operational Model v1.
2. Whether Transfer Sync draft remains paused or is rewritten.
3. Whether first reward round will be manual/admin-only.
4. Dust policy recipient.
5. Safe block confirmation count per chain.
6. Whether reward proof data is served from static JSON or database.
7. Whether owned NFT data comes from indexer only or direct RPC fallback.
8. Storage adapter design.

---

## 26. Readiness Status

```text
INDEXER ARCHITECTURE: UPDATED
INDEXER SKELETON: IMPLEMENTED
TRANSFER SYNC: PAUSED / EXPERIMENTAL
INDEXER OPERATIONAL MODEL: REQUIRED BEFORE CONTINUING
REWARD AUTOMATION: PENDING
FRONTEND REWARD CLAIM: PLACEHOLDER ONLY
PUBLIC REWARD LAUNCH: NOT YET READY
```

---

P.S. Read this document freely for information and guidance. Do not redistribute or restate—no quotes, summaries, paraphrases, or derivatives—without prior written permission from [**Prof. NOTA**](https://nota.endhonesa.com/). Sharing the link is allowed. So, share the link, not the text. Do not discuss or re-tell the contents in any form—written, spoken, or recorded—without prior written permission.

---
