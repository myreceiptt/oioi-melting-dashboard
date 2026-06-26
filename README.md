# OiOi Melting Dashboard

Smart contract, deployment, frontend, admin-dashboard, indexer, and reward workspace for the OiOi Melting Dashboard ecosystem.

The project supports six NFT collections across two chain-specific ecosystems.

## Base Set

- ROTY BASE / ROTYBASE
- Melting BASE / MELTBASE
- Amanda BASE / AMANBASE
- OiOi Soft Staking on Base
- OiOi Reward Distributor on Base
- Base $OiOi token

## Ethereum Set

- ROTY dETH / ROTYDETH
- Melting dETH / MELTDETH
- Amanda dETH / AMANDETH
- OiOi Soft Staking on Ethereum
- OiOi Reward Distributor on Ethereum
- Ethereum $OiOi token

---

## Core Principle

```text
Required wallet compatibility, strict EOA-first identity.
```

Frontend v1 is:

- wallet-first
- chain-aware
- contract-state-driven
- EOA-first
- no embedded wallet
- no smart account / account abstraction
- no email login
- no phone login
- no passkey login
- no social login
- no identity linking

The connected Web3 wallet address is the user identity.

---

## Current Status

### Completed

- Smart contract suite implemented.
- Unit tests pass.
- Integration lifecycle tests pass.
- Reward Merkle generator works for prepared allocation/proof input.
- Deployment scripts are available.
- Local full smoke deployment works.
- Base Sepolia deployment completed.
- Base Sepolia verification completed.
- Base Sepolia read checks completed.
- Base Sepolia functional test completed.
- Ethereum Sepolia deployment completed.
- Ethereum Sepolia verification completed.
- Ethereum Sepolia read checks completed.
- Ethereum Sepolia functional test completed.
- Frontend architecture documented.
- Frontend Sepolia MVP implemented.
- ROTY public mint UI implemented.
- ROTY whitelist proof lookup and whitelist mint UI implemented.
- Melting/Amanda gated mint UI implemented.
- Dashboard stake/unstake UI implemented.
- Reward claim UI implemented against Supabase proof API and on-chain reads.
- Reward proof API implemented against Supabase reward tables.
- Admin dashboard implemented for mint phases, metadata, pricing/treasury/royalty, staking registry, reward rounds, and rescue controls.
- Admin reward create / approve / fund / pause / unpause flow completed on testnet.
- Owned NFT discovery implemented through backend API, Alchemy NFT data, on-chain staking checks, and Supabase cache.
- Frontend Sepolia Browser QA completed for read/OFF-phase/stake flows.
- Supabase indexer/reward pipeline scripts implemented.
- Boundary-sync worker orchestration implemented for reward tapal batas jobs.
- GitHub Actions scheduled worker implemented for slow, resumable boundary sync jobs.
- Reward calculation and Merkle proof storage implemented from indexed Supabase data.
- Testnet reward round flow completed through create, fund, claim, and closed states.
- BASE / dETH theme shell, App Navbar, App Footer, App Menu, and Theme Switcher implemented.
- Production-intended Sepolia rehearsal deployment completed.
- Subdomain Surface Behavior v1 passed.
- Production-intended Sepolia rehearsal domain QA passed.
- Full Testnet Browser QA v1 passed.
- Full Testnet Mutation QA v1 passed.
- Full Testnet E2E QA v1 passed.
- Worker jobs / boundary reward flow passed through GitHub Actions.
- Testnet Release Candidate Lock v1 passed.
- Mainnet Deployment Approval Gate v1 documented as ready with notes.
- Base Mainnet and Ethereum Mainnet contract deployment completed, verified, and read-checked.
- Production domains now serve mainnet.
- Mainnet public surface is live.
- Base Mainnet and Ethereum Mainnet mint phases are open.
- Production browser QA passed for the public mint/staking/admin baseline.
- Admin mainnet operations QA passed.

### Locked Decisions

- Mainnet deployment is deferred until explicit approval after Mainnet Deployment Approval Gate v1.
- Indexer + reward storage is Supabase Postgres-first.
- Local JSON is not the primary indexer storage.
- Supabase indexer sync is checkpointed, resumable, and worker-driven.
- Deployment scripts should not be rewritten only to capture block numbers.
- Indexer `FROM_BLOCK` values are manually read from block explorers.
- `TO_BLOCK` is optional and only for bounded backfill/testing.
- Admin Dashboard is implemented and remains the operational owner surface.
- Every stage has its own testing checkpoint.
- Full Testnet E2E QA v1 is the canonical QA pass report for the current Sepolia rehearsal surface.

### Current Canonical Docs

- `docs/qa/FULL_TESTNET_E2E_QA_V1.md` — canonical QA pass report.
- `docs/qa/TESTNET_RELEASE_CANDIDATE_LOCK_V1.md` — Testnet Release Candidate lock report.
- `docs/mainnet/MAINNET_DEPLOYMENT_APPROVAL_GATE_V1.md` — historical mainnet approval gate.
- `docs/mainnet/MAINNET_CONTRACT_DEPLOYMENT_COMPLETION_V1.md` — mainnet contract deployment completion record.
- `docs/qa/MAINNET_PUBLIC_SURFACE_AND_MINT_OPENING_QA_V1.md` — canonical production mainnet public surface and mint opening QA/status report.
- `docs/TESTNET_PRODUCT_COMPLETION_PLAN.md` — current operational next-step checklist.
- `URUTANSEHAT.md` — high-level sequence/status.
- `docs/qa/TESTNET_ROUTE_DOMAIN_MAPPING.md` — canonical route/domain mapping reference.
- `docs/qa/PRODUCTION_SUBDOMAIN_MAPPING_SEPOLIA_REHEARSAL.md` — domain QA pass record.

### Pending / Next

- Mainnet Reward Round Operations / Production Reward Data Plane.
- Mainnet Supabase/database separation or configuration for reward operations.
- Mainnet GitHub Actions worker/indexer env configuration.
- Mainnet reward calculation/proof generation validation.
- Mainnet reward claim launch approval.
- Final UI/UX polish pass.
- Mainnet reward claim remains not production-ready until mainnet indexer/reward/proof flow is implemented, run, verified, and approved.

---

## Contracts

```text
contracts/nft/MemorialNFTCore.sol
contracts/nft/TheRotyMemorial.sol
contracts/nft/MeltingMemorial.sol
contracts/nft/AmandaMemorial.sol
contracts/staking/OiOiSoftStaking.sol
contracts/rewards/OiOiRewardDistributor.sol
contracts/interfaces/
contracts/mocks/
```

---

## Important Scripts

### Compile and test

```bash
npm run build
npm run compile
npm run test
```

### Deployment config

```bash
npm run deploy:config -- baseSepolia
npm run deploy:config -- ethereumSepolia
npm run deploy:config -- baseMainnet
npm run deploy:config -- ethereumMainnet
```

### Preflight

```bash
npm run deploy:preflight -- baseSepolia
npm run deploy:preflight -- ethereumSepolia
npm run deploy:preflight -- baseMainnet
npm run deploy:preflight -- ethereumMainnet
```

### Local full smoke deployment

```bash
npm run deploy:local-full -- --network hardhatBase
npm run deploy:local-full -- --network hardhatMainnet
```

### Real deployment order

```bash
npm run deploy:roty -- --network <network>
npm run deploy:staking -- --network <network>
npm run deploy:register-roty -- --network <network>
npm run deploy:melting -- --network <network>
npm run deploy:register-melting -- --network <network>
npm run deploy:amanda -- --network <network>
npm run deploy:register-amanda -- --network <network>
npm run deploy:reward-distributor -- --network <network>
```

### Constructor args export

Run only after the deployment record exists:

```bash
npm run verify:args -- <network>
```

Do not treat `verify:args` as a pre-deployment smoke check for networks that have not been deployed yet.

### Read checks

```bash
npm run deploy:read-check -- --network baseSepolia
npm run deploy:read-check -- --network ethereumSepolia
npm run deploy:read-check -- --network baseMainnet
npm run deploy:read-check -- --network ethereumMainnet
```

### Restore mint phases

```bash
npm run deploy:restore-mint-phases -- --network baseSepolia
npm run deploy:restore-mint-phases -- --network ethereumSepolia
npm run deploy:restore-mint-phases -- --network baseMainnet
npm run deploy:restore-mint-phases -- --network ethereumMainnet
```

### Functional tests

```bash
npm run test:base-sepolia-functional -- --network baseSepolia
npm run test:ethereum-sepolia-functional -- --network ethereumSepolia
```

Do not run functional tests on mainnet unless intentionally minting real NFTs.

---

## Whitelist

ROTY whitelist source:

```text
scripts/whitelist/whitelist-oioi-snapshot-overrides.csv
```

Generate clean whitelist, Merkle root/proofs, and frontend proof data:

```bash
npm run whitelist:clean
npm run whitelist:merkle
npm run whitelist:frontend
```

The same ROTY whitelist root is used for Base and Ethereum.

Current locked root:

```text
0x0b2504d3e2d95c57e039aea1c027015bc0ecf39c3ad14424764faa696c3fcce9
```

Current clean unique addresses:

```text
2241
```

---

## Rewards

Reward allocation is calculated off-chain from indexed staking and ownership history.

Reward Distributor only verifies Merkle proofs and pays claims.

Canonical reward pipeline:

```text
submit tapal batas + reward amount in Admin Reward Operations
run boundary worker through GitHub Actions or local CLI
sync Transfer / Staked / Unstaked / Reward events to Supabase
rebuild derived ownership and stake state
calculate valid staking intervals
calculate weighted reward allocations
generate Merkle root/proofs
create reward round on-chain from Admin UI
approve and fund $OiOi
claim from Reward Claim Panel
```

Canonical worker command:

```bash
npm run indexer:boundary-worker
```

Canonical manual DB commands remain available for diagnostics and controlled recovery:

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

## Documentation

Key docs:

```text
docs/SPEC_LOCK.md
docs/IMPLEMENTATION_ROADMAP.md
docs/TESTNET_PRODUCT_COMPLETION_PLAN.md
docs/DEPLOYMENT_RUNBOOK.md
docs/TESTING_CHECKLIST.md
docs/MAINNET_READINESS_REVIEW.md
docs/FRONTEND_ARCHITECTURE.md
docs/FRONTEND_SEPOLIA_BROWSER_QA.md
docs/INDEXER_ARCHITECTURE.md
docs/INDEXER_OPERATIONAL_MODEL.md
docs/INDEXER_IMPLEMENTATION_PLAN.md
```

---

## Safety Rules

Never commit:

```text
.env
private keys
RPC secrets
API keys
generated constructor args
local deployment records
artifacts
cache
generated indexer output
generated reward output
generated whitelist output
```

Mainnet deployment is not public launch.

Mint opening must be a separate intentional decision.

Reward claim must remain disabled until reward proof data is available and tested.

---

P.S. Read this document freely for information and guidance. Do not redistribute or restate—no quotes, summaries, paraphrases, or derivatives—without prior written permission from [**Prof. NOTA**](https://nota.endhonesa.com/). Sharing the link is allowed. So, share the link, not the text. Do not discuss or re-tell the contents in any form—written, spoken, or recorded—without prior written permission.

---
