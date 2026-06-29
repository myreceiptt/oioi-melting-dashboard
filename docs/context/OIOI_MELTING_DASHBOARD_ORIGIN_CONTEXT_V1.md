# OiOi Melting Dashboard — Origin Conversation Context v1

Date: 2026-06-29
Project: OiOi Melting Dashboard
Context Type: Reconstructed Conversation Context
Owner / Operator: Prof. NOTA v11.47

---

## 1. Purpose

This document preserves the origin context of the OiOi Melting Dashboard project.

It is not a literal transcript of the full conversation.

It is a reconstructed context document based on the available conversation memory, decisions, implementation milestones, and later documentation work.

Its purpose is to help future readers understand:

- how the project started,
- what misunderstanding or idea triggered it,
- how the idea evolved,
- what decisions were made,
- why the architecture became multi-chain,
- why soft staking and reward distribution were designed this way,
- why Supabase and workers were introduced,
- how the project moved from concept to testnet, then to mainnet,
- and why some operational rules were locked.

This document is meant to preserve reasoning, not only final status.

---

## 2. The Starting Point

The conversation started from a question around the old Polygon ROTY collection.

The initial idea could be summarized as:

```text
Can the old Polygon ROTY contract be moved to Base?
```

The first important correction was:

```text
A smart contract cannot be moved from Polygon to Base.
```

A deployed smart contract exists on its original chain. It cannot simply be transported to another blockchain.

The correct framing became:

```text
Do not move the old Polygon contract.
Deploy a new Base-native mirror / relaunch contract that preserves identity, token IDs, metadata patterns, and provenance.
```

This correction became the conceptual seed of the project.

The project was not a contract migration in the literal sense.

It became a **provenance-aware relaunch**.

---

## 3. The Correct Framing: Mirror, Relaunch, Provenance

The project direction moved from “move contract” to:

```text
Create a new contract on a new chain while preserving the meaning of the old collection.
```

The new chain deployment should preserve:

- the collection identity,
- token ID continuity where appropriate,
- metadata URI pattern or historical reference,
- the meaning of the original collection,
- and a clear provenance link to the original Polygon ROTY.

The old Polygon collection became the origin/provenance layer.

The new Base deployment became a relaunch layer.

This created the first important project principle:

```text
The new contract is not pretending to be the old contract.
It is a new on-chain expression of the same lineage.
```

---

## 4. From ROTY Relaunch to Multi-Chain Ecosystem

The project did not remain a simple Base mirror.

It expanded into a multi-chain NFT ecosystem.

The relaunch direction grew into two chain-specific sets:

```text
Base Set
Ethereum Set
```

The Base Set became the lower-cost, practical, active participation side.

The Ethereum Set became the dETH / more canonical / more symbolic counterpart.

This produced the idea of having corresponding collections across both chains.

The ecosystem became:

```text
Base:
- ROTY BASE
- Melting BASE
- Amanda BASE

Ethereum:
- ROTY dETH
- Melting dETH
- Amanda dETH
```

Each chain would have its own:

```text
NFT contracts
Soft staking contract
Reward distributor contract
$OiOi token
Frontend interaction surface
Admin operation surface
Reward calculation path
```

This is where the OiOi Melting Dashboard stopped being a single-contract relaunch and became a full multi-chain operational system.

---

## 5. The Collections

The collection design stabilized into three narrative/product groups.

### ROTY

ROTY is the original lineage anchor.

It preserves the memory of the Polygon-origin collection and becomes the main relaunch collection on Base and Ethereum.

### Melting

Melting extends the universe and becomes part of the same staking/reward ecosystem.

It carries the “melting” language and is connected to the broader ENDHONESA / Melting Land direction.

### Amanda

Amanda becomes the third collection in the ecosystem.

Together, ROTY, Melting, and Amanda form the three collection types used in staking and reward calculations.

The project therefore moved from:

```text
one old Polygon collection
```

to:

```text
six new mainnet collections across Base and Ethereum
```

while still preserving the idea that Polygon ROTY is the origin/provenance source.

---

## 6. The Contract Naming Direction

The shared contract/codebase concept was locked around:

```text
TheRotyMemorial
```

The name reflects that this is not only a minting system.

It is also a memorial/provenance system.

The contracts are not just for distributing NFTs.

They carry memory, history, and continuity.

This matters because the project was never only about technical redeployment.

It was about preserving meaning while creating new utility.

---

## 7. The Soft Staking Decision

A major architectural decision was to use **non-custodial soft staking**.

The NFT should remain inside the user’s wallet.

The staking contract records participation, but it does not custody the NFT.

The core principle:

```text
User keeps the NFT.
Contract records staking intent.
Ownership is validated through ownerOf(tokenId).
```

This decision avoided the user experience and risk of locking NFTs inside a contract.

The staking system therefore needed to be transfer-aware.

If a user stakes an NFT and later transfers it away, the system must not keep rewarding the old owner forever.

This created a requirement:

```text
Reward validity must depend on both staking records and actual ownership.
```

Soft staking became the bridge between:

- user participation,
- NFT ownership,
- reward eligibility,
- and time-based contribution.

---

## 8. Reward Philosophy

The reward system was not designed as a simple “everyone gets the same amount” mechanism.

It was designed around valid staking duration.

The basic logic:

```text
If a wallet owns and validly stakes an NFT during a reward period,
that wallet earns reward weight for that valid duration.
```

This created a need to calculate:

- ownership events,
- staking events,
- valid intervals,
- duration,
- collection weights,
- reward allocations,
- Merkle roots,
- Merkle proofs,
- claim status.

The project therefore required more than a smart contract.

It needed an off-chain data plane.

---

## 9. $OiOi Reward Layer

The reward token became:

```text
$OiOi
```

The system uses separate $OiOi token contracts per chain:

```text
Base $OiOi
Ethereum $OiOi
```

Each chain has its own reward distributor.

The reason is simple:

```text
Base reward operations should remain on Base.
Ethereum reward operations should remain on Ethereum.
```

This avoids pretending that one chain can automatically act as another chain.

The system remains multi-chain, but each chain has its own native operational layer.

---

## 10. Frontend Identity Decision

The frontend identity model was locked as wallet-first and EOA-first.

The user identity is:

```text
the connected Web3 wallet address
```

The project explicitly avoids:

```text
embedded wallet
smart account / account abstraction
email login
phone login
passkey login
social login
identity linking
```

This was an important simplification.

The project is not trying to solve every identity problem.

It focuses on:

```text
wallet connects
wallet owns NFT
wallet stakes NFT
wallet claims reward
```

That simplicity is part of the system’s operational safety.

---

## 11. Dashboard Direction

The frontend became the OiOi Melting Dashboard.

It needed to support:

- minting,
- whitelist mint,
- public mint,
- gated mint,
- wallet connection,
- chain switching,
- NFT ownership discovery,
- staking,
- unstaking,
- reward claim,
- admin operations,
- reward round operations,
- and multi-domain routing.

The dashboard was not only a user interface.

It became the operational console for the ecosystem.

---

## 12. Admin Dashboard Direction

The Admin Dashboard became necessary because the ecosystem has many owner-controlled operations.

Admin operations include:

- mint phase controls,
- metadata controls,
- pricing controls,
- treasury controls,
- royalty controls,
- staking registry controls,
- reward round controls,
- reward approval/funding controls,
- pause/unpause controls,
- and emergency/rescue controls.

The Admin Dashboard became the operational surface for the owner/operator.

This reduced the need to run raw scripts for every small mainnet operation.

---

## 13. Why Supabase Was Introduced

The reward system could not rely only on frontend reads.

Reward calculation requires historical data:

- transfers,
- staking events,
- unstaking events,
- reward round events,
- ownership state,
- staking state,
- valid intervals,
- duration calculations,
- allocation records,
- proof records.

This led to the Supabase decision.

Supabase became the Postgres-first data layer for:

```text
event storage
ownership reconstruction
staking position reconstruction
valid stake interval calculation
reward calculation
Merkle allocation storage
proof API support
reward round history
```

Local JSON was demoted from primary storage.

The project needed a persistent, queryable, auditable data plane.

---

## 14. Indexer Architecture

The indexer became responsible for syncing and rebuilding reward-relevant state.

Indexer responsibilities include:

```text
sync NFT transfer events
sync staking events
sync RewardDistributor events
rebuild current NFT owners
rebuild current stake positions
calculate valid stake intervals
calculate reward allocations
generate Merkle roots and proofs
update reward round data
```

The indexer is checkpointed and resumable.

This matters because mainnet indexing can be slow and should not require one giant fragile run.

The system prefers slow, resumable, verifiable work over fast but risky work.

---

## 15. Tapal Batas Model

The reward distribution model became based on a submitted boundary block.

This was referred to as:

```text
Tapal Batas
```

The operator chooses a target block for each chain.

The worker processes events up to that boundary and calculates rewards for the selected range.

The model is:

```text
First reward range:
deployment/from block -> first submitted Tapal Batas block

Next reward range:
previous Tapal Batas + 1 -> next submitted Tapal Batas block
```

Reward distribution is not scheduled.

It happens when the operator decides OiOi is available and worth distributing.

This decision preserves flexibility.

It avoids forcing artificial reward cycles.

---

## 16. Worker and GitHub Actions

Because reward boundary jobs can be slow, the worker model was introduced.

The worker became:

```text
resumable
checkpointed
safe to run repeatedly
suitable for GitHub Actions
```

GitHub Actions became the operational place to run the boundary worker.

This means reward calculation does not depend only on a local laptop session.

The worker can process tasks in batches and continue until the job succeeds.

---

## 17. Testnet Rehearsal

Before mainnet, the system went through testnet rehearsal.

The testnet work included:

- Base Sepolia deployment,
- Ethereum Sepolia deployment,
- contract verification,
- read checks,
- functional tests,
- minting,
- staking,
- reward round create/fund/claim,
- frontend QA,
- admin QA,
- GitHub Actions worker flow,
- Supabase event sync,
- reward calculation,
- Merkle proof generation,
- and user claim testing.

Testnet was used not just as a deployment rehearsal, but as a full product rehearsal.

This created the confidence to move toward mainnet.

---

## 18. Mainnet Deployment Philosophy

Mainnet deployment was treated as a separate approval gate.

The project intentionally separated:

```text
contract deployment
public launch
mint opening
reward claim launch
metadata lock
```

This avoided the dangerous assumption:

```text
Deployed means launched.
```

The locked principle became:

```text
Mainnet deployment is not public launch.
```

A contract can be deployed and verified while mint phases remain off.

A public surface can go live before reward claim is launched.

Reward claim can remain disabled until controlled verification is done.

Metadata can remain unlocked until final metadata is ready.

This staged approach protected the project from rushing.

---

## 19. Mainnet Public Surface

After deployment, the production environment moved to mainnet.

The public mint/staking surface went live.

Base Mainnet and Ethereum Mainnet mint phases were opened.

Production domains served mainnet.

This meant the public mint/staking surface was no longer just theoretical.

However, reward claim remained deferred.

The project separated:

```text
public mint/staking launch
```

from:

```text
public reward claim launch
```

This distinction became important later when documentation still contained older “public launch not ready” language.

---

## 20. Mainnet Reward Data Plane

The mainnet reward data-plane was then prepared.

Supabase mainnet schema and seed setup were completed.

Mainnet worker readiness passed.

The first mainnet boundary reward job succeeded.

The first calculated reward rounds were generated for Base and Ethereum.

The first reward rounds were then created, approved, and funded on-chain.

At this point, the mainnet reward system had reached:

```text
calculated
created on-chain
approved
funded on-chain
```

but public claim was still not launched.

---

## 21. Critical Reward Round SOP Decision

A major operational discussion happened around reward round transaction hashes and Supabase state.

The confusing state was:

```text
On-chain transaction succeeded,
but Supabase created_tx_hash / funded_tx_hash may still be null.
```

The final locked SOP:

```text
Admin UI reads live on-chain state for create/fund/pause/claim.
Supabase stores calculation, allocation, Merkle root, proof data, and historical reconciliation.
created_tx_hash and funded_tx_hash are reconciled from RewardDistributor events.
Supabase may temporarily remain stale until event indexing crosses those tx blocks.
This is not a bug under the current SOP.
```

Important operator rules:

```text
Do not manually update Supabase only to fill tx hashes.
Do not submit a new Tapal Batas solely for tx hash reconciliation.
Do not treat stale Supabase tx hash fields as a blocker if live on-chain state confirms the round is created/funded.
Event-only catch-up exists as an optional technical tool, but it is not the default SOP.
```

This decision protected the system from unnecessary manual fixes.

---

## 22. Documentation Alignment

As the project evolved, documentation became heavy.

There were many docs, including:

- README,
- URUTANSEHAT,
- deployment runbooks,
- readiness reviews,
- QA reports,
- mainnet approval docs,
- Supabase schema docs,
- indexer docs,
- reward operation docs,
- and product completion plans.

A concern appeared:

```text
Old pending notes can make finished work look unfinished.
```

The main example was historical approval-gate wording such as:

```text
Mainnet env wiring not approved.
Public launch not ready.
Reward/indexer/proof flow requires implementation/configuration and validation.
```

Those statements may have been true when written, but later became historical or superseded.

The documentation lesson:

```text
Docs must distinguish current status from historical gate status.
```

`URUTANSEHAT.md` should be a clarity map, not a source of endless false pending work.

---

## 23. URUTANSEHAT Role

`URUTANSEHAT.md` became the high-level map of the project.

It should answer:

```text
What was done?
What is truly not done?
What is historical?
What is optional?
What should not become a fake blocker?
```

It should not turn every old note into a current task.

It should not invent new work.

It should not make the project feel endless.

The remaining list should only include what is truly remaining.

---

## 24. True Remaining Items After Mainnet Reward Data Plane

After the mainnet reward data-plane and first reward round preparation, the true remaining items were narrowed to:

```text
1. Final visual QA pass.
2. Controlled user reward claim verification on mainnet.
3. Public reward claim launch approval / enablement.
4. Post-claim verification.
5. RewardDistributor event reconciliation later through a future worker/indexer pass.
6. Final metadata update/reveal/lock approval.
7. Metadata lock approval.
```

Non-blocking evidence TODO:

```text
Missing Base approve/fund tx hashes and Ethereum create/approve/fund tx hashes may remain TODO unless reviewed evidence is available.
```

This should not be treated as a main blocker.

---

## 25. Later UI/UX and Small Feature Work

After the mainnet reward round documentation discussion, additional work was performed with Codex outside the exact prompt previously discussed.

Known high-level categories:

```text
UI/UX polishing
small feature additions
URUTANSEHAT cleanup / adjustment
```

This document does not yet record the exact details of that later work.

To complete this section, add:

```text
Date:
Branch:
Commit:
Files changed:
UI/UX polish performed:
Small features added:
Checks run:
Remaining issues:
```

---

## 26. Core Principles That Emerged

Several principles emerged across the conversation.

### 26.1 Do not fake migration

A contract cannot be moved across chains.

The correct approach is a new deployment with provenance.

### 26.2 Preserve meaning, not only code

The relaunch preserves memory, lineage, and identity.

It is not merely a copy-paste deployment.

### 26.3 Keep NFTs in user wallets

Soft staking should not require NFT custody.

Ownership remains with the wallet.

### 26.4 Separate live state from reconciliation state

The chain is the live source of truth for active reward operations.

Supabase is the calculation, proof, reconciliation, and history layer.

### 26.5 Do not chase tx hashes with unsafe actions

Manual DB edits and unnecessary boundary jobs should be avoided.

### 26.6 Stage mainnet carefully

Deployment, public mint, reward claim, and metadata lock are separate decisions.

### 26.7 Documentation must not create false unfinishedness

Old pending notes must be contextualized.

Optional future improvements must not become blockers.

---

## 27. What This Context Should Prevent

This document should prevent future confusion such as:

```text
“Why did we not move the Polygon contract directly?”
“Why are there Base and Ethereum versions?”
“Why is staking non-custodial?”
“Why do we need Supabase?”
“Why do we use Tapal Batas?”
“Why can Supabase tx hashes be null after on-chain success?”
“Why should we not manually update Supabase?”
“Why should we not submit Tapal Batas just to reconcile tx hashes?”
“Why does an old doc say env wiring was not approved?”
“Why is public mint live but reward claim still deferred?”
“Why is URUTANSEHAT being cleaned?”
```

The short answer:

```text
Because the project evolved carefully from provenance relaunch to multi-chain reward system, and each layer has a separate operational responsibility.
```

---

## 28. Suggested Canonical Docs

The following docs should be considered related to this context:

```text
README.md
URUTANSEHAT.md
docs/mainnet/MAINNET_REWARD_ROUND_OPERATIONS_V1.md
docs/mainnet/MAINNET_SUPABASE_SETUP_RUNBOOK_V1.md
docs/MAINNET_READINESS_REVIEW.md
docs/mainnet/MAINNET_DEPLOYMENT_APPROVAL_GATE_V1.md
docs/mainnet/MAINNET_CONTRACT_DEPLOYMENT_COMPLETION_V1.md
docs/mainnet/MAINNET_ENV_WIRING_APPROVAL_DECISION_V1.md
docs/qa/MAINNET_PUBLIC_SURFACE_AND_MINT_OPENING_QA_V1.md
supabase/docs/SUPABASE_SCHEMA.md
```

`MAINNET_REWARD_ROUND_OPERATIONS_V1.md` should remain the canonical technical record for mainnet reward round SOP.

`URUTANSEHAT.md` should remain the high-level sequence and current remaining map.

This document preserves the reconstructed origin and decision context behind those docs.

---

## 29. Final Note

This project started from a deceptively simple question:

```text
Can the old Polygon ROTY contract be moved to Base?
```

The answer became a much larger system:

```text
No, the old contract cannot be moved.
But its lineage can be preserved.
Its meaning can be relaunched.
Its ecosystem can be expanded.
Its participation can be measured.
Its rewards can be calculated.
Its operations can be staged.
Its documentation can preserve the reasoning.
```

The OiOi Melting Dashboard is therefore not only a dashboard.

It is the operational layer for a multi-chain NFT memory, staking, and reward ecosystem.

The final direction remains:

```text
Preserve provenance.
Respect chain reality.
Keep user custody.
Make reward calculation auditable.
Keep operations staged.
Do not fake completion.
Do not invent blockers.
Do not erase context.
```
