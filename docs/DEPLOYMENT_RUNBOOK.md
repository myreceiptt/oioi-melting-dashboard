# OiOi Melting Dashboard — Deployment Runbook v2

This runbook defines the safe deployment, verification, read-check, and functional-test order for the OiOi Melting Dashboard smart contract suite.

Version note: this v2 runbook reflects the actual Base Sepolia and Ethereum Sepolia deployment flow already completed during testnet rehearsal, including preflight checks, RPC allowlist troubleshooting, constructor-args export, multi-explorer verification, read-checks, mint-phase restore, functional tests, and reward-distributor counter behavior.

---

## Scope

### Contracts

1. `TheRotyMemorial`
2. `OiOiSoftStaking`
3. `MeltingMemorial`
4. `AmandaMemorial`
5. `OiOiRewardDistributor`

### Networks

1. `hardhatBase` — local/simulated Base-style rehearsal
2. `hardhatMainnet` — local/simulated Ethereum-style rehearsal
3. `baseSepolia` — Base Sepolia testnet
4. `ethereumSepolia` — Ethereum Sepolia testnet
5. `baseMainnet` — Base mainnet
6. `ethereumMainnet` — Ethereum mainnet

### Frontend Domains

- ROTY BASE mint: [rotybase.endhonesa.com](https://rotybase.endhonesa.com/)
- ROTY dETH mint: [rotydeth.endhonesa.com](https://rotydeth.endhonesa.com/)
- Melting BASE mint: [meltingbase.endhonesa.com](https://meltingbase.endhonesa.com/)
- Melting dETH mint: [meltingdeth.endhonesa.com](https://meltingdeth.endhonesa.com/)
- Amanda BASE mint: [amandabase.endhonesa.com](https://amandabase.endhonesa.com/)
- Amanda dETH mint: [amandadeth.endhonesa.com](https://amandadeth.endhonesa.com/)
- OiOi Melting Dashboard: [softstaking.endhonesa.com](https://softstaking.endhonesa.com/)

---

## 0. Golden Rules

Do not deploy mainnet before both Sepolia deployments pass verification, read-checks, and functional tests.

Do not enable mint immediately after deployment.

Do not leave mint phases enabled after functional testing.

Do not lock metadata until final revealed metadata is uploaded, checked, revealed, indexed, and approved.

Do not use local simulated deployment records as real deployment records.

Do not commit `.env`, private keys, generated constructor args, generated local deployment folders, Hardhat artifacts, cache, or local output files.

Do not “fix forward” on mainnet. Stop, inspect, and diagnose.

---

## 1. Required `.env` Values

Required for all real deployments:

```env
PRIVATE_KEY=
BASE_RPC_URL=
BASE_SEPOLIA_RPC_URL=
ETHEREUM_RPC_URL=
ETHEREUM_SEPOLIA_RPC_URL=
ETHERSCAN_API_KEY=
```

Required for testnet reward distributors:

```env
BASE_SEPOLIA_OIOI_TOKEN=
ETHEREUM_SEPOLIA_OIOI_TOKEN=
```

Mainnet `$OiOi` addresses are locked in deployment config:

```text
Base:
0xba0032620d88D9b16752CbDE75593c080C3d38de

Ethereum:
0x1C696882b93d7241d09D55f52693cAD367A5bEaf
```

Expected deployer / owner:

```text
0x29bf68e3969e0b6686ea55b7c48241ba3f6b9ba0
```

Mint treasury:

```text
0x9e26b98d4fadf70d0c0e57c609347358934a934c
```

Royalty receiver:

```text
0x29bf68e3969e0b6686ea55b7c48241ba3f6b9ba0
```

---

## 2. RPC / Alchemy Notes

If Alchemy returns:

```text
Unspecified origin not on whitelist.
```

then the RPC key is blocked by Alchemy allowlist settings.

For Hardhat / terminal deployment, use a deployment/backend Alchemy key that allows non-browser requests. Domain allowlist can break terminal requests because terminal requests usually do not send a browser `Origin` header.

Recommended key split:

1. Deployment/backend key — used in `.env` for Hardhat scripts.
2. Frontend key — domain allowlisted for production domains and previews.

To manually test Base Sepolia RPC:

```bash
curl -s -X POST "$BASE_SEPOLIA_RPC_URL" \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","id":1,"method":"eth_chainId","params":[]}'
```

Expected Base Sepolia result:

```json
{"jsonrpc":"2.0","id":1,"result":"0x14a34"}
```

If using shell variables, load `.env` first:

```bash
set -a
source .env
set +a
```

Security note: rotate/regenerate any RPC key that has been pasted into chat or public logs before production/mainnet use.

---

## 3. Global Pre-Deployment Checklist

Before any testnet or mainnet deployment:

```bash
git status
npm run compile
npm run test
npm run reward:merkle
npm run whitelist:clean
npm run whitelist:merkle
npm run deploy:config -- baseMainnet
npm run deploy:config -- ethereumMainnet
```

Expected:

- working tree clean
- compile passes
- tests pass
- reward Merkle generator works
- ROTY whitelist clean/proof generation works
- deployment config prints correct values
- ROTY Merkle root exists

Check ROTY Merkle root:

```bash
cat scripts/whitelist/output/roty-whitelist.root.txt
```

Expected format:

```text
0x + 64 hex chars
```

---

## 4. Deployment Preflight

Before deploying to any real network:

```bash
npm run deploy:preflight -- baseSepolia
npm run deploy:preflight -- ethereumSepolia
npm run deploy:preflight -- baseMainnet
npm run deploy:preflight -- ethereumMainnet
```

Preflight checks:

- network is supported
- chain ID matches expected network
- RPC URL is present and points to the correct chain
- `PRIVATE_KEY` matches `DEPLOYER_ADDRESS`
- `$OiOi` token address is not zero
- testnet `$OiOi` env value matches deploy config
- ROTY Merkle root exists
- collection config is valid
- existing deployment record is detected before redeploying

Do not deploy if preflight fails.

---

## 5. Local Full Smoke Deployment

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
- `OiOiSoftStaking` deployed
- ROTY approved in staking
- Melting deployed
- Melting approved in staking
- Amanda deployed
- Amanda approved in staking
- local mock `$OiOi` deployed
- `OiOiRewardDistributor` deployed
- `deployment.json` written

Do not use local deployment addresses for testnet or mainnet.

---

## 6. Testnet Deployment Pattern

The safe testnet pattern is:

```text
preflight
→ deploy all contracts
→ export constructor args
→ commit deployment record
→ verify all contracts
→ run read-check
→ run functional test
→ run read-check again
→ commit scripts/docs updates if any
```

Do not enable production mint after testnet deployment. Functional tests may temporarily enable mint phases, but must restore them to OFF.

---

## 7. Base Sepolia Deployment Order

Run only after global checks, preflight, and local full smoke deployment pass.

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

Commit after successful deployment:

```bash
git add deployments/base-sepolia/deployment.json
git commit -m "chore: record Base Sepolia deployment"
git push
```

---

## 8. Ethereum Sepolia Deployment Order

Run only after Base Sepolia deployment, verification, read-check, and functional test pass.

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

Commit after successful deployment:

```bash
git add deployments/ethereum-sepolia/deployment.json
git commit -m "chore: record Ethereum Sepolia deployment"
git push
```

---

## 9. Constructor Args Export

After deploying any real network, export constructor args:

```bash
npm run verify:args -- baseSepolia
npm run verify:args -- ethereumSepolia
npm run verify:args -- baseMainnet
npm run verify:args -- ethereumMainnet
```

This generates:

```text
deployments/<network>/constructor-args/TheRotyMemorial.ts
deployments/<network>/constructor-args/OiOiSoftStaking.ts
deployments/<network>/constructor-args/MeltingMemorial.ts
deployments/<network>/constructor-args/AmandaMemorial.ts
deployments/<network>/constructor-args/OiOiRewardDistributor.ts
```

These files are generated artifacts and are not committed.

---

## 10. Contract Verification

Verification requires exact constructor arguments. Always export constructor args before verification.

If Hardhat verification reports a missing RPC env variable, ensure `hardhat.config.ts` loads:

```ts
import "dotenv/config";
```

Manual verification commands:

### TheRotyMemorial

```bash
npx hardhat verify \
  --network <network> \
  --constructor-args-path deployments/<network-folder>/constructor-args/TheRotyMemorial.ts \
  <ROTY_ADDRESS>
```

### OiOiSoftStaking

```bash
npx hardhat verify \
  --network <network> \
  --constructor-args-path deployments/<network-folder>/constructor-args/OiOiSoftStaking.ts \
  <STAKING_ADDRESS>
```

### MeltingMemorial

```bash
npx hardhat verify \
  --network <network> \
  --constructor-args-path deployments/<network-folder>/constructor-args/MeltingMemorial.ts \
  <MELTING_ADDRESS>
```

### AmandaMemorial

```bash
npx hardhat verify \
  --network <network> \
  --constructor-args-path deployments/<network-folder>/constructor-args/AmandaMemorial.ts \
  <AMANDA_ADDRESS>
```

### OiOiRewardDistributor

```bash
npx hardhat verify \
  --network <network> \
  --constructor-args-path deployments/<network-folder>/constructor-args/OiOiRewardDistributor.ts \
  <REWARD_DISTRIBUTOR_ADDRESS>
```

Recommended order:

1. Wait until explorer indexes the deployment.
2. Export constructor args.
3. Verify ROTY.
4. Verify staking.
5. Verify Melting.
6. Verify Amanda.
7. Verify RewardDistributor.
8. Confirm verification on Etherscan, Blockscout, and Sourcify when available.

`already verified` is acceptable.

Constructor mismatch is not acceptable. Stop and diagnose.

---

## 11. Read Checks

Run read-check after deployment and verification.

```bash
npm run deploy:read-check -- --network baseSepolia
npm run deploy:read-check -- --network ethereumSepolia
npm run deploy:read-check -- --network baseMainnet
npm run deploy:read-check -- --network ethereumMainnet
```

Read-check confirms:

- names
- symbols
- owner
- treasury
- royalty receiver
- royalty amount
- mint prices
- max supplies
- max mint per tx
- unrevealed URI
- revealed URI/base URI
- reveal status
- metadata lock status
- ROTY Merkle root
- mint phase status
- staking approved collections
- Melting/Amanda staking dependencies
- RewardDistributor reward token
- RewardDistributor cumulative counters and token balance invariants

Important: RewardDistributor counters are cumulative.

Do not expect these to remain zero after functional tests:

```text
totalRewardFunded
totalRewardClaimed
```

The valid invariant is:

```text
totalRewardClaimed <= totalRewardFunded
allocatedUnclaimedRewardBalance == totalRewardFunded - totalRewardClaimed
rewardToken.balanceOf(distributor) >= allocatedUnclaimedRewardBalance
excessRewardTokenBalance == tokenBalance - allocatedUnclaimedRewardBalance
```

---

## 12. Restore Mint Phases

If any functional test, failed script, or manual action leaves mint phases enabled, restore them to OFF:

```bash
npm run deploy:restore-mint-phases -- --network baseSepolia
npm run deploy:restore-mint-phases -- --network ethereumSepolia
npm run deploy:restore-mint-phases -- --network baseMainnet
npm run deploy:restore-mint-phases -- --network ethereumMainnet
```

Expected safe state:

```text
ROTY whitelistMintEnabled = false
ROTY publicMintEnabled = false
Melting gatedMintEnabled = false
Amanda gatedMintEnabled = false
```

Always run read-check after restore:

```bash
npm run deploy:read-check -- --network <network>
```

---

## 13. Base Sepolia Functional Test

Run only after Base Sepolia deployment, verification, and read-check pass.

Prerequisites:

- deployer has enough Base Sepolia ETH for gas and mint payments
- deployer has at least 1 Base Sepolia `$OiOi`
- mint phases are OFF before test

Run:

```bash
npm run deploy:restore-mint-phases -- --network baseSepolia
npm run deploy:read-check -- --network baseSepolia
npm run test:base-sepolia-functional -- --network baseSepolia
npm run deploy:read-check -- --network baseSepolia
```

The functional test performs:

1. Temporarily enable ROTY public mint.
2. Public mint 1 ROTY.
3. Stake ROTY.
4. Temporarily enable Melting gated mint.
5. Mint 1 Melting.
6. Stake Melting.
7. Temporarily enable Amanda gated mint.
8. Mint 1 Amanda.
9. Stake Amanda.
10. Create reward round.
11. Approve `$OiOi` funding.
12. Fund reward round.
13. Claim reward.
14. Restore mint phases to their initial state.

The script must wait for transaction receipts and retry state reads before proceeding.

---

## 14. Ethereum Sepolia Functional Test

Run only after Ethereum Sepolia deployment, verification, and read-check pass.

Prerequisites:

- deployer has enough Ethereum Sepolia ETH for gas and mint payments
- deployer has at least 1 Ethereum Sepolia `$OiOi`
- mint phases are OFF before test

Run:

```bash
npm run deploy:restore-mint-phases -- --network ethereumSepolia
npm run deploy:read-check -- --network ethereumSepolia
npm run test:ethereum-sepolia-functional -- --network ethereumSepolia
npm run deploy:read-check -- --network ethereumSepolia
```

Expected final state:

```text
ROTY publicMintEnabled = false
Melting gatedMintEnabled = false
Amanda gatedMintEnabled = false
RewardDistributor counters valid
```

---

## 15. Testnet Completion Criteria

Testnet phase is complete only when both chains have:

```text
✅ deployment record committed
✅ constructor args exported
✅ contracts verified
✅ read-check passed before functional test
✅ functional test passed
✅ mint phases restored to OFF
✅ read-check passed after functional test
```

Do not proceed to mainnet until all criteria are met.

---

## 16. Mainnet Readiness Review

Before mainnet deployment, review:

1. Git status is clean.
2. Latest testnet deployment records are committed.
3. Latest scripts are committed.
4. Base Sepolia read-check and functional test passed.
5. Ethereum Sepolia read-check and functional test passed.
6. RPC keys are rotated if exposed.
7. Mainnet RPC URLs are confirmed with `eth_chainId`.
8. Deployer wallet has enough ETH on Base and Ethereum.
9. Mainnet `$OiOi` addresses are final.
10. ROTY whitelist Merkle root is final.
11. Unrevealed URIs are final.
12. Pending revealed URIs for Melting/Amanda are intentionally pending.
13. Mint phases will remain OFF after deployment.
14. Deployment window is chosen.
15. No rush, no tired deployment, no distracted deployment.

---

## 17. Base Mainnet Deployment Order

Run only after Mainnet Readiness Review passes.

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

Check:

```bash
cat deployments/base-mainnet/deployment.json
```

Commit deployment record:

```bash
git add deployments/base-mainnet/deployment.json
git commit -m "chore: record Base mainnet deployment"
git push
```

Do not enable mint yet.

---

## 18. Ethereum Mainnet Deployment Order

Run only after Base Mainnet deployment is verified, read-checked, and stable.

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

Check:

```bash
cat deployments/ethereum-mainnet/deployment.json
```

Commit deployment record:

```bash
git add deployments/ethereum-mainnet/deployment.json
git commit -m "chore: record Ethereum mainnet deployment"
git push
```

Do not enable mint yet.

---

## 19. Pre-Mint Opening Checklist

Before enabling any production mint phase:

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
- `whitelistMintEnabled` currently false
- `publicMintEnabled` currently false
- frontend reads contract correctly

### Melting

- contract verified
- staking contract reference correct
- ROTY reference correct
- price correct
- treasury correct
- unrevealed URI correct
- `gatedMintEnabled` currently false
- frontend reads eligibility correctly

### Amanda

- contract verified
- staking contract reference correct
- ROTY reference correct
- Melting reference correct
- price correct
- treasury correct
- unrevealed URI correct
- `gatedMintEnabled` currently false
- frontend reads eligibility correctly

### RewardDistributor

- contract verified
- reward token correct
- owner correct
- no unintended funded/claimable round
- frontend can read claim data

---

## 20. Mint Opening Order

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

For production, do not use raw blind execution. Prefer a dedicated opening script that waits for transaction receipts and read-confirms each state change.

---

## 21. Metadata Reveal + Lock

Do not lock metadata while unrevealed.

Steps:

1. Set final `revealedBaseURI`.
2. Check token 1 metadata.
3. Check last token metadata:
   - ROTY: 1047
   - Melting: 1747
   - Amanda: 2020
4. Call `setRevealed(true)`.
5. Wait and verify marketplace/indexer display.
6. Call `lockMetadata()` only after final approval.

If metadata is wrong before lock, update URI using owner function.

If metadata is already locked, URI cannot be updated by design.

---

## 22. Reward Round Procedure

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
4. Approve reward token funding.
5. Fund reward round.
6. Publish claim data to frontend.
7. Test one small claim.
8. Monitor claims.
9. Track cumulative funded/claimed counters.

---

## 23. Emergency Notes

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

If mint phase is accidentally left ON:

- run `npm run deploy:restore-mint-phases -- --network <network>`
- run read-check immediately after

If RPC fails:

- verify `.env` is loaded
- verify `eth_chainId` with curl
- check Alchemy allowlist settings
- rotate exposed keys before production

---

P.S. Read this document freely for information and guidance. Do not redistribute or restate—no quotes, summaries, paraphrases, or derivatives—without prior written permission from [**Prof. NOTA**](https://nota.endhonesa.com/). Sharing the link is allowed. So, share the link, not the text. Do not discuss or re-tell the contents in any form—written, spoken, or recorded—without prior written permission.

---
