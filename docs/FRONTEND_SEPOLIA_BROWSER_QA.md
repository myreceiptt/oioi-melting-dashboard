# OiOi Melting Dashboard — Frontend Sepolia Browser QA v2

This checklist records the completed Sepolia frontend QA and defines the next browser QA stages.

Current frontend mode:

```text
NEXT_PUBLIC_APP_ENV=sepolia
```

Required wallet model:

```text
Required wallet compatibility, strict EOA-first identity.
```

---

## 1. Completed QA Scope

Status: Completed for current Sepolia MVP.

Validated:

```text
homepage routes
all six mint pages
dashboard routes
wallet connect
ChainGuard
ROTY mint disabled states while phases OFF
gated mint disabled states while phases OFF
whitelist eligibility reads
staking eligibility reads
dashboard stake/unstake
reward placeholder
browser console review
```

This QA did not validate active reward claim because proof API and reward calculator are not yet complete.

This QA did not validate Admin Dashboard because Admin Dashboard is not yet implemented.

---

## 2. Pre-QA Commands

Run before each frontend QA pass:

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

## 3. Environment Review

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

## 4. Current Route QA

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

Expected:

```text
page loads
wallet connect appears
chain-aware content appears
no runtime crash
```

---

## 5. Wallet QA

Test with:

```text
injected browser wallet
MetaMask
WalletConnect
Coinbase Wallet if available
```

Expected:

```text
wallet modal opens
no email login
no phone login
no passkey login
no social login
no embedded wallet
connected address appears
current chain appears
disconnect works
```

---

## 6. ChainGuard QA

Expected:

```text
wrong-chain warning appears
switch chain button appears
wrong-chain actions blocked
correct-chain actions enabled according to state
```

---

## 7. ROTY Mint Page QA

Routes:

```text
/mint/roty/base
/mint/roty/ethereum
```

Expected while phases OFF:

```text
collection name appears
symbol appears
contract address appears
wallet connect appears
live contract state appears
remainingSupply appears
maxSupply appears
maxMintPerTx appears
mintPrice appears
revealed appears
metadataLocked appears
whitelistMintEnabled appears
publicMintEnabled appears
whitelist eligibility appears after wallet connect
whitelist claimed appears after wallet connect
Whitelist Mint button disabled
Public Mint button disabled
```

Expected disabled messages:

```text
Whitelist mint is closed.
Public mint is closed.
```

---

## 8. Gated Mint Page QA

Routes:

```text
/mint/melting/base
/mint/melting/ethereum
/mint/amanda/base
/mint/amanda/ethereum
```

Expected while phases OFF:

```text
page loads
collection name appears
symbol appears
contract address appears
wallet connect appears
live contract state appears
gatedMintEnabled appears
eligibility appears after wallet connect
mint button disabled
```

Expected disabled message:

```text
Gated mint is closed.
```

---

## 9. Dashboard Stake / Unstake QA

Routes:

```text
/dashboard/base
/dashboard/ethereum
```

Expected:

```text
supported collection summary appears
stake/unstake panel appears for ROTY, Melting, Amanda
input tokenId appears
ownerOf reads if token exists
stake active reads
stake valid reads
Stake disabled if already active
Unstake enabled if active
Stake enabled if inactive and wallet owns token
```

Completed manual transaction QA:

```text
unstake succeeded
stake again succeeded
Base Sepolia and Ethereum Sepolia states updated correctly
```

---

## 10. Reward Placeholder QA

Expected:

```text
RewardDistributor address appears
$OiOi token address appears
rewardToken from distributor appears
totalRewardFunded appears
totalRewardClaimed appears
allocatedUnclaimedRewardBalance appears
excessRewardTokenBalance appears
distributor $OiOi balance appears
wallet $OiOi balance appears if connected
Claim button disabled
Claim not active yet message appears
```

---

## 11. Next QA Stages

### Admin Dashboard QA

Pending.

Must validate:

```text
owner access
non-owner blocked
read surfaces
mint phase ON/OFF controls
metadata/reveal controls
staking approval controls
reward round create/fund
claim pause/unpause
warnings/tooltips
confirmation modals
post-write refresh
```

### Mint With Phases ON QA

Pending.

Must validate:

```text
ROTY whitelist mint
ROTY public mint
Melting gated mint
Amanda gated mint
wrong-chain protection
tx status
explorer links
phase restore OFF
```

### Reward Claim QA

Pending.

Must validate:

```text
proof API
claimable amount
claim transaction
claimed status refresh
already-claimed state
non-eligible wallet state
```

### Full Browser E2E

Pending.

Defined in:

```text
docs/TESTNET_PRODUCT_COMPLETION_PLAN.md
```

---

## 12. Current Result

```text
FRONTEND SEPOLIA BROWSER QA FOR CURRENT MVP: PASS
ADMIN DASHBOARD QA: PENDING
ACTIVE MINT QA WITH PHASES ON: PENDING
REWARD CLAIM QA: PENDING
FULL TESTNET BROWSER E2E: PENDING
```

---

P.S. Read this document freely for information and guidance. Do not redistribute or restate—no quotes, summaries, paraphrases, or derivatives—without prior written permission from [**Prof. NOTA**](https://nota.endhonesa.com/). Sharing the link is allowed. So, share the link, not the text. Do not discuss or re-tell the contents in any form—written, spoken, or recorded—without prior written permission.

---
