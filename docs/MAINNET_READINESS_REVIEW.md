# OiOi Melting Dashboard — Mainnet Readiness Review v2

This document began as the readiness review before Base Mainnet and Ethereum
Mainnet deployment. It now records the completed mainnet public/operational
state and preserves earlier gate history for auditability.

Mainnet contract deployment has been completed, the public mint/staking surface
is live, reward round operations are live, and reward claim is operational.

Current project decision:

```text
Mainnet contract deployment is complete for Base Mainnet + Ethereum Mainnet.
Production env is mainnet.
Mainnet public surface is live.
Mint phases are open.
Reward claim is live and operational.
Current mode is evergreen maintenance.
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
- Reward claim UI implemented against Supabase proof API.
- Reward proof API implemented against Supabase reward tables.
- Frontend Sepolia browser QA completed for read/OFF-phase/stake flows.
- Supabase indexer/reward pipeline scripts implemented.
- Indexer operational model documented.
- Production-intended Sepolia rehearsal domains passed Subdomain Surface Behavior v1 QA.
- Full Testnet Browser QA v1 passed.
- Full Testnet Mutation QA v1 passed.
- Full Testnet E2E QA v1 passed.
- Worker jobs / boundary reward flow passed through GitHub Actions.
- Testnet Release Candidate Lock v1 passed.
- Mainnet Deployment Approval Gate v1 documented as ready with notes.
- Mainnet Deployment Approval Decision v1 approved for Base Mainnet + Ethereum Mainnet contract deployment only.
- Base Mainnet contract deployment completed, verified, and read-checked.
- Ethereum Mainnet contract deployment completed, verified, and read-checked.
- Base Mainnet and Ethereum Mainnet mint phases were safe-off at deployment completion.
- Base Mainnet and Ethereum Mainnet mint phases are now open in production.
- Base Mainnet and Ethereum Mainnet metadata remains unlocked.
- Production domains serve mainnet.
- Mainnet public surface and mint opening QA passed.
- Admin mainnet operations QA passed.
- Mainnet Supabase reward data-plane setup completed.
- Mainnet GitHub Actions worker readiness passed.
- First mainnet boundary reward job succeeded.
- First mainnet Base and Ethereum calculated reward rounds generated.
- First mainnet Base and Ethereum reward rounds created, approved, and funded on-chain.
- Mainnet reward claim launched and operationally validated.
- Project is complete, public, and operational.
- Mainnet preparation checks passed:
  - repo clean
  - build/compile/test pass
  - Base RPC chain ID verified
  - Ethereum RPC chain ID verified
  - baseMainnet preflight passed
  - ethereumMainnet preflight passed
  - deployer wallet funded
  - whitelist root finalized

### Current Final Status

```text
Mainnet contract deployment is complete, verified, and read-checked.
Mainnet public mint/staking surface is live.
Mainnet reward data-plane foundation is complete.
Mainnet reward round operations are operational.
Mainnet reward claim is live.
Admin operations are live.
Project is in evergreen maintenance mode.
```

### Maintenance After Public Opening

- Keep dependencies and tooling healthy.
- Keep lint/build/test commands passing.
- Run reward distributions when OiOi is available and an operator chooses a new Tapal Batas.
- Keep Supabase reconciliation as part of normal worker/indexer operations.
- Keep documentation updated when operational behavior changes.

Canonical mainnet reward operation status and SOP:

```text
docs/mainnet/MAINNET_REWARD_ROUND_OPERATIONS_V1.md
```

---

## 2. Mainnet Deployment and Launch History

Mainnet deployment originally meant contracts were deployed but public launch
was not automatically authorized. That staged gate has completed. The current
production app is public and operational.

Historical launch sequence:

1. Testnet Release Candidate completed.
2. Mainnet contracts deployed.
3. Mainnet contracts verified.
4. Mainnet read checks pass.
5. Mainnet frontend environment is wired.
6. Mainnet read-only browser QA passes.
7. Admin Dashboard is working.
8. Mint opening is approved and completed.
9. Reward round operations and reward claim are validated and completed.

---

## 3. Golden Rules

Do not re-run mainnet deployment commands unless a separate recovery plan explicitly approves that action.

Do not run any owner-only mainnet transaction from the wrong wallet.

Do not wire or deploy mainnet frontend env with an unreviewed `.env`.

Do not enable mint immediately after deployment without the separate controlled opening step.

Do not launch public frontend before read checks and browser QA pass.

Reward claim is now live and operational. Treat future reward changes as
operator-controlled production changes.

Do not run sensitive owner actions casually; treat future metadata, mint, reward,
and rescue operations as operator-controlled production changes.

Metadata strategy is approved as Option A in `docs/mainnet/METADATA_STRATEGY_APPROVAL_DECISION_V1.md`.

This metadata approval did not authorize mint opening by itself. Mint phases had to remain OFF at deployment completion. Later production mint opening was completed and documented separately. Metadata must remain unlocked, and `lockMetadata()` must not be called until final Melting/Amanda revealed metadata is approved.

Do not delete or overwrite mainnet deployment records casually.

Do not treat `verify:args` as pre-deployment for a network that has no deployment record yet.

Do not treat mainnet deployment as pressure to open mint.

Do not treat Mainnet Deployment Approval Gate v1 as deployment authorization by itself.

Do not treat temporary stale Supabase reward round fields as a mainnet blocker
when live on-chain state confirms create/fund status. Under the locked Reward
Round SOP, `created_tx_hash`, `funded_tx_hash`, funded amount, claimed amount,
pause state, and long-term DB status are reconciled from RewardDistributor
events after event indexing crosses the relevant transaction blocks.

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

Mainnet deployment records now exist for Base Mainnet and Ethereum Mainnet. Constructor args export and read-checks are post-deployment steps and have passed as part of the completion record.

---

## 7. Deployer Wallet Review

Expected deployer / owner wallet:

```text
0x29bf68e3969e0b6686ea55b7c48241ba3f6b9ba0
```

Deployment confirmation:

- deployment was executed from the expected owner wallet.
- wallet was funded for Base Mainnet deployment.
- wallet was funded for Ethereum Mainnet deployment.
- this wallet is the initial owner.
- future owner-only scripts must be executed only from this wallet unless ownership is explicitly changed.

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

Deployment config review was completed before deployment:

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

Mainnet deployment approval was granted for Base Mainnet + Ethereum Mainnet contract deployment only.

That approved contract deployment scope is now complete.

Mint phases had to remain OFF at deployment completion. Later production mainnet env wiring and mint opening were completed and are recorded in `docs/qa/MAINNET_PUBLIC_SURFACE_AND_MINT_OPENING_QA_V1.md`.

Mainnet reward claim was later launched and operationally validated. The
mainnet reward data-plane foundation, first-round preparation, and public claim
flow are now complete.

Canonical gate document:

```text
docs/mainnet/MAINNET_DEPLOYMENT_APPROVAL_GATE_V1.md
```

Final deployment approval decision document:

```text
docs/mainnet/MAINNET_DEPLOYMENT_APPROVAL_DECISION_V1.md
```

Canonical deployment completion document:

```text
docs/mainnet/MAINNET_CONTRACT_DEPLOYMENT_COMPLETION_V1.md
```

---

## 11. Mainnet Deployment Order

The command sequence below is historical for the completed contract deployment. Do not re-run deployment commands unless a separate recovery plan explicitly approves that action.

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

Historical deployment baseline: do not enable mint in the deployment transaction sequence itself.

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

Historical deployment baseline: do not enable mint in the deployment transaction sequence itself.

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

Read-only mainnet env wiring was an intermediate approval stage before public
opening. It is now historical context.

Canonical env wiring plan:

```text
docs/mainnet/MAINNET_ENV_WIRING_PLAN_V1.md
```

Canonical read-only env wiring approval decision:

```text
docs/mainnet/MAINNET_ENV_WIRING_APPROVAL_DECISION_V1.md
```

That approval originally covered read-only frontend QA only. Later public
opening, minting, staking, reward operations, and reward claim were completed
through separate steps and are now live.

For the approved read-only QA scope:

```env
NEXT_PUBLIC_APP_ENV=mainnet
```

Fill:

```env
NEXT_PUBLIC_BASE_*
NEXT_PUBLIC_ETH_*
```

This historical step has been completed.

Mainnet read-only frontend QA result:

```text
docs/qa/MAINNET_READ_ONLY_FRONTEND_QA_V1.md
MAINNET READ-ONLY FRONTEND QA V1: PASSED FOR LOCALHOST READ-ONLY QA
BASE MAINNET FRONTEND READS: PASS
ETHEREUM MAINNET FRONTEND READS: PASS
```

The later production-domain QA pass confirmed the live mainnet public
mint/staking/admin baseline. Reward operations and reward claim were completed
after that gate.

---

## 14. Controlled Mainnet Opening

Opening was separate from deployment and is completed for the mint/staking public surface.

Completed opening order:

1. Enable ROTY whitelist mint.
2. Controlled mint.
3. Enable ROTY public mint.
4. Enable staking dashboard.
5. Enable Melting gated mint.
6. Enable Amanda gated mint.
7. Reward claim was launched and operationally validated after the initial
   controlled mint/staking opening.

---

## 15. Review Result

```text
CONTRACT DEPLOYMENT PREPARATION: PASSED
TESTNET PRODUCT VALIDATION: FULL E2E QA PASSED
TESTNET RELEASE CANDIDATE LOCK V1: PASSED
MAINNET DEPLOYMENT APPROVAL DECISION V1: APPROVED
APPROVED DEPLOYMENT SCOPE: BASE MAINNET + ETHEREUM MAINNET
MAINNET CONTRACT DEPLOYMENT COMPLETION V1: COMPLETE
BASE MAINNET CONTRACT DEPLOYMENT: DONE / VERIFIED / SAFE OFF
ETHEREUM MAINNET CONTRACT DEPLOYMENT: DONE / VERIFIED / SAFE OFF
MAINNET DEPLOYMENT AUTHORIZATION: APPROVED FOR CONTRACT DEPLOYMENT ONLY
MAINNET PUBLIC SURFACE: LIVE
READ-ONLY MAINNET ENV WIRING: APPROVED
MAINNET PRODUCTION-DOMAIN BROWSER QA: PASS
MAINNET REWARD CLAIM: LIVE / OPERATIONAL
MINT OPENING: DONE / LIVE
REWARD ROUND OPERATIONS: LIVE / OPERATIONAL
CURRENT MODE: EVERGREEN MAINTENANCE
```

---

P.S. Read this document freely for information and guidance. Do not redistribute or restate—no quotes, summaries, paraphrases, or derivatives—without prior written permission from [**Prof. NOTA**](https://nota.endhonesa.com/). Sharing the link is allowed. So, share the link, not the text. Do not discuss or re-tell the contents in any form—written, spoken, or recorded—without prior written permission.

---
