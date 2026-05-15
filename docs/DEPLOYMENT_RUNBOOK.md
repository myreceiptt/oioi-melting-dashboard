# OiOi Melting Dashboard — Deployment Runbook v1

This runbook defines the safe deployment order for the OiOi Melting Dashboard smart contract suite.

## Scope

Contracts:

1. TheRotyMemorial
2. OiOiSoftStaking
3. MeltingMemorial
4. AmandaMemorial
5. OiOiRewardDistributor

Chains:

1. Base Sepolia
2. Ethereum Sepolia
3. Base Mainnet
4. Ethereum Mainnet

Frontend:

- ROTY BASE mint: [rotybase.endhonesa.com](https://rotybase.endhonesa.com/)
- ROTY dETH mint: [rotydeth.endhonesa.com](https://rotydeth.endhonesa.com/)
- Melting BASE mint: [meltingbase.endhonesa.com](https://meltingbase.endhonesa.com/)
- Melting dETH mint: [meltingdeth.endhonesa.com](https://meltingdeth.endhonesa.com/)
- Amanda BASE mint: [amandabase.endhonesa.com](https://amandabase.endhonesa.com/)
- Amanda dETH mint: [amandadeth.endhonesa.com](https://amandadeth.endhonesa.com/)
- OiOi Melting Dashboard: [softstaking.endhonesa.com](https://softstaking.endhonesa.com/)

---

## 0. Golden Rules

Do not deploy mainnet before Sepolia dry-run passes.

Do not enable mint immediately after deployment.

Do not lock metadata until revealed metadata is final and checked.

Do not use local simulated deployment records as real deployment records.

Do not commit `.env`, private keys, generated local deployment folders, or local artifacts.

---

## 1. Pre-Deployment Checklist

Before any testnet or mainnet deployment:

```bash
git status
npm run compile
npm run test
npm run reward:merkle
npm run deploy:config -- baseMainnet
npm run deploy:config -- ethereumMainnet
```

Expected:

- working tree clean
- compile passes
- tests pass
- reward Merkle generator works
- deployment config prints correct values

---

## 2. Required `.env` Values

Required for all real deployments:

```env
PRIVATE_KEY=
BASE_RPC_URL=
BASE_SEPOLIA_RPC_URL=
ETHEREUM_RPC_URL=
ETHEREUM_SEPOLIA_RPC_URL=
ETHERSCAN_API_KEY=
```

Required before Base Sepolia reward distributor deployment:

```env
BASE_SEPOLIA_OIOI_TOKEN=
```

Required before Ethereum Sepolia reward distributor deployment:

```env
ETHEREUM_SEPOLIA_OIOI_TOKEN=
```

Mainnet $OiOi addresses are locked in config:

```text
Base:
0xba0032620d88D9b16752CbDE75593c080C3d38de

Ethereum:
0x1C696882b93d7241d09D55f52693cAD367A5bEaf
```

---

## 3. Local Full Smoke Deployment

Local smoke deployment must use the combined script because simulated chain state resets between separate Hardhat runs.

Run:

```bash
rm -rf deployments/hardhat-base deployments/hardhat-mainnet

npm run deploy:local-full -- --network hardhatBase
cat deployments/hardhat-base/deployment.json

npm run deploy:local-full -- --network hardhatMainnet
cat deployments/hardhat-mainnet/deployment.json
```

Expected:

- ROTY deployed
- Staking deployed
- ROTY registered
- Melting deployed
- Melting registered
- Amanda deployed
- Amanda registered
- Mock $OiOi deployed
- RewardDistributor deployed
- deployment.json written

---

## 4. Base Sepolia Deployment Order

Run only after local full smoke deployment passes.

```bash
npm run deploy:roty -- --network baseSepolia
npm run deploy:staking -- --network baseSepolia
npm run deploy:register-roty -- --network baseSepolia
npm run deploy:melting -- --network baseSepolia
npm run deploy:register-melting -- --network baseSepolia
npm run deploy:amanda -- --network baseSepolia
npm run deploy:register-amanda -- --network baseSepolia
npm run deploy:reward-distributor -- --network baseSepolia
```

Check:

```bash
cat deployments/base-sepolia/deployment.json
```

Required result:

```json
{
  "contracts": {
    "roty": "0x...",
    "staking": "0x...",
    "melting": "0x...",
    "amanda": "0x...",
    "rewardDistributor": "0x..."
  },
  "registrations": {
    "rotyApprovedInStaking": true,
    "meltingApprovedInStaking": true,
    "amandaApprovedInStaking": true
  }
}
```

---

## 5. Ethereum Sepolia Deployment Order

Run only after Base Sepolia deployment passes.

```bash
npm run deploy:roty -- --network ethereumSepolia
npm run deploy:staking -- --network ethereumSepolia
npm run deploy:register-roty -- --network ethereumSepolia
npm run deploy:melting -- --network ethereumSepolia
npm run deploy:register-melting -- --network ethereumSepolia
npm run deploy:amanda -- --network ethereumSepolia
npm run deploy:register-amanda -- --network ethereumSepolia
npm run deploy:reward-distributor -- --network ethereumSepolia
```

Check:

```bash
cat deployments/ethereum-sepolia/deployment.json
```

---

## 6. Testnet Post-Deploy Checks

For each testnet:

1. Confirm owner addresses.
2. Confirm treasury address.
3. Confirm royalty receiver.
4. Confirm mint prices.
5. Confirm unrevealed URI.
6. Confirm ROTY Merkle root.
7. Confirm staking approved collections.
8. Confirm reward distributor token address.
9. Confirm frontend can read contracts.
10. Confirm test wallet flow:

- ROTY whitelist mint
- ROTY public mint
- stake ROTY
- mint Melting
- stake Melting
- mint Amanda
- stake Amanda
- create/fund reward round
- claim reward

---

## 7. Base Mainnet Deployment Order

Run only after both testnets pass.

```bash
npm run deploy:roty -- --network baseMainnet
npm run deploy:staking -- --network baseMainnet
npm run deploy:register-roty -- --network baseMainnet
npm run deploy:melting -- --network baseMainnet
npm run deploy:register-melting -- --network baseMainnet
npm run deploy:amanda -- --network baseMainnet
npm run deploy:register-amanda -- --network baseMainnet
npm run deploy:reward-distributor -- --network baseMainnet
```

Check:

```bash
cat deployments/base-mainnet/deployment.json
```

Do not enable mint yet.

---

## 8. Ethereum Mainnet Deployment Order

Run only after Base Mainnet deployment is verified and stable.

```bash
npm run deploy:roty -- --network ethereumMainnet
npm run deploy:staking -- --network ethereumMainnet
npm run deploy:register-roty -- --network ethereumMainnet
npm run deploy:melting -- --network ethereumMainnet
npm run deploy:register-melting -- --network ethereumMainnet
npm run deploy:amanda -- --network ethereumMainnet
npm run deploy:register-amanda -- --network ethereumMainnet
npm run deploy:reward-distributor -- --network ethereumMainnet
```

Check:

```bash
cat deployments/ethereum-mainnet/deployment.json
```

Do not enable mint yet.

---

## 9. Contract Verification

Verify all deployed contracts after deployment.

Contracts to verify per network:

1. TheRotyMemorial
2. OiOiSoftStaking
3. MeltingMemorial
4. AmandaMemorial
5. OiOiRewardDistributor

Verification requires the exact constructor arguments used at deployment.

Do not expose private keys or API keys in committed files.

---

## 10. Pre-Mint Opening Checklist

Before enabling any mint phase:

### ROTY

- contract verified
- owner correct
- treasury correct
- royalty receiver correct
- public price correct
- max supply correct
- maxMintPerTx correct
- Merkle root correct
- unrevealed URI correct
- frontend reads contract correctly

### Melting

- contract verified
- staking contract reference correct
- ROTY reference correct
- price correct
- treasury correct
- unrevealed URI correct
- gated mint disabled by default
- frontend reads eligibility correctly

### Amanda

- contract verified
- staking contract reference correct
- ROTY reference correct
- Melting reference correct
- price correct
- treasury correct
- unrevealed URI correct
- gated mint disabled by default
- frontend reads eligibility correctly

---

## 11. Mint Opening Order

Recommended opening order:

1. Enable ROTY whitelist mint.
2. Enable ROTY public mint.
3. Enable staking dashboard.
4. Enable Melting gated mint.
5. Enable Amanda gated mint.

ROTY:

```solidity
setWhitelistMintEnabled(true)
setPublicMintEnabled(true)
```

Melting:

```solidity
setGatedMintEnabled(true)
```

Amanda:

```solidity
setGatedMintEnabled(true)
```

---

## 12. Metadata Reveal + Lock

Do not lock metadata while unrevealed.

Steps:

1. Set final revealedBaseURI.
2. Check token 1 metadata.
3. Check last token metadata:
   - ROTY: 1047
   - Melting: 1747
   - Amanda: 2020

4. Call `setRevealed(true)`.
5. Wait and verify marketplace/indexer display.
6. Call `lockMetadata()`.

---

## 13. Reward Round Procedure

RewardDistributor does not calculate rewards.

Reward allocation is calculated off-chain from:

- staking events
- unstaking events
- ERC721 transfer events
- valid staking duration
- collection weights

Weights:

```text
ROTY     = 217491
MELTING  = 362900
AMANDA   = 419609
DENOM    = 1000000
```

Round procedure:

1. Calculate allocation JSON.
2. Generate Merkle root/proofs.
3. Create reward round.
4. Fund reward round.
5. Publish claim data to frontend.
6. Test one small claim.
7. Monitor claims.

---

## 14. Emergency Notes

If deployment script fails before writing deployment record:

- inspect explorer
- determine whether contract was deployed
- manually update deployment record only if address is confirmed
- do not re-run blindly

If deployment record exists and script refuses to redeploy:

- confirm existing contract address
- delete deployment record only for local simulation
- never delete mainnet deployment record casually

If reward token address is wrong:

- do not use that RewardDistributor
- deploy a new RewardDistributor with the correct immutable token address

If metadata URI is wrong before lock:

- update URI using owner function

If metadata is already locked:

- cannot update URI by design

---

P.S. Read this document freely for information and guidance. Do not redistribute or restate—no quotes, summaries, paraphrases, or derivatives—without prior written permission from [**Prof. NOTA**](https://nota.endhonesa.com/). Sharing the link is allowed. So, share the link, not the text. Do not discuss or re-tell the contents in any form—written, spoken, or recorded—without prior written permission.

---
