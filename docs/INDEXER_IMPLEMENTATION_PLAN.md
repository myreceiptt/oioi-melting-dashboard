# OiOi Melting Dashboard — Indexer Implementation Plan v1

This document defines the practical implementation plan for the indexer MVP.

The goal is to build a working indexer and reward calculation pipeline without introducing database complexity too early and without allowing raw event sync to derail the mainnet/frontend path.

---

## 1. Decision Lock

Indexer MVP v1 uses:

```text
Local JSON storage first.
Postgres/Supabase or managed indexer later.
```

Reason:

- faster to implement
- easier to debug
- easier to inspect manually
- no database setup needed yet
- good enough for Sepolia proof-of-concept
- can be migrated to Postgres after event/reward logic is proven

This is not the final production architecture.

Production reward operations should eventually use durable database storage or a managed indexing service.

---

## 2. Operational Lock

Before continuing beyond skeleton, the project must accept `docs/INDEXER_OPERATIONAL_MODEL.md`.

Current operational decisions:

```text
Indexer does not run in browser.
Frontend never scans blockchain history.
Indexer runs as backend/admin worker or CLI.
Do not rewrite deployment scripts only to capture block numbers.
For v1, FROM_BLOCK is manually read from block explorer and stored in .env.
TO_BLOCK is optional and only for bounded backfill/testing.
Checkpoint is written after successful sync and controls resume.
Transfer sync draft is paused/experimental until operational model is accepted.
```

---

## 3. Current Status

Completed:

```text
Indexer skeleton implemented.
indexer:status command exists.
indexer:rebuild skeleton exists.
Local JSON storage helper exists.
Generated output is ignored except .gitkeep.
```

Paused / Experimental:

```text
Transfer sync draft may exist in scripts/indexer/sync.ts.
ownership calculator draft may exist in scripts/indexer/calculators/ownership.ts.
Do not continue Transfer Sync, Staking Sync, Reward Sync, or Duration Calculator yet.
```

Next accepted step:

```text
Commit and accept Indexer Operational Model v1.
```

---

## 4. MVP Scope

Indexer MVP v1 should support:

```text
Base Sepolia
Ethereum Sepolia
```

Mainnet support can be added after Sepolia indexer flow is proven and after mainnet contracts are deployed.

MVP reads:

```text
ERC721 Transfer events
OiOiSoftStaking Staked events
OiOiSoftStaking Unstaked events
OiOiRewardDistributor reward events
```

MVP produces:

```text
current NFT ownership snapshot
current stake position snapshot
staking timeline
transfer timeline
valid staking duration report
reward allocation input JSON
```

---

## 5. Non-Goals for MVP v1

Do not build yet:

```text
Postgres schema
Supabase setup
hosted worker
production API server
automatic scheduled sync
admin dashboard
full reward automation
mainnet reward distribution
```

Do not rely on indexer as the only source of truth.

Contract reads remain authoritative for live actions.

---

## 6. Folder Structure

Accepted skeleton:

```text
scripts/indexer/
  config.ts
  types.ts
  storage.ts
  sync.ts
  status.ts
  rebuild.ts
  output/
    .gitkeep
```

Future calculators:

```text
scripts/indexer/calculators/
  ownership.ts
  staking.ts
  duration.ts
  rewards.ts
```

Generated output:

```text
scripts/indexer/output/base-sepolia/
scripts/indexer/output/ethereum-sepolia/
```

Generated output should not be committed unless intentionally used as a fixture.

---

## 7. Git Ignore Rules

Required:

```gitignore
# Generated indexer output
scripts/indexer/output/**
!scripts/indexer/output/.gitkeep
```

Only this should be tracked:

```text
scripts/indexer/output/.gitkeep
```

Output JSON should not be tracked.

---

## 8. Network Keys

Accepted keys:

```text
baseSepolia
ethereumSepolia
```

Future keys:

```text
baseMainnet
ethereumMainnet
```

The indexer should load deployment records from:

```text
deployments/base-sepolia/deployment.json
deployments/ethereum-sepolia/deployment.json
deployments/base-mainnet/deployment.json
deployments/ethereum-mainnet/deployment.json
```

---

## 9. Start Block Strategy

The indexer should not guess block numbers.

For v1:

```text
FROM_BLOCK is manually read from the block explorer.
```

Use the earliest contract creation block for the chain.

Example:

```env
BASE_SEPOLIA_INDEXER_FROM_BLOCK=
ETHEREUM_SEPOLIA_INDEXER_FROM_BLOCK=
BASE_MAINNET_INDEXER_FROM_BLOCK=
ETHEREUM_MAINNET_INDEXER_FROM_BLOCK=
```

Optional bounded backfill:

```env
BASE_SEPOLIA_INDEXER_TO_BLOCK=
ETHEREUM_SEPOLIA_INDEXER_TO_BLOCK=
BASE_MAINNET_INDEXER_TO_BLOCK=
ETHEREUM_MAINNET_INDEXER_TO_BLOCK=
```

Rules:

```text
FROM_BLOCK is used only when no checkpoint exists.
TO_BLOCK limits one sync/backfill run.
After successful sync, checkpoint stores the last synced block.
Later runs resume from checkpoint + 1.
If TO_BLOCK remains set and checkpoint already passed it, sync becomes no-op.
```

---

## 10. RPC Range / Rate Limit Strategy

Default `.env.example` values:

```env
INDEXER_BLOCK_RANGE=10
INDEXER_REQUEST_DELAY_MS=250
```

Reason:

- some free RPC tiers restrict `eth_getLogs` range
- large historical sync can trigger rate limits
- bounded backfills should be preferred during development

Do not run unbounded sync on a free RPC without understanding request volume.

---

## 11. Event Sources

### ERC721 Transfer Events

Sources:

```text
ROTY
Melting
Amanda
```

Event:

```solidity
Transfer(address indexed from, address indexed to, uint256 indexed tokenId)
```

Used for:

```text
mint detection
current owner reconstruction
ownership interval reconstruction
transfer-out / transfer-back detection
```

### OiOiSoftStaking Events

Sources:

```text
OiOiSoftStaking
```

Events:

```solidity
Staked(address indexed user, address indexed collection, uint256 indexed tokenId, uint256 timestamp)
Unstaked(address indexed user, address indexed collection, uint256 indexed tokenId, uint256 timestamp)
```

Used for:

```text
stake intent windows
active stake state
valid stake duration calculation
```

### RewardDistributor Events

Sources:

```text
OiOiRewardDistributor
```

Events:

```text
RewardRoundCreated
RewardRoundFunded
Claimed
ClaimPausedUpdated
MerkleRootUpdated
```

Used for:

```text
reward round display
claim status display
future proof API
```

---

## 12. JSON Storage Files

Per network output folder:

```text
metadata.json
checkpoints.json
events.json
transfers.json
staking-events.json
reward-events.json
current-owners.json
current-stakes.json
duration-report.json
```

Example:

```text
scripts/indexer/output/base-sepolia/current-owners.json
scripts/indexer/output/base-sepolia/current-stakes.json
```

---

## 13. Checkpoint Format

`checkpoints.json`:

```json
{
  "network": "baseSepolia",
  "chainId": 84532,
  "updatedAt": "2026-05-16T00:00:00.000Z",
  "sources": {
    "roty": {
      "address": "0x...",
      "lastSyncedBlock": 0
    },
    "melting": {
      "address": "0x...",
      "lastSyncedBlock": 0
    },
    "amanda": {
      "address": "0x...",
      "lastSyncedBlock": 0
    },
    "staking": {
      "address": "0x...",
      "lastSyncedBlock": 0
    },
    "rewardDistributor": {
      "address": "0x...",
      "lastSyncedBlock": 0
    }
  }
}
```

---

## 14. Transfer Record Format

`transfers.json`:

```json
[
  {
    "chainId": 84532,
    "network": "baseSepolia",
    "collectionKey": "roty",
    "collectionAddress": "0x...",
    "tokenId": "1",
    "from": "0x0000000000000000000000000000000000000000",
    "to": "0x...",
    "txHash": "0x...",
    "logIndex": 0,
    "blockNumber": 123,
    "blockTimestamp": 1770000000
  }
]
```

---

## 15. Staking Event Format

`staking-events.json`:

```json
[
  {
    "chainId": 84532,
    "network": "baseSepolia",
    "eventType": "staked",
    "user": "0x...",
    "collectionAddress": "0x...",
    "collectionKey": "roty",
    "tokenId": "1",
    "txHash": "0x...",
    "logIndex": 0,
    "blockNumber": 123,
    "blockTimestamp": 1770000000
  }
]
```

---

## 16. Current Owner Format

`current-owners.json`:

```json
[
  {
    "chainId": 84532,
    "network": "baseSepolia",
    "collectionKey": "roty",
    "collectionAddress": "0x...",
    "tokenId": "1",
    "owner": "0x...",
    "updatedBlockNumber": 123,
    "updatedBlockTimestamp": 1770000000
  }
]
```

---

## 17. Current Stake Format

`current-stakes.json`:

```json
[
  {
    "chainId": 84532,
    "network": "baseSepolia",
    "user": "0x...",
    "collectionKey": "roty",
    "collectionAddress": "0x...",
    "tokenId": "1",
    "active": true,
    "currentlyOwned": true,
    "valid": true,
    "stakedAt": 1770000000,
    "unstakedAt": null,
    "updatedBlockNumber": 123,
    "updatedBlockTimestamp": 1770000000
  }
]
```

---

## 18. Valid Duration Report Format

`duration-report.json`:

```json
{
  "network": "baseSepolia",
  "chainId": 84532,
  "periodStart": 1770000000,
  "periodEnd": 1772600000,
  "wallets": [
    {
      "wallet": "0x...",
      "totalWeightedDuration": "123456789",
      "positions": [
        {
          "collectionKey": "roty",
          "collectionAddress": "0x...",
          "tokenId": "1",
          "validDurationSeconds": "86400",
          "collectionWeight": "217491",
          "weightedDuration": "18791222400"
        }
      ]
    }
  ]
}
```

---

## 19. Reward Allocation Output Format

The reward calculator should output Merkle generator input:

```json
{
  "chain": "baseSepolia",
  "roundId": 1,
  "periodStartTimestamp": 1770000000,
  "periodEndTimestamp": 1772600000,
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

This output should be compatible with the existing reward Merkle generator.

---

## 20. Reward Weight Lock

Weights:

```text
DENOMINATOR = 1,000,000

ROTY     = 217,491
MELTING  = 362,900
AMANDA   = 419,609
```

Formula:

```text
weightedDuration = validDurationSeconds * collectionWeight
```

Wallet allocation:

```text
walletAmountWei = floor(rewardAmountWei * walletWeightedDuration / totalWeightedDuration)
```

Dust policy v1:

```text
Assign dust to admin/treasury allocation explicitly.
```

This ensures:

```text
sum(allocation.amountWei) == rewardAmountWei
```

---

## 21. CLI Scripts

Current accepted scripts:

```json
{
  "indexer:status": "tsx scripts/indexer/status.ts",
  "indexer:rebuild": "tsx scripts/indexer/rebuild.ts"
}
```

Potential future scripts:

```json
{
  "indexer:sync": "tsx scripts/indexer/sync.ts",
  "rewards:calculate": "tsx scripts/rewards/calculate-round.ts"
}
```

Do not treat `indexer:sync` as production-ready until operational model is accepted.

---

## 22. Implementation Order

### Step 1 — Indexer skeleton

Status: Completed.

Goal:

```text
npm run indexer:status -- baseSepolia
npm run indexer:status -- ethereumSepolia
```

prints deployment config and empty checkpoint state.

### Step 2 — Indexer Operational Model

Status: Current / Required before continuing.

Create and commit:

```text
docs/INDEXER_OPERATIONAL_MODEL.md
```

Goal:

```text
manual FROM_BLOCK policy accepted
TO_BLOCK behavior understood
checkpoint behavior understood
no deployment script rewrite required
transfer sync marked paused/experimental
```

### Step 3 — Transfer event sync

Status: Paused / Experimental.

Create or stabilize `sync.ts` only after Step 2.

Goal:

```text
transfers.json generated
current-owners.json generated
```

### Step 4 — Staking event sync

Status: Pending.

Extend sync to Staked and Unstaked events.

Goal:

```text
staking-events.json generated
current-stakes.json generated
```

### Step 5 — Reward event sync

Status: Pending.

Extend sync to RewardDistributor events.

Goal:

```text
reward-events.json generated
```

### Step 6 — Duration calculator

Status: Pending.

Create duration calculator.

Goal:

```text
duration-report.json generated for given period
```

### Step 7 — Reward calculator

Status: Pending.

Upgrade `scripts/rewards/calculate-round.ts`.

Goal:

```text
real allocation JSON generated from duration report
```

### Step 8 — Merkle integration

Status: Pending.

Feed allocation output into:

```text
npm run reward:merkle
```

Goal:

```text
root + proofs generated from real indexed data
```

---

## 23. MVP API Strategy

Frontend currently has:

```text
whitelist proof API route
reward placeholder
```

Reward proof API can be added after reward calculator output exists.

Future API:

```text
GET /api/rewards/:chain/:roundId/:address
```

MVP can serve proof data from local/static JSON before database.

---

## 24. Testing Strategy

### Unit test candidates

```text
parse transfer event
parse staking event
current owner reconstruction
current stake reconstruction
interval intersection
valid duration calculation
reward allocation
dust assignment
```

### Sepolia manual validation

Use known functional test data:

```text
Base Sepolia tokenId #1 for ROTY, Melting, Amanda
Ethereum Sepolia tokenId #1 for ROTY, Melting, Amanda
```

Expected:

```text
owner = deployer
stake active = true, unless manually unstaked
stake valid = true, if NFT remains in deployer wallet
```

---

## 25. Stop Conditions

Stop indexer implementation if:

```text
deployment record missing
chain ID mismatch
RPC unavailable
RPC rate limit prevents reliable sync
event decoding fails
duplicate events appear
current owner reconstruction is wrong
stake active state differs from contract read
valid duration calculation is inconsistent
reward allocation total does not equal reward amount
operational model is unclear or contradicted
```

---

## 26. Done Criteria for MVP

Indexer MVP is done when:

```text
npm run indexer:sync -- baseSepolia
npm run indexer:sync -- ethereumSepolia
npm run indexer:status -- baseSepolia
npm run indexer:status -- ethereumSepolia
```

produce correct JSON outputs, and:

```text
npm run rewards:calculate -- baseSepolia --round 1
npm run rewards:calculate -- ethereumSepolia --round 1
```

produce allocation JSON compatible with Merkle generation.

This is not currently complete.

---

## 27. Current Next Step

```text
Commit docs/INDEXER_OPERATIONAL_MODEL.md.
Keep Transfer Sync paused/experimental.
Do not continue indexer implementation until operational model is accepted.
```

---

P.S. Read this document freely for information and guidance. Do not redistribute or restate—no quotes, summaries, paraphrases, or derivatives—without prior written permission from [**Prof. NOTA**](https://nota.endhonesa.com/). Sharing the link is allowed. So, share the link, not the text. Do not discuss or re-tell the contents in any form—written, spoken, or recorded—without prior written permission.

---
