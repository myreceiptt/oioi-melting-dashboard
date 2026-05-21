# OiOi Melting Dashboard — Testnet Product Completion Plan v2

This document is the operational checklist for completing the OiOi Melting Dashboard product on testnet before mainnet deployment.

The goal is to make Base Sepolia and Ethereum Sepolia behave like a complete product rehearsal:

```text
mint
stake
admin controls
indexer sync
reward calculation
reward proof
reward claim
full browser E2E
```

Only after this plan reaches Testnet Release Candidate should mainnet deployment proceed.

---

## 1. Guiding Principle

```text
Testnet first. Mainnet after Testnet Release Candidate.
```

Mainnet deployment is intentionally deferred even though preparation checks passed.

This prevents the project from treating deployed mainnet contracts as launch pressure before the full product is ready.

---

## 2. Locked Decisions

### 2.1 Testnet Contract Deployment

Status: Done.

Rules:

```text
Do not change deploy scripts unless there is a fatal bug.
Do not redo testnet deployment just to improve indexer block recording.
Indexer block numbers are read manually from block explorers.
verify:args is post-deployment, not pre-deployment.
```

### 2.2 Indexer + Reward Storage

Status: Locked.

```text
Supabase Postgres is the primary database/storage for indexer + reward pipeline.
```

Local JSON is not the main indexer storage.

Allowed JSON/static output:

```text
Merkle proof export
public proof snapshot
audit backup
debug export
```

### 2.3 Admin Dashboard

Status: Required.

Admin Dashboard must be completed before full testnet browser E2E.

Admin Dashboard must audit actual contract functions, not only a rough remembered list.

### 2.4 Testing Discipline

Every stage has its own testing checkpoint.

Full Browser E2E happens only after all modules are built and tested individually.

---

## 3. Current Done Items

### 3.1 Contracts and Deployment

```text
✅ Contract suite implemented.
✅ Base Sepolia deployed.
✅ Base Sepolia verified.
✅ Base Sepolia read-check passed.
✅ Base Sepolia functional test passed.
✅ Ethereum Sepolia deployed.
✅ Ethereum Sepolia verified.
✅ Ethereum Sepolia read-check passed.
✅ Ethereum Sepolia functional test passed.
✅ Mint phases restored OFF after functional tests.
```

### 3.2 Frontend Sepolia MVP

```text
✅ Next.js app skeleton.
✅ Wallet-first connection.
✅ ChainGuard.
✅ Contract config.
✅ Contract reads.
✅ Homepage links.
✅ ROTY public mint UI.
✅ ROTY whitelist proof lookup.
✅ ROTY whitelist mint UI.
✅ Melting gated mint UI.
✅ Amanda gated mint UI.
✅ Dashboard stake/unstake UI.
✅ Reward placeholder.
✅ Sepolia Browser QA for read/OFF-phase/stake flows.
```

### 3.3 Documentation

```text
✅ Deployment Runbook.
✅ Frontend Architecture.
✅ Frontend Sepolia Browser QA.
✅ Implementation Roadmap.
✅ Indexer Architecture.
✅ Indexer Implementation Plan.
✅ Indexer Operational Model.
✅ Mainnet Readiness Review.
✅ Spec Lock.
✅ Testing Checklist.
```

---

## 4. Remaining Product Completion Sequence

## Step 1 — Lock Testnet Contract Deployment

Status: Done.

Requirements:

```text
✅ Do not change deploy scripts unless fatal bug.
✅ Preserve testnet deployment procedure.
✅ Preserve deployment records.
✅ Use manual FROM_BLOCK for indexer.
✅ Keep mint phases OFF unless testing intentionally.
```

Testing:

```text
✅ build pass
✅ compile pass
✅ test pass
✅ read-check baseSepolia pass
✅ read-check ethereumSepolia pass
```

---

## Step 2 — Complete Testnet Frontend Application

Status: In progress.

Already done:

```text
✅ User mint pages.
✅ User dashboard.
✅ Stake/unstake.
✅ Reward placeholder.
✅ Active reward claim UI.
✅ Reward proof API.
```

Remaining:

```text
🔜 Reward claim browser QA with generated Supabase proofs.
🔜 Full testnet browser E2E.
🔜 Final UI/UX polish.
```

Testing for this step:

```text
build
compile
test
browser route QA
wallet connect QA
ChainGuard QA
admin access guard QA
admin read/write testnet transaction QA
```

---

## Step 3 — Admin Dashboard Architecture + Implementation

Status: Next.

Suggested routes:

```text
/admin
/admin/base
/admin/ethereum
```

Required audit sources:

```text
TheRotyMemorial
MeltingMemorial
AmandaMemorial
MemorialNFTCore
OiOiSoftStaking
OiOiRewardDistributor
ERC20 $OiOi read surface
```

Admin Dashboard must include read surfaces for:

```text
owner
pendingOwner
mint phase states
mint prices
treasury
royalty receiver/fee
metadata state
revealed/unrevealed URIs
metadata lock status
staking approved collections
reward token
reward round details
reward funded/claimed counters
claim pause status
ERC20 balances/allowances where useful
```

Admin Dashboard must include write surfaces for necessary future operations:

```text
ROTY whitelist mint ON/OFF
ROTY public mint ON/OFF
Melting gated mint ON/OFF
Amanda gated mint ON/OFF
set Merkle root
set mint price
set treasury
set default royalty
set revealed state
set revealed base URI
set unrevealed URI
set base extension
lock metadata
approve/unapprove staking collection
create reward round
fund reward round
pause/unpause claim
transfer ownership / accept ownership if needed
rescue ETH/ERC20 if needed
```

Guard requirements:

```text
only owner/deployer can write
non-owner sees read-only or blocked UI
risky actions have warning/info icon
write actions require confirmation modal
high-risk actions show current value and new value
irreversible actions require typed confirmation
post-transaction read-check is shown
```

Testing:

```text
non-owner blocked
owner can read
owner can toggle phases on testnet
owner can restore phases OFF
owner can create/fund reward round on testnet
warning/tooltip UI works
confirmation modal works
post-write state refresh works
```

---

## Step 4 — Supabase Postgres Indexer + Reward Pipeline

Status: Not started.

Storage:

```text
Supabase Postgres
```

Required implementation:

```text
schema/migrations
network/contract registry
sync checkpoints
indexed events
NFT transfers
staking events
reward events
current owners
current stake positions
reward rounds
reward allocations
proof records
claim status
```

Required sync behavior:

```text
manual FROM_BLOCK
optional TO_BLOCK for bounded backfill/testing
checkpoint resume
idempotent event upsert
rate-limit-aware block ranges
confirmation delay
no browser getLogs
```

Reward calculation:

```text
valid staking duration = active soft-stake intent ∩ actual NFT ownership duration
weightedDuration = validDurationSeconds * collectionWeight
walletAmountWei = floor(rewardAmountWei * walletWeightedDuration / totalWeightedDuration)
dust policy explicitly handled
```

Testing:

```text
Supabase migration passes
bounded sync works on Base Sepolia
bounded sync works on Ethereum Sepolia
checkpoint resumes correctly
duplicate event insert is prevented
ownership matches contract reads
stake state matches contract reads
duration calculator handles transfer-out/transfer-back
allocation sums to reward amount
Merkle root/proofs generated
proof API returns correct proof
```

---

## Step 5 — Reward Claim Integration

Status: Not started.

Frontend must support:

```text
reward round list
wallet allocation
claimable amount
proof fetch
claimed status
claim tx
post-claim state refresh
explorer link
error state
```

Testing:

```text
wallet with allocation sees claimable reward
wallet without allocation sees no claimable reward
already claimed wallet is blocked
claim tx succeeds on testnet
claimed status updates
reward distributor counters update
```

---

## Step 6 — Stage-by-Stage Browser Testing

Status: Continuous.

Required stage tests:

### Mint Pages

```text
connect wallet
switch chain
ROTY whitelist mint
ROTY public mint
Melting gated mint
Amanda gated mint
tx state
explorer link
phase disabled state
```

### User Dashboard

```text
stake
unstake
active status
valid status
owned/current owner reads
wrong-chain handling
```

### Admin Dashboard

```text
owner guard
contract reads
mint phase toggles
metadata/reveal controls
staking approvals
reward round creation/funding
claim pause/unpause
warnings and confirmations
```

### Reward Claim

```text
proof fetch
claimable amount
claim transaction
claimed status
error states
```

---

## Step 7 — Full Testnet Browser E2E

Status: Not started.

Run after all modules above pass their own testing.

Required Base Sepolia flow:

```text
user connects wallet
user mints ROTY
user stakes ROTY
user mints Melting
user stakes Melting
user mints Amanda
user stakes Amanda
admin creates reward round
admin funds reward round
indexer syncs
reward calculator generates allocation
proof API serves proof
user claims $OiOi
claimed status confirms
mint phases restored OFF if needed
```

Repeat on Ethereum Sepolia.

---

## Step 8 — Final UI/UX Polish

Status: Not started.

Scope:

```text
homepage
mint pages
user dashboard
admin dashboard
reward claim
loading states
empty states
error states
mobile responsiveness
copywriting
explorer links
risk warnings
confirmation modals
accessibility basics
```

---

## Step 9 — Testnet Release Candidate

Status: Not started.

Done criteria:

```text
all stage tests pass
full browser E2E pass on Base Sepolia
full browser E2E pass on Ethereum Sepolia
admin procedures documented
indexer/reward procedures documented
runbook updated
roadmap updated
mainnet readiness review updated
no critical blockers
```

---

## Step 10 — Mainnet Deployment Gate

Status: Ready but deferred.

Preparation already passed:

```text
repo clean
build/compile/test pass
RPC chain IDs verified
preflight passed
deployer wallet funded
whitelist finalized
deploy config reviewed
```

Do not deploy until Testnet Release Candidate unless a separate explicit strategic override is made.

---

## 5. Current Next Step

```text
Admin Dashboard Architecture v1
```

Before writing code, create:

```text
Contract Admin Surface Audit
Admin Dashboard route plan
Admin action risk matrix
Admin testing checklist
```

---

P.S. Read this document freely for information and guidance. Do not redistribute or restate—no quotes, summaries, paraphrases, or derivatives—without prior written permission from [**Prof. NOTA**](https://nota.endhonesa.com/). Sharing the link is allowed. So, share the link, not the text. Do not discuss or re-tell the contents in any form—written, spoken, or recorded—without prior written permission.

---
