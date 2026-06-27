# OiOi Melting Dashboard — Indexer Operational Model v3

This document locks the operational model for the implemented OiOi Melting Dashboard indexer and reward worker.

---

## 1. Decision Summary

Accepted decisions:

```text
Indexer does not run in browser.
Frontend never scans blockchain history.
Indexer runs as backend/admin worker, GitHub Actions job, or controlled CLI.
Do not rewrite deployment scripts only to capture block numbers.
FROM_BLOCK is manually read from block explorer and stored in env.
TO_BLOCK is optional and only for bounded backfill/testing.
Checkpoint is written after successful sync and controls resume.
Supabase Postgres is the primary indexer/reward storage.
Local JSON is not the primary indexer storage.
```

---

## 2. Current Accepted State

Accepted:

```text
Supabase schema exists.
DB-backed event sync exists.
DB-backed rebuild scripts exist.
Reward calculation exists.
Merkle proof storage exists.
Proof API exists.
Admin boundary sync API exists.
Boundary worker exists.
GitHub Actions scheduled worker exists.
Dashboard wallet NFT cache exists.
Boundary worker flow passed through GitHub Actions on testnet.
On-chain reward round creation and user reward claim validated on testnet.
Mainnet Supabase reward data-plane setup completed.
First mainnet boundary worker job completed successfully.
First Base/Ethereum mainnet reward rounds created, approved, and funded on-chain.
```

Legacy diagnostic tool retained:

```text
scripts/indexer/sync.ts
```

---

## 3. Why the Indexer Exists

Smart contracts answer current state:

```text
Does this wallet currently own the NFT?
Is this stake currently active?
Is this stake currently valid?
```

Rewards need historical state:

```text
During a reward period, how long was this NFT actively staked and still owned by the staker?
```

Reward rule:

```text
valid staking duration = active soft-stake intent ∩ actual NFT ownership duration
```

---

## 4. Browser Responsibility

The browser/frontend may:

```text
connect wallet
read current contract state
submit mint/stake/unstake/claim transactions
call API routes
show indexed data
show cached wallet NFT discovery data
```

The browser/frontend must not:

```text
scan historical blockchain events
run getLogs loops
calculate production reward allocations from raw chain history
expose Supabase service role key
act as the reward indexer
```

---

## 5. Worker Responsibility

The worker may:

```text
read deployment records
read env start block values
read queued Supabase sync jobs
read logs from RPC
decode events
write Supabase records
write checkpoints
build ownership state
build stake state
calculate reward durations
generate reward allocation records
prepare proof data for frontend
update job/target status
pause/retry on rate limits
```

The worker is an admin/backend process, not a user-facing browser workflow.

---

## 6. Storage Policy

Supabase stores:

```text
chains
contracts
checkpoints
indexed events
transfers
staking events
reward events
current owners
current stake positions
valid stake intervals
reward calculations
reward rounds
reward allocations
reward claims
boundary sync jobs
boundary snapshots
dashboard wallet NFT cache
indexer locks
```

Local JSON may be used only for:

```text
Merkle export
audit export
public static proof snapshot
debug backup
whitelist generated data
```

---

## 7. Deployment Block Policy

Procedure:

```text
1. Deploy contracts.
2. Open block explorer.
3. Find earliest contract creation transaction block for that chain.
4. Store that block in env as chain-level INDEXER_FROM_BLOCK.
5. Run indexer/worker from that block.
```

Use one chain-level start block per chain.

Example:

```env
BASE_SEPOLIA_INDEXER_FROM_BLOCK=
ETHEREUM_SEPOLIA_INDEXER_FROM_BLOCK=
BASE_MAINNET_INDEXER_FROM_BLOCK=
ETHEREUM_MAINNET_INDEXER_FROM_BLOCK=
```

---

## 8. FROM_BLOCK, TO_BLOCK, and Checkpoints

`FROM_BLOCK` is used only when no checkpoint exists.

If checkpoint exists, checkpoint wins.

`TO_BLOCK` is an optional bounded sync/testing stop. It is not a reward tapal batas.

After successful sync:

```text
next start block = checkpoint + 1
```

Reward tapal batas is submitted through Admin Reward Operations and stored in Supabase boundary job/snapshot records.

---

## 9. RPC Range and Rate Limits

Default safe values:

```env
INDEXER_BLOCK_RANGE=10
INDEXER_REQUEST_DELAY_MS=250
INDEXER_WORKER_BLOCK_SPAN=200
```

`INDEXER_BLOCK_RANGE` keeps individual `getLogs` requests small.

`INDEXER_WORKER_BLOCK_SPAN` limits work per worker invocation.

On RPC rate limits, the worker pauses/retries and preserves completed progress.

---

## 10. GitHub Actions Operational Model

Workflow:

```text
.github/workflows/boundary-worker.yml
```

Expected behavior:

```text
scheduled worker runs automatically
manual dispatch can run the same worker
concurrency prevents overlapping worker executions
one run processes one bounded worker batch
repeated runs eventually complete large jobs
```

This is intentionally conservative and suitable for slow reward-boundary syncs.

The existing scheduled workflow remains the Sepolia/testnet worker:

```text
.github/workflows/boundary-worker.yml
```

Mainnet uses a separate manual-only workflow:

```text
.github/workflows/mainnet-boundary-worker.yml
```

The mainnet workflow is intentionally not scheduled yet. It runs the same
worker command only when manually dispatched, uses the mainnet Supabase data
plane, and requires mainnet RPC and `FROM_BLOCK` values. Testnet history remains
in the testnet Supabase project and must not be copied into mainnet.

Reward chain mapping is environment-aware:

```text
NEXT_PUBLIC_APP_ENV=sepolia:
  base -> baseSepolia
  ethereum -> ethereumSepolia

NEXT_PUBLIC_APP_ENV=mainnet:
  base -> baseMainnet
  ethereum -> ethereumMainnet
```

Mainnet reward claim remains disabled until the mainnet worker/proof/claim flow
is run and separately approved.

RewardDistributor event reconciliation:

```text
Admin UI reads live on-chain state for active create/fund/pause/claim operations.
Supabase stores calculation, allocation, Merkle root, proof, and history.
created_tx_hash and funded_tx_hash are reconciled from reward_round_events.
Supabase reward_rounds can temporarily remain calculated with null tx hashes after successful on-chain create/fund.
This is expected if event indexing has not crossed those transaction blocks.
Do not manually update Supabase only to fill tx hashes.
Do not submit Tapal Batas solely for tx hash reconciliation.
```

---

## 11. Dashboard Wallet NFT Discovery

Routine dashboard NFT display is separate from reward-boundary worker jobs.

Dashboard discovery uses:

```text
Alchemy NFT API
on-chain staking reads
Supabase dashboard wallet NFT cache
safe API route
short cache TTL
```

This keeps user-facing NFT display responsive without mutating reward calculation history.

---

## 12. Mainnet Policy

Mainnet contract deployment is complete, verified, read-checked, and safe-off.

Current mainnet reward/indexer/proof foundation status:

```text
Base/Ethereum MAINNET FROM_BLOCK values recorded in operator env
mainnet Supabase schema/seed complete
mainnet worker readiness pass
first mainnet boundary worker job success
first mainnet calculated reward rounds generated
first Base/Ethereum reward rounds created, approved, and funded on-chain
do not open reward claim until controlled user claim verification and explicit launch approval
```

Production mainnet reward claim remains unavailable until controlled mainnet user claim verification is documented and reward claim launch is explicitly approved.

---

## 13. Current Status

```text
INDEXER OPERATIONAL MODEL: IMPLEMENTED FOR TESTNET
BOUNDARY WORKER: IMPLEMENTED
GITHUB ACTIONS WORKER: IMPLEMENTED AND QA-PASSED
REWARD CLAIM: IMPLEMENTED AND QA-PASSED ON TESTNET
DASHBOARD NFT DISCOVERY: IMPLEMENTED
MAINNET REWARD DATA-PLANE FOUNDATION: COMPLETE
MAINNET REWARD CLAIM LAUNCH: NOT APPROVED
NEXT MAJOR TASK: CONTROLLED MAINNET USER CLAIM VERIFICATION / CLAIM LAUNCH APPROVAL
```

---

P.S. Read this document freely for information and guidance. Do not redistribute or restate—no quotes, summaries, paraphrases, or derivatives—without prior written permission from [**Prof. NOTA**](https://nota.endhonesa.com/). Sharing the link is allowed. So, share the link, not the text. Do not discuss or re-tell the contents in any form—written, spoken, or recorded—without prior written permission.

---
