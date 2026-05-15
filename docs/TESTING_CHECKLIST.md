# OiOi Melting Dashboard — Testnet Readiness Checklist v1

This checklist must pass before deploying to Base Sepolia or Ethereum Sepolia.

---

## 1. Repository State

Run:

```bash
git status
npm run compile
npm run test
npm run reward:merkle
```

Required:

- working tree clean
- compile passes
- all tests pass
- reward Merkle generator works

---

## 2. Local Smoke Deployment

Run:

```bash
rm -rf deployments/hardhat-base deployments/hardhat-mainnet

npm run deploy:local-full -- --network hardhatBase
npm run deploy:local-full -- --network hardhatMainnet
```

Required:

- ROTY deployed
- OiOiSoftStaking deployed
- ROTY approved in staking
- Melting deployed
- Melting approved in staking
- Amanda deployed
- Amanda approved in staking
- Mock $OiOi deployed
- OiOiRewardDistributor deployed
- deployment.json written

---

## 3. Environment Variables

Required in `.env`:

```env
PRIVATE_KEY=
BASE_SEPOLIA_RPC_URL=
ETHEREUM_SEPOLIA_RPC_URL=
ETHERSCAN_API_KEY=

BASE_SEPOLIA_OIOI_TOKEN=
ETHEREUM_SEPOLIA_OIOI_TOKEN=
```

Mainnet variables may also be present, but do not use mainnet deploy commands during testnet phase.

---

## 4. Deployer Wallet

Expected deployer / owner wallet:

```text
0x29bf68e3969e0b6686ea55b7c48241ba3f6b9ba0
```

Before testnet deploy, confirm the private key in `.env` belongs to this wallet.

Do not continue if the deploy script reports a different deployer.

---

## 5. Testnet Funds

Before deploying:

### Base Sepolia Funds

Required:

- enough Base Sepolia ETH for deployment gas
- enough Base Sepolia `$OiOi` test token for reward distributor testing

### Ethereum Sepolia Funds

Required:

- enough Sepolia ETH for deployment gas
- enough Ethereum Sepolia `$OiOi` test token for reward distributor testing

---

## 6. Testnet $OiOi Token Addresses

RewardDistributor requires immutable reward token address.

Before deploying reward distributor on testnet:

```env
BASE_SEPOLIA_OIOI_TOKEN=0x...
ETHEREUM_SEPOLIA_OIOI_TOKEN=0x...
```

Do not deploy `OiOiRewardDistributor` on testnet while these are blank or zero address.

If a testnet $OiOi token is not available yet, deploy a testnet mock $OiOi token first.

---

## 7. ROTY Whitelist Merkle Root

Run:

```bash
npm run whitelist:clean
npm run whitelist:merkle
cat scripts/whitelist/output/roty-whitelist.root.txt
```

Required:

- clean whitelist generated
- rejected rows reviewed
- root exists
- root is `0x` + 64 hex chars
- same root can be used for ROTY BASE and ROTY dETH

---

## 8. Deployment Config Smoke Check

Run:

```bash
npm run deploy:config -- baseSepolia
npm run deploy:config -- ethereumSepolia
```

Required:

- correct chain labels
- correct collection names
- correct symbols
- correct prices
- correct unrevealed URIs
- correct testnet `$OiOi` token addresses
- no unexpected zero address for reward token

---

## 9. Testnet Deployment Order

Only after all readiness checks pass:

### Base Sepolia

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

### Ethereum Sepolia

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

---

## 10. Testnet Deployment Record Check

After each chain deployment:

```bash
cat deployments/base-sepolia/deployment.json
cat deployments/ethereum-sepolia/deployment.json
```

Required fields:

```json
{
  "contracts": {
    "roty": "0x...",
    "staking": "0x...",
    "melting": "0x...",
    "amanda": "0x...",
    "rewardDistributor": "0x..."
  },
  "tokens": {
    "oioi": "0x..."
  },
  "registrations": {
    "rotyApprovedInStaking": true,
    "meltingApprovedInStaking": true,
    "amandaApprovedInStaking": true
  }
}
```

---

## 11. Constructor Args Export

After deployment:

```bash
npm run verify:args -- baseSepolia
npm run verify:args -- ethereumSepolia
```

Required:

- constructor args generated for all five contracts
- summary.json generated
- files are not committed

---

## 12. Contract Verification

Verify after explorer indexing is ready.

Required contracts per chain:

1. TheRotyMemorial
2. OiOiSoftStaking
3. MeltingMemorial
4. AmandaMemorial
5. OiOiRewardDistributor

Do not proceed to frontend testing until contracts are verified or verification failure is understood.

---

## 13. Testnet Functional Checks

After deployment and verification:

### ROTY

- whitelist mint works
- public mint works
- whitelist wallet cannot claim free mint twice
- whitelist wallet can public mint after free mint
- payment goes to treasury

### Staking

- ROTY can be staked
- Melting can be staked
- Amanda can be staked
- NFT remains in wallet
- `hasValidStake()` returns true while NFT is owned
- `hasValidStake()` returns false when NFT leaves wallet
- `hasValidStake()` returns true again if NFT returns

### Melting

- mint is closed by default
- non-staker cannot mint
- ROTY staker can mint after gated mint enabled
- payment goes to treasury

### Amanda

- mint is closed by default
- non-staker cannot mint
- ROTY staker can mint
- Melting staker can mint
- payment goes to treasury

### RewardDistributor

- reward round can be created
- reward round can be funded
- valid proof can claim
- invalid proof cannot claim
- double claim fails
- unclaimed allocation remains claimable

---

## 14. Stop Conditions

Stop immediately if:

- wrong deployer wallet appears
- wrong chain appears
- reward token is zero address
- deployment record contains wrong address
- contract verification fails for unknown reason
- treasury address is wrong
- royalty receiver is wrong
- mint price is wrong
- staking references wrong collection
- reward distributor references wrong token

Do not “fix forward” on mainnet. Diagnose first.

---

P.S. Read this document freely for information and guidance. Do not redistribute or restate—no quotes, summaries, paraphrases, or derivatives—without prior written permission from [**Prof. NOTA**](https://nota.endhonesa.com/). Sharing the link is allowed. So, share the link, not the text. Do not discuss or re-tell the contents in any form—written, spoken, or recorded—without prior written permission.

---
