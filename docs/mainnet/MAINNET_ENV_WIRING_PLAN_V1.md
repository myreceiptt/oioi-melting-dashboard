# OiOi Melting Dashboard — Mainnet Env Wiring Plan v1

Date: 2026-06-25

Status:

```text
MAINNET ENV WIRING PLAN V1: APPLIED FOR READ-ONLY QA
READ-ONLY MAINNET ENV WIRING: APPROVED
MAINNET READ-ONLY FRONTEND QA V1: PASSED FOR LOCALHOST READ-ONLY QA
PRODUCTION MAINNET ENV: LIVE
MAINNET PUBLIC SURFACE: LIVE
MINT OPENING: DONE / LIVE
MAINNET REWARD CLAIM LAUNCH: NOT APPROVED
METADATA LOCK: NOT APPROVED
CONTRACT DEPLOYMENT: COMPLETE
```

This document prepares the mainnet frontend/server environment wiring inventory after Base Mainnet and Ethereum Mainnet contract deployment completion.

Read-only mainnet env wiring was initially approved by `docs/mainnet/MAINNET_ENV_WIRING_APPROVAL_DECISION_V1.md`.

Later production mainnet env wiring and mint opening were completed and are recorded in `docs/qa/MAINNET_PUBLIC_SURFACE_AND_MINT_OPENING_QA_V1.md`.

This plan does not approve reward claim launch, metadata reveal, metadata lock, or `lockMetadata()`.

---

## 1. Canonical Mainnet Addresses

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

## 2. Env Variable Inventory

Inventory source: code-level scan of `process.env`, `NEXT_PUBLIC_*`, Supabase, RPC, indexer, reward, deploy, and chain/address usage.

| Variable | Scope | Current source/file | Proposed mainnet value/source | Required now? | Public safe? | Approval status | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `NEXT_PUBLIC_APP_ENV` | Public frontend / Vercel Production | `lib/utils/env.ts`, `lib/wallet/chains.ts`, admin reward controls | `mainnet` | Phase A only after approval | Yes | NOT APPROVED | Switches app contracts/chains from Sepolia to mainnet. |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | Public frontend / Vercel Production | `lib/wallet/wagmiConfig.ts` | Existing WalletConnect project ID | Phase A | Yes | READY FOR REVIEW | Browser-visible by WalletConnect design. |
| `NEXT_PUBLIC_BASE_ROTY_CONTRACT` | Public frontend / Vercel Production | `lib/contracts/addresses.ts` | `0x55b74ec648ab9ec3e9557627b3b22cce27e2606c` | Phase A only after approval | Yes | NOT APPROVED | Base Mainnet ROTY. |
| `NEXT_PUBLIC_BASE_MELTING_CONTRACT` | Public frontend / Vercel Production | `lib/contracts/addresses.ts` | `0xed1f55128e43699f7ee50ad7ae61bca7d559d991` | Phase A only after approval | Yes | NOT APPROVED | Base Mainnet Melting. |
| `NEXT_PUBLIC_BASE_AMANDA_CONTRACT` | Public frontend / Vercel Production | `lib/contracts/addresses.ts` | `0x486a060e304d02aa241a6904fa7cb95777f88b77` | Phase A only after approval | Yes | NOT APPROVED | Base Mainnet Amanda. |
| `NEXT_PUBLIC_BASE_STAKING_CONTRACT` | Public frontend / Vercel Production | `lib/contracts/addresses.ts` | `0xd2211e042af0d618ec33622417064c761d5f71ea` | Phase A only after approval | Yes | NOT APPROVED | Base Mainnet soft staking. |
| `NEXT_PUBLIC_BASE_REWARD_DISTRIBUTOR` | Public frontend / Vercel Production | `lib/contracts/addresses.ts` | `0xfa9fe257e99b50547981273d249c04ab7e06d380` | Phase A only after approval | Yes | NOT APPROVED | Read-only reward surface only until reward claim launch approval. |
| `NEXT_PUBLIC_BASE_OIOI_TOKEN` | Public frontend / Vercel Production | `lib/contracts/addresses.ts` | `0xba0032620d88D9b16752CbDE75593c080C3d38de` | Phase A only after approval | Yes | NOT APPROVED | Base Mainnet `$OiOi`. |
| `NEXT_PUBLIC_ETH_ROTY_CONTRACT` | Public frontend / Vercel Production | `lib/contracts/addresses.ts` | `0xcb89275572ad3fb388d4c8ad78d7b94e05e5f218` | Phase A only after approval | Yes | NOT APPROVED | Ethereum Mainnet ROTY. |
| `NEXT_PUBLIC_ETH_MELTING_CONTRACT` | Public frontend / Vercel Production | `lib/contracts/addresses.ts` | `0xb2dcc1d826f88a287924480b0f7b73e50ecb0192` | Phase A only after approval | Yes | NOT APPROVED | Ethereum Mainnet Melting. |
| `NEXT_PUBLIC_ETH_AMANDA_CONTRACT` | Public frontend / Vercel Production | `lib/contracts/addresses.ts` | `0xbfcef50a61847b321c54722a870ec43f49791263` | Phase A only after approval | Yes | NOT APPROVED | Ethereum Mainnet Amanda. |
| `NEXT_PUBLIC_ETH_STAKING_CONTRACT` | Public frontend / Vercel Production | `lib/contracts/addresses.ts` | `0xa0dc510eecabb579ab3744224132ee46c6a2ef6a` | Phase A only after approval | Yes | NOT APPROVED | Ethereum Mainnet soft staking. |
| `NEXT_PUBLIC_ETH_REWARD_DISTRIBUTOR` | Public frontend / Vercel Production | `lib/contracts/addresses.ts` | `0x18d5e33c34d5da020c23ad3849ae28765da84fae` | Phase A only after approval | Yes | NOT APPROVED | Read-only reward surface only until reward claim launch approval. |
| `NEXT_PUBLIC_ETH_OIOI_TOKEN` | Public frontend / Vercel Production | `lib/contracts/addresses.ts` | `0x1C696882b93d7241d09D55f52693cAD367A5bEaf` | Phase A only after approval | Yes | NOT APPROVED | Ethereum Mainnet `$OiOi`. |
| `NEXT_PUBLIC_BASE_SEPOLIA_*` | Public frontend / Vercel Sepolia rehearsal | `lib/contracts/addresses.ts` | Keep existing Sepolia values outside mainnet wiring | No | Yes | KEEP SEPARATE | Must not be mixed into mainnet build. |
| `NEXT_PUBLIC_ETHEREUM_SEPOLIA_*` | Public frontend / Vercel Sepolia rehearsal | `lib/contracts/addresses.ts` | Keep existing Sepolia values outside mainnet wiring | No | Yes | KEEP SEPARATE | Must not be mixed into mainnet build. |
| `NEXT_PUBLIC_ROTY_BROI_ORIGIN_URL` | Public deploy/config domain value | `scripts/deploy/00-config.ts` | Existing ROTY origin URL or default | No for frontend env wiring | Yes | NOT NEEDED FOR PHASE A | Used by deploy config, not current frontend routing. |
| `NEXT_PUBLIC_ROTY_BASE_URL` | Public deploy/config domain value | `scripts/deploy/00-config.ts` | `https://rotybase.endhonesa.com/` | No for frontend env wiring | Yes | NOT NEEDED FOR PHASE A | Used by deploy config, not current frontend routing. |
| `NEXT_PUBLIC_ROTY_DETH_URL` | Public deploy/config domain value | `scripts/deploy/00-config.ts` | `https://rotydeth.endhonesa.com/` | No for frontend env wiring | Yes | NOT NEEDED FOR PHASE A | Used by deploy config, not current frontend routing. |
| `NEXT_PUBLIC_MELTING_BASE_URL` | Public deploy/config domain value | `scripts/deploy/00-config.ts` | `https://meltingbase.endhonesa.com/` | No for frontend env wiring | Yes | NOT NEEDED FOR PHASE A | Used by deploy config, not current frontend routing. |
| `NEXT_PUBLIC_MELTING_DETH_URL` | Public deploy/config domain value | `scripts/deploy/00-config.ts` | `https://meltingdeth.endhonesa.com/` | No for frontend env wiring | Yes | NOT NEEDED FOR PHASE A | Used by deploy config, not current frontend routing. |
| `NEXT_PUBLIC_AMANDA_BASE_URL` | Public deploy/config domain value | `scripts/deploy/00-config.ts` | `https://amandabase.endhonesa.com/` | No for frontend env wiring | Yes | NOT NEEDED FOR PHASE A | Used by deploy config, not current frontend routing. |
| `NEXT_PUBLIC_AMANDA_DETH_URL` | Public deploy/config domain value | `scripts/deploy/00-config.ts` | `https://amandadeth.endhonesa.com/` | No for frontend env wiring | Yes | NOT NEEDED FOR PHASE A | Used by deploy config, not current frontend routing. |
| `NEXT_PUBLIC_SOFTSTAKING_URL` | Public deploy/config domain value | `scripts/deploy/00-config.ts` | `https://softstaking.endhonesa.com/` | No for frontend env wiring | Yes | NOT NEEDED FOR PHASE A | Used by deploy config, not current frontend routing. |
| `SUPABASE_URL` | Server-only API/indexer/dashboard | `lib/supabase/server.ts`, API routes, indexer scripts | Existing Supabase project or separate approved mainnet Supabase project | Phase A if read-only APIs remain active | No | NOT APPROVED | Required by server APIs. Do not expose as `NEXT_PUBLIC` unless architecture changes. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only API/indexer/dashboard secret | `lib/supabase/server.ts`, API routes, indexer scripts | Service-role key for approved target Supabase project | Phase A if read-only APIs remain active | No | NOT APPROVED | Must remain server-only. Never expose to browser. |
| `SUPABASE_ANON_KEY` | Not found in current code | `.env.example` only | Not found in current code. Needs implementation before wiring. | No | Depends | NOT NEEDED | Do not add to Vercel unless code needs it. |
| `SUPABASE_PUBLISHABLE_KEY` | Not found in current code | `.env.example` only | Not found in current code. Needs implementation before wiring. | No | Depends | NOT NEEDED | Do not add to Vercel unless code needs it. |
| `SUPABASE_SECRET_KEY` | Not found in current code | `.env.example` only | Not found in current code. Needs implementation before wiring. | No | No | NOT NEEDED | Do not add to Vercel unless code needs it. |
| `SUPABASE_JWT_SECRET` | Not found in current code | `.env.example` only | Not found in current code. Needs implementation before wiring. | No | No | NOT NEEDED | Do not add to Vercel unless code needs it. |
| `ALCHEMY_API_KEY` | Server-only dashboard NFT API | `lib/dashboard/walletNfts.ts` | Alchemy key approved for mainnet read-only NFT discovery | Phase A if dashboard NFT discovery is active | No | NOT APPROVED | Used by NFT API, not browser-exposed. |
| `ALCHEMY_BASE_MAINNET_RPC_URL` | Server-only dashboard NFT API / RPC | `lib/dashboard/walletNfts.ts` | Base Mainnet Alchemy RPC URL | Phase A if dashboard NFT discovery is active | No | NOT APPROVED | Preferred mainnet Base RPC for dashboard NFT enrichment. |
| `ALCHEMY_ETHEREUM_MAINNET_RPC_URL` | Server-only dashboard NFT API / RPC | `lib/dashboard/walletNfts.ts` | Ethereum Mainnet Alchemy RPC URL | Phase A if dashboard NFT discovery is active | No | NOT APPROVED | Preferred mainnet Ethereum RPC for dashboard NFT enrichment. |
| `BASE_RPC_URL` | Server/local deploy/read API fallback | `hardhat.config.ts`, `lib/dashboard/walletNfts.ts`, deploy scripts | Base Mainnet RPC URL | Phase A only if used as server fallback; deploy-only otherwise | No | NOT APPROVED | Also used by Hardhat. Keep server/local only. |
| `ETHEREUM_RPC_URL` | Server/local deploy/read API fallback | `hardhat.config.ts`, `lib/dashboard/walletNfts.ts`, deploy scripts | Ethereum Mainnet RPC URL | Phase A only if used as server fallback; deploy-only otherwise | No | NOT APPROVED | Also used by Hardhat. Keep server/local only. |
| `ALCHEMY_BASE_SEPOLIA_RPC_URL` | Server-only Sepolia dashboard NFT API / RPC | `lib/dashboard/walletNfts.ts` | Existing Sepolia value | No for mainnet wiring | No | KEEP SEPARATE | Sepolia rehearsal only. |
| `ALCHEMY_ETHEREUM_SEPOLIA_RPC_URL` | Server-only Sepolia dashboard NFT API / RPC | `lib/dashboard/walletNfts.ts` | Existing Sepolia value | No for mainnet wiring | No | KEEP SEPARATE | Sepolia rehearsal only. |
| `BASE_SEPOLIA_RPC_URL` | Sepolia worker/deploy/indexer | `.github/workflows/boundary-worker.yml`, `scripts/indexer/config.ts`, deploy scripts | Existing Sepolia RPC | No for mainnet wiring | No | KEEP SEPARATE | Do not mix into mainnet worker/frontend. |
| `ETHEREUM_SEPOLIA_RPC_URL` | Sepolia worker/deploy/indexer | `.github/workflows/boundary-worker.yml`, `scripts/indexer/config.ts`, deploy scripts | Existing Sepolia RPC | No for mainnet wiring | No | KEEP SEPARATE | Do not mix into mainnet worker/frontend. |
| `BASE_MAINNET_INDEXER_FROM_BLOCK` | Mainnet indexer start block | `.github/workflows/mainnet-boundary-worker.yml`, indexer scripts | Base Mainnet first project deployment block | Required only for approved manual mainnet worker runs | No | NOT APPROVED FOR REWARD CLAIM LAUNCH | Supported by the mainnet data-plane foundation. Mainnet worker remains manual-only and reward claim remains disabled until separately validated/approved. |
| `BASE_MAINNET_INDEXER_TO_BLOCK` | Optional mainnet indexer target block | indexer scripts | Optional bounded mainnet worker target | No | No | OPTIONAL | Not a reward tapal batas. Use only for bounded diagnostics/backfill. |
| `ETHEREUM_MAINNET_INDEXER_FROM_BLOCK` | Mainnet indexer start block | `.github/workflows/mainnet-boundary-worker.yml`, indexer scripts | Ethereum Mainnet first project deployment block | Required only for approved manual mainnet worker runs | No | NOT APPROVED FOR REWARD CLAIM LAUNCH | Supported by the mainnet data-plane foundation. Mainnet worker remains manual-only and reward claim remains disabled until separately validated/approved. |
| `ETHEREUM_MAINNET_INDEXER_TO_BLOCK` | Optional mainnet indexer target block | indexer scripts | Optional bounded mainnet worker target | No | No | OPTIONAL | Not a reward tapal batas. Use only for bounded diagnostics/backfill. |
| `BASE_SEPOLIA_INDEXER_FROM_BLOCK` | Sepolia worker/indexer | `.github/workflows/boundary-worker.yml`, `lib/indexer/boundarySyncWorker.ts` | Existing Sepolia start block | No for mainnet wiring | No | KEEP SEPARATE | Current GitHub Actions worker is Sepolia-only. |
| `ETHEREUM_SEPOLIA_INDEXER_FROM_BLOCK` | Sepolia worker/indexer | `.github/workflows/boundary-worker.yml`, `lib/indexer/boundarySyncWorker.ts` | Existing Sepolia start block | No for mainnet wiring | No | KEEP SEPARATE | Current GitHub Actions worker is Sepolia-only. |
| `INDEXER_BLOCK_RANGE` | Sepolia worker/indexer tuning | `.github/workflows/boundary-worker.yml`, indexer scripts | Existing conservative value | No for mainnet wiring | No | KEEP SEPARATE | Mainnet worker tuning requires a later approval. |
| `INDEXER_WORKER_BLOCK_SPAN` | Boundary worker tuning | `.github/workflows/boundary-worker.yml`, `.github/workflows/mainnet-boundary-worker.yml`, `lib/indexer/boundarySync.ts` | Existing Sepolia value or approved mainnet manual-run value | Only for worker runs | No | KEEP SEPARATE | Mainnet workflow is manual-only and can use `MAINNET_INDEXER_WORKER_BLOCK_SPAN` override. |
| `INDEXER_WORKER_COMMAND_TIMEOUT_MS` | Boundary worker tuning | `.github/workflows/boundary-worker.yml`, `.github/workflows/mainnet-boundary-worker.yml`, `lib/indexer/boundarySyncWorker.ts` | Existing Sepolia value or approved mainnet manual-run value | Only for worker runs | No | KEEP SEPARATE | Keep conservative for mainnet manual worker runs. |
| `INDEXER_WORKER_LOCK_TTL_SECONDS` | Boundary worker tuning | `.github/workflows/boundary-worker.yml`, `.github/workflows/mainnet-boundary-worker.yml`, `lib/indexer/boundarySync.ts` | Existing Sepolia value or approved mainnet manual-run value | Only for worker runs | No | KEEP SEPARATE | Supabase data planes remain separate. |
| `INDEXER_WORKER_RATE_LIMIT_DELAY_SECONDS` | Boundary worker tuning | `.github/workflows/boundary-worker.yml`, `.github/workflows/mainnet-boundary-worker.yml`, `lib/indexer/boundarySync.ts` | Existing Sepolia value or approved mainnet manual-run value | Only for worker runs | No | KEEP SEPARATE | Use conservative delay values for mainnet RPC safety. |
| `INDEXER_WORKER_RETRY_DELAY_SECONDS` | Boundary worker tuning | `.github/workflows/boundary-worker.yml`, `.github/workflows/mainnet-boundary-worker.yml`, `lib/indexer/boundarySync.ts` | Existing Sepolia value or approved mainnet manual-run value | Only for worker runs | No | KEEP SEPARATE | Mainnet workflow is not scheduled yet. |
| `INDEXER_CRON_SECRET` | Server/GitHub Actions cron secret | `app/api/cron/boundary-sync/route.ts`, `lib/indexer/boundarySyncWorker.ts`, workflow | Existing Sepolia cron secret | No for mainnet wiring | No | NOT APPROVED FOR MAINNET | Mainnet worker/cron needs a later approval. |
| `REWARD_CALCULATION_AMOUNT_OIOI` | Local/worker child env | `scripts/rewards/calculate-rewards-db.ts`, boundary worker | Not needed for Phase A | No | No | NOT APPROVED | Used only by approved reward calculation jobs. |
| `REWARD_ROUND_ID` | Local/worker child env | `scripts/rewards/generate-merkle-db.ts`, boundary worker | Not needed for Phase A | No | No | NOT APPROVED | Used only by approved Merkle generation jobs. |
| `PRIVATE_KEY` | Local deploy/operator secret | `hardhat.config.ts`, deploy scripts, preflight | Existing operator wallet private key, local only | No for env wiring | No | NOT FOR VERCEL | Never store in frontend/Vercel env for this app. |
| `ETHERSCAN_API_KEY` | Local deploy/verify secret | `hardhat.config.ts`, verify scripts | Existing explorer API key | No for env wiring | No | NOT FOR FRONTEND | Deploy/verify only. |
| `DEPLOYER_ADDRESS` | Local deploy/read-check config | `scripts/deploy/00-config.ts`, preflight/read-check | `0x29bf68e3969e0b6686ea55b7c48241ba3f6b9ba0` | No for env wiring | Address is public | NOT NEEDED FOR VERCEL | Used by deployment/read-check tooling. |
| `MINT_TREASURY_ADDRESS` | Local deploy/read-check config | `scripts/deploy/00-config.ts`, preflight/read-check | `0x9e26b98d4fadf70d0c0e57c609347358934a934c` | No for env wiring | Address is public | NOT NEEDED FOR VERCEL | Used by deployment/read-check tooling. |
| `ROYALTY_RECEIVER_ADDRESS` | Local deploy/read-check config | `scripts/deploy/00-config.ts`, preflight/read-check | `0x29bf68e3969e0b6686ea55b7c48241ba3f6b9ba0` | No for env wiring | Address is public | NOT NEEDED FOR VERCEL | Used by deployment/read-check tooling. |
| `BASE_SEPOLIA_OIOI_TOKEN` | Testnet deploy-only | `scripts/deploy/00-config.ts`, preflight | Existing Sepolia token | No | Address is public | KEEP SEPARATE | Testnet deployment config only. |
| `ETHEREUM_SEPOLIA_OIOI_TOKEN` | Testnet deploy-only | `scripts/deploy/00-config.ts`, preflight | Existing Sepolia token | No | Address is public | KEEP SEPARATE | Testnet deployment config only. |
| `BASE_OIOI_TOKEN` | Not found in current code | `.env.example` only | Not found in current code. Needs implementation before wiring if expected. | No | Address is public | NOT NEEDED | Mainnet `$OiOi` is hardcoded in deploy/reward config today. |
| `ETH_OIOI_TOKEN` | Not found in current code | `.env.example` only | Not found in current code. Needs implementation before wiring if expected. | No | Address is public | NOT NEEDED | Mainnet `$OiOi` is hardcoded in deploy/reward config today. |
| `POSTGRES_*` | Not found in current code | `.env.example` only | Not found in current code. Needs implementation before wiring. | No | No | NOT NEEDED | Current app uses Supabase service client directly. |

---

## 3. Proposed Wiring Phases

### Phase A — Read-Only Mainnet Frontend Wiring

```text
Purpose: allow mainnet read-only QA only.
No mint opening.
No reward claim launch.
No public announcement.
No metadata lock.
```

Phase A may wire mainnet public contract addresses, mainnet app env, WalletConnect project ID, and server-only read dependencies needed for dashboard/API read surfaces. Phase A must not enable mint phases or claim readiness by wording, UI announcement, or operational action.

Phase A localhost read-only frontend QA result:

```text
docs/qa/MAINNET_READ_ONLY_FRONTEND_QA_V1.md
BASE MAINNET FRONTEND READS: PASS
ETHEREUM MAINNET FRONTEND READS: PASS
```

### Phase B — Controlled Mint Wiring

```text
Requires separate approval.
Only after read-only QA passes and a separate controlled opening approval is recorded.
```

Phase B is a later approval gate for enabling controlled mint phases. It is not included in this plan approval.

### Phase C — Indexer/Reward/Proof Production Wiring

```text
Requires separate validation.
Reward claim remains disabled until approved.
```

Mainnet indexer/reward env names are supported by the parallel mainnet data
plane foundation. Production reward claim must still wait until mainnet
Supabase schema/seed setup, indexing, reward calculation, proof generation, and
claim QA are configured, run, verified, and explicitly approved.

### Phase D — Public Launch

```text
Requires separate launch approval.
```

Public launch is not authorized by env wiring readiness.

---

## 4. Required Checks Before Applying Env Wiring

```text
git status clean
npm run lint:frontend
npm run build
mainnet deployment records present
Base and Ethereum read-check PASS
public launch still not approved
mint phases still OFF
metadata still unlocked
reward claim still not approved
```

Required record files:

```text
deployments/base-mainnet/deployment.json
deployments/ethereum-mainnet/deployment.json
```

Required read checks:

```bash
npm run deploy:read-check -- --network baseMainnet
npm run deploy:read-check -- --network ethereumMainnet
```

---

## 5. Stop Conditions

Stop immediately if any of these conditions appear:

```text
missing env inventory
unknown env var required by frontend
accidental .env commit
public launch wording introduced
mint opening introduced
reward claim enabled
metadata lock/reveal introduced
incorrect contract address
wrong chain ID
Sepolia address mixed into mainnet env
mainnet address mixed into Sepolia env
server secret exposed as NEXT_PUBLIC
```

Additional stop conditions:

- Vercel production env contains `PRIVATE_KEY`.
- Vercel production env contains deploy-only keys that are not needed by runtime.
- Any server-only secret is converted into a `NEXT_PUBLIC_*` variable.
- Mainnet reward worker is assumed ready without code-level mainnet worker support and production validation.

---

## 6. Approval Boundary

Read-only env wiring is approved only for QA by:

```text
docs/mainnet/MAINNET_ENV_WIRING_APPROVAL_DECISION_V1.md
```

That original approval did not include public launch, mint opening, reward claim launch, metadata lock, or any on-chain transaction. Later production mainnet env wiring and mint opening were completed and are recorded in `docs/qa/MAINNET_PUBLIC_SURFACE_AND_MINT_OPENING_QA_V1.md`.

```text
READ-ONLY MAINNET ENV WIRING: APPROVED
PRODUCTION MAINNET ENV: LIVE
MAINNET PUBLIC SURFACE: LIVE
MINT OPENING: DONE / LIVE
MAINNET REWARD CLAIM LAUNCH: NOT APPROVED
METADATA LOCK: NOT APPROVED
```

---

## 7. Final Status

```text
MAINNET ENV WIRING PLAN V1: APPLIED FOR READ-ONLY QA
READ-ONLY MAINNET ENV WIRING: APPROVED
MAINNET READ-ONLY FRONTEND QA V1: PASSED FOR LOCALHOST READ-ONLY QA
PRODUCTION MAINNET ENV: LIVE
MAINNET PUBLIC SURFACE: LIVE
MINT OPENING: DONE / LIVE
MAINNET REWARD CLAIM LAUNCH: NOT APPROVED
METADATA LOCK: NOT APPROVED
```

P.S. Read this document freely for information and guidance. Do not redistribute or restate—no quotes, summaries, paraphrases, or derivatives—without prior written permission from [**Prof. NOTA**](https://nota.endhonesa.com/). Sharing the link is allowed. So, share the link, not the text. Do not discuss or re-tell the contents in any form—written, spoken, or recorded—without prior written permission.

---
