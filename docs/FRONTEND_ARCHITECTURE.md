# OiOi Melting Dashboard — Frontend Architecture v2

This document defines the frontend architecture for the OiOi Melting Dashboard ecosystem.

The frontend must support:

1. Six NFT mint pages.
2. One user soft staking dashboard.
3. One admin dashboard.
4. $OiOi reward claim UI.
5. Base and Ethereum chain sets.
6. Testnet-first development, then mainnet switch-over.

---

## 1. Decision Lock — Wallet Connection v1

Guiding sentence:

```text
Required wallet compatibility, strict EOA-first identity.
```

Frontend v1 identity model:

```text
Wallet-first
Chain-aware
Contract-state-driven
EOA-first
No embedded wallet
No smart account / account abstraction
No email login
No phone login
No passkey login
No social login
No identity linking
```

Meaning:

- User must connect an existing Web3 wallet.
- The connected wallet address is the user identity.
- The same wallet address mints, stakes, unstakes, and claims.
- Admin identity is also wallet-based.
- Owner/admin write access is controlled by the connected owner wallet and on-chain contract permissions.

Wallet compatibility v1:

1. Injected wallets
2. MetaMask
3. WalletConnect
4. Coinbase Wallet in EOA-only mode
5. EIP-1193 provider support
6. EIP-6963 multi-wallet discovery

---

## 2. Frontend Stack

```text
Next.js
TypeScript
Tailwind
wagmi
viem
TanStack Query
custom wallet modal
```

Do not use embedded wallet SDKs in v1.

Do not use social login SDKs in v1.

Do not use account abstraction SDKs in v1.

---

## 3. Product Surfaces

### Mint Pages

Domains:

```text
rotybase.endhonesa.com
rotydeth.endhonesa.com
meltingbase.endhonesa.com
meltingdeth.endhonesa.com
amandabase.endhonesa.com
amandadeth.endhonesa.com
```

Routes:

```text
/mint/roty/base
/mint/roty/ethereum
/mint/melting/base
/mint/melting/ethereum
/mint/amanda/base
/mint/amanda/ethereum
```

### User Dashboard

Domain:

```text
softstaking.endhonesa.com
```

Routes:

```text
/dashboard
/dashboard/base
/dashboard/ethereum
```

### Admin Dashboard

Suggested routes:

```text
/admin
/admin/base
/admin/ethereum
```

Admin Dashboard is required before Testnet Release Candidate.

---

## 4. Current Frontend Status

Completed:

```text
Next.js app shell
Tailwind baseline
wagmi config
wallet connectors
custom wallet modal
ChainGuard
env validation
contract address config
explorer helpers
homepage links
six mint pages
ROTY public mint UI
ROTY whitelist proof lookup
ROTY whitelist mint UI
Melting gated mint UI
Amanda gated mint UI
dashboard stake/unstake UI
reward claim UI backed by Supabase proof API
Sepolia browser QA for read/OFF-phase/stake flows
```

Pending:

```text
owned NFT auto-discovery
reward claim browser QA with real funded testnet rounds
final UI/UX polish
```

---

## 5. Admin Dashboard Architecture Requirement

Admin Dashboard must be designed after a Contract Admin Surface Audit.

Audit actual functions from:

```text
TheRotyMemorial
MeltingMemorial
AmandaMemorial
MemorialNFTCore
OiOiSoftStaking
OiOiRewardDistributor
ERC20 $OiOi reads
```

Admin Dashboard must support read and write surfaces necessary for future operation.

### Read Surfaces

```text
owner
pendingOwner
mint phase states
mint prices
treasury
royalty receiver/fee
metadata state
revealed state
revealedBaseURI
unrevealedURI
baseExtension
metadataLocked
staking approved collections
reward token
reward round details
reward funded/claimed counters
claim pause status
ERC20 balances
ERC20 allowance where useful
```

### Write Surfaces

```text
setWhitelistMintEnabled
setPublicMintEnabled
setGatedMintEnabled
setMerkleRoot
setMintPrice
setTreasury
setDefaultRoyalty
setRevealed
setRevealedBaseURI
setUnrevealedURI
setBaseExtension
lockMetadata
setCollectionApproved
createRewardRound
fundRewardRound
setClaimPaused
transferOwnership
acceptOwnership
rescueETH
rescueERC20
```

### Risk Controls

Admin write actions must include:

```text
owner guard
non-owner blocked state
info/warning icon
tooltip/explanation
confirmation modal
current value display
new value display
post-transaction state refresh
```

High-risk actions must include stronger confirmation:

```text
lockMetadata
setTreasury
setDefaultRoyalty
setMerkleRoot
setRevealed
setRevealedBaseURI
rescueETH
rescueERC20
transferOwnership
```

Irreversible actions such as `lockMetadata()` must require typed confirmation.

---

## 6. Environment Strategy

Frontend supports:

```env
NEXT_PUBLIC_APP_ENV=sepolia
```

or:

```env
NEXT_PUBLIC_APP_ENV=mainnet
```

Sepolia envs are used for testnet product completion.

Mainnet envs are filled only after mainnet deployment records exist.

---

## 7. Reward Claim Architecture

Reward claim UI depends on Supabase-backed reward proof data.

Current state:

```text
Reward claim panel exists.
Proof API exists and reads Supabase reward tables.
End-to-end browser claim validation still depends on generated proofs and a funded testnet round.
```

Active claim flow:

```text
fetch reward rounds
fetch wallet allocation/proof
read hasClaimed from contract
display claimable amount
submit claim transaction
wait for receipt
refresh claimed state
```

---

## 8. Testing Strategy

Every frontend stage has its own browser testing.

Required stage tests:

```text
wallet connect
chain switch
mint pages
gated mint
user dashboard stake/unstake
admin dashboard reads/writes
reward claim
```

Full Browser E2E happens after all stages are complete.

---

## 9. Mainnet Switch

Mainnet switch happens only after Testnet Release Candidate.

Mainnet switch steps:

```text
fill NEXT_PUBLIC_BASE_*
fill NEXT_PUBLIC_ETH_*
set NEXT_PUBLIC_APP_ENV=mainnet
deploy Vercel production
run mainnet read-only QA
confirm mint phases OFF
```

Do not open mint during mainnet env wiring.

---

P.S. Read this document freely for information and guidance. Do not redistribute or restate—no quotes, summaries, paraphrases, or derivatives—without prior written permission from [**Prof. NOTA**](https://nota.endhonesa.com/). Sharing the link is allowed. So, share the link, not the text. Do not discuss or re-tell the contents in any form—written, spoken, or recorded—without prior written permission.

---
