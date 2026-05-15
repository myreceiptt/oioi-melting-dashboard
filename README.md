# OiOi Melting Dashboard

Smart contract, deployment, frontend, and indexer workspace for the OiOi Melting Dashboard ecosystem.

The project supports six NFT collections across two chain-specific ecosystems:

## Base Set

- The ROTY BASE / ROTYBASE
- Melting BASE / MELTBASE
- Amanda BASE / AMANBASE
- OiOiSoftStaking on Base
- OiOiRewardDistributor on Base
- Base $OiOi token

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
- Frontend architecture documented.
- Indexer architecture documented.
- Mainnet readiness review documented.

Pending:

- Frontend skeleton implementation.
- Mint pages implementation.
- OiOi Melting Dashboard implementation.
- Indexer/backend implementation.
- Mainnet deployment.
- Mainnet verification/read checks.
- Final mint opening.

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

Generate clean whitelist and Merkle root/proofs:

```bash
npm run whitelist:clean
npm run whitelist:merkle
```

The same ROTY whitelist root is used for Base and Ethereum.

---

## Rewards

Reward allocation is calculated off-chain.

RewardDistributor only verifies Merkle proofs and pays claims.

Generate reward Merkle data:

```bash
npm run reward:merkle
```

Reward architecture is documented in:

```text
docs/INDEXER_ARCHITECTURE.md
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
docs/INDEXER_ARCHITECTURE.md
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
```

Mainnet deployment is not public launch.

Mint opening must be a separate intentional decision.

---

P.S. Read this document freely for information and guidance. Do not redistribute or restate—no quotes, summaries, paraphrases, or derivatives—without prior written permission from [**Prof. NOTA**](https://nota.endhonesa.com/). Sharing the link is allowed. So, share the link, not the text. Do not discuss or re-tell the contents in any form—written, spoken, or recorded—without prior written permission.

---
