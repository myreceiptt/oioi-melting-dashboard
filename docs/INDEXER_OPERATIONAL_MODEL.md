# OiOi Melting Dashboard — Indexer Operational Model v2

This document locks the operational model for the OiOi Melting Dashboard indexer.

It supersedes the earlier Local JSON-first assumption.

---

## 1. Decision Summary

Accepted decisions:

```text
Indexer does not run in browser.
Frontend never scans blockchain history.
Indexer runs as backend/admin worker or CLI.
Do not rewrite deployment scripts only to capture block numbers.
FROM_BLOCK is manually read from block explorer and stored in .env.
TO_BLOCK is optional and only for bounded backfill/testing.
Checkpoint is written after successful sync and controls resume.
Transfer Sync is paused/experimental until Supabase-first implementation is accepted.
Supabase Postgres is the primary indexer/reward storage.
Local JSON is not the primary storage.
```

---

## 2. Current Accepted Indexer State

Accepted:

```text
Indexer skeleton is implemented.
Indexer status command exists.
Generated output is ignored.
```

Paused / Experimental:

```text
Transfer sync draft may exist in scripts/indexer/sync.ts.
ownership calculator draft may exist in scripts/indexer/calculators/ownership.ts.
```

Do not continue production indexer logic until Supabase Postgres-first architecture is implemented.

---

## 3. Why the Indexer Exists

Smart contracts can answer current state:

```text
Does this wallet currently own the NFT?
Is this stake currently active?
Is this stake currently valid?
```

Rewards need historical state:

```text
During a reward period, how long was this NFT actively staked and still owned by the staker?
```

Therefore, reward calculation needs event history:

```text
ERC721 Transfer events
OiOiSoftStaking Staked events
OiOiSoftStaking Unstaked events
RewardDistributor events
```

The reward rule is:

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
```

The browser/frontend must not:

```text
scan historical blockchain events
run getLogs loops
calculate production reward allocations from raw chain history
act as the indexer
expose Supabase service role key
```

---

## 5. Indexer Responsibility

The indexer may:

```text
read deployment records
read .env start block values
read logs from RPC
decode events
write Supabase records
write checkpoints
build ownership state
build stake state
calculate reward durations
generate reward allocation records
prepare proof data for frontend
```

The indexer is an admin/backend process, not a user-facing browser workflow.

---

## 6. Storage Policy

Accepted storage:

```text
Supabase Postgres
```

Supabase stores:

```text
checkpoints
indexed events
transfers
staking events
reward events
current owners
current stake positions
reward rounds
reward allocations
proofs
claim status
```

Local JSON may be used only for:

```text
Merkle export
audit export
public static proof snapshot
debug backup
```

---

## 7. Deployment Block Policy

The project will not go backward to rewrite deployment scripts just to store block numbers.

For v1, indexer start blocks are filled manually after deployment.

Procedure:

```text
1. Deploy contracts.
2. Open block explorer.
3. Find earliest contract creation transaction block for that chain.
4. Store that block in .env as chain-level INDEXER_FROM_BLOCK.
5. Run indexer from that block.
```

Use one chain-level start block per chain for MVP.

Example:

```env
BASE_SEPOLIA_INDEXER_FROM_BLOCK=
ETHEREUM_SEPOLIA_INDEXER_FROM_BLOCK=
BASE_MAINNET_INDEXER_FROM_BLOCK=
ETHEREUM_MAINNET_INDEXER_FROM_BLOCK=
```

---

## 8. FROM_BLOCK, TO_BLOCK, and Checkpoint Rules

### FROM_BLOCK

```text
FROM_BLOCK = block awal sync.
```

Used only when no checkpoint exists.

If checkpoint exists, checkpoint wins.

### TO_BLOCK

```text
TO_BLOCK = optional batas akhir sync untuk bounded backfill/testing.
```

TO_BLOCK is not checkpoint.

But if sync succeeds until TO_BLOCK, checkpoint becomes TO_BLOCK.

### Checkpoint

```text
checkpoint = last block successfully synced.
```

After successful sync, next run starts from:

```text
checkpoint + 1
```

Example:

```env
BASE_SEPOLIA_INDEXER_FROM_BLOCK=41536800
BASE_SEPOLIA_INDEXER_TO_BLOCK=41537200
```

If sync succeeds:

```json
{
  "lastSyncedBlock": 41537200
}
```

Next run starts from:

```text
41537201
```

If TO_BLOCK remains set at `41537200`, next run is no-op.

To continue normal sync, clear TO_BLOCK.

---

## 9. RPC Range and Rate Limit Policy

Default safe values:

```env
INDEXER_BLOCK_RANGE=10
INDEXER_REQUEST_DELAY_MS=250
```

Reason:

```text
some free RPC tiers restrict eth_getLogs to small block ranges
too many fast requests can trigger HTTP 429
bounded backfill is safer during development
```

For production, use:

```text
checkpoint-based sync
retry/backoff
delay
confirmation delay
durable Supabase storage
```

---

## 10. Supabase Responsibility

Supabase should be treated as backend storage.

Do not expose:

```text
SUPABASE_SERVICE_ROLE_KEY
```

to the browser.

Frontend should only read indexed/reward data through safe API routes or safe RLS policies.

Recommended first implementation:

```text
server-side API routes use service role key
browser never talks directly to unsafe admin tables
```

---

## 11. Mainnet Policy

Mainnet deployment is deferred until Testnet Release Candidate.

After mainnet deployment:

```text
manually record Base MAINNET FROM_BLOCK
manually record Ethereum MAINNET FROM_BLOCK
seed Supabase contracts table
run mainnet read-only sync only after read-check passes
do not open reward claim until production reward flow is tested
```

---

## 12. Stop Conditions

Stop indexer/reward implementation if:

```text
Supabase env is missing
service role key is exposed to frontend
deployment record is missing
chain ID mismatch occurs
FROM_BLOCK is missing and no checkpoint exists
RPC repeatedly rate limits
event decoding fails
duplicate event insert happens
ownership state mismatches contract read
stake state mismatches contract read
allocation total mismatch occurs
proof verification fails
claim test fails
```

---

## 13. Current Status

```text
INDEXER OPERATIONAL MODEL: UPDATED FOR SUPABASE POSTGRES-FIRST
INDEXER SKELETON: IMPLEMENTED
TRANSFER SYNC: PAUSED / EXPERIMENTAL
SUPABASE SCHEMA: NOT STARTED
REWARD CALCULATOR: NOT PRODUCTION-COMPLETE
PROOF API: NOT STARTED
BROWSER CLAIM: NOT ACTIVE
```

---

P.S. Read this document freely for information and guidance. Do not redistribute or restate—no quotes, summaries, paraphrases, or derivatives—without prior written permission from [**Prof. NOTA**](https://nota.endhonesa.com/). Sharing the link is allowed. So, share the link, not the text. Do not discuss or re-tell the contents in any form—written, spoken, or recorded—without prior written permission.

---
