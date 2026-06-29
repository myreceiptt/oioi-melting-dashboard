# Mainnet Reward Round Conversation Context v1

> Current status note (2026-06-29): this is a historical mainnet reward-round
> conversation-context record. The current canonical project status is
> `docs/PROJECT_FINAL_STATUS_AND_MAINTENANCE_V1.md`: complete, public,
> operational, and in evergreen maintenance mode. Any older "pending",
> "remaining", "not approved", or "deferred" wording below describes the state
> at the time this context was written.

Date: 2026-06-28
Scope: OiOi Melting Dashboard — Mainnet Reward Round, Supabase Data Plane, Worker, SOP, Documentation Alignment

## 1. Purpose

This document preserves the conversation context behind the first mainnet reward round operations for the OiOi Melting Dashboard.

It is not a technical runbook, migration file, QA report, or transaction log.

Its purpose is to preserve:

- how the mainnet reward round work started,
- what was discussed,
- what was confusing,
- what was investigated,
- what decisions were made,
- what was executed,
- what was intentionally not executed,
- what documentation was updated,
- what remains truly unfinished,
- and what should not be reopened as endless uncertainty.

This note exists so future maintainers, operators, or the project owner can understand the reasoning behind the repo state, not only the final checklist.

---

## 2. Starting Point

The main concern at the beginning of this work was not only whether the mainnet reward round could technically run.

The deeper concern was:

```text
Can the mainnet reward data-plane, worker, Supabase state, Admin UI, and on-chain reward round operations be executed safely without creating fake progress, hidden bugs, manual database cheating, or unnecessary operational loops?
```

The project already had:

- deployed mainnet contracts,
- production mainnet frontend surface,
- open mint phases,
- testnet reward round rehearsal,
- Supabase-based indexer/reward pipeline,
- GitHub Actions worker,
- Admin reward round controls,
- and a reward claim UI guarded from public mainnet launch.

The missing part was proving that the first mainnet reward data-plane and reward round preparation could be completed in a controlled way.

---

## 3. Mainnet Supabase Setup

The first major step was preparing the mainnet Supabase data-plane.

The following migrations were applied manually in the Supabase Mainnet SQL Editor:

```text
001_initial_schema.sql
cleanup Sepolia static config rows
002_reward_amount_columns_as_text.sql
003_boundary_sync_orchestration.sql
004_dashboard_wallet_nft_cache.sql
005_dashboard_wallet_nft_media_html.sql
```

Mainnet chain rows were seeded:

```text
baseMainnet       chain_id 8453
ethereumMainnet   chain_id 1
```

Mainnet contract rows were seeded for both chains:

```text
Base:
- roty
- melting
- amanda
- staking
- rewardDistributor
- oioi

Ethereum:
- roty
- melting
- amanda
- staking
- rewardDistributor
- oioi
```

Verification confirmed:

```text
Sepolia chains: 0 rows
Sepolia contracts: 0 rows
Mainnet chains: 2 rows
Mainnet contracts: 12 rows

Contract count:
- baseMainnet: 6
- ethereumMainnet: 6

Operational tables: empty before first run
```

This established that mainnet Supabase was not polluted by Sepolia static seed rows and had the correct mainnet contract references.

---

## 4. Local Mainnet Verification

The local Supabase check was run with:

```bash
NEXT_PUBLIC_APP_ENV=mainnet npm run supabase:check
```

Result:

```text
Supabase connection OK.
baseMainnet found.
ethereumMainnet found.
contractCount = 12.
```

Local mainnet app smoke checks passed:

```text
Local mainnet app: OK
Wallet connect: OK
Owned NFT API base: OK
Owned NFT API ethereum: OK
Reward claim mainnet disabled: OK
```

Important environment readiness was confirmed:

```text
MAINNET_SUPABASE_URL
MAINNET_SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_APP_ENV=mainnet
NEXT_PUBLIC_MAINNET_REWARD_CLAIM_ENABLED=false
BASE_MAINNET_RPC_URL
ETHEREUM_MAINNET_RPC_URL
Alchemy / NFT API wiring
```

The important decision at this stage:

```text
Reward claim public launch must remain disabled during setup.
```

---

## 5. GitHub Actions Worker Preparation

GitHub Actions mainnet worker secrets and variables were prepared.

Secrets included:

```text
MAINNET_SUPABASE_URL
MAINNET_SUPABASE_SERVICE_ROLE_KEY
BASE_MAINNET_RPC_URL
ETHEREUM_MAINNET_RPC_URL
MAINNET_INDEXER_CRON_SECRET
```

Variables included mainnet worker/indexer block configuration.

The known non-secret worker values included:

```text
BASE_MAINNET_INDEXER_FROM_BLOCK=47772116
ETHEREUM_MAINNET_INDEXER_FROM_BLOCK=25393545
INDEXER_WORKER_BLOCK_SPAN=10000
```

A no-job Mainnet Boundary Worker smoke run succeeded.

The database remained clean before the real job.

This proved that the worker could run without accidentally processing unintended jobs.

---

## 6. First Mainnet Boundary Job

The first real mainnet boundary job was submitted through the Admin UI.

URL context:

```text
https://softstaking.endhonesa.com/admin/ethereum#round-controls
```

Submitted values:

```text
Base Mainnet target block: 47893400
Ethereum Mainnet target block: 25410046
Reward amount: 1 OiOi
```

Job ID:

```text
0118f1d1-ea0f-44b3-a74e-9d4902ff22a2
```

The Mainnet Boundary Worker was run manually through GitHub Actions until all targets succeeded.

Final result:

```text
baseMainnet: success 10
ethereumMainnet: success 10
```

All tasks completed successfully for both chains:

```text
roty
melting
amanda
staking
rewardDistributor
rebuildOwnership
rebuildStakePositions
calculateValidIntervals
calculateRewards
generateMerkle
```

Parent job result:

```text
status: success
reward_amount_wei: 1000000000000000000
requested_by: 0x29bF68E3969E0b6686ea55B7C48241ba3f6B9bA0
error_message: null
```

---

## 7. First Mainnet Calculated Reward Rounds

Two first mainnet reward rounds were generated.

Base Mainnet:

```text
round_id: 1782576147
reward amount: 1 OiOi
merkle root: 0x7f568e12d3035fc72abd22df0bae4f5c9e04e35e0c3f40dfed8e983d66ea6665
allocation count: 1
```

Ethereum Mainnet:

```text
round_id: 1782576167
reward amount: 1 OiOi
merkle root: 0xcd7cc85c502438946e27680feee59fedfcdb1e879bc5366c59721df5445ce7e8
allocation count: 1
```

Each chain had one eligible wallet:

```text
0x2eade7ea53ca2ca6477c0ba5526393eaeeef1784
```

Each allocation had:

```text
amount_wei: 1000000000000000000
proof: []
claimed: false
```

The empty proof was confirmed as valid because each Merkle tree had only one leaf.

This was an important point: `proof = []` was not an error.

---

## 8. Key Confusion: Why Transaction Hashes Were Null

After the first calculated reward rounds existed, the reward rounds had not yet been created/funded on-chain.

Later, after on-chain create/fund operations started, Supabase fields such as:

```text
created_tx_hash
funded_tx_hash
funded_amount_wei
reward_rounds.status
```

could still appear stale or null.

This became a serious point of discussion because manually filling Supabase fields would have been dangerous and philosophically wrong for this system.

The core concern was:

```text
If the chain transaction succeeded, why does Supabase still show null tx hash?
Is that a bug?
Should the Admin UI write the tx hash directly?
Should the operator manually update Supabase?
Should an event-only catch-up be run immediately?
```

The answer after investigation:

```text
No manual DB update should be done.
This is not necessarily a bug.
Admin UI reads live on-chain state for active create/fund/pause/claim.
Supabase is the calculation/proof/reconciliation/history layer.
Transaction hashes and long-term DB state are reconciled through RewardDistributor event indexing.
```

---

## 9. Locked Reward Round SOP

The final Reward Round SOP was locked as follows.

Reward round operations are intentionally split:

```text
Supabase:
- calculation
- allocation
- Merkle root
- proof data
- historical reconciliation

Smart contracts / on-chain reads:
- live create state
- live funding state
- live pause state
- live claim state
```

The Admin UI does not need to immediately persist:

```text
created_tx_hash
funded_tx_hash
```

after a transaction receipt.

Expected temporary Supabase state:

```text
reward_rounds.status = calculated
created_tx_hash = null
funded_tx_hash = null
```

This can be valid after successful on-chain create/fund transactions if RewardDistributor event indexing has not crossed those transaction blocks.

This is not a bug under the current SOP.

Default operator rules:

```text
Do not manually update Supabase only to fill tx hashes.
Do not submit a new Tapal Batas solely for tx hash reconciliation.
Do not treat stale Supabase tx hash fields as a blocker if live on-chain state confirms created/funded state.
Event-only catch-up exists as an optional technical path, but it is not the default SOP.
```

The next natural reward distribution worker cycle may reconcile previous RewardDistributor events if the next Tapal Batas is higher than those transaction blocks.

---

## 10. First Mainnet On-Chain Reward Round Operations

Base reward round was created on-chain successfully.

Known Base create transaction:

```text
0xed3515501ab38fd1f345c4179b38185b38d51c2bd170774521cfd63eb567e399
```

Known Base create block:

```text
47895688
```

This block was higher than the previous worker rewardDistributor target block:

```text
47893400
```

Therefore, the create event was not expected to already appear in Supabase `reward_round_events`.

This was expected and accepted.

The operator decided not to run event-only catch-up just to fill tx hashes.

After that:

```text
Base OiOi funding approval of 1 OiOi succeeded.
Base funding of 1 OiOi succeeded.
Ethereum reward round was created on-chain successfully.
Ethereum OiOi funding approval of 1 OiOi succeeded.
Ethereum funding of 1 OiOi succeeded.
```

The first Base and Ethereum reward rounds were therefore:

```text
calculated
created on-chain
approved
funded on-chain
```

Public reward claim remained disabled.

---

## 11. Reward Distribution Model

Reward distribution is not scheduled.

A new reward round is created only when OiOi is available for distribution and the operator chooses a new Tapal Batas.

Range model:

```text
First range:
deployment/from block -> submitted Tapal Batas block

Next range:
previous Tapal Batas + 1 -> next submitted Tapal Batas block
```

Eligibility is based on valid/active NFT stake duration inside the selected range.

The next Tapal Batas should be higher than prior create/fund/claim/pause/unpause transaction blocks if those events are expected to reconcile into Supabase during the next worker/indexer pass.

---

## 12. Documentation Sync

After the mainnet reward round work, documentation was updated in the repository.

The docs-only sync updated multiple files including:

```text
README.md
URUTANSEHAT.md
docs/DEPLOYMENT_RUNBOOK.md
docs/IMPLEMENTATION_ROADMAP.md
docs/INDEXER_IMPLEMENTATION_PLAN.md
docs/INDEXER_OPERATIONAL_MODEL.md
docs/MAINNET_READINESS_REVIEW.md
docs/TESTING_CHECKLIST.md
docs/TESTNET_PRODUCT_COMPLETION_PLAN.md
docs/mainnet/MAINNET_CONTRACT_DEPLOYMENT_COMPLETION_V1.md
docs/mainnet/MAINNET_DEPLOYMENT_APPROVAL_DECISION_V1.md
docs/mainnet/MAINNET_DEPLOYMENT_APPROVAL_GATE_V1.md
docs/mainnet/MAINNET_ENV_WIRING_APPROVAL_DECISION_V1.md
docs/mainnet/MAINNET_ENV_WIRING_PLAN_V1.md
docs/mainnet/MAINNET_SUPABASE_SETUP_RUNBOOK_V1.md
docs/mainnet/MAINNET_REWARD_ROUND_OPERATIONS_V1.md
docs/qa/MAINNET_PUBLIC_SURFACE_AND_MINT_OPENING_QA_V1.md
docs/qa/MAINNET_READ_ONLY_FRONTEND_QA_V1.md
supabase/docs/SUPABASE_SCHEMA.md
```

A new canonical document was added:

```text
docs/mainnet/MAINNET_REWARD_ROUND_OPERATIONS_V1.md
```

That document became the canonical record for:

```text
mainnet reward data-plane status
first mainnet reward round preparation
Reward Round SOP / Decision Log
```

The docs sync explicitly stated that:

```text
created_tx_hash / funded_tx_hash may remain null temporarily.
This is not a bug.
Do not manually update Supabase only to fill tx hashes.
Do not submit Tapal Batas solely for tx hash reconciliation.
Event-only catch-up is optional, not the default SOP.
```

---

## 13. URUTANSEHAT Discussion

After the docs sync, `URUTANSEHAT.md` was reviewed.

The document correctly recorded the project sequence from early concept to mainnet reward round operations.

However, one issue appeared:

```text
Some historical pending notes still looked like current pending work.
```

Examples included old gate language such as:

```text
Public launch not ready.
Mainnet env wiring not approved.
Mainnet reward/indexer/proof flow requires post-deployment implementation/configuration and validation.
```

These were accurate in their historical gate context, but no longer fully accurate as current status because later sections documented:

```text
production env is mainnet
public mint/staking surface is live
mint phases are open
mainnet reward data-plane foundation is done
first reward rounds are calculated, created, approved, and funded on-chain
```

The discussion concluded that `URUTANSEHAT.md` should distinguish:

```text
1. truly remaining current work
2. historical / superseded gate notes
3. non-blocking missing evidence notes
4. optional future improvements
```

This was not meant to create more work.

It was meant to prevent old pending notes from making the project look endlessly unfinished.

---

## 14. Historical Remaining Items at That Point

The true remaining items were narrowed to:

```text
1. Final visual QA pass.
2. Controlled user reward claim verification on mainnet.
3. Public reward claim launch approval / enablement.
4. Post-claim verification.
5. RewardDistributor event reconciliation later through a future worker/indexer pass.
6. Final metadata update/reveal/lock approval.
7. Metadata lock approval.
```

Non-blocking missing evidence note:

```text
Missing Base approve/fund tx hashes and Ethereum create/approve/fund tx hashes may remain unrecorded unless reviewed evidence is available.
```

This tx hash evidence note should not be treated as a main blocker.

The current locked rule remained:

```text
Supabase tx hashes may remain null until event indexing crosses those blocks.
Do not submit Tapal Batas solely for tx hash reconciliation.
Do not manually update Supabase only to fill tx hashes.
```

---

## 15. Later Work After This Discussion

After the reward round documentation discussion, additional work was performed with Codex outside the exact prompt discussed in this conversation.

Known high-level categories:

```text
UI/UX polishing
small feature additions
URUTANSEHAT cleanup / adjustment
```

Details are not recorded in this conversation yet.

To complete this section, add the actual Codex output, commit hashes, changed files, or summary of those later changes.

Suggested structure:

```text
Later Codex Work:
- Date:
- Branch:
- Commit:
- Files changed:
- UI/UX polish performed:
- Small features added:
- Any docs updated:
- Any tests/checks run:
- Any remaining issue:
```

---

## 16. Important Lessons

This work produced several operational lessons.

### 16.1 Do not confuse live on-chain state with Supabase reconciliation state

Supabase is not always the live operational source of truth for reward round create/fund/claim state.

The chain is the live source of truth for active reward operations.

Supabase is the calculation, proof, reconciliation, and historical record layer.

### 16.2 Do not chase cosmetic database completeness with risky operations

Running an event-only catch-up or submitting a new Tapal Batas only to fill tx hashes can create unnecessary operational noise.

Manual DB edits to tx hash fields should be avoided.

### 16.3 Documentation must distinguish current state from historical gate state

A historical “not approved” may be correct at the time it was written, but misleading later if the later stage has already completed.

Historical docs should remain useful, but current overview docs must prevent old blockers from appearing current.

### 16.4 URUTANSEHAT should not create endless work

`URUTANSEHAT.md` should be a clarity map.

It should not become a source of anxiety or false unfinishedness.

Its remaining list should include only what is truly remaining.

### 16.5 Optional future improvements are not blockers

Optional improvements should remain optional.

They should not be promoted into mandatory launch blockers unless a new explicit decision says so.

---

## 17. Current Mental Model

The project state after this conversation can be summarized as:

```text
Contracts:
done

Mainnet production env:
live

Public mint/staking surface:
live

Mainnet Supabase reward data-plane:
done

First reward calculation:
done

First reward rounds:
created, approved, funded on-chain

Reward claim:
not publicly launched yet

Controlled claim verification:
still requires explicit documentation unless already completed later

Supabase event reconciliation:
can happen later through worker/indexer

Metadata lock:
not approved

Final visual QA:
may be completed later if recorded by subsequent work
```

---

## 18. What This Document Should Prevent

This document should prevent future confusion such as:

```text
“Why are created_tx_hash and funded_tx_hash null?”
“Should we manually update Supabase?”
“Should we submit Tapal Batas just to catch up tx hashes?”
“Is reward claim blocked because Supabase status is stale?”
“Is public mint/staking still not launched?”
“Why does an old gate doc say env wiring was not approved?”
“Are optional catch-up workflows blockers?”
“Why does URUTANSEHAT still show unfinished items?”
```

The answer should be found here:

```text
The system intentionally separates live on-chain operations from Supabase reconciliation.
Old approval gates may be historical.
Current remaining work must be explicitly separated from historical pending notes.
```

---

## 19. Canonical Documents Related to This Context

Primary related docs:

```text
URUTANSEHAT.md
README.md
docs/mainnet/MAINNET_REWARD_ROUND_OPERATIONS_V1.md
docs/mainnet/MAINNET_SUPABASE_SETUP_RUNBOOK_V1.md
docs/MAINNET_READINESS_REVIEW.md
docs/mainnet/MAINNET_DEPLOYMENT_APPROVAL_GATE_V1.md
docs/mainnet/MAINNET_CONTRACT_DEPLOYMENT_COMPLETION_V1.md
docs/mainnet/MAINNET_ENV_WIRING_APPROVAL_DECISION_V1.md
docs/qa/MAINNET_PUBLIC_SURFACE_AND_MINT_OPENING_QA_V1.md
supabase/docs/SUPABASE_SCHEMA.md
```

`MAINNET_REWARD_ROUND_OPERATIONS_V1.md` should remain the canonical technical record for the reward round SOP.

`URUTANSEHAT.md` should remain the high-level project sequence and current remaining map.

This document preserves the conversation context behind those docs.

---

## 20. Final Note

This conversation was not only about executing a reward round.

It was about protecting the project from:

```text
manual shortcuts
unclear source of truth
documentation drift
fake blockers
old pending notes
unnecessary worker runs
unnecessary Codex work
endless discussion loops
```

The final direction is:

```text
Keep the system honest.
Keep the documentation clean.
Treat on-chain state as live operational truth.
Treat Supabase as calculation/proof/reconciliation/history.
Keep remaining work limited to what is truly remaining.
Do not invent blockers.
Do not erase context.
```
