# OiOi Melting Dashboard — Frontend Sepolia Browser QA v1

This checklist validates the Sepolia frontend before indexer implementation and before mainnet deployment.

Current frontend mode:

```text
NEXT_PUBLIC_APP_ENV=sepolia
```

Required wallet model:

```text
Required wallet compatibility, strict EOA-first identity.
```

---

## 1. Pre-QA Commands

Run:

```bash
npm run build
npm run compile
npm run test
npm run deploy:read-check -- --network baseSepolia
npm run deploy:read-check -- --network ethereumSepolia
```

Required result:

```text
PASS
```

---

## 2. Environment Review

Confirm `.env` contains:

```env
NEXT_PUBLIC_APP_ENV=sepolia
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=

NEXT_PUBLIC_BASE_SEPOLIA_ROTY_CONTRACT=
NEXT_PUBLIC_BASE_SEPOLIA_MELTING_CONTRACT=
NEXT_PUBLIC_BASE_SEPOLIA_AMANDA_CONTRACT=
NEXT_PUBLIC_BASE_SEPOLIA_STAKING_CONTRACT=
NEXT_PUBLIC_BASE_SEPOLIA_REWARD_DISTRIBUTOR=
NEXT_PUBLIC_BASE_SEPOLIA_OIOI_TOKEN=

NEXT_PUBLIC_ETHEREUM_SEPOLIA_ROTY_CONTRACT=
NEXT_PUBLIC_ETHEREUM_SEPOLIA_MELTING_CONTRACT=
NEXT_PUBLIC_ETHEREUM_SEPOLIA_AMANDA_CONTRACT=
NEXT_PUBLIC_ETHEREUM_SEPOLIA_STAKING_CONTRACT=
NEXT_PUBLIC_ETHEREUM_SEPOLIA_REWARD_DISTRIBUTOR=
NEXT_PUBLIC_ETHEREUM_SEPOLIA_OIOI_TOKEN=
```

Do not commit `.env`.

---

## 3. Start Frontend

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Expected:

- homepage loads
- no runtime crash
- wallet connect button appears
- navigation links appear

---

## 4. Wallet QA

Test with:

- injected browser wallet
- MetaMask
- WalletConnect
- Coinbase Wallet if available

Expected:

- wallet modal opens
- no email login
- no phone login
- no passkey login
- no social login
- no embedded wallet
- connected address appears
- current chain appears
- disconnect works

---

## 5. ChainGuard QA

### Base page while connected to Ethereum Sepolia

Open:

```text
http://localhost:3000/mint/roty/base
```

Expected:

- wrong-chain warning appears
- switch chain button appears
- mint action blocked

### Ethereum page while connected to Base Sepolia

Open:

```text
http://localhost:3000/mint/roty/ethereum
```

Expected:

- wrong-chain warning appears
- switch chain button appears
- mint action blocked

---

## 6. ROTY Mint Pages

Open:

```text
http://localhost:3000/mint/roty/base
http://localhost:3000/mint/roty/ethereum
```

Expected:

- page loads
- collection name appears
- symbol appears
- contract address appears
- wallet connect appears
- live contract state appears
- totalMinted appears
- remainingSupply appears
- maxSupply appears
- maxMintPerTx appears
- mintPrice appears
- revealed appears
- metadataLocked appears
- whitelistMintEnabled appears
- publicMintEnabled appears
- whitelist eligibility appears after wallet connect
- whitelist claimed appears after wallet connect
- Whitelist Mint button appears
- Public Mint button appears
- both buttons disabled while mint phases are OFF

Expected disabled messages:

```text
Whitelist mint is closed.
Public mint is closed.
```

---

## 7. Gated Mint Pages

Open:

```text
http://localhost:3000/mint/melting/base
http://localhost:3000/mint/melting/ethereum
http://localhost:3000/mint/amanda/base
http://localhost:3000/mint/amanda/ethereum
```

Expected:

- page loads
- collection name appears
- symbol appears
- contract address appears
- wallet connect appears
- live contract state appears
- gatedMintEnabled appears
- eligibility appears after wallet connect
- mint button appears
- mint button disabled while gated mint is OFF

Expected disabled message:

```text
Gated mint is closed.
```

Eligibility expectations:

```text
Wallet without valid stake: eligible = No
Wallet with valid stake: eligible = Yes
```

---

## 8. Dashboard Pages

Open:

```text
http://localhost:3000/dashboard
http://localhost:3000/dashboard/base
http://localhost:3000/dashboard/ethereum
```

Expected:

- dashboard loads
- chain selector links appear
- wallet connect appears
- ChainGuard works
- supported collection summary appears
- stake/unstake panel appears
- reward placeholder appears

---

## 9. Stake / Unstake Panel QA

Open:

```text
http://localhost:3000/dashboard/base
http://localhost:3000/dashboard/ethereum
```

For each collection:

- ROTY
- Melting
- Amanda

Enter tokenId:

```text
1
```

Expected:

- ownerOf appears if token exists
- connected wallet owns token = correct
- stake active = correct
- stake valid = correct
- Stake button disabled if already active
- Unstake button enabled if active
- Stake button enabled if user owns token and stake inactive
- Unstake button disabled if stake inactive

Optional transaction QA:

- unstake tokenId 1
- verify stake active becomes No
- stake tokenId 1 again
- verify stake active becomes Yes
- verify stake valid becomes Yes

---

## 10. Reward Placeholder QA

Open:

```text
http://localhost:3000/dashboard/base
http://localhost:3000/dashboard/ethereum
```

Expected:

- RewardDistributor address appears
- $OiOi token address appears
- rewardToken from distributor appears
- totalRewardFunded appears
- totalRewardClaimed appears
- allocatedUnclaimedRewardBalance appears
- excessRewardTokenBalance appears
- distributor $OiOi balance appears
- wallet $OiOi balance appears if wallet connected
- Claim button is disabled
- “Claim not active yet” message appears

---

## 11. Browser Console QA

Open browser devtools.

Expected:

- no red runtime errors
- no repeated RPC failure loop
- no missing env error
- no hydration error
- no broken route error

Warnings may be reviewed case by case.

---

## 12. Routes QA

Valid routes:

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
```

Invalid route examples:

```text
/mint/wrong/base
/mint/roty/wrong
/dashboard/wrong
```

Expected:

- valid routes load
- invalid routes show invalid page message or not-found behavior
- app does not crash

---

## 13. QA Result

Base Sepolia frontend:

```text
PASS
```

Ethereum Sepolia frontend:

```text
PASS
```

Wallet connection:

```text
PASS
```

ChainGuard:

```text
PASS
```

Mint read UI:

```text
PASS
```

Stake/unstake UI:

```text
PASS
```

Reward placeholder:

```text
PASS
```

Final result:

```text
FRONTEND SEPOLIA BROWSER QA: PASS
```

---

P.S. Read this document freely for information and guidance. Do not redistribute or restate—no quotes, summaries, paraphrases, or derivatives—without prior written permission from [**Prof. NOTA**](https://nota.endhonesa.com/). Sharing the link is allowed. So, share the link, not the text. Do not discuss or re-tell the contents in any form—written, spoken, or recorded—without prior written permission.

---
