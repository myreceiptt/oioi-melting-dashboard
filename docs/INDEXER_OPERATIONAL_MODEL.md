# OiOi Melting Dashboard — Indexer Operational Model v1

This document locks the operational model for the OiOi Melting Dashboard indexer before further indexer implementation continues.

It exists because the first Transfer Sync attempt exposed practical issues:

```text
raw getLogs ranges
RPC limits
rate limits
manual block range confusion
unclear start block policy
```

The goal is to prevent the indexer from derailing the already validated contract and frontend work.

---

## 1. Decision Summary

Accepted decisions:

```text
Indexer does not run in browser.
Frontend never scans blockchain history.
Indexer runs as backend/admin worker or CLI.
Do not rewrite deployment scripts only to capture block numbers.
For v1, FROM_BLOCK is manually read from block explorer and stored in .env.
TO_BLOCK is optional and only for bounded backfill/testing.
Checkpoint is written after successful sync and controls resume.
Transfer Sync is paused/experimental until this model is accepted.
Local JSON storage is acceptable for MVP.
Postgres/Supabase or managed indexer can be added later through a storage adapter.
```

---

## 2. Current Accepted Indexer State

Accepted:

```text
Indexer skeleton is implemented.
Indexer status command exists.
Local JSON output folder exists.
Generated output is ignored.
```

Paused / Experimental:

```text
Transfer sync draft may exist in scripts/indexer/sync.ts.
ownership calculator draft may exist in scripts/indexer/calculators/ownership.ts.
```

Do not continue:

```text
Transfer Sync
Staking Sync
Reward Sync
Duration Calculator
Reward Calculator
Reward Proof API
```

until this operational model is committed and accepted.

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
```

---

## 5. Indexer Responsibility

The indexer may:

```text
read deployment records
read .env start block values
read logs from RPC
decode events
write checkpoints
write local JSON output
later write to database
build ownership state
build stake state
calculate reward durations
generate reward allocation inputs
prepare proof data for frontend
```

The indexer is an admin/backend process, not a user-facing browser workflow.

---

## 6. Deployment Block Policy

The project will not go backward to rewrite deployment scripts just to store block numbers.

For v1, indexer start blocks are filled manually after deployment.

Procedure:

```text
1. Deploy contracts.
2. Open block explorer.
3. Find the earliest contract creation transaction block for that chain.
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

This keeps testnet and mainnet operational flow consistent.

---

## 7. FROM_BLOCK, TO_BLOCK, and Checkpoint Rules

### FROM_BLOCK

```text
FROM_BLOCK = block awal sync.
```

It is used only when no checkpoint exists yet.

If checkpoint exists, checkpoint wins.

### TO_BLOCK

```text
TO_BLOCK = optional batas akhir sync untuk bounded backfill/testing.
```

TO_BLOCK is not the checkpoint itself.

But if sync succeeds until TO_BLOCK, checkpoint will become TO_BLOCK.

### Checkpoint

```text
checkpoint = last block successfully synced.
```

After a successful sync, next run starts from:

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

If TO_BLOCK remains set at 41537200, the next run becomes no-op because:

```text
fromBlock = 41537201
toBlock = 41537200
```

To continue normal sync, clear TO_BLOCK:

```env
BASE_SEPOLIA_INDEXER_TO_BLOCK=
```

---

## 8. RPC Range and Rate Limit Policy

Default safe values:

```env
INDEXER_BLOCK_RANGE=10
INDEXER_REQUEST_DELAY_MS=250
```

Reason:

- some free RPC tiers restrict `eth_getLogs` to small block ranges
- too many fast requests can trigger HTTP 429
- bounded backfill is safer than unbounded historical sync

Do not run a wide unbounded sync on a free RPC without understanding request volume.

For development:

```text
Use FROM_BLOCK and TO_BLOCK to sync a small known window first.
```

For production:

```text
Use checkpoint-based sync, retries, delays, and durable storage.
```

---

## 9. Storage Policy

Accepted MVP storage:

```text
Local JSON
```

Future production storage:

```text
Postgres / Supabase / managed indexer
```

Do not hardwire reward logic directly to local JSON.

Use a storage adapter boundary so future migration does not require rewriting the core logic.

Recommended boundary:

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

Core logic should remain storage-independent:

```text
event decoding
ownership reconstruction
stake reconstruction
valid duration calculation
reward allocation
Merkle input generation
```

---

## 10. Generated Output Policy

Generated indexer output must not be committed.

Allowed tracked file:

```text
scripts/indexer/output/.gitkeep
```

Ignored generated output:

```text
scripts/indexer/output/base-sepolia/*
scripts/indexer/output/ethereum-sepolia/*
scripts/indexer/output/base-mainnet/*
scripts/indexer/output/ethereum-mainnet/*
```

Validation command:

```bash
git ls-files scripts/indexer/output
```

Expected output:

```text
scripts/indexer/output/.gitkeep
```

---

## 11. Transfer Sync Status

Current decision:

```text
Transfer Sync draft may stay in the repo.
It is paused/experimental.
Do not continue or rely on it as production behavior yet.
```

Before accepting Transfer Sync as active:

1. Confirm FROM_BLOCK values.
2. Confirm TO_BLOCK behavior.
3. Confirm checkpoint behavior.
4. Confirm rate limit behavior.
5. Confirm output files are ignored.
6. Confirm sync can resume safely.
7. Confirm current owner reconstruction against contract reads.
8. Confirm no duplicate events.
9. Confirm no wide accidental RPC scan.

---

## 12. Reward Claim Status

Reward claim frontend is placeholder only.

Claim button must remain disabled until:

```text
reward round data exists
wallet allocation exists
Merkle proof exists
claimable check passes
proof data is served to frontend
```

Reward claim must not be advertised as live before proof data is ready.

---

## 13. Mainnet Policy

Mainnet deployment does not require production reward indexer to be complete.

Mainnet public reward launch does require reward/indexer proof flow.

Mainnet mint opening may proceed before reward automation if:

```text
contracts verified
read checks pass
mainnet frontend QA passes
mint phases opened intentionally
reward claim remains disabled or clearly not active
```

After mainnet deployment:

```text
manually read earliest contract creation block
store BASE_MAINNET_INDEXER_FROM_BLOCK / ETHEREUM_MAINNET_INDEXER_FROM_BLOCK in .env
do not commit .env
```

---

## 14. Stop Conditions

Stop indexer execution if:

```text
FROM_BLOCK is unknown
wrong chain ID appears
deployment record is missing
RPC rejects getLogs range
RPC returns repeated 429
output files are accidentally tracked
checkpoint behavior is unclear
current owner reconstruction differs from contract reads
stake state differs from contract reads
sync would require excessive request volume
```

---

## 15. Next Implementation Gate

Before continuing indexer code, decide:

```text
Keep transfer sync draft and harden it
or
revert transfer sync to skeleton and rewrite later
or
move directly to managed/database indexing approach
```

Recommended current path:

```text
Keep transfer sync as paused draft.
Do not execute further.
Commit this operational model.
Update roadmap/spec/readiness docs.
Proceed only after human confirmation.
```

---

## 16. Current Status

```text
INDEXER OPERATIONAL MODEL: READY AFTER THIS DOCUMENT IS COMMITTED
INDEXER SKELETON: IMPLEMENTED
TRANSFER SYNC: PAUSED / EXPERIMENTAL
STAKING SYNC: PENDING
REWARD SYNC: PENDING
DURATION CALCULATOR: PENDING
REWARD CLAIM: PLACEHOLDER ONLY
```

---

P.S. Read this document freely for information and guidance. Do not redistribute or restate—no quotes, summaries, paraphrases, or derivatives—without prior written permission from [**Prof. NOTA**](https://nota.endhonesa.com/). Sharing the link is allowed. So, share the link, not the text. Do not discuss or re-tell the contents in any form—written, spoken, or recorded—without prior written permission.

---
