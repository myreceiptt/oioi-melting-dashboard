# OiOi Melting Dashboard — Mainnet Deployment Approval Gate v1

> Current status note (2026-06-29): this is a historical deployment approval
> gate. The current canonical project status is
> `docs/PROJECT_FINAL_STATUS_AND_MAINTENANCE_V1.md`: complete, public,
> operational, and in evergreen maintenance mode. Any "not approved",
> "pending", or "not ready" wording below describes the gate status at the
> time this document was written, not the current production state.

Date: 2026-06-24

Status:

```text
MAINNET DEPLOYMENT APPROVAL GATE V1: READY WITH NOTES
DEPLOYMENT AUTHORIZATION: APPROVED FOR CONTRACT DEPLOYMENT ONLY
APPROVED DEPLOYMENT SCOPE: BASE MAINNET + ETHEREUM MAINNET
MAINNET CONTRACT DEPLOYMENT: DONE / VERIFIED / SAFE OFF
MAINNET PUBLIC SURFACE: LIVE
PRODUCTION MAINNET ENV: LIVE
MAINNET REWARD CLAIM LAUNCH: NOT READY / NOT APPROVED
METADATA LOCK: NOT APPROVED
MINT OPENING: DONE / LIVE
```

This document records the approval gate that preceded the Base Mainnet and Ethereum Mainnet contract deployment transactions.

The approved contract deployment scope has now been completed and is recorded in `docs/mainnet/MAINNET_CONTRACT_DEPLOYMENT_COMPLETION_V1.md`.

It did not authorize reward claim launch, metadata reveal, metadata lock, or `lockMetadata()`.

Later production mainnet env wiring and mint opening are documented in `docs/qa/MAINNET_PUBLIC_SURFACE_AND_MINT_OPENING_QA_V1.md`.

---

## 1. Baseline References

Canonical testnet and readiness references:

```text
docs/qa/TESTNET_RELEASE_CANDIDATE_LOCK_V1.md
docs/qa/FULL_TESTNET_E2E_QA_V1.md
docs/mainnet/MAINNET_CONTRACT_DEPLOYMENT_COMPLETION_V1.md
docs/MAINNET_READINESS_REVIEW.md
docs/DEPLOYMENT_RUNBOOK.md
```

Current baseline:

```text
Testnet Release Candidate Lock v1: DONE / PASS
Full Testnet E2E QA v1: DONE / PASS
Worker jobs / boundary reward flow: DONE / PASS through GitHub Actions
On-chain reward round creation and user reward claim: validated on testnet
Base Mainnet contract deployment: DONE / VERIFIED / SAFE OFF
Ethereum Mainnet contract deployment: DONE / VERIFIED / SAFE OFF
Production mainnet env: live
Mainnet production-domain browser QA: pass
Controlled mainnet mint/staking opening: done / live
Mainnet Reward Round Operations: data-plane foundation done; reward claim launch was completed later and is recorded in `docs/PROJECT_FINAL_STATUS_AND_MAINTENANCE_V1.md`
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

Satisfied before the first mainnet deployment transaction:

```text
explicit mainnet deployment approval: APPROVED / COMPLETED
metadata strategy approved as Option A
deployer / treasury / royalty confirmation
mainnet $OiOi token confirmation
final no-go / go decision: APPROVED FOR CONTRACT DEPLOYMENT ONLY
```

Final deployment approval form and completion record:

```text
docs/mainnet/MAINNET_DEPLOYMENT_APPROVAL_DECISION_V1.md
docs/mainnet/MAINNET_CONTRACT_DEPLOYMENT_COMPLETION_V1.md
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

This metadata approval was for contract deployment planning only. It did not authorize mainnet deployment by itself.

Rules at contract deployment planning time:

```text
mint phases had to remain OFF at deployment completion
metadata must remain unlocked
final metadata update/reveal/lock remains a later approval
lockMetadata() must not be called until final Melting/Amanda revealed metadata is approved
```

Later production mainnet env wiring and mint opening were completed and are recorded separately. Metadata must remain unlocked and final metadata update/reveal/lock remains a later approval.

Canonical metadata decision document:

```text
docs/mainnet/METADATA_STRATEGY_APPROVAL_DECISION_V1.md
```

### Mainnet Reward / Indexer / Proof Pipeline

At this gate, mainnet reward claim was not production-ready.

Later mainnet reward data-plane setup and first-round preparation were completed and are recorded in:

```text
docs/mainnet/MAINNET_REWARD_ROUND_OPERATIONS_V1.md
```

Current reward status:

```text
mainnet Supabase schema/seed: complete
mainnet boundary worker first job: success
first mainnet calculated rounds: generated
first Base/Ethereum reward rounds: created, approved, and funded on-chain
public reward claim launch: not approved
controlled user claim verification: not yet documented
```

Production reward claim remains unavailable until controlled mainnet claim verification and explicit reward claim launch approval.

---

## 4. Required Approvals Before Deployment

These items were required before any mainnet deployment transaction and were confirmed for the completed contract deployment scope:

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

These commands were approved for Base Mainnet + Ethereum Mainnet contract deployment only and have already been executed for the completed deployment. Do not re-run them unless a separate recovery plan explicitly approves that action.

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

Post-deployment verification has passed for both deployment records.

### Base Mainnet Verification

```bash
npm run verify:args -- baseMainnet
npm run deploy:read-check -- --network baseMainnet
npm run deploy:restore-mint-phases -- --network baseMainnet
```

### Ethereum Mainnet Verification

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

Current result:

```text
BaseScan verification: DONE / already verified
Etherscan verification: DONE / already verified or successfully verified
Base read-check: PASS
Ethereum read-check: PASS
Base mint phases: OFF
Ethereum mint phases: OFF
Base metadata: UNLOCKED
Ethereum metadata: UNLOCKED
```

---

## 8. Mainnet Env Wiring

Mainnet env wiring is not approved yet.

Do not wire mainnet frontend env until the separate mainnet env wiring plan/gate is approved, even though deployments and read-checks have passed.

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
7. Enable reward claim only after controlled mainnet user claim verification and explicit launch approval.
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
MAINNET CONTRACT DEPLOYMENT: DONE / VERIFIED / SAFE OFF
MAINNET PUBLIC SURFACE: LIVE
PRODUCTION MAINNET ENV: LIVE
MAINNET REWARD CLAIM LAUNCH: NOT READY / NOT APPROVED
METADATA LOCK: NOT APPROVED
MINT OPENING: DONE / LIVE
```

Reward claim launch, metadata reveal, metadata lock, and `lockMetadata()` still require separate explicit approvals.

P.S. Read this document freely for information and guidance. Do not redistribute or restate—no quotes, summaries, paraphrases, or derivatives—without prior written permission from [**Prof. NOTA**](https://nota.endhonesa.com/). Sharing the link is allowed. So, share the link, not the text. Do not discuss or re-tell the contents in any form—written, spoken, or recorded—without prior written permission.

---
