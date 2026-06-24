# OiOi Melting Dashboard — Mainnet Deployment Approval Decision v1

Date: 2026-06-25

Status:

```text
MAINNET DEPLOYMENT APPROVAL DECISION V1: NOT YET APPROVED
MAINNET DEPLOYMENT: NOT STARTED
DEPLOYMENT AUTHORIZATION: NOT YET APPROVED
PUBLIC LAUNCH: NOT READY
MAINNET REWARD CLAIM LAUNCH: NOT READY
```

This document is the final approval form before any mainnet deployment command may be run.

It does not approve deployment in its current state.

---

## 1. Baseline References

```text
docs/qa/TESTNET_RELEASE_CANDIDATE_LOCK_V1.md
docs/mainnet/MAINNET_DEPLOYMENT_APPROVAL_GATE_V1.md
docs/mainnet/METADATA_STRATEGY_APPROVAL_DECISION_V1.md
docs/MAINNET_READINESS_REVIEW.md
docs/DEPLOYMENT_RUNBOOK.md
```

---

## 2. Already Approved

```text
Testnet RC Lock v1: PASS
Mainnet Approval Gate v1: READY WITH NOTES
Metadata Strategy Option A: APPROVED
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
Mainnet deployment transaction: NOT YET APPROVED
Mainnet env wiring: NOT YET APPROVED
Public launch: NOT APPROVED
Mainnet reward claim launch: NOT APPROVED
Metadata lock: NOT APPROVED
```

---

## 4. Deployment Scope Decision

```text
Deployment scope:
[ ] Base Mainnet only
[ ] Ethereum Mainnet only
[ ] Base Mainnet + Ethereum Mainnet
[ ] Defer deployment
```

---

## 5. Required Owner Confirmations

```text
[ ] I approve running mainnet deployment commands.
[ ] I confirm this is contract deployment only, not public launch.
[ ] I confirm mint phases must remain OFF after deployment.
[ ] I confirm metadata must remain unlocked.
[ ] I confirm `lockMetadata()` must not be called.
[ ] I confirm final Melting/Amanda revealed metadata remains a later gate.
[ ] I confirm mainnet reward claim remains unavailable.
[ ] I confirm mainnet indexer/reward/proof pipeline is not production-ready yet.
[ ] I confirm deployment must stop if any stop condition occurs.
```

---

## 6. Critical Values to Confirm Before Approval

No secrets should be written in this document.

```text
[ ] Deployer wallet confirmed.
[ ] Treasury wallet confirmed.
[ ] Royalty receiver confirmed.
[ ] Base Mainnet $OiOi token confirmed.
[ ] Ethereum Mainnet $OiOi token confirmed.
[ ] Collection names/symbols confirmed.
[ ] Max supplies confirmed.
[ ] Mint prices confirmed.
[ ] Whitelist root confirmed.
[ ] Metadata placeholder strategy confirmed.
[ ] RPC chain IDs confirmed.
[ ] Deployer balances confirmed.
```

---

## 7. Safe Pre-Deployment Commands

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

## 8. Deployment Commands

Do not run these commands now.

```text
DO NOT RUN UNTIL THIS DOCUMENT IS UPDATED TO APPROVED
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

## 9. Stop Conditions

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

## 10. Approval Block

```text
MAINNET DEPLOYMENT APPROVAL: NOT YET APPROVED

Approved deployment scope:
[ ] Base Mainnet only
[ ] Ethereum Mainnet only
[ ] Base Mainnet + Ethereum Mainnet
[ ] Defer deployment

Approved by:
Date:
Notes:
```

---

## 11. Final Status

```text
MAINNET DEPLOYMENT APPROVAL DECISION V1: NOT YET APPROVED
MAINNET DEPLOYMENT: NOT STARTED
DEPLOYMENT AUTHORIZATION: NOT YET APPROVED
PUBLIC LAUNCH: NOT READY
MAINNET REWARD CLAIM LAUNCH: NOT READY
```

P.S. Read this document freely for information and guidance. Do not redistribute or restate—no quotes, summaries, paraphrases, or derivatives—without prior written permission from [**Prof. NOTA**](https://nota.endhonesa.com/). Sharing the link is allowed. So, share the link, not the text. Do not discuss or re-tell the contents in any form—written, spoken, or recorded—without prior written permission.

---
