# OiOi Melting Dashboard — Mainnet Env Wiring Approval Decision v1

Date: 2026-06-25

Status:

```text
MAINNET ENV WIRING APPROVAL DECISION V1: HISTORICAL READ-ONLY APPROVAL
READ-ONLY MAINNET ENV WIRING: APPROVED
PRODUCTION MAINNET ENV: LIVE
MAINNET PUBLIC SURFACE: LIVE
MINT OPENING: DONE / LIVE
MAINNET REWARD CLAIM LAUNCH: NOT APPROVED
METADATA LOCK: NOT APPROVED
```

This decision originally approved read-only mainnet env wiring for frontend QA only.

Later production mainnet env wiring and mint opening were completed and are recorded in `docs/qa/MAINNET_PUBLIC_SURFACE_AND_MINT_OPENING_QA_V1.md`.

This document does not approve reward claim launch, metadata reveal, metadata lock, or `lockMetadata()`.

---

## 1. Decision Scope

Approved:

- Configure required mainnet environment variables for read-only frontend QA.
- Use committed deployment records as canonical contract sources.
- Allow frontend build/preview/QA against Base Mainnet and Ethereum Mainnet addresses.
- Keep all mint/reward/metadata actions unavailable unless already safely disabled by UI/code.

Not approved:

- Public launch.
- Opening mint phases.
- Enabling whitelist mint.
- Enabling public mint.
- Enabling gated mint.
- Funding reward distributor.
- Enabling reward claim.
- Revealing metadata.
- Updating final metadata.
- Calling `lockMetadata()`.
- Any on-chain transaction.

---

## 2. Canonical Mainnet Addresses

### Base Mainnet

```text
ROTY BASE: 0x55b74ec648ab9ec3e9557627b3b22cce27e2606c
OiOiSoftStaking: 0xd2211e042af0d618ec33622417064c761d5f71ea
Melting BASE: 0xed1f55128e43699f7ee50ad7ae61bca7d559d991
Amanda BASE: 0x486a060e304d02aa241a6904fa7cb95777f88b77
OiOiRewardDistributor: 0xfa9fe257e99b50547981273d249c04ab7e06d380
$OiOi Base: 0xba0032620d88D9b16752CbDE75593c080C3d38de
```

### Ethereum Mainnet

```text
ROTY dETH: 0xcb89275572ad3fb388d4c8ad78d7b94e05e5f218
OiOiSoftStaking: 0xa0dc510eecabb579ab3744224132ee46c6a2ef6a
Melting dETH: 0xb2dcc1d826f88a287924480b0f7b73e50ecb0192
Amanda dETH: 0xbfcef50a61847b321c54722a870ec43f49791263
OiOiRewardDistributor: 0x18d5e33c34d5da020c23ad3849ae28765da84fae
$OiOi Ethereum: 0x1C696882b93d7241d09D55f52693cAD367A5bEaf
```

---

## 3. Required Pre-Apply Checks

Before applying env wiring:

- `git status` clean.
- Latest `main` pulled.
- `.env` is not staged.
- Env variables reviewed against `MAINNET_ENV_WIRING_PLAN_V1`.
- No Sepolia address used in mainnet env.
- No server secret exposed as `NEXT_PUBLIC`.
- `npm run lint:frontend` passes.
- `npm run build` passes.
- Base read-check remains PASS.
- Ethereum read-check remains PASS.
- Mint phases remain OFF.
- Metadata remains unlocked.

Recommended read-check commands:

```bash
npm run deploy:read-check -- --network baseMainnet
npm run deploy:read-check -- --network ethereumMainnet
```

---

## 4. Approved Next Step

Approved operational step after this document was committed:

- Apply read-only mainnet env wiring locally and/or in Vercel environment.
- Run frontend build.
- Run mainnet read-only frontend QA.

Mainnet read-only frontend QA result:

```text
docs/qa/MAINNET_READ_ONLY_FRONTEND_QA_V1.md
MAINNET READ-ONLY FRONTEND QA V1: PASSED FOR LOCALHOST READ-ONLY QA
BASE MAINNET FRONTEND READS: PASS
ETHEREUM MAINNET FRONTEND READS: PASS
```

Still not approved:

- Reward claim launch.
- Metadata lock.

---

## 5. Approval Boundary

This decision is intentionally narrow.

Read-only env wiring is approved only for QA against deployed Base Mainnet and Ethereum Mainnet contracts.

No production opening or write action is authorized by this document.

Any later transition from read-only QA to controlled mint opening, reward claim launch, metadata update/reveal/lock, or public launch requires a separate explicit approval document.

The next major technical task after production mint opening is Mainnet Reward Round Operations / Production Reward Data Plane.

---

## 6. Final Status

```text
MAINNET ENV WIRING APPROVAL DECISION V1: HISTORICAL READ-ONLY APPROVAL
READ-ONLY MAINNET ENV WIRING: APPROVED
PRODUCTION MAINNET ENV: LIVE
MAINNET PUBLIC SURFACE: LIVE
MINT OPENING: DONE / LIVE
MAINNET REWARD CLAIM LAUNCH: NOT APPROVED
METADATA LOCK: NOT APPROVED
```

P.S. Read this document freely for information and guidance. Do not redistribute or restate—no quotes, summaries, paraphrases, or derivatives—without prior written permission from [**Prof. NOTA**](https://nota.endhonesa.com/). Sharing the link is allowed. So, share the link, not the text. Do not discuss or re-tell the contents in any form—written, spoken, or recorded—without prior written permission.

---
