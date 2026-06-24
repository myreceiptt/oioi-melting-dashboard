# Testnet Release Candidate Lock v1

Date: 2026-06-24

Status: PASS

Commit SHA:

```text
9e6ee24adb4896223d6352376ea4a0b2d12d952d
```

Environment:

```text
Live Sepolia rehearsal on production-intended subdomains.
```

This document records the Testnet Release Candidate Lock v1 result for the OiOi Melting Dashboard testnet release surface.

The RC lock confirms that the current Sepolia rehearsal surface is ready to be treated as the locked testnet release candidate baseline.

This RC lock does not authorize mainnet deployment by itself.

Mainnet deployment still requires explicit approval.

---

## 1. Scope

The RC lock covers:

```text
smart contract read checks
frontend build health
test suite health
production-intended Sepolia rehearsal subdomains
wallet connect surface
dashboard read surface
admin read surface
reward read surface
GitHub Actions boundary worker status
testnet reward boundary flow
testnet reward round creation and claim validation
```

The canonical full E2E QA report is:

```text
docs/qa/FULL_TESTNET_E2E_QA_V1.md
```

---

## 2. Pre-RC Verification

Commands and results:

```text
git status --short: CLEAN
npm run lint:frontend: PASS
npm run build: PASS
npm run compile: PASS
npm run test: PASS
npm run deploy:read-check -- --network baseSepolia: PASS
npm run deploy:read-check -- --network ethereumSepolia: PASS
```

---

## 3. Browser Sanity Checks

Checked live Sepolia rehearsal surfaces:

```text
https://softstaking.endhonesa.com/: PASS
https://rotybase.endhonesa.com/: PASS
https://rotydeth.endhonesa.com/: PASS
https://softstaking.endhonesa.com/dashboard: PASS
https://softstaking.endhonesa.com/admin: PASS
```

Sanity checks:

```text
Sepolia banner visible: PASS
Wallet connect visible/works: PASS
Dashboard read surface: PASS
Admin read surface: PASS
Reward read surface: PASS
No missing env error: PASS
No major console error observed: PASS
```

The broader production-intended Sepolia rehearsal domain QA remains documented in:

```text
docs/qa/PRODUCTION_SUBDOMAIN_MAPPING_SEPOLIA_REHEARSAL.md
docs/qa/TESTNET_ROUTE_DOMAIN_MAPPING.md
```

---

## 4. Worker / Boundary Reward Flow

Status:

```text
GitHub Actions boundary worker last run: PASS
No active failed worker job requiring action.
No known stuck boundary job requiring action.
```

The worker jobs / boundary reward flow was previously validated through:

```text
GitHub Actions worker execution
Supabase boundary job processing
on-chain reward round creation
user reward claim with prepared wallets
```

Result:

```text
Worker jobs / boundary reward flow: PASS
```

---

## 5. Mint / Admin Baseline

Mint phase state has been reviewed and is intentionally set for the RC baseline.

Admin controlled operations remain available on Sepolia.

No mainnet environment is enabled.

---

## 6. Known Non-Blockers

Known non-blockers:

```text
Transient GitHub Actions failure can be recovered by rerun.
Transient RPC/cache delays are acceptable when recoverable.
Alchemy RPC access issues can be operational configuration issues and are not product/indexer logic blockers when resolved.
User-rejected wallet transaction is not a blocker.
```

---

## 7. Blockers

```text
none observed
```

---

## 8. RC Lock Verdict

```text
TESTNET RELEASE CANDIDATE LOCK V1: PASS
```

The current testnet release surface is locked as the Testnet Release Candidate v1 baseline.

---

## 9. Mainnet Status

```text
mainnet deployment: not started / deferred
mainnet env wiring: not started
mainnet read-only QA: not started
controlled mainnet opening: not started
public launch: not started
```

This RC lock does not authorize mainnet deployment by itself.

Mainnet deployment remains deferred until explicit approval.

---

P.S. Read this document freely for information and guidance. Do not redistribute or restate—no quotes, summaries, paraphrases, or derivatives—without prior written permission from [**Prof. NOTA**](https://nota.endhonesa.com/). Sharing the link is allowed. So, share the link, not the text. Do not discuss or re-tell the contents in any form—written, spoken, or recorded—without prior written permission.

---
