# OiOi Melting Dashboard — Mainnet Deployment Approval Decision v1

Date: 2026-06-25

Status:

```text
MAINNET DEPLOYMENT APPROVAL DECISION V1: APPROVED
APPROVED DEPLOYMENT SCOPE: BASE MAINNET + ETHEREUM MAINNET
MAINNET CONTRACT DEPLOYMENT: DONE / VERIFIED / SAFE OFF
DEPLOYMENT AUTHORIZATION: APPROVED FOR CONTRACT DEPLOYMENT ONLY
MAINNET PUBLIC SURFACE: LIVE
PRODUCTION MAINNET ENV: LIVE
MAINNET REWARD CLAIM LAUNCH: NOT READY / NOT APPROVED
METADATA LOCK: NOT APPROVED
MINT OPENING: DONE / LIVE
```

This document records the final approval that allowed the mainnet contract deployment commands to be run.

The approved contract deployment scope has now been completed and recorded in `docs/mainnet/MAINNET_CONTRACT_DEPLOYMENT_COMPLETION_V1.md`.

It approved contract deployment only for the selected scope. Later production mainnet env wiring and mint opening were completed and are recorded in `docs/qa/MAINNET_PUBLIC_SURFACE_AND_MINT_OPENING_QA_V1.md`.

It does not approve mainnet reward claim launch, metadata lock, or final metadata reveal/update/lock. Later mainnet Reward Round Operations data-plane setup and first-round preparation were completed separately and are recorded in `docs/mainnet/MAINNET_REWARD_ROUND_OPERATIONS_V1.md`.

---

## 1. Baseline References

```text
docs/qa/TESTNET_RELEASE_CANDIDATE_LOCK_V1.md
docs/mainnet/MAINNET_DEPLOYMENT_APPROVAL_GATE_V1.md
docs/mainnet/METADATA_STRATEGY_APPROVAL_DECISION_V1.md
docs/mainnet/MAINNET_CONTRACT_DEPLOYMENT_COMPLETION_V1.md
docs/MAINNET_READINESS_REVIEW.md
docs/DEPLOYMENT_RUNBOOK.md
```

---

## 2. Already Approved

```text
Testnet RC Lock v1: PASS
Mainnet Approval Gate v1: READY WITH NOTES
Metadata Strategy Option A: APPROVED
Mainnet Contract Deployment Completion v1: COMPLETE
```

Metadata Strategy Option A means deployment planning may proceed with pending Melting/Amanda revealed URI placeholders only under these constraints:

```text
mint phases OFF
metadata unlocked
no public launch
no lockMetadata() before final Melting/Amanda metadata approval
```

---

## 3. Still Not Approved

```text
Mainnet reward claim launch: NOT APPROVED
Metadata lock: NOT APPROVED
Reward Round Operations production data plane: FOUNDATION DONE / CLAIM LAUNCH PENDING
```

---

## 4. Deployment Scope Decision

```text
Deployment scope:
[ ] Base Mainnet only
[ ] Ethereum Mainnet only
[x] Base Mainnet + Ethereum Mainnet
[ ] Defer deployment
```

---

## 5. Required Owner Confirmations

```text
[x] I approve running mainnet deployment commands.
[x] I confirm this is contract deployment only, not public launch.
[x] I confirm mint phases had to remain OFF at deployment completion.
[x] I confirm metadata must remain unlocked.
[x] I confirm `lockMetadata()` must not be called.
[x] I confirm final Melting/Amanda revealed metadata remains a later gate.
[x] I confirm mainnet reward claim launch remains unavailable until separate approval.
[x] I confirm mainnet indexer/reward/proof setup requires separate validation and approval before public claim launch.
[x] I confirm deployment must stop if any stop condition occurs.
```

---

## 6. Critical Values to Confirm Before Approval

No secrets should be written in this document.

```text
[x] Deployer wallet confirmed: 0x29bF68E3969E0b6686ea55B7C48241ba3f6B9bA0
[x] Treasury wallet confirmed.
[x] Royalty receiver confirmed.
[x] Base Mainnet $OiOi token confirmed: 0xba0032620d88D9b16752CbDE75593c080C3d38de
[x] Ethereum Mainnet $OiOi token confirmed: 0x1C696882b93d7241d09D55f52693cAD367A5bEaf
[x] Collection names/symbols confirmed.
[x] Max supplies confirmed.
[x] Mint prices confirmed.
[x] Whitelist root confirmed: 0x0b2504d3e2d95c57e039aea1c027015bc0ecf39c3ad14424764faa696c3fcce9
[x] Metadata placeholder strategy confirmed.
[x] RPC chain IDs confirmed: Base 8453, Ethereum 1.
[x] Deployer balances confirmed by preflight.
```

---

## 7. Pre-Approval Verification Result

```text
SAFE PRE-DEPLOYMENT VERIFICATION: PASS

git status / pull: PASS
lint: PASS
build: PASS
compile: PASS
test: PASS — 62 passing
baseMainnet config: PASS
ethereumMainnet config: PASS
baseMainnet preflight: PASS
ethereumMainnet preflight: PASS
deployer match: PASS
RPC chain ID: PASS
existing deployment records: none / fresh deployment path
```

---

## 7a. Deployment Completion Result

The approved Base Mainnet + Ethereum Mainnet contract deployment scope has been completed.

Canonical completion record:

```text
docs/mainnet/MAINNET_CONTRACT_DEPLOYMENT_COMPLETION_V1.md
```

Completion status:

```text
Base Mainnet contract deployment: DONE / VERIFIED / SAFE OFF
Ethereum Mainnet contract deployment: DONE / VERIFIED / SAFE OFF
BaseScan verification: DONE / already verified
Etherscan verification: DONE / already verified or successfully verified
Base read-check: PASS
Ethereum read-check: PASS
mint phases: OFF
metadata: UNLOCKED
```

This completion does not approve public launch, env wiring, reward claim launch, metadata reveal, metadata lock, mint opening, or `lockMetadata()`.

---

## 8. Safe Pre-Deployment Commands

These commands are safe / no deploy:

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

Stop if any safe command fails unexpectedly.

---

## 9. Deployment Commands

Historical approved contract deployment commands for the selected scope.

These commands have already been executed for the completion recorded in `docs/mainnet/MAINNET_CONTRACT_DEPLOYMENT_COMPLETION_V1.md`. Do not re-run them unless a separate recovery plan explicitly approves that action.

```text
APPROVED FOR CONTRACT DEPLOYMENT ONLY
PUBLIC LAUNCH IS NOT APPROVED
MAINNET REWARD CLAIM LAUNCH IS NOT APPROVED
STOP IF ANY STOP CONDITION OCCURS
```

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

## 10. Stop Conditions

Stop immediately if any of these occur:

```text
dirty working tree
deployer mismatch
RPC chain ID mismatch
insufficient ETH/Base ETH
preflight failure
metadata strategy mismatch
any deploy tx failure
deployment record inconsistency
unexpected verification failure
read-check failure
mint phases cannot be restored OFF
accidental Sepolia/mainnet env mixing
any prompt to launch publicly before read-only QA
any prompt to enable reward claim before mainnet proof flow validation
```

Do not fix forward on mainnet. Stop, inspect, and decide.

---

## 11. Approval Block

```text
MAINNET DEPLOYMENT APPROVAL: APPROVED

Approved deployment scope:
[ ] Base Mainnet only
[ ] Ethereum Mainnet only
[x] Base Mainnet + Ethereum Mainnet
[ ] Defer deployment

Approved by: Prof. NOTA
Date: 2026-06-25
Notes: Approved for contract deployment only. At deployment completion, mint phases had to remain OFF. Later production mainnet env wiring and mint opening were completed and are recorded separately. Metadata must remain unlocked. lockMetadata() must not be called. Mainnet reward claim launch is not approved. Stop immediately if any stop condition occurs.
```

---

## 12. Final Status

```text
MAINNET DEPLOYMENT APPROVAL DECISION V1: APPROVED
APPROVED DEPLOYMENT SCOPE: BASE MAINNET + ETHEREUM MAINNET
MAINNET CONTRACT DEPLOYMENT: DONE / VERIFIED / SAFE OFF
DEPLOYMENT AUTHORIZATION: APPROVED FOR CONTRACT DEPLOYMENT ONLY
MAINNET PUBLIC SURFACE: LIVE
PRODUCTION MAINNET ENV: LIVE
MAINNET REWARD CLAIM LAUNCH: NOT READY / NOT APPROVED
METADATA LOCK: NOT APPROVED
MINT OPENING: DONE / LIVE
```

P.S. Read this document freely for information and guidance. Do not redistribute or restate—no quotes, summaries, paraphrases, or derivatives—without prior written permission from [**Prof. NOTA**](https://nota.endhonesa.com/). Sharing the link is allowed. So, share the link, not the text. Do not discuss or re-tell the contents in any form—written, spoken, or recorded—without prior written permission.

---
