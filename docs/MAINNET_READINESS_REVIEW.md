# OiOi Melting Dashboard — Mainnet Readiness Review v1

This document is the final review gate before any Base Mainnet or Ethereum Mainnet deployment.

Mainnet deployment must not be treated as launch readiness. Mainnet deployment only means the contracts are deployed. Public launch requires frontend, indexer, reward tooling, final domain setup, and mint opening decisions.

---

## 1. Current Status

### Completed

- Smart contract suite implemented.
- Unit tests pass.
- Integration lifecycle tests pass.
- ROTY whitelist Merkle scripts work.
- Reward Merkle generator works.
- Deployment scripts are available.
- Constructor args export works.
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

### Not Yet Completed

- Frontend mint pages.
- OiOi Melting Dashboard frontend.
- Indexer/backend for staking duration and reward calculation.
- Frontend Sepolia end-to-end browser test.
- Mainnet deployment.
- Mainnet verification.
- Mainnet read checks.
- Mainnet frontend environment switch.
- Final mint opening.

---

## 2. Mainnet Deployment Is Not Launch

Mainnet deployment may proceed only when contract readiness is confirmed.

Public mint opening may proceed only after:

1. Mainnet contracts are deployed.
2. Mainnet contracts are verified.
3. Mainnet read checks pass.
4. Frontend is connected to mainnet contracts.
5. Indexer/backend plan is confirmed.
6. Reward calculation pipeline is documented.
7. Emergency restore/disable scripts are available.
8. Final human approval is given.

---

## 3. Golden Rules

Do not deploy mainnet if Sepolia status is uncertain.

Do not deploy mainnet from the wrong wallet.

Do not deploy mainnet with an unreviewed `.env`.

Do not enable mint immediately after deployment.

Do not launch public frontend before read checks pass.

Do not treat reward claim as ready until indexer/reward calculation flow is ready.

Do not lock metadata while revealed metadata is pending.

Do not delete or overwrite mainnet deployment records casually.

---

## 4. Required Repository State

Before mainnet deployment:

```bash
git status
npm run compile
npm run test
npm run reward:merkle
npm run deploy:preflight -- baseMainnet
npm run deploy:preflight -- ethereumMainnet
```

Required result:

- working tree clean
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
```

Optional but expected for testnet continuity:

```env
BASE_SEPOLIA_RPC_URL=
ETHEREUM_SEPOLIA_RPC_URL=
BASE_SEPOLIA_OIOI_TOKEN=
ETHEREUM_SEPOLIA_OIOI_TOKEN=
```

Mainnet $OiOi addresses are locked in deployment config:

```text
Base $OiOi:
0xba0032620d88D9b16752CbDE75593c080C3d38de

Ethereum $OiOi:
0x1C696882b93d7241d09D55f52693cAD367A5bEaf
```

Never commit `.env`.

---

## 6. Deployer Wallet Review

Expected deployer / owner wallet:

```text
0x29bf68e3969e0b6686ea55b7c48241ba3f6b9ba0
```

Before deployment, confirm:

- `PRIVATE_KEY` belongs to this wallet.
- wallet has enough Base ETH for Base Mainnet deployment.
- wallet has enough ETH for Ethereum Mainnet deployment.
- wallet is intentionally used as initial owner.
- owner-only scripts will be executed only from this wallet.

Stop if deployer mismatch appears.

---

## 7. Treasury and Royalty Review

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

Confirm:

- treasury address is final.
- royalty receiver is final.
- royalty fee is intentionally 11%.
- mint proceeds go directly to treasury.
- no withdraw workflow is needed for mint proceeds.

---

## 8. Collection Review

### ROTY BASE

```text
Name: The ROTY BASE
Symbol: ROTYBASE
Chain: Base
Max supply: 1047
Mint price: 0.001047 ETH
Whitelist mint: 1 free mint per whitelisted wallet
Public mint: paid, no per-wallet cap
Max mint per tx: 11
```

### ROTY dETH

```text
Name: The ROTY dETH
Symbol: ROTYDETH
Chain: Ethereum
Max supply: 1047
Mint price: 0.01047 ETH
Whitelist mint: 1 free mint per whitelisted wallet
Public mint: paid, no per-wallet cap
Max mint per tx: 11
```

### Melting BASE

```text
Name: Melting BASE
Symbol: MELTBASE
Chain: Base
Max supply: 1747
Mint price: 0.001747 ETH
Mint type: staking-gated paid mint only
Eligibility: valid ROTY soft stake
```

### MELTING dETH

```text
Name: MELTING dETH
Symbol: MELTDETH
Chain: Ethereum
Max supply: 1747
Mint price: 0.01747 ETH
Mint type: staking-gated paid mint only
Eligibility: valid ROTY soft stake
```

### Amanda BASE

```text
Name: Amanda BASE
Symbol: AMANBASE
Chain: Base
Max supply: 2020
Mint price: 0.002020 ETH
Mint type: staking-gated paid mint only
Eligibility: valid ROTY or Melting soft stake
```

### Amanda dETH

```text
Name: Amanda dETH
Symbol: AMANDETH
Chain: Ethereum
Max supply: 2020
Mint price: 0.02020 ETH
Mint type: staking-gated paid mint only
Eligibility: valid ROTY or Melting soft stake
```

---

## 9. URI Review

### ROTY URI

Unrevealed URI:

```text
ipfs://bafkreiefsmbkjgw3fs47v52xu6zqzbgw4z2fhdsgvaczh7gstn4txurv2m
```

Revealed base URI:

```text
ipfs://bafybeigzgy6jngo4lvdqukwge2e3nwtgmnt7kpkmg7p2mmi2zrr5atmm3a/
```

### Melting URI

Unrevealed URI:

```text
ipfs://bafkreiccvibarcxlaq3q2vm23p4jsbtxizkjneivjokh4srdpsi36zzzdi
```

Revealed base URI:

```text
ipfs://pending-melting-revealed/
```

Status:

```text
Pending final artwork. Do not reveal or lock metadata yet.
```

### Amanda URI

Unrevealed URI:

```text
ipfs://bafkreihvdfz5un5mslexhs2u5zagfw2dsw62hnvt3unvaypiijtyco7agy
```

Revealed base URI:

```text
ipfs://pending-amanda-revealed/
```

Status:

```text
Pending final artwork. Do not reveal or lock metadata yet.
```

---

## 10. Whitelist Review

ROTY whitelist source:

```text
scripts/whitelist/whitelist-oioi-snapshot-overrides.csv
```

Before mainnet deployment:

```bash
npm run whitelist:clean
npm run whitelist:merkle
cat scripts/whitelist/output/roty-whitelist.root.txt
```

Confirm:

- invalid rows reviewed
- duplicate addresses removed
- unique valid address count understood
- Merkle root is final
- same root is intended for Base and Ethereum
- frontend whitelist proof lookup will use matching proof data

Do not deploy ROTY mainnet if the Merkle root is uncertain.

---

## 11. Reward Architecture Review

RewardDistributor does not calculate rewards.

Reward calculation is off-chain.

RewardDistributor only:

- stores reward rounds
- stores Merkle root
- receives/funds $OiOi
- verifies claim proofs
- prevents double claim
- tracks cumulative funded/claimed counters

Reward calculation requires indexer/backend support.

Required indexed events:

```text
OiOiSoftStaking:
- Staked
- Unstaked

NFT contracts:
- Transfer

OiOiRewardDistributor:
- RewardRoundCreated
- RewardRoundFunded
- Claimed
```

Reward calculation must account for:

```text
valid duration = active stake intent ∩ actual NFT ownership duration
```

Collection weights:

```text
ROTY     = 217491
MELTING  = 362900
AMANDA   = 419609
DENOM    = 1000000
```

---

## 12. Frontend Readiness Gate

Mainnet deployment may happen before frontend is complete.

Mint opening must not happen before frontend is ready.

Required frontend surfaces:

### Mint Pages

- rotybase.endhonesa.com
- rotydeth.endhonesa.com
- meltingbase.endhonesa.com
- meltingdeth.endhonesa.com
- amandabase.endhonesa.com
- amandadeth.endhonesa.com

Required mint page functions:

- connect wallet
- detect/switch chain
- show collection data
- show mint phase
- show price
- show eligibility
- mint NFT
- show transaction state
- show explorer link

### OiOi Melting Dashboard

- softstaking.endhonesa.com

Required dashboard functions:

- connect wallet
- choose Base or Ethereum
- show owned NFTs
- show staking status
- stake NFT
- unstake NFT
- show valid stake status
- show reward rounds
- show claimable rewards
- claim $OiOi

---

## 13. Indexer / Backend Readiness Gate

The indexer/backend is required before real reward distribution.

Minimum MVP:

- sync Base events
- sync Ethereum events
- track staking intent
- track NFT transfers
- compute valid staking duration
- apply collection weights
- generate reward allocation JSON
- feed reward Merkle generator
- expose claim data to frontend

Suggested commands:

```bash
npm run indexer:sync -- base
npm run indexer:sync -- ethereum
npm run rewards:calculate -- base --round <id>
npm run rewards:calculate -- ethereum --round <id>
npm run reward:merkle -- --input <allocation-file>
```

Until indexer/backend is ready:

```text
Minting can be tested.
Soft staking can be tested.
Reward rounds should remain controlled/manual.
Public reward distribution should not be advertised as fully live.
```

---

## 14. Mainnet Deployment Gate

Base Mainnet deployment may proceed only if:

- Base Sepolia passed.
- Ethereum Sepolia passed.
- runbook updated.
- mainnet readiness review committed.
- deployer wallet funded.
- RPC preflight passes.
- Merkle root final.
- deployment team understands mint phases remain OFF.

Ethereum Mainnet deployment may proceed only if:

- Base Mainnet deployment is completed.
- Base Mainnet contracts are verified.
- Base Mainnet read-check passes.
- Base Mainnet deployment record is committed.
- Ethereum Mainnet preflight passes.

---

## 15. Base Mainnet Deployment Order

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

Do not enable mint yet.

Commit:

```bash
git add deployments/base-mainnet/deployment.json
git commit -m "chore: record Base Mainnet deployment"
git push
```

---

## 16. Ethereum Mainnet Deployment Order

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

Do not enable mint yet.

Commit:

```bash
git add deployments/ethereum-mainnet/deployment.json
git commit -m "chore: record Ethereum Mainnet deployment"
git push
```

---

## 17. Mainnet Verification

Verify all five contracts per chain:

1. TheRotyMemorial
2. OiOiSoftStaking
3. MeltingMemorial
4. AmandaMemorial
5. OiOiRewardDistributor

Use constructor args from:

```text
deployments/<network>/constructor-args/
```

If verification fails:

- stop
- do not redeploy blindly
- check constructor args
- check explorer indexing
- check compiler settings
- check network

---

## 18. Mainnet Read Checks

After verification:

```bash
npm run deploy:read-check -- --network baseMainnet
npm run deploy:read-check -- --network ethereumMainnet
```

Required:

- owners correct
- treasury correct
- royalty receiver correct
- prices correct
- URIs correct
- Merkle root correct
- staking registrations true
- reward token correct
- mint phases OFF
- reward counters valid

---

## 19. Final Mint Opening Plan

Mint opening must be a separate decision.

Recommended order:

1. Enable ROTY whitelist mint.
2. Enable ROTY public mint.
3. Enable staking dashboard.
4. Enable Melting gated mint.
5. Enable Amanda gated mint.
6. Enable reward claim only after indexer/reward flow is ready.

Do not open everything at once unless the frontend and monitoring are ready.

---

## 20. Emergency Controls

Available owner controls:

### ROTY

```solidity
setWhitelistMintEnabled(false)
setPublicMintEnabled(false)
setMerkleRoot(...)
setMintPrice(...)
setTreasury(...)
```

### Melting

```solidity
setGatedMintEnabled(false)
setMintPrice(...)
setTreasury(...)
```

### Amanda

```solidity
setGatedMintEnabled(false)
setMintPrice(...)
setTreasury(...)
```

### Staking

```solidity
setCollectionApproved(collection, false)
```

### RewardDistributor

```solidity
setClaimPaused(roundId, true)
```

---

## 21. Stop Conditions

Stop immediately if:

- wrong deployer wallet appears
- wrong chain ID appears
- RPC returns wrong chain
- deployment record already exists unexpectedly
- contract address is missing
- contract verification fails unexpectedly
- read-check fails
- mint phase is accidentally ON
- reward token is wrong
- treasury is wrong
- owner is wrong
- URI is wrong
- frontend cannot read contract
- indexer cannot reconstruct staking history

---

## 22. Review Result

Mainnet readiness status:

```text
CONTRACT READINESS: READY AFTER THIS REVIEW PASSES
FRONTEND READINESS: PENDING
INDEXER READINESS: PENDING
PUBLIC LAUNCH READINESS: NOT YET READY
```

Conclusion:

```text
Mainnet deployment may proceed after this review is committed and preflight passes.
Public launch / mint opening must wait for frontend and operational readiness.
```

---

P.S. Read this document freely for information and guidance. Do not redistribute or restate—no quotes, summaries, paraphrases, or derivatives—without prior written permission from [**Prof. NOTA**](https://nota.endhonesa.com/). Sharing the link is allowed. So, share the link, not the text. Do not discuss or re-tell the contents in any form—written, spoken, or recorded—without prior written permission.

---
