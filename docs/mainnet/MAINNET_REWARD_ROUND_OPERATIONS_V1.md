# Mainnet Reward Round Operations v1

Date: 2026-06-28

Status:

```text
MAINNET REWARD DATA PLANE SETUP: COMPLETE
MAINNET SUPABASE SCHEMA/SEED: COMPLETE
MAINNET APP SMOKE CHECKS: PASS
MAINNET WORKER READINESS: PASS
FIRST MAINNET BOUNDARY WORKER JOB: SUCCESS
FIRST MAINNET CALCULATED REWARD ROUNDS: GENERATED
FIRST MAINNET REWARD ROUNDS: CREATED / APPROVED / FUNDED ON-CHAIN
MAINNET REWARD CLAIM PUBLIC ENABLEMENT: NOT APPROVED
CONTROLLED USER CLAIM VERIFICATION ON MAINNET: NOT YET DOCUMENTED
```

This document records the first mainnet reward data-plane setup and the locked
operator SOP for reward round operations.

---

## 1. Completed

Mainnet Supabase setup:

```text
migrations 001 through 005 applied successfully
Sepolia static seed rows removed from mainnet Supabase
baseMainnet and ethereumMainnet chain rows seeded
12 mainnet contract rows seeded
NEXT_PUBLIC_APP_ENV=mainnet npm run supabase:check succeeded
supabase:check found baseMainnet, ethereumMainnet, and contractCount = 12
```

Mainnet app smoke checks:

```text
local mainnet app OK
wallet connect OK
Owned NFT API base OK
Owned NFT API ethereum OK
reward claim mainnet disabled guard OK
```

GitHub Actions / worker readiness:

```text
mainnet GitHub Actions secrets and variables added
no-job Mainnet Boundary Worker smoke succeeded
precheck and postcheck showed no stray jobs before boundary rehearsal
```

First mainnet boundary worker job:

```text
job_id: 0118f1d1-ea0f-44b3-a74e-9d4902ff22a2
job_kind: reward_boundary_sync
status: success
reward_amount_wei: 1000000000000000000
requested_by: 0x29bF68E3969E0b6686ea55B7C48241ba3f6B9bA0
baseMainnet target block: 47893400
ethereumMainnet target block: 25410046
all 10 baseMainnet targets succeeded
all 10 ethereumMainnet targets succeeded
error_message: none
```

First mainnet calculated reward rounds:

```text
baseMainnet round_id: 1782576147
baseMainnet reward amount: 1 OiOi
baseMainnet merkle root: 0x7f568e12d3035fc72abd22df0bae4f5c9e04e35e0c3f40dfed8e983d66ea6665
baseMainnet allocation count: 1

ethereumMainnet round_id: 1782576167
ethereumMainnet reward amount: 1 OiOi
ethereumMainnet merkle root: 0xcd7cc85c502438946e27680feee59fedfcdb1e879bc5366c59721df5445ce7e8
ethereumMainnet allocation count: 1
```

Each chain has one eligible wallet. A Merkle proof of `[]` is expected for a
single-leaf Merkle tree.

Mainnet on-chain reward operations:

```text
Base reward round created on-chain successfully
Base OiOi funding approval of 1 OiOi succeeded
Base funding of 1 OiOi succeeded
Ethereum reward round created on-chain successfully
Ethereum OiOi funding approval of 1 OiOi succeeded
Ethereum funding of 1 OiOi succeeded
```

Known transaction data:

```text
Base create tx: 0xed3515501ab38fd1f345c4179b38185b38d51c2bd170774521cfd63eb567e399
Base create tx block: 47895688
Base approve tx: TODO
Base fund tx: TODO
Ethereum create tx: TODO
Ethereum approve tx: TODO
Ethereum fund tx: TODO
```

Do not invent missing transaction hashes. Fill TODOs only from explorer,
wallet history, or committed/reviewed operational evidence.

---

## 2. Current Locked SOP

Reward round operations are intentionally split between two sources of truth:

```text
Supabase:
  calculation
  allocation
  Merkle root
  proof data
  historical reconciliation

Smart contracts / on-chain reads:
  live create state
  live funding state
  live pause state
  live claim state
```

The Admin UI does not need to immediately persist `created_tx_hash` or
`funded_tx_hash` after a transaction receipt.

The Admin UI reads live on-chain state for active create/fund/pause/claim
operations. Supabase `reward_rounds` may remain temporarily stale after
successful on-chain create/fund/claim transactions.

Expected temporary state:

```text
reward_rounds.status = calculated
created_tx_hash = null
funded_tx_hash = null
```

This can be valid after successful on-chain create/fund transactions if
RewardDistributor event indexing has not yet crossed those transaction blocks.
This is not a bug under the current SOP.

Long-term DB fields are reconciled from `reward_round_events` after
RewardDistributor event indexing:

```text
created_tx_hash
funded_tx_hash
funded_amount_wei
claimed_amount_wei
claim_paused
long-term reward_rounds.status
```

Default operator rule:

```text
Do not manually update Supabase only to fill tx hashes.
Do not submit a new Tapal Batas solely for tx hash reconciliation.
Do not treat stale Supabase tx hash fields as a blocker if live on-chain state confirms the round is created/funded.
Event-only catch-up is optional, not the default SOP.
```

Event-only catch-up is available as a technical recovery/diagnostic path, but
the default SOP is to let the next natural reward distribution worker cycle
reconcile RewardDistributor events unless there is a specific operator reason
to catch up earlier.

The next natural reward distribution cycle may reconcile prior create/fund/claim
events if the new Tapal Batas target block is higher than those transaction
blocks.

Public/user claim readiness is separate from Supabase reconciliation status.
Active claim flow depends on:

```text
proof availability
on-chain funded state
mainnet claim guard approval
operator-controlled launch decision
```

---

## 3. Reward Distribution Model

Reward distribution is not scheduled.

A new reward round is created only when OiOi is available for distribution and
the operator chooses a new Tapal Batas.

Range rule:

```text
first range:
  deployment/from block -> submitted Tapal Batas block

next range:
  previous Tapal Batas + 1 -> next submitted Tapal Batas block
```

Eligibility is based on valid/active NFT stake duration inside the selected
range.

If prior create/fund/claim/pause/unpause events should be reconciled into
Supabase during the next worker cycle, the next Tapal Batas should be higher
than those transaction blocks.

---

## 4. Still Remaining / Not Yet Done

```text
Controlled user claim verification on mainnet is not yet documented.
Public claim enablement remains not approved unless separately decided.
Post-claim verification remains pending.
RewardDistributor event reconciliation after the first create/fund operations remains pending until a later worker/indexer pass crosses those tx blocks.
Next reward distribution cycle using a new Tapal Batas remains pending.
Missing Base approve/fund and Ethereum create/approve/fund tx hashes should be documented if needed.
```

Do not claim that `created_tx_hash` or `funded_tx_hash` is reconciled in
mainnet Supabase until actual data proves it.

Do not claim public reward claim launch is live until the repo/docs explicitly
record the approval and QA result.

---

## 5. Optional Future Improvements

```text
Operator-friendly RewardDistributor event-only catch-up workflow.
Dedicated mainnet reward event reconciliation runbook.
Admin UI hint that stale Supabase tx hash fields are expected until event indexing.
Additional tx hash evidence table after explorer review.
```

These are not blockers for the current locked SOP.

---

## 6. Reasoning

The SOP intentionally:

```text
avoids unnecessary worker/indexer runs only to chase tx hashes
avoids manual DB edits for on-chain transaction state
keeps smart contracts as the live source of truth for operational state
keeps Supabase as the calculation/proof/reconciliation/history layer
preserves the irregular/non-scheduled reward distribution model
```

P.S. Read this document freely for information and guidance. Do not redistribute or restate—no quotes, summaries, paraphrases, or derivatives—without prior written permission from [**Prof. NOTA**](https://nota.endhonesa.com/). Sharing the link is allowed. So, share the link, not the text. Do not discuss or re-tell the contents in any form—written, spoken, or recorded—without prior written permission.

---
