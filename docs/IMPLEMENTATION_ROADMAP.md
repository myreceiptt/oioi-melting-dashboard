# OiOi Melting Dashboard — Implementation Roadmap v1

This roadmap defines the current execution path after successful Base Sepolia and Ethereum Sepolia validation and after the Sepolia frontend MVP.

---

## Phase 1 — Contract Suite

Status: Completed.

Completed:

- MemorialNFTCore
- TheRotyMemorial
- MeltingMemorial
- AmandaMemorial
- OiOiSoftStaking
- OiOiRewardDistributor
- MockERC20 for tests
- Unit tests
- Integration lifecycle tests

---

## Phase 2 — Deployment Tooling

Status: Completed.

Completed:

- deployment config
- deployment state helper
- ROTY deploy script
- staking deploy script
- ROTY registration script
- Melting deploy script
- Melting registration script
- Amanda deploy script
- Amanda registration script
- RewardDistributor deploy script
- local full smoke deploy script
- preflight script
- read-check script
- restore mint phases script
- constructor args export script

Decision:

```text
Do not rewrite deployment scripts only to record block numbers.
For indexer v1, start blocks are manually read from block explorers and stored in .env.
```

---

## Phase 3 — Testnet Validation

Status: Completed.

Completed on Base Sepolia:

- deployment
- verification
- read checks
- functional test
- mint phases restored to OFF

Completed on Ethereum Sepolia:

- deployment
- verification
- read checks
- functional test
- mint phases restored to OFF

---

## Phase 4 — Documentation Alignment

Status: Completed / continuing.

Completed:

- deployment runbook
- testing checklist
- mainnet readiness review
- frontend architecture
- indexer architecture
- README alignment
- SPEC_LOCK alignment
- implementation roadmap alignment
- frontend Sepolia browser QA
- indexer implementation plan

Current documentation correction:

- Indexer Operational Model v1 is added to prevent premature raw sync execution.
- Transfer sync is marked paused/experimental until operational model is accepted.

---

## Phase 5 — Frontend Skeleton v1

Status: Completed.

Stack:

```text
Next.js
TypeScript
Tailwind
wagmi
viem
TanStack Query
custom wallet modal
```

Completed:

- dependencies installed
- Next app shell
- Tailwind baseline
- wagmi config
- wallet connectors
- custom wallet modal
- ChainGuard
- env validation
- contract address config
- explorer helpers
- homepage

Output:

- frontend app builds
- wallet connect works
- chain guard works
- config loads Sepolia addresses

---

## Phase 6 — Frontend Contract Config and Reads

Status: Completed.

Completed:

- contract address config
- explicit `NEXT_PUBLIC_*` env reads
- collection config
- ABI definitions
- explorer helpers
- mint page live contract reads
- dashboard read-only staking summary
- reward distributor read placeholder

---

## Phase 7 — Mint Pages MVP

Status: Completed for Sepolia.

Routes:

```text
/mint/roty/base
/mint/roty/ethereum
/mint/melting/base
/mint/melting/ethereum
/mint/amanda/base
/mint/amanda/ethereum
```

Completed:

- ROTY public mint UI
- ROTY whitelist proof lookup API
- ROTY whitelist mint UI
- Melting gated mint UI
- Amanda gated mint UI
- supply/price/phase reads
- eligibility reads
- transaction state
- explorer links
- disabled states while mint phases are OFF
- Base Sepolia browser QA
- Ethereum Sepolia browser QA

---

## Phase 8 — Dashboard MVP

Status: Completed for Sepolia MVP.

Routes:

```text
/dashboard
/dashboard/base
/dashboard/ethereum
```

Completed:

- chain selector
- wallet connect
- ChainGuard
- supported collection summary
- stake status reads
- manual tokenId stake action
- manual tokenId unstake action
- valid stake status reads
- reward claim placeholder
- Base Sepolia browser QA
- Ethereum Sepolia browser QA

Not yet completed:

- automatic owned NFT discovery
- reward proof API
- active reward claim button
- reward rounds UI with real claim data

Those require accepted indexer/reward proof workflow.

---

## Phase 9 — Frontend Sepolia Browser QA

Status: Completed.

Validated:

- homepage routes
- all six mint pages
- dashboard routes
- wallet connect
- ChainGuard
- ROTY mint disabled states while phases OFF
- gated mint disabled states while phases OFF
- whitelist eligibility reads
- staking eligibility reads
- dashboard stake/unstake
- reward placeholder
- browser console review

---

## Phase 10 — Indexer Skeleton v1

Status: Completed.

Completed:

- indexer config
- indexer types
- local JSON storage helper
- indexer status command
- indexer rebuild skeleton
- output folder gitkeep
- generated output ignored

Accepted status:

```text
Indexer skeleton is valid.
Indexer Transfer Sync is paused/experimental.
```

---

## Phase 11 — Indexer Operational Model v1

Status: Current / Next.

Goal:

Document and accept the operational model before continuing indexer implementation.

Key decisions:

```text
Indexer does not run in browser.
Indexer runs as backend/admin worker.
Do not rewrite deployment scripts for block numbers.
FROM_BLOCK is manually read from block explorer for v1.
TO_BLOCK is optional and only for bounded backfill/testing.
Checkpoint controls resume after first successful sync.
Transfer sync draft remains paused/experimental.
Production storage can later upgrade to Postgres/Supabase via storage adapter.
```

Done criteria:

- `docs/INDEXER_OPERATIONAL_MODEL.md` committed.
- `docs/INDEXER_IMPLEMENTATION_PLAN.md` updated.
- `docs/INDEXER_ARCHITECTURE.md` updated.
- Team agrees whether to continue raw `getLogs` sync, delay it, or move to managed/database-first indexing.

---

## Phase 12 — Indexer MVP

Status: Pending.

Do not continue until Phase 11 is accepted.

Potential implementation order after acceptance:

1. Confirm `.env` start blocks.
2. Keep Transfer Sync as paused draft or clean it.
3. Implement storage adapter boundary.
4. Implement transfer sync safely with checkpoints, delays, and bounded backfill.
5. Implement staking event sync.
6. Implement reward event sync.
7. Build current ownership snapshot.
8. Build current stake snapshot.
9. Build valid duration calculator.
10. Build weighted duration calculator.
11. Generate reward allocation input JSON.
12. Generate Merkle proof data.
13. Serve static/API reward proof data.
14. Test on Base Sepolia.
15. Test on Ethereum Sepolia.

---

## Phase 13 — Mainnet Deployment

Status: Pending.

Prerequisites:

- frontend Sepolia MVP completed
- frontend browser QA completed
- indexer operational model documented
- mainnet readiness review updated
- Base Mainnet preflight passes
- Ethereum Mainnet preflight passes
- deployer wallet funded
- Merkle root final
- mint phases understood to remain OFF

Base Mainnet:

```bash
npm run deploy:preflight -- baseMainnet
npm run deploy:roty -- --network baseMainnet
npm run deploy:staking -- --network baseMainnet
npm run deploy:register-roty -- --network baseMainnet
npm run deploy:melting -- --network baseMainnet
npm run deploy:register-melting -- --network baseMainnet
npm run deploy:amanda -- --network baseMainnet
npm run deploy:register-amanda -- --network baseMainnet
npm run deploy:reward-distributor -- --network baseMainnet
npm run verify:args -- baseMainnet
npm run deploy:read-check -- --network baseMainnet
```

Ethereum Mainnet:

```bash
npm run deploy:preflight -- ethereumMainnet
npm run deploy:roty -- --network ethereumMainnet
npm run deploy:staking -- --network ethereumMainnet
npm run deploy:register-roty -- --network ethereumMainnet
npm run deploy:melting -- --network ethereumMainnet
npm run deploy:register-melting -- --network ethereumMainnet
npm run deploy:amanda -- --network ethereumMainnet
npm run deploy:register-amanda -- --network ethereumMainnet
npm run deploy:reward-distributor -- --network ethereumMainnet
npm run verify:args -- ethereumMainnet
npm run deploy:read-check -- --network ethereumMainnet
```

After each mainnet deployment:

- verify contracts
- run read checks
- commit deployment record
- manually read earliest contract creation block from explorer
- store chain-level `*_INDEXER_FROM_BLOCK` in `.env`
- keep mint phases OFF

---

## Phase 14 — Mainnet Frontend Switch

Status: Pending.

Tasks:

1. Fill mainnet frontend env variables.
2. Confirm frontend reads mainnet contracts.
3. Confirm wallet switch works.
4. Confirm mint buttons remain disabled while phases are OFF.
5. Confirm dashboard reads staking contracts.
6. Confirm explorer links point to mainnet explorers.
7. Confirm domains point to correct routes.
8. Run mainnet browser QA before mint opening.

---

## Phase 15 — Final Mint Opening

Status: Pending.

Opening order:

1. Enable ROTY whitelist mint.
2. Enable ROTY public mint.
3. Enable staking dashboard.
4. Enable Melting gated mint.
5. Enable Amanda gated mint.
6. Enable reward claim only after indexer/reward proof flow is ready.

Do not open all phases until frontend and monitoring are ready.

---

## Phase 16 — Reward Operations

Status: Pending.

Tasks per reward round:

1. Sync indexer or prepare approved static data.
2. Confirm sync checkpoint / data freshness.
3. Calculate weighted duration.
4. Generate allocation JSON.
5. Generate Merkle root/proofs.
6. Review allocation summary.
7. Create reward round.
8. Fund reward round.
9. Publish reward proof data.
10. Monitor claims.

Reward claim remains placeholder until proof data is ready.

---

## Current Next Step

```text
Commit Documentation + Repo State Correction v1.
Then review Indexer Operational Model v1 before continuing indexer implementation.
```

---

P.S. Read this document freely for information and guidance. Do not redistribute or restate—no quotes, summaries, paraphrases, or derivatives—without prior written permission from [**Prof. NOTA**](https://nota.endhonesa.com/). Sharing the link is allowed. So, share the link, not the text. Do not discuss or re-tell the contents in any form—written, spoken, or recorded—without prior written permission.

---
