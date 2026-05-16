# OiOi Melting Dashboard — Indexer Implementation Plan v1

This document defines the practical implementation plan for the first indexer MVP.

The goal is to build a working indexer and reward calculation pipeline for Sepolia first, without introducing database complexity too early.

---

## 1. Decision Lock

Indexer MVP v1 uses:

```text
Local JSON storage first.
Postgres/Supabase later.
```

Reason:

- faster to implement
- easier to debug
- easier to inspect manually
- no database setup needed yet
- good enough for Sepolia proof-of-concept
- can be migrated to Postgres after event/reward logic is proven

This is not the final production architecture.

Production reward operations should eventually use durable database storage.

---

## 2. MVP Scope

Indexer MVP v1 must support:

```text
Base Sepolia
Ethereum Sepolia
```

Mainnet support can be added after Sepolia indexer flow is proven.

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

## 3. Non-Goals for MVP v1

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

## 4. Folder Structure

Create:

```text
scripts/indexer/
  config.ts
  types.ts
  storage.ts
  sync.ts
  status.ts
  rebuild.ts
  calculators/
    ownership.ts
    staking.ts
    duration.ts
    rewards.ts
  output/
    .gitkeep
```

Generated output:

```text
scripts/indexer/output/base-sepolia/
scripts/indexer/output/ethereum-sepolia/
```

Generated output should not be committed unless intentionally used as a fixture.

---

## 5. Git Ignore Rules

Add:

```gitignore
# Generated indexer output
scripts/indexer/output/**
!scripts/indexer/output/.gitkeep
```

---

## 6. Network Keys

Indexer v1 supports these keys:

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
```

---

## 7. Event Sources

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

## 8. JSON Storage Files

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

## 9. Checkpoint Format

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

## 10. Transfer Record Format

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

## 11. Staking Event Format

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

## 12. Current Owner Format

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

## 13. Current Stake Format

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

## 14. Valid Duration Report Format

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

## 15. Reward Allocation Output Format

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

## 16. Reward Weight Lock

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

## 17. CLI Scripts

Add package scripts:

```json
{
  "indexer:sync": "tsx scripts/indexer/sync.ts",
  "indexer:status": "tsx scripts/indexer/status.ts",
  "indexer:rebuild": "tsx scripts/indexer/rebuild.ts",
  "rewards:calculate": "tsx scripts/rewards/calculate-round.ts"
}
```

Expected usage:

```bash
npm run indexer:sync -- baseSepolia
npm run indexer:sync -- ethereumSepolia

npm run indexer:status -- baseSepolia
npm run indexer:status -- ethereumSepolia

npm run rewards:calculate -- baseSepolia --round 1
npm run rewards:calculate -- ethereumSepolia --round 1
```

---

## 18. Implementation Order

### Step 1 — Indexer skeleton

Create:

```text
scripts/indexer/config.ts
scripts/indexer/types.ts
scripts/indexer/storage.ts
scripts/indexer/status.ts
scripts/indexer/output/.gitkeep
```

Goal:

```text
npm run indexer:status -- baseSepolia
npm run indexer:status -- ethereumSepolia
```

prints deployment config and empty checkpoint state.

### Step 2 — Transfer event sync

Create `sync.ts` that can sync ERC721 Transfer events for ROTY, Melting, Amanda.

Goal:

```text
transfers.json generated
current-owners.json generated
```

### Step 3 — Staking event sync

Extend `sync.ts` to sync Staked and Unstaked events.

Goal:

```text
staking-events.json generated
current-stakes.json generated
```

### Step 4 — Reward event sync

Extend `sync.ts` to sync RewardDistributor events.

Goal:

```text
reward-events.json generated
```

### Step 5 — Duration calculator

Create duration calculator.

Goal:

```text
duration-report.json generated for given period
```

### Step 6 — Reward calculator

Upgrade `scripts/rewards/calculate-round.ts`.

Goal:

```text
real allocation JSON generated from duration report
```

### Step 7 — Merkle integration

Feed allocation output into:

```text
npm run reward:merkle
```

Goal:

```text
root + proofs generated from real indexed data
```

---

## 19. MVP API Strategy

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

## 20. Testing Strategy

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

## 21. Stop Conditions

Stop indexer implementation if:

```text
deployment record missing
chain ID mismatch
RPC unavailable
event decoding fails
duplicate events appear
current owner reconstruction is wrong
stake active state differs from contract read
valid duration calculation is inconsistent
reward allocation total does not equal reward amount
```

---

## 22. Done Criteria for MVP

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

---

## 23. Current Next Step

After this document is committed:

```text
Implement Indexer Skeleton v1.
```

---

P.S. Read this document freely for information and guidance. Do not redistribute or restate—no quotes, summaries, paraphrases, or derivatives—without prior written permission from [**Prof. NOTA**](https://nota.endhonesa.com/). Sharing the link is allowed. So, share the link, not the text. Do not discuss or re-tell the contents in any form—written, spoken, or recorded—without prior written permission.

---
