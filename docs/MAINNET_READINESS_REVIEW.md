# OiOi Melting Dashboard — Mainnet Readiness Review v2

This document is the review gate before any Base Mainnet or Ethereum Mainnet deployment.

Mainnet deployment must not be treated as launch readiness.

Current project decision:

```text
Mainnet deployment is ready from contract-preparation perspective, but intentionally deferred until Testnet Release Candidate.
```

---

## 1. Current Status

### Completed

- Smart contract suite implemented.
- Unit tests pass.
- Integration lifecycle tests pass.
- ROTY whitelist Merkle scripts work.
- Reward Merkle generator works for prepared allocation/proof input.
- Deployment scripts are available.
- Constructor args export works after deployment record exists.
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
- Frontend Sepolia MVP implemented.
- ROTY public + whitelist mint UI implemented.
- Melting/Amanda gated mint UI implemented.
- Dashboard stake/unstake UI implemented.
- Reward claim placeholder implemented.
- Frontend Sepolia browser QA completed for read/OFF-phase/stake flows.
- Indexer skeleton implemented.
- Indexer operational model documented.
- Mainnet preparation checks passed:
  - repo clean
  - build/compile/test pass
  - Base RPC chain ID verified
  - Ethereum RPC chain ID verified
  - baseMainnet preflight passed
  - ethereumMainnet preflight passed
  - deployer wallet funded
  - whitelist root finalized

### Locked / Deferred

```text
Mainnet deployment is deferred until Testnet Release Candidate.
```

### Pending Before Testnet Release Candidate

- Admin Dashboard Architecture.
- Admin Dashboard implementation.
- Supabase Postgres schema/migrations.
- Database indexer.
- Reward calculator from real indexed duration.
- Reward proof API.
- Active reward claim UI.
- Stage-by-stage browser testing with phases ON.
- Full Testnet Browser E2E.
- Final UI/UX polish.

---

## 2. Mainnet Deployment Is Not Launch

Mainnet deployment only means contracts are deployed.

Public launch requires:

1. Testnet Release Candidate completed.
2. Mainnet contracts deployed.
3. Mainnet contracts verified.
4. Mainnet read checks pass.
5. Mainnet frontend environment is wired.
6. Mainnet read-only browser QA passes.
7. Admin Dashboard is working.
8. Mint opening is explicitly approved.
9. Reward claim remains disabled unless production reward proof flow is ready.

---

## 3. Golden Rules

Do not deploy mainnet if Sepolia/Testnet Product Completion status is uncertain.

Do not deploy mainnet from the wrong wallet.

Do not deploy mainnet with an unreviewed `.env`.

Do not enable mint immediately after deployment.

Do not launch public frontend before read checks and browser QA pass.

Do not treat reward claim as ready until Supabase indexer/reward calculation/proof flow is ready.

Do not lock metadata while revealed metadata is pending.

Do not delete or overwrite mainnet deployment records casually.

Do not treat `verify:args` as pre-deployment for a network that has no deployment record yet.

Do not treat mainnet deployment as pressure to open mint.

---

## 4. Required Repository State Before Mainnet Deployment

```bash
git status
npm run build
npm run compile
npm run test
npm run reward:merkle
npm run deploy:preflight -- baseMainnet
npm run deploy:preflight -- ethereumMainnet
```

Required:

- working tree clean
- build passes
- compile passes
- tests pass
- reward Merkle generator passes
- Base Mainnet preflight passes
- Ethereum Mainnet preflight passes

---

## 5. Required `.env` Review

Required values:

```env
PRIVATE_KEY=
BASE_RPC_URL=
ETHEREUM_RPC_URL=
ETHERSCAN_API_KEY=
NEXT_PUBLIC_APP_ENV=
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=
DEPLOYER_ADDRESS=0x29bf68e3969e0b6686ea55b7c48241ba3f6b9ba0
MINT_TREASURY_ADDRESS=0x9e26b98d4fadf70d0c0e57c609347358934a934c
ROYALTY_RECEIVER_ADDRESS=0x29bf68e3969e0b6686ea55b7c48241ba3f6b9ba0
```

Mainnet frontend values must be filled after deployment:

```env
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

Indexer start blocks are manually filled after deployment:

```env
BASE_MAINNET_INDEXER_FROM_BLOCK=
BASE_MAINNET_INDEXER_TO_BLOCK=

ETHEREUM_MAINNET_INDEXER_FROM_BLOCK=
ETHEREUM_MAINNET_INDEXER_TO_BLOCK=
```

Mainnet $OiOi addresses:

```text
Base $OiOi:
0xba0032620d88D9b16752CbDE75593c080C3d38de

Ethereum $OiOi:
0x1C696882b93d7241d09D55f52693cAD367A5bEaf
```

Never commit `.env`.

---

## 6. Current Mainnet Preparation Result

Latest preparation status:

```text
repo clean: PASS
build: PASS
compile: PASS
test: PASS
Base RPC chainId: 0x2105 / PASS
Ethereum RPC chainId: 0x1 / PASS
baseMainnet preflight: PASS
ethereumMainnet preflight: PASS
deployer funded: PASS
whitelist clean unique addresses: 2241
whitelist root: 0x0b2504d3e2d95c57e039aea1c027015bc0ecf39c3ad14424764faa696c3fcce9
deploy config baseMainnet: reviewed
deploy config ethereumMainnet: reviewed
```

`verify:args -- baseMainnet` and `verify:args -- ethereumMainnet` currently fail because mainnet deployment records do not exist yet. This is expected before deployment and is not a readiness failure.

---

## 7. Deployer Wallet Review

Expected deployer / owner wallet:

```text
0x29bf68e3969e0b6686ea55b7c48241ba3f6b9ba0
```

Before deployment, confirm:

- `PRIVATE_KEY` belongs to this wallet.
- wallet has enough Base ETH.
- wallet has enough ETH.
- wallet is intentionally used as initial owner.
- owner-only scripts will be executed only from this wallet.

Stop if deployer mismatch appears.

---

## 8. Treasury and Royalty Review

Mint treasury:

```text
0x9e26b98d4fadf70d0c0e57c609347358934a934c
```

Royalty receiver:

```text
0x29bf68e3969e0b6686ea55b7c48241ba3f6b9ba0
```

Royalty fee:

```text
11%
```

---

## 9. Collection Review

Mainnet collection specs remain as locked in `docs/SPEC_LOCK.md`.

Before deployment, re-run:

```bash
npm run deploy:config -- baseMainnet
npm run deploy:config -- ethereumMainnet
```

Review:

- names
- symbols
- max supplies
- mint prices
- URIs
- treasury
- royalty receiver
- $OiOi token address
- deployment output directory

---

## 10. Mainnet Deployment Gate

Mainnet deployment may proceed only after Testnet Release Candidate unless an explicit strategic override is made.

If override is made, mint phases must remain OFF and public frontend must not open.

---

## 11. Mainnet Deployment Order

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

npm run verify:args -- baseMainnet
npm run deploy:read-check -- --network baseMainnet
```

Do not enable mint.

Commit:

```bash
git add deployments/base-mainnet/deployment.json
git commit -m "chore: record Base Mainnet deployment"
git push
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

npm run verify:args -- ethereumMainnet
npm run deploy:read-check -- --network ethereumMainnet
```

Do not enable mint.

Commit:

```bash
git add deployments/ethereum-mainnet/deployment.json
git commit -m "chore: record Ethereum Mainnet deployment"
git push
```

---

## 12. Post-Deployment Requirements

After each mainnet deployment:

1. Run `verify:args`.
2. Verify contracts.
3. Run read-check.
4. Confirm mint phases OFF.
5. Confirm owner, treasury, royalty, prices, URIs, Merkle root.
6. Manually inspect block explorer.
7. Record chain-level indexer `FROM_BLOCK` manually.
8. Update `.env` locally.
9. Update docs if needed.
10. Commit deployment record.

---

## 13. Mainnet Env Wiring

After both chains deploy:

```env
NEXT_PUBLIC_APP_ENV=mainnet
```

Fill:

```env
NEXT_PUBLIC_BASE_*
NEXT_PUBLIC_ETH_*
```

Then deploy Vercel production and run Mainnet Read-Only QA.

---

## 14. Controlled Mainnet Opening

Opening must be separate from deployment.

Recommended order:

1. Enable ROTY whitelist mint.
2. Controlled mint.
3. Enable ROTY public mint if ready.
4. Enable staking dashboard.
5. Enable Melting gated mint.
6. Enable Amanda gated mint.
7. Enable reward claim only after production reward flow is ready.

---

## 15. Review Result

```text
CONTRACT DEPLOYMENT PREPARATION: PASSED
TESTNET PRODUCT COMPLETION: IN PROGRESS
TESTNET RELEASE CANDIDATE: NOT READY
MAINNET DEPLOYMENT: READY BUT DEFERRED
PUBLIC LAUNCH: NOT READY
REWARD CLAIM LAUNCH: NOT READY
```

---

P.S. Read this document freely for information and guidance. Do not redistribute or restate—no quotes, summaries, paraphrases, or derivatives—without prior written permission from [**Prof. NOTA**](https://nota.endhonesa.com/). Sharing the link is allowed. So, share the link, not the text. Do not discuss or re-tell the contents in any form—written, spoken, or recorded—without prior written permission.

---
