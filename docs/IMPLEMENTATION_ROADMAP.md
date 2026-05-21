# OiOi Melting Dashboard — Implementation Roadmap v2

This roadmap defines the current execution path after successful Base Sepolia and Ethereum Sepolia contract validation and after the Sepolia frontend MVP.

The project now follows a testnet-first product completion discipline:

```text
Testnet full product completion
→ Testnet full browser E2E
→ Testnet Release Candidate
→ Mainnet deployment
→ Mainnet env wiring
→ Mainnet read-only QA
→ Controlled mainnet opening
```

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
verify:args is post-deployment because it needs deployment records.
```

---

## Phase 3 — Testnet Contract Validation

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

## Phase 4 — Frontend Sepolia MVP

Status: Completed.

Completed:

- Next.js frontend skeleton
- Tailwind baseline
- wallet-first wagmi/viem setup
- custom wallet modal
- ChainGuard
- contract env config
- contract reads
- homepage links
- six mint pages
- ROTY public mint UI
- ROTY whitelist proof lookup API
- ROTY whitelist mint UI
- Melting gated mint UI
- Amanda gated mint UI
- dashboard stake/unstake UI
- reward claim placeholder
- active reward claim UI backed by Supabase proof API
- Frontend Sepolia Browser QA for read/OFF-phase/stake flows

---

## Phase 5 — Documentation + Repo State Alignment

Status: Completed / continuing.

Completed:

- deployment runbook
- testing checklist
- mainnet readiness review
- frontend architecture
- frontend Sepolia browser QA
- indexer architecture
- indexer operational model
- indexer implementation plan
- spec lock alignment
- roadmap alignment
- documentation correction for paused indexer transfer sync

Current correction:

```text
Indexer + reward pipeline is now Supabase Postgres-first.
Local JSON is no longer the primary indexer storage.
Mainnet deployment is deferred until Testnet Release Candidate.
```

---

## Phase 6 — Testnet Product Completion Plan

Status: Current.

Primary checklist:

```text
docs/TESTNET_PRODUCT_COMPLETION_PLAN.md
```

Completed:

- Lock Testnet Contract Deployment.

In progress:

- Complete Testnet Frontend Application.

Next:

- Admin Dashboard Architecture v1.

---

## Phase 7 — Admin Dashboard

Status: Pending / Next.

Goal:

Build owner/admin surfaces so contract operations do not depend on CLI or block explorer workflows during testnet rehearsal.

Suggested routes:

```text
/admin
/admin/base
/admin/ethereum
```

Required first step:

```text
Contract Admin Surface Audit
```

Audit actual contract read/write surfaces from:

```text
TheRotyMemorial
MeltingMemorial
AmandaMemorial
MemorialNFTCore
OiOiSoftStaking
OiOiRewardDistributor
ERC20 $OiOi reads
```

Admin dashboard must include:

- owner guard
- read contract state
- mint phase controls
- staking collection approval controls
- reveal/metadata controls
- reward round creation
- reward round funding
- claim pause/unpause
- reward/distributor state reads
- warning/info tooltips for risky actions
- confirmation modals for write actions
- stronger confirmation for irreversible/destructive actions

Testing required:

- owner wallet can access admin actions
- non-owner wallet is blocked from writes
- all reads are correct
- phase toggles work on testnet
- warning/confirmation UI works

---

## Phase 8 — Supabase Postgres Indexer + Reward Pipeline

Status: Pending.

Locked decision:

```text
Supabase Postgres is the primary storage for indexer + reward pipeline.
```

Tasks:

1. Define Supabase schema and migrations.
2. Store chains, contracts, checkpoints, indexed events, NFT transfers, staking events, current owners, current stakes, reward rounds, and reward allocations.
3. Implement checkpoint-based indexer using manual FROM_BLOCK.
4. Respect optional TO_BLOCK only for bounded backfill/testing.
5. Sync ERC721 Transfer events.
6. Sync OiOi Soft Staking Staked/Unstaked events.
7. Sync OiOi Reward Distributor events.
8. Build current ownership state.
9. Build current stake state.
10. Compute valid staking duration.
11. Apply collection weights.
12. Generate reward allocation.
13. Generate Merkle root/proofs.
14. Serve reward proof API.
15. Integrate active reward claim UI.

Testing required:

- schema migration passes
- indexer sync works on bounded Sepolia window
- checkpoint resumes correctly
- duplicate events are not inserted
- ownership state matches contract reads
- stake state matches contract reads
- reward allocation sums correctly
- generated proof matches on-chain claim expectation

---

## Phase 9 — Stage-by-Stage Browser Testing

Status: Continuous.

Already completed:

- OFF-phase/read/stake browser QA.

Pending:

- Admin Dashboard browser testing.
- Mint browser testing with phases ON.
- Gated mint browser testing.
- Reward claim browser testing.

Each stage must have its own completed QA before Full Browser E2E.

---

## Phase 10 — Full Testnet Browser E2E

Status: Pending.

Goal:

Test the whole product like a release, still on testnet.

Required flow:

1. User connects wallet.
2. User switches chain.
3. User mints ROTY on testnet.
4. User stakes ROTY.
5. User mints Melting.
6. User stakes Melting.
7. User mints Amanda.
8. User stakes Amanda.
9. Admin creates reward round.
10. Admin funds reward round.
11. Indexer syncs events to Supabase.
12. Reward calculator generates allocation.
13. Merkle proof data is served.
14. User claims $OiOi via browser.
15. Claimed status is confirmed.
16. Repeat for Base Sepolia and Ethereum Sepolia.

---

## Phase 11 — Final UI/UX Polish

Status: Pending.

Scope:

- homepage
- mint pages
- user dashboard
- admin dashboard
- reward claim panel
- loading states
- error states
- empty states
- mobile responsiveness
- explorer links
- copywriting
- admin warnings/tooltips
- confirmation modals
- accessibility review

---

## Phase 12 — Testnet Release Candidate

Status: Pending.

Done criteria:

- all testnet flows pass
- no critical blockers
- docs updated
- runbook final
- QA checklist PASS
- admin procedures documented
- indexer/reward procedures documented
- Vercel preview/testnet deployment passes
- full browser E2E passes on Base Sepolia and Ethereum Sepolia

---

## Phase 13 — Mainnet Deployment

Status: Ready but deferred.

Preparation passed:

- repo clean
- build/compile/test pass
- RPC chain IDs verified
- mainnet preflight passed
- deployer wallet funded
- whitelist finalized

Deferred until:

```text
Testnet Release Candidate is complete.
```

Mainnet order:

1. Base Mainnet deploy.
2. Base verification.
3. Base read-check.
4. Record Base indexer FROM_BLOCK manually.
5. Ethereum Mainnet deploy.
6. Ethereum verification.
7. Ethereum read-check.
8. Record Ethereum indexer FROM_BLOCK manually.
9. Keep all mint phases OFF.

---

## Phase 14 — Mainnet Env Wiring

Status: Pending.

Tasks:

- fill `NEXT_PUBLIC_BASE_*`
- fill `NEXT_PUBLIC_ETH_*`
- set `NEXT_PUBLIC_APP_ENV=mainnet`
- deploy Vercel production
- setup production domains
- keep mint phases OFF

---

## Phase 15 — Mainnet Read-Only QA

Status: Pending.

Tasks:

- frontend reads mainnet contracts
- admin dashboard reads owner/admin state
- dashboard reads staking contracts
- reward dashboard reads distributor state
- mint phases remain OFF
- reward claim remains disabled until proof data is production-ready

---

## Phase 16 — Controlled Mainnet Opening

Status: Pending.

Order:

1. Enable ROTY whitelist mint.
2. Controlled mint.
3. Enable ROTY public mint if ready.
4. Enable staking dashboard.
5. Enable Melting gated mint.
6. Enable Amanda gated mint.
7. Enable reward claim only after production indexer/reward flow is ready.

---

## Current Next Step

```text
Admin Dashboard Architecture v1
```

Do not proceed to mainnet deployment until Testnet Release Candidate is complete unless a separate explicit strategic override is made.

---

P.S. Read this document freely for information and guidance. Do not redistribute or restate—no quotes, summaries, paraphrases, or derivatives—without prior written permission from [**Prof. NOTA**](https://nota.endhonesa.com/). Sharing the link is allowed. So, share the link, not the text. Do not discuss or re-tell the contents in any form—written, spoken, or recorded—without prior written permission.

---
