# OiOi Melting Dashboard — Testnet Product Completion Plan v3

This document is the operational checklist for the locked Testnet Release Candidate baseline and the documented mainnet approval gate.

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

Mainnet deployment remains deferred after Mainnet Deployment Approval Gate v1 until explicit approval.

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

### Not Started

```text
⏸ Mainnet contract deployment.
⏸ Mainnet env wiring.
⏸ Mainnet read-only QA.
⏸ Controlled mainnet opening.
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

## 4. Current Next Major Task

```text
Explicit mainnet deployment approval decision
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
```

Required approval-sensitive work before mainnet deployment:

```text
Explicit mainnet approval.
Metadata strategy approval.
Deployer / treasury / royalty / token address confirmation.
Mainnet env wiring plan.
Mainnet read-only QA plan.
Controlled mainnet opening plan.
Mainnet reward/indexer/proof pipeline remains not production-ready until implemented/configured, run, verified, and approved after deployment.
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

Mainnet deployment must wait until explicit approval after Mainnet Deployment Approval Gate v1.

Mainnet remains:

```text
ready-but-deferred
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

Mainnet contract deployment is now complete, verified, read-checked, and safe-off.

Mainnet still needs:

```text
mainnet env wiring
mainnet read-only QA
controlled opening plan execution
mainnet reward/indexer/proof validation before any production reward claim launch
final metadata update/reveal/lock approval
```

---

P.S. Read this document freely for information and guidance. Do not redistribute or restate—no quotes, summaries, paraphrases, or derivatives—without prior written permission from [**Prof. NOTA**](https://nota.endhonesa.com/). Sharing the link is allowed. So, share the link, not the text. Do not discuss or re-tell the contents in any form—written, spoken, or recorded—without prior written permission.

---
