# OiOi Melting Dashboard - Mainnet Read-Only Frontend QA v1

Date: 2026-06-25

Status:

```text
MAINNET READ-ONLY FRONTEND QA V1: PASSED FOR LOCALHOST READ-ONLY QA
BASE MAINNET FRONTEND READS: PASS
ETHEREUM MAINNET FRONTEND READS: PASS
MAINNET PUBLIC SURFACE: LIVE
MINT OPENING: DONE / LIVE
MAINNET REWARD CLAIM LAUNCH: NOT APPROVED
METADATA LOCK: NOT APPROVED
```

This report records the read-only frontend QA result after mainnet env wiring was approved for QA only.

Later production-domain browser QA and mint opening passed and are recorded in `docs/qa/MAINNET_PUBLIC_SURFACE_AND_MINT_OPENING_QA_V1.md`.

This report does not approve reward claim launch, metadata reveal, metadata lock, or `lockMetadata()`.

---

## 1. Scope

Environment:

```text
localhost read-only frontend QA using mainnet env wiring
Base Mainnet deployed contracts
Ethereum Mainnet deployed contracts
```

Canonical preceding documents:

```text
docs/mainnet/MAINNET_CONTRACT_DEPLOYMENT_COMPLETION_V1.md
docs/mainnet/MAINNET_ENV_WIRING_PLAN_V1.md
docs/mainnet/MAINNET_ENV_WIRING_APPROVAL_DECISION_V1.md
```

Commit at the time of the frontend read fix:

```text
e007a75 fix: stabilize mainnet read-only contract reads
```

`.env.local` was local/ignored and must not be committed.

---

## 2. Issue And Fix

Observed issue:

```text
Ethereum Mainnet frontend contract reads were stuck in Loading/Refreshing while Base Mainnet reads worked.
```

Root cause:

```text
The frontend Ethereum read path was using wagmi default RPC / browser read transport behavior that was not stable for the mainnet read-only QA environment. Server-side deployment read-checks used operator RPC configuration and passed.
```

Fix applied before this QA report:

- Stabilized frontend wagmi transports with explicit public frontend RPC env support:
  - `NEXT_PUBLIC_ALCHEMY_BASE_MAINNET_RPC_URL`
  - `NEXT_PUBLIC_ALCHEMY_ETHEREUM_MAINNET_RPC_URL`
  - `NEXT_PUBLIC_ALCHEMY_BASE_SEPOLIA_RPC_URL`
  - `NEXT_PUBLIC_ALCHEMY_ETHEREUM_SEPOLIA_RPC_URL`
- Kept public RPC fallbacks for frontend reads.
- Ensured mint read hooks use explicit target `chainId`.
- Ensured gated eligibility reads use explicit target `chainId`.
- Ensured dashboard read panel staking summary reads use explicit target `chainId`.
- No contract state change was made.

---

## 3. Manual Frontend QA Result

| Surface | Result | Notes |
| --- | --- | --- |
| `/mint/roty/base` | PASS | Base Mainnet read-only frontend reads returned. |
| `/mint/roty/ethereum` | PASS | Ethereum Mainnet read-only frontend reads returned after the frontend read fix. |
| Dashboard Base read-only panel | PASS | Base Mainnet dashboard read surface returned. |
| Dashboard Ethereum read-only panel | PASS | Ethereum Mainnet dashboard read surface returned. |
| `/mint/melting/base` | NOT CHECKED | Outside the confirmed manual evidence for this report. |
| `/mint/melting/ethereum` | NOT CHECKED | Outside the confirmed manual evidence for this report. |
| `/mint/amanda/base` | NOT CHECKED | Outside the confirmed manual evidence for this report. |
| `/mint/amanda/ethereum` | NOT CHECKED | Outside the confirmed manual evidence for this report. |
| Admin Base read-only panel | NOT CHECKED | Outside the confirmed manual evidence for this report. |
| Admin Ethereum read-only panel | NOT CHECKED | Outside the confirmed manual evidence for this report. |
| No Sepolia address shown in mainnet mode | NOT CHECKED | Must be included in later broader mainnet browser QA. |
| No transaction prompt during read-only QA | NOT CHECKED | Must be included in later broader mainnet browser QA. |

Read-only frontend QA status for the confirmed scope:

```text
BASE MAINNET FRONTEND READS: PASS
ETHEREUM MAINNET FRONTEND READS: PASS
```

---

## 4. Command Validation

Pre-doc repository state:

```text
git status --short: clean
latest relevant commit: e007a75 fix: stabilize mainnet read-only contract reads
.env.local: ignored / uncommitted
```

Validation:

```text
npm run lint:frontend: PASS
npm run build: PASS
```

Read-check commands:

```bash
npm run deploy:read-check -- --network baseMainnet
npm run deploy:read-check -- --network ethereumMainnet
```

Initial local attempts for the exact commands above timed out against Alchemy because the local DNS/network path selected NAT64/IPv6 routes first. This was a local networking/RPC connectivity issue, not a contract or read-check logic failure.

Read-check retry with IPv4-first DNS ordering:

```bash
NODE_OPTIONS=--dns-result-order=ipv4first npm run deploy:read-check -- --network baseMainnet
NODE_OPTIONS=--dns-result-order=ipv4first npm run deploy:read-check -- --network ethereumMainnet
```

Result:

```text
Base Mainnet read-check: PASS
Ethereum Mainnet read-check: PASS
```

---

## 5. Current Boundary

This historical QA pass did not approve mint opening by itself. Later production mint opening was completed and documented separately.

Still not approved:

- Funding reward distributor.
- Reward claim launch.
- Metadata reveal.
- Metadata lock.
- Calling `lockMetadata()`.

Mainnet reward claim launch still requires separate production indexer/reward/proof validation and explicit approval.

---

## 6. Known Notes

- The IPv4-first read-check retry is documented because local DNS/NAT64/IPv6 routing caused operator RPC timeouts.
- The read-only frontend fix changed frontend read transport and target-chain read behavior only.
- `.env.local` remains local/ignored and must not be committed.
- Broader production-domain mainnet browser QA later passed and is recorded in `docs/qa/MAINNET_PUBLIC_SURFACE_AND_MINT_OPENING_QA_V1.md`.

---

## 7. Current Next Task

```text
Mainnet Reward Round Operations / Production Reward Data Plane
```

Current status:

- Mainnet public surface: live.
- Mint opening: done / live.
- Reward claim launch: deferred.
- Metadata lock: not performed.
- Reward Round Operations: pending mainnet database/indexer/proof support.

---

## 8. Final Status

```text
MAINNET READ-ONLY FRONTEND QA V1: PASSED FOR LOCALHOST READ-ONLY QA
BASE MAINNET FRONTEND READS: PASS
ETHEREUM MAINNET FRONTEND READS: PASS
MAINNET PUBLIC SURFACE: LIVE
MINT OPENING: DONE / LIVE
MAINNET REWARD CLAIM LAUNCH: NOT APPROVED
METADATA LOCK: NOT APPROVED
```

P.S. Read this document freely for information and guidance. Do not redistribute or restate—no quotes, summaries, paraphrases, or derivatives—without prior written permission from [**Prof. NOTA**](https://nota.endhonesa.com/). Sharing the link is allowed. So, share the link, not the text. Do not discuss or re-tell the contents in any form—written, spoken, or recorded—without prior written permission.

---
