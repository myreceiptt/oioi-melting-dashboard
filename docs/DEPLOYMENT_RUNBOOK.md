# OiOi Melting Dashboard — Deployment Runbook v3

This runbook defines the safe deployment, verification, read-check, and functional-test order for the OiOi Melting Dashboard smart contract suite.

This v3 runbook reflects:

```text
Base Sepolia completed.
Ethereum Sepolia completed.
Frontend Sepolia MVP completed.
Mainnet deployment preparation passed.
Testnet Release Candidate Lock v1 passed.
Mainnet deployment is intentionally deferred until explicit approval after Mainnet Deployment Approval Gate v1.
verify:args is post-deployment because it requires deployment records.
```

---

## Scope

### Contracts

1. `TheRotyMemorial`
2. `OiOiSoftStaking`
3. `MeltingMemorial`
4. `AmandaMemorial`
5. `OiOiRewardDistributor`

### Networks

1. `hardhatBase`
2. `hardhatMainnet`
3. `baseSepolia`
4. `ethereumSepolia`
5. `baseMainnet`
6. `ethereumMainnet`

---

## 0. Golden Rules

Do not deploy mainnet before explicit approval after Mainnet Deployment Approval Gate v1.

Do not enable mint immediately after deployment.

Do not leave mint phases enabled after functional testing.

Do not lock metadata until final revealed metadata is uploaded, checked, revealed, indexed, and approved.

Do not use local simulated deployment records as real deployment records.

Do not commit `.env`, private keys, generated constructor args, generated local deployment folders, Hardhat artifacts, cache, generated indexer output, generated reward output, or generated whitelist output.

Do not “fix forward” on mainnet. Stop, inspect, and diagnose.

Do not treat the approval gate document as approval by itself.

Do not launch mainnet reward claim until the mainnet indexer/reward/proof flow is implemented/configured, run, verified, and approved.

Metadata strategy approval is tracked in:

```text
docs/mainnet/METADATA_STRATEGY_APPROVAL_DECISION_V1.md
```

---

## 1. Required `.env` Values

Required for real deployments:

```env
PRIVATE_KEY=
BASE_RPC_URL=
BASE_SEPOLIA_RPC_URL=
ETHEREUM_RPC_URL=
ETHEREUM_SEPOLIA_RPC_URL=
ETHERSCAN_API_KEY=
DEPLOYER_ADDRESS=0x29bf68e3969e0b6686ea55b7c48241ba3f6b9ba0
MINT_TREASURY_ADDRESS=0x9e26b98d4fadf70d0c0e57c609347358934a934c
ROYALTY_RECEIVER_ADDRESS=0x29bf68e3969e0b6686ea55b7c48241ba3f6b9ba0
```

Required for testnet reward distributors:

```env
BASE_SEPOLIA_OIOI_TOKEN=
ETHEREUM_SEPOLIA_OIOI_TOKEN=
```

Mainnet `$OiOi` addresses are locked:

```text
Base:
0xba0032620d88D9b16752CbDE75593c080C3d38de

Ethereum:
0x1C696882b93d7241d09D55f52693cAD367A5bEaf
```

---

## 2. Global Checks

```bash
git status
npm run build
npm run compile
npm run test
npm run reward:merkle
npm run whitelist:clean
npm run whitelist:merkle
npm run whitelist:frontend
```

Required:

```text
working tree clean
build passes
compile passes
tests pass
reward Merkle generator works
ROTY whitelist generation works
frontend proof export works
```

---

## 3. Deployment Preflight

```bash
npm run deploy:preflight -- baseSepolia
npm run deploy:preflight -- ethereumSepolia
npm run deploy:preflight -- baseMainnet
npm run deploy:preflight -- ethereumMainnet
```

Do not deploy if preflight fails.

---

## 4. Testnet Deployment Pattern

The safe testnet pattern is:

```text
preflight
→ deploy all contracts
→ export constructor args
→ commit deployment record
→ verify all contracts
→ run read-check
→ run functional test
→ restore mint phases OFF
→ run read-check again
→ commit updates
```

Testnet deployment is completed for Base Sepolia and Ethereum Sepolia.

---

## 5. Constructor Args Export

Run only after deploying the target network and after `deployment.json` exists.

```bash
npm run verify:args -- baseSepolia
npm run verify:args -- ethereumSepolia
npm run verify:args -- baseMainnet
npm run verify:args -- ethereumMainnet
```

Expected failure before mainnet deployment:

```text
Missing deployment record: deployments/base-mainnet
Missing deployment record: deployments/ethereum-mainnet
```

This is not a readiness failure before deployment.

---

## 6. Read Checks

```bash
npm run deploy:read-check -- --network baseSepolia
npm run deploy:read-check -- --network ethereumSepolia
npm run deploy:read-check -- --network baseMainnet
npm run deploy:read-check -- --network ethereumMainnet
```

Required:

```text
owners correct
treasury correct
royalty correct
prices correct
URIs correct
Merkle root correct
staking registrations true
mint phases expected
reward token correct
reward counters valid
```

---

## 7. Functional Tests

Testnet only:

```bash
npm run test:base-sepolia-functional -- --network baseSepolia
npm run test:ethereum-sepolia-functional -- --network ethereumSepolia
```

Do not run functional tests on mainnet unless intentionally minting real NFTs.

After functional testing:

```bash
npm run deploy:restore-mint-phases -- --network baseSepolia
npm run deploy:restore-mint-phases -- --network ethereumSepolia
```

---

## 8. Current Mainnet Preparation Result

Latest preparation status:

```text
repo clean: PASS
build: PASS
compile: PASS
test: PASS
Base RPC chainId 0x2105: PASS
Ethereum RPC chainId 0x1: PASS
baseMainnet preflight: PASS
ethereumMainnet preflight: PASS
deployer funded: PASS
whitelist root finalized
deploy config reviewed
Testnet Release Candidate Lock v1: PASS
Mainnet Deployment Approval Gate v1: READY WITH NOTES / NOT APPROVED
```

Locked whitelist root:

```text
0x0b2504d3e2d95c57e039aea1c027015bc0ecf39c3ad14424764faa696c3fcce9
```

Clean whitelist count:

```text
2241
```

---

## 9. Mainnet Deployment Policy

Mainnet deployment is ready from a contract-preparation perspective but deferred until explicit approval after Mainnet Deployment Approval Gate v1.

If explicit approval is given, mainnet deployment may proceed with all mint phases OFF and no public launch.

Approval-sensitive caveats:

```text
metadata strategy must be explicitly approved before deployment
pending revealed URI placeholders must remain unlocked until final metadata is approved
mainnet reward claim is not production-ready at deployment time
mainnet indexer/reward/proof flow must be implemented/configured and validated after deployment
```

Canonical approval gate:

```text
docs/mainnet/MAINNET_DEPLOYMENT_APPROVAL_GATE_V1.md
```

---

## 10. Base Mainnet Deployment Order

Do not run until explicit approval is given.

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

Then verify all contracts.

Do not enable mint.

Commit deployment record:

```bash
git add deployments/base-mainnet/deployment.json
git commit -m "chore: record Base Mainnet deployment"
git push
```

Record Base mainnet indexer FROM_BLOCK manually from explorer.

---

## 11. Ethereum Mainnet Deployment Order

Do not run until explicit approval is given.

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

Then verify all contracts.

Do not enable mint.

Commit deployment record:

```bash
git add deployments/ethereum-mainnet/deployment.json
git commit -m "chore: record Ethereum Mainnet deployment"
git push
```

Record Ethereum mainnet indexer FROM_BLOCK manually from explorer.

---

## 12. Post-Deployment Mainnet Steps

After each chain deployment:

```text
verify contracts
run read-check
confirm mint phases OFF
confirm owner, treasury, royalty, prices, URIs, Merkle root
inspect explorer
record FROM_BLOCK
commit deployment record
```

---

## 13. Mainnet Env Wiring

Only after mainnet contracts are deployed:

```env
NEXT_PUBLIC_APP_ENV=mainnet
NEXT_PUBLIC_BASE_*
NEXT_PUBLIC_ETH_*
```

Deploy Vercel production after env wiring.

Run Mainnet Read-Only QA before opening mint.

---

## 14. Controlled Mainnet Opening

Opening is separate from deployment.

Order:

```text
enable ROTY whitelist mint
controlled mint
enable ROTY public mint if ready
enable staking dashboard
enable Melting gated mint
enable Amanda gated mint
enable reward claim only after production reward flow is ready
```

---

P.S. Read this document freely for information and guidance. Do not redistribute or restate—no quotes, summaries, paraphrases, or derivatives—without prior written permission from [**Prof. NOTA**](https://nota.endhonesa.com/). Sharing the link is allowed. So, share the link, not the text. Do not discuss or re-tell the contents in any form—written, spoken, or recorded—without prior written permission.

---
