# OiOi Melting Dashboard

Smart contract, deployment, frontend, and indexer workspace for the OiOi Melting Dashboard ecosystem.

The project supports six NFT collections across two chain-specific ecosystems.

---

## Base Set

- The ROTY BASE / ROTYBASE
- Melting BASE / MELTBASE
- Amanda BASE / AMANBASE
- OiOiSoftStaking on Base
- OiOiRewardDistributor on Base
- Base $OiOi token

---

## Ethereum Set

- The ROTY dETH / ROTYDETH
- MELTING dETH / MELTDETH
- Amanda dETH / AMANDETH
- OiOiSoftStaking on Ethereum
- OiOiRewardDistributor on Ethereum
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

Completed:

- Smart contract suite implemented.
- Unit tests pass.
- Integration lifecycle tests pass.
- Reward Merkle generator works.
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
- Mint phases are restored to OFF after functional testing.
- Frontend architecture documented.
- Frontend skeleton implemented.
- Frontend contract config implemented.
- Frontend contract read layer implemented.
- ROTY public mint UI implemented.
- ROTY whitelist proof lookup and whitelist mint UI implemented.
- Melting/Amanda gated mint UI implemented.
- Dashboard stake/unstake UI implemented.
- Reward claim placeholder implemented.
- Frontend Sepolia browser QA completed.
- Homepage links for all mint pages and dashboards completed.
- Indexer architecture documented.
- Indexer implementation plan documented.
- Indexer skeleton implemented.

Paused / Experimental:

- Transfer sync draft exists but is not accepted as the active operational path yet.
- `scripts/indexer/sync.ts` may contain paused/experimental transfer-sync work.
- Do not continue Transfer Sync, Staking Sync, Reward Sync, or Duration Calculator implementation until `docs/INDEXER_OPERATIONAL_MODEL.md` is committed and accepted.

Pending:

- Indexer Operational Model v1 documentation.
- Mainnet deployment.
- Mainnet verification/read checks.
- Mainnet frontend environment switch.
- Mainnet browser QA.
- Indexer operational implementation.
- Reward proof API / static reward proof publication.
- Final mint opening.
- Public reward claim launch.

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

## Frontend

Frontend stack:

```text
Next.js
TypeScript
Tailwind
wagmi
viem
TanStack Query
custom wallet modal
```

Implemented routes:

```text
/
/dashboard
/dashboard/base
/dashboard/ethereum
/mint/roty/base
/mint/roty/ethereum
/mint/melting/base
/mint/melting/ethereum
/mint/amanda/base
/mint/amanda/ethereum
/api/whitelist/roty/[chain]/[address]
```

Implemented frontend features:

- wallet connection
- ChainGuard
- contract state reads
- ROTY public mint UI
- ROTY whitelist proof lookup
- ROTY whitelist mint UI
- Melting/Amanda gated mint UI
- dashboard staking summary
- manual tokenId stake/unstake panel
- reward claim placeholder
- explorer links

Reward claim is not active yet because reward proof data still depends on the indexer/reward pipeline.

---

## Indexer

Current accepted indexer status:

```text
Indexer skeleton: implemented.
Indexer operational model: pending.
Transfer sync: paused / experimental draft.
Production reward indexer: pending.
```

Important operational decision:

```text
Do not rewrite deployment scripts only to add deployment block numbers.
For v1, indexer start blocks can be manually read from block explorers and stored in .env.
```

Key indexer environment variables:

```env
INDEXER_BLOCK_RANGE=10
INDEXER_REQUEST_DELAY_MS=250

BASE_SEPOLIA_INDEXER_FROM_BLOCK=
BASE_SEPOLIA_INDEXER_TO_BLOCK=

ETHEREUM_SEPOLIA_INDEXER_FROM_BLOCK=
ETHEREUM_SEPOLIA_INDEXER_TO_BLOCK=

BASE_MAINNET_INDEXER_FROM_BLOCK=
BASE_MAINNET_INDEXER_TO_BLOCK=

ETHEREUM_MAINNET_INDEXER_FROM_BLOCK=
ETHEREUM_MAINNET_INDEXER_TO_BLOCK=
```

Rules:

```text
FROM_BLOCK = manual start block for first sync.
TO_BLOCK = optional bounded sync limit for testing/backfill.
checkpoint = written after successful sync and used for later resume.
```

The frontend never scans blockchain history in the browser.

---

## Important Scripts

### Compile and test

```bash
npm run compile
npm run test
npm run build
```

### Frontend dev

```bash
npm run dev
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

### Indexer status

```bash
npm run indexer:status -- baseSepolia
npm run indexer:status -- ethereumSepolia
```

Do not run transfer/staking/reward sync as production workflow until the indexer operational model is accepted.

---

## Whitelist

ROTY whitelist source:

```text
scripts/whitelist/whitelist-oioi-snapshot-overrides.csv
```

Generate clean whitelist and Merkle root/proofs:

```bash
npm run whitelist:clean
npm run whitelist:merkle
npm run whitelist:frontend
```

The same ROTY whitelist root is used for Base and Ethereum.

The frontend whitelist proof route reads static proof data from:

```text
public/whitelist/roty-proofs.json
```

---

## Rewards

Reward allocation is calculated off-chain.

RewardDistributor only verifies Merkle proofs and pays claims.

Generate reward Merkle data:

```bash
npm run reward:merkle
```

Current frontend reward status:

```text
Reward claim placeholder implemented.
Claim button intentionally disabled.
Claim activation requires reward proof data.
```

Reward architecture is documented in:

```text
docs/INDEXER_ARCHITECTURE.md
docs/INDEXER_OPERATIONAL_MODEL.md
```

---

## Documentation

Key docs:

```text
docs/SPEC_LOCK.md
docs/IMPLEMENTATION_ROADMAP.md
docs/DEPLOYMENT_RUNBOOK.md
docs/TESTING_CHECKLIST.md
docs/MAINNET_READINESS_REVIEW.md
docs/FRONTEND_ARCHITECTURE.md
docs/FRONTEND_SEPOLIA_BROWSER_QA.md
docs/INDEXER_ARCHITECTURE.md
docs/INDEXER_IMPLEMENTATION_PLAN.md
docs/INDEXER_OPERATIONAL_MODEL.md
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
```

Mainnet deployment is not public launch.

Mint opening must be a separate intentional decision.

---

P.S. Read this document freely for information and guidance. Do not redistribute or restate—no quotes, summaries, paraphrases, or derivatives—without prior written permission from [**Prof. NOTA**](https://nota.endhonesa.com/). Sharing the link is allowed. So, share the link, not the text. Do not discuss or re-tell the contents in any form—written, spoken, or recorded—without prior written permission.

---
