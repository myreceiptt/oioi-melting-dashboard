# OiOi Melting Dashboard — Mainnet Deployment Approval Gate v1

Date: 2026-06-24

Status:

```text
MAINNET DEPLOYMENT APPROVAL GATE V1: READY WITH NOTES
DEPLOYMENT AUTHORIZATION: APPROVED FOR CONTRACT DEPLOYMENT ONLY
APPROVED DEPLOYMENT SCOPE: BASE MAINNET + ETHEREUM MAINNET
MAINNET DEPLOYMENT: APPROVED / NOT STARTED
PUBLIC LAUNCH: NOT READY / NOT APPROVED
MAINNET REWARD CLAIM LAUNCH: NOT READY / NOT APPROVED
```

This document records the approval gate before any Base Mainnet or Ethereum Mainnet deployment transaction.

It does not authorize deployment by itself.

---

## 1. Baseline References

Canonical testnet and readiness references:

```text
docs/qa/TESTNET_RELEASE_CANDIDATE_LOCK_V1.md
docs/qa/FULL_TESTNET_E2E_QA_V1.md
docs/MAINNET_READINESS_REVIEW.md
docs/DEPLOYMENT_RUNBOOK.md
```

Current baseline:

```text
Testnet Release Candidate Lock v1: DONE / PASS
Full Testnet E2E QA v1: DONE / PASS
Worker jobs / boundary reward flow: DONE / PASS through GitHub Actions
On-chain reward round creation and user reward claim: validated on testnet
Mainnet deployment: not started
Mainnet env wiring: not started
Mainnet read-only QA: not started
Controlled mainnet opening: not started
```

---

## 2. Gate Verdict

Verdict:

```text
READY WITH NOTES
```

Blockers:

```text
none observed
```

Required before first mainnet transaction:

```text
explicit mainnet deployment approval: APPROVED
metadata strategy approved as Option A
deployer / treasury / royalty confirmation
mainnet $OiOi token confirmation
final no-go / go decision: APPROVED FOR CONTRACT DEPLOYMENT ONLY
```

Final deployment approval form:

```text
docs/mainnet/MAINNET_DEPLOYMENT_APPROVAL_DECISION_V1.md
```

---

## 3. Approval-Sensitive Items

### Metadata Strategy

Current deployment config includes pending revealed metadata placeholders:

```text
scripts/deploy/00-config.ts uses ipfs://pending-melting-revealed/
scripts/deploy/00-config.ts uses ipfs://pending-amanda-revealed/
```

Deployment with pending revealed URI values is acceptable for contract deployment planning because it has been explicitly approved, and metadata must remain unlocked until final metadata is ready, checked, revealed, indexed, and approved.

Metadata strategy is now approved as:

```text
Option A — Deploy with pending revealed URI placeholders
```

This approval is for contract deployment planning only. It does not authorize mainnet deployment by itself.

Rules remain:

```text
mint phases must remain OFF
metadata must remain unlocked
public launch remains not ready
final metadata update/reveal/lock remains a later approval
lockMetadata() must not be called until final Melting/Amanda revealed metadata is approved
```

Stop if mainnet deployment is proposed without separate explicit deployment approval.

Canonical metadata decision document:

```text
docs/mainnet/METADATA_STRATEGY_APPROVAL_DECISION_V1.md
```

### Mainnet Reward / Indexer / Proof Pipeline

Mainnet reward claim is not production-ready at this gate.

Current reward/indexer implementation is testnet-validated, but mainnet support still requires post-deployment setup:

```text
mainnet indexer support must be implemented/configured after deployment
mainnet FROM_BLOCK values must be recorded after deployment
mainnet contracts must be seeded/verified in Supabase
mainnet reward proof flow must be run and tested before reward claim launch
```

Production reward claim remains unavailable until the mainnet reward/indexer/proof flow is implemented, run, verified, and explicitly approved.

---

## 4. Required Approvals Before Deployment

Approve each item before any mainnet transaction:

```text
deployer wallet
treasury wallet
royalty receiver
Base Mainnet $OiOi token address
Ethereum Mainnet $OiOi token address
collection names
collection symbols
collection max supply values
mint prices
whitelist root
metadata strategy
mint phases remaining OFF after deployment
contract deployment only, not public launch
reward claim disabled / not production-ready
```

Do not continue if any item is unclear.

---

## 5. Safe Pre-Mainnet Commands

These commands are safe because they do not deploy contracts or send transactions:

```bash
git status --short
npm run lint:frontend
npm run build
npm run compile
npm run test
npm run deploy:config -- baseMainnet
npm run deploy:config -- ethereumMainnet
npm run deploy:preflight -- baseMainnet
npm run deploy:preflight -- ethereumMainnet
```

Stop if any command fails unexpectedly.

---

## 6. Mainnet Deployment Commands

These commands are approved for Base Mainnet + Ethereum Mainnet contract deployment only. Stop if any stop condition occurs.

### Base Mainnet

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
```

### Ethereum Mainnet

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
```

---

## 7. Post-Deployment Verification

Run only after each deployment record exists.

### Base Mainnet

```bash
npm run verify:args -- baseMainnet
npm run deploy:read-check -- --network baseMainnet
npm run deploy:restore-mint-phases -- --network baseMainnet
```

### Ethereum Mainnet

```bash
npm run verify:args -- ethereumMainnet
npm run deploy:read-check -- --network ethereumMainnet
npm run deploy:restore-mint-phases -- --network ethereumMainnet
```

Required result:

```text
constructor args exported
read-check passes
mint phases are OFF
deployment records are consistent
```

---

## 8. Mainnet Env Wiring

Do not wire mainnet frontend env before deployments and read-checks pass.

Required public frontend env after deployment:

```env
NEXT_PUBLIC_APP_ENV=mainnet
NEXT_PUBLIC_BASE_ROTY_CONTRACT=
NEXT_PUBLIC_BASE_MELTING_CONTRACT=
NEXT_PUBLIC_BASE_AMANDA_CONTRACT=
NEXT_PUBLIC_BASE_STAKING_CONTRACT=
NEXT_PUBLIC_BASE_REWARD_DISTRIBUTOR=
NEXT_PUBLIC_BASE_OIOI_TOKEN=
NEXT_PUBLIC_ETH_ROTY_CONTRACT=
NEXT_PUBLIC_ETH_MELTING_CONTRACT=
NEXT_PUBLIC_ETH_AMANDA_CONTRACT=
NEXT_PUBLIC_ETH_STAKING_CONTRACT=
NEXT_PUBLIC_ETH_REWARD_DISTRIBUTOR=
NEXT_PUBLIC_ETH_OIOI_TOKEN=
```

Private/server/operator env must stay separate from browser env.

Do not put `PRIVATE_KEY` in Vercel unless separately approved. Browser transactions use the connected wallet.

---

## 9. Mainnet Read-Only QA Sequence

After deployment and env wiring:

```text
open softstaking domain
open /dashboard
open /dashboard/base
open /dashboard/ethereum
open /admin
open /admin/base
open /admin/ethereum
open six dedicated mint subdomains
confirm chain guard behavior
confirm admin read cards
confirm mint phases OFF
confirm reward claim surface does not imply production rewards are available
confirm no Sepolia contracts remain in mainnet frontend env
```

Mainnet read-only QA must pass before controlled opening.

---

## 10. Controlled Opening Sequence

Controlled opening is separate from deployment.

Suggested order:

```text
1. Enable ROTY whitelist mint only if approved.
2. Run controlled mint.
3. Enable ROTY public mint only if approved.
4. Confirm staking dashboard behavior.
5. Enable Melting gated mint only if approved.
6. Enable Amanda gated mint only if approved.
7. Enable reward claim only after mainnet indexer/reward/proof flow is implemented, run, verified, and approved.
```

Public launch is not ready at this gate.

---

## 11. Stop Conditions

Stop immediately if any of these occur:

```text
dirty git tree
deployer mismatch
RPC chain ID mismatch
insufficient ETH / Base ETH
preflight failure
metadata strategy mismatch
deployment transaction failure
inconsistent deployment record
unexpected verification failure
read-check failure
mint phases cannot be restored OFF
Vercel env mixes Sepolia and mainnet values
admin read-only surface fails
reward claim appears enabled without mainnet proof validation
```

Do not fix forward on mainnet. Stop, inspect, and decide.

---

## 12. Final Gate Statement

```text
MAINNET DEPLOYMENT APPROVAL GATE V1: READY WITH NOTES
DEPLOYMENT AUTHORIZATION: APPROVED FOR CONTRACT DEPLOYMENT ONLY
APPROVED DEPLOYMENT SCOPE: BASE MAINNET + ETHEREUM MAINNET
MAINNET DEPLOYMENT: APPROVED / NOT STARTED
PUBLIC LAUNCH: NOT READY / NOT APPROVED
MAINNET REWARD CLAIM LAUNCH: NOT READY / NOT APPROVED
```

Mainnet still requires explicit approval before any deployment transaction.

P.S. Read this document freely for information and guidance. Do not redistribute or restate—no quotes, summaries, paraphrases, or derivatives—without prior written permission from [**Prof. NOTA**](https://nota.endhonesa.com/). Sharing the link is allowed. So, share the link, not the text. Do not discuss or re-tell the contents in any form—written, spoken, or recorded—without prior written permission.

---
