# OiOi Melting Dashboard — Testnet Product Completion Plan v3

This document is the historical operational checklist for the locked Testnet
Release Candidate baseline and the later documented mainnet setup gates. The
current canonical project status is:

```text
PROJECT STATUS: COMPLETE / PUBLIC / OPERATIONAL
CURRENT MODE: EVERGREEN MAINTENANCE
CANONICAL STATUS: docs/PROJECT_FINAL_STATUS_AND_MAINTENANCE_V1.md
```

The product rehearsal now covers:

```text
mint
stake / unstake
admin controls
boundary worker sync
reward calculation
Merkle proof storage
reward claim
full browser E2E
```

Mainnet contract deployment, production env wiring, mint opening, reward
round operations, public reward claim, and production public surface launch
have since been completed through separate approval gates and operational
verification.

---

## 1. Current Product Status

### Completed

```text
✅ Base Sepolia contracts deployed, verified, read-checked, and function-tested.
✅ Ethereum Sepolia contracts deployed, verified, read-checked, and function-tested.
✅ Mint pages implemented for ROTY, Melting, and Amanda on both chain sets.
✅ Dashboard stake/unstake flow implemented.
✅ Owned NFT discovery implemented with backend API, Alchemy NFT data, on-chain staking checks, and Supabase cache.
✅ Admin dashboard implemented.
✅ Admin reward operations implemented with Supabase-generated rounds and live on-chain reads.
✅ Reward boundary sync orchestration implemented.
✅ GitHub Actions worker implemented for resumable boundary jobs.
✅ Transfer, staking, and reward event sync implemented.
✅ Ownership and stake-position rebuild implemented.
✅ Valid interval, reward calculation, and Merkle proof generation implemented.
✅ Reward rounds and proof APIs implemented.
✅ Reward claim panel implemented and tested on funded rounds.
✅ BASE / dETH aesthetic theme shell implemented.
✅ App Navbar, App Footer, App Menu, Theme Switcher, and copyright footer implemented.
✅ Production-intended Sepolia rehearsal deployment completed.
✅ Full Testnet Browser QA v1 passed.
✅ Full Testnet Mutation QA v1 passed.
✅ Full Testnet E2E QA v1 passed.
✅ Worker jobs / boundary reward flow passed through GitHub Actions.
✅ Testnet Release Candidate Lock v1 passed.
✅ Mainnet Deployment Approval Gate v1 documented as ready with notes.
```

### Later Completed After Testnet RC

```text
✅ Mainnet contract deployment completed, verified, and safe-off.
✅ Mainnet env wiring completed.
✅ Mainnet read-only QA passed.
✅ Controlled mainnet public mint/staking opening completed.
✅ Mainnet Supabase data-plane setup completed.
✅ First mainnet boundary worker job succeeded.
✅ First mainnet calculated reward rounds generated.
✅ First Base/Ethereum reward rounds created, approved, and funded on-chain.
✅ Mainnet reward claim launched and operationally validated.
✅ Project finalized as public and operational.
```

---

## 2. Canonical Commands

### Health checks

```bash
npm run lint:frontend
npm run build
npm run compile
npm run test
```

### Boundary worker

```bash
npm run indexer:boundary-worker
```

The same worker command is used by GitHub Actions.

### Manual indexer diagnostics and recovery

```bash
npm run indexer:db-check -- <chain>
npm run indexer:sync-transfers -- <chain>
npm run indexer:rebuild-ownership -- <chain>
npm run indexer:sync-staking -- <chain>
npm run indexer:rebuild-stake-positions -- <chain>
npm run indexer:sync-rewards -- <chain>
npm run indexer:calculate-valid-intervals -- <chain>
npm run rewards:calculate -- <chain>
npm run rewards:merkle-db -- <chain>
```

---

## 3. Reward Round Operational Flow

1. Admin submits block tapal batas and reward amount in Admin Reward Operations.
2. A boundary sync job is stored in Supabase.
3. Worker runs locally or through GitHub Actions.
4. Worker syncs chain targets in small, resumable batches.
5. Worker rebuilds derived state.
6. Worker calculates allocations and generates Merkle proof data.
7. Admin creates the selected reward round on-chain.
8. Admin approves and funds $OiOi.
9. Users claim from Reward Claim Panel.
10. Round becomes closed when all allocation has been claimed on-chain.

Reward event sync after create/fund/claim is optional reconciliation; admin/user UI reads live contract state for the active operation flow.

---

## 4. Current Mode

```text
Evergreen maintenance.
```

Recently completed:

```text
Subdomain Surface Behavior v1 passed.
Production-intended Sepolia rehearsal domain QA passed for softstaking.endhonesa.com and six dedicated mint subdomains.
Full Testnet Browser QA v1 passed on live Sepolia rehearsal subdomains.
Full Testnet Mutation QA v1 passed on live Sepolia rehearsal subdomains.
Full Testnet E2E QA v1 documented in docs/qa/FULL_TESTNET_E2E_QA_V1.md.
Worker jobs / boundary reward flow passed through GitHub Actions.
Testnet Release Candidate Lock v1 documented in docs/qa/TESTNET_RELEASE_CANDIDATE_LOCK_V1.md.
Mainnet Deployment Approval Gate v1 documented in docs/mainnet/MAINNET_DEPLOYMENT_APPROVAL_GATE_V1.md.
Mainnet Contract Deployment Completion v1 documented in docs/mainnet/MAINNET_CONTRACT_DEPLOYMENT_COMPLETION_V1.md.
Mainnet Reward Round Operations v1 documented in docs/mainnet/MAINNET_REWARD_ROUND_OPERATIONS_V1.md.
Final public/maintenance status documented in docs/PROJECT_FINAL_STATUS_AND_MAINTENANCE_V1.md.
```

Current maintenance scope:

```text
dependency updates
deprecated tooling updates
lint/build/test upkeep
operational monitoring
documentation upkeep
future owner-approved content or product expansions
```

---

## 5. Testnet Release Candidate Gate

Testnet Release Candidate Lock v1 result:

```text
Subdomain Surface Behavior v1 passes. ✅
Final deployed browser QA passes. ✅
Full Testnet Mutation QA passes. ✅
Worker Jobs reward round QA is documented. ✅
Full Testnet E2E QA is documented. ✅
No critical blockers remain. ✅
Pre-RC health checks pass. ✅
Base Sepolia read-check passes. ✅
Ethereum Sepolia read-check passes. ✅
Browser sanity checks pass. ✅
Testnet Release Candidate Lock v1 passes. ✅
```

---

## 6. Mainnet Gate

Mainnet deployment, public opening, reward operations, and reward claim were
completed later. This section remains as historical context from the testnet
completion plan.

Current mainnet status:

```text
public and operational
```

Preparation already passed earlier:

```text
repo health
build / compile / test
RPC chain IDs
mainnet preflight
deployer funding
whitelist root
```

Mainnet contract deployment is complete, verified, read-checked, and safe-off.

Current maintenance mode includes:

```text
regular health checks
dependency updates
operator review before any future product expansion
documentation updates when operations change
```

---

P.S. Read this document freely for information and guidance. Do not redistribute or restate—no quotes, summaries, paraphrases, or derivatives—without prior written permission from [**Prof. NOTA**](https://nota.endhonesa.com/). Sharing the link is allowed. So, share the link, not the text. Do not discuss or re-tell the contents in any form—written, spoken, or recorded—without prior written permission.

---
