# OiOi Melting Dashboard — Frontend Architecture v1

This document defines the frontend architecture for the OiOi Melting Dashboard ecosystem.

The frontend must support:

1. Six NFT mint pages.
2. One soft staking dashboard.
3. $OiOi reward claim UI.
4. Base and Ethereum chain sets.
5. Testnet-first development, then mainnet switch-over.

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
- No off-chain user profile is required for v1.
- No hidden account abstraction should be assumed.
- No embedded wallet should be created for the user.

Wallet compatibility v1:

Required:

1. Injected wallets
2. MetaMask
3. WalletConnect
4. Coinbase Wallet in EOA-only mode
5. EIP-1193 provider support
6. EIP-6963 multi-wallet discovery

Required connectors:

```ts
injected();
metaMask();
walletConnect({ projectId });
coinbaseWallet({
  appName: "OiOi Melting Dashboard",
  preference: "eoaOnly",
});
```

Required env:

```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=
```

---

## 2. Frontend Stack

Frontend stack:

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

## 3. Core Frontend Principles

### 3.1 Wallet-first

The wallet is the account.

There is no separate user account.

No email identity, phone identity, passkey identity, or social identity is attached to the user.

### 3.2 Chain-aware

Every action must happen on the correct chain.

Base actions must happen on Base or Base Sepolia.

Ethereum actions must happen on Ethereum or Ethereum Sepolia.

A wallet holding/staking on Base does not automatically qualify on Ethereum.

### 3.3 Contract-state-driven

Frontend must not invent state.

Frontend reads state from:

- NFT contracts
- OiOiSoftStaking contracts
- OiOiRewardDistributor contracts
- ERC20 $OiOi contracts
- indexer/backend reward data

### 3.4 EOA-first

The expected v1 user is an externally owned account.

The frontend should not create embedded wallets.

The frontend should not route actions through smart accounts.

The frontend should show the connected wallet address clearly.

### 3.5 Same-wallet rule

The same connected wallet must be used for:

- minting ROTY
- staking ROTY
- minting Melting
- staking Melting
- minting Amanda
- staking Amanda
- claiming $OiOi

---

## 4. Product Surfaces

### 4.1 Six Mint Pages

Domains:

```text
rotybase.endhonesa.com
rotydeth.endhonesa.com
meltingbase.endhonesa.com
meltingdeth.endhonesa.com
amandabase.endhonesa.com
amandadeth.endhonesa.com
```

Routes in one codebase:

```text
/mint/roty/base
/mint/roty/ethereum
/mint/melting/base
/mint/melting/ethereum
/mint/amanda/base
/mint/amanda/ethereum
```

### 4.2 OiOi Melting Dashboard

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

Dashboard functions:

- connect wallet
- choose Base or Ethereum
- show supported collections
- show owned NFTs
- show stake status
- stake NFT
- unstake NFT
- show valid stake status
- show reward rounds
- show claimable rewards
- claim $OiOi

---

## 5. Chain Sets

### 5.1 Base Set

Mainnet:

```text
Chain: Base
ROTY: The ROTY BASE / ROTYBASE
Melting: Melting BASE / MELTBASE
Amanda: Amanda BASE / AMANBASE
$OiOi: Base $OiOi
```

Testnet:

```text
Chain: Base Sepolia
ROTY: The ROTY BASE / ROTYBASE
Melting: Melting BASE / MELTBASE
Amanda: Amanda BASE / AMANBASE
$OiOi: Base Sepolia $OiOi
```

### 5.2 Ethereum Set

Mainnet:

```text
Chain: Ethereum
ROTY: The ROTY dETH / ROTYDETH
Melting: MELTING dETH / MELTDETH
Amanda: Amanda dETH / AMANDETH
$OiOi: Ethereum $OiOi
```

Testnet:

```text
Chain: Ethereum Sepolia
ROTY: The ROTY dETH / ROTYDETH
Melting: MELTING dETH / MELTDETH
Amanda: Amanda dETH / AMANDETH
$OiOi: Ethereum Sepolia $OiOi
```

---

## 6. Environment Strategy

Frontend must support two modes:

```env
NEXT_PUBLIC_APP_ENV=sepolia
```

or:

```env
NEXT_PUBLIC_APP_ENV=mainnet
```

### 6.1 WalletConnect

```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=
```

### 6.2 Sepolia Contract Env

```env
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

### 6.3 Mainnet Contract Env

```env
NEXT_PUBLIC_BASE_ROTY_CONTRACT=
NEXT_PUBLIC_BASE_MELTING_CONTRACT=
NEXT_PUBLIC_BASE_AMANDA_CONTRACT=
NEXT_PUBLIC_BASE_STAKING_CONTRACT=
NEXT_PUBLIC_BASE_REWARD_DISTRIBUTOR=
NEXT_PUBLIC_BASE_OIOI_TOKEN=0xba0032620d88D9b16752CbDE75593c080C3d38de

NEXT_PUBLIC_ETH_ROTY_CONTRACT=
NEXT_PUBLIC_ETH_MELTING_CONTRACT=
NEXT_PUBLIC_ETH_AMANDA_CONTRACT=
NEXT_PUBLIC_ETH_STAKING_CONTRACT=
NEXT_PUBLIC_ETH_REWARD_DISTRIBUTOR=
NEXT_PUBLIC_ETH_OIOI_TOKEN=0x1C696882b93d7241d09D55f52693cAD367A5bEaf
```

---

## 7. Suggested Folder Structure

```text
app/
  layout.tsx
  page.tsx

  mint/
    [collection]/
      [chain]/
        page.tsx

  dashboard/
    page.tsx
    base/
      page.tsx
    ethereum/
      page.tsx

components/
  wallet/
    ConnectWalletButton.tsx
    CustomWalletModal.tsx
    WalletStatus.tsx
    ChainGuard.tsx
    WalletOptionButton.tsx

  mint/
    MintPageShell.tsx
    RotyMintPanel.tsx
    GatedMintPanel.tsx
    MintStatusCard.tsx
    EligibilityCard.tsx
    SupplyCard.tsx
    TransactionStatus.tsx

  dashboard/
    DashboardShell.tsx
    ChainSelector.tsx
    OwnedNftList.tsx
    NftCard.tsx
    StakePanel.tsx
    RewardPanel.tsx
    ClaimPanel.tsx

lib/
  wallet/
    wagmiConfig.ts
    connectors.ts
    walletLabels.ts

  chains/
    chains.ts
    chainMode.ts

  contracts/
    addresses.ts
    abis.ts
    collectionConfig.ts
    contractClients.ts

  hooks/
    useActiveChainSet.ts
    useCollectionConfig.ts
    useMintState.ts
    useRotyWhitelist.ts
    useStakeStatus.ts
    useOwnedNfts.ts
    useRewardClaims.ts
    useTransactionFlow.ts

  services/
    whitelistProofs.ts
    rewardProofs.ts
    nftOwnership.ts
    explorer.ts

  utils/
    env.ts
    format.ts
    invariant.ts
    address.ts

public/
  assets/
```

---

## 8. Wallet Layer Architecture

### 8.1 wagmi config

`lib/wallet/wagmiConfig.ts` should define:

- supported chains
- connectors
- transports
- WalletConnect project ID
- Coinbase Wallet EOA-only preference

Supported chains:

```text
base
mainnet
baseSepolia
sepolia
```

### 8.2 Connectors

`lib/wallet/connectors.ts` should expose:

```ts
injected();
metaMask();
walletConnect({ projectId });
coinbaseWallet({
  appName: "OiOi Melting Dashboard",
  preference: "eoaOnly",
});
```

### 8.3 Custom wallet modal

The custom wallet modal must show:

```text
Browser Wallet
MetaMask
WalletConnect
Coinbase Wallet
```

The modal should not show:

```text
Email login
Phone login
Passkey login
Social login
Create wallet
Embedded wallet
Smart account
```

### 8.4 Wallet status

Wallet status should display:

- connected address
- current chain
- required chain
- connector name if available
- wrong-chain warning
- switch chain button

---

## 9. Chain Guard

Every mint and dashboard action must pass through `ChainGuard`.

`ChainGuard` responsibilities:

1. Detect connected chain.
2. Compare with required chain.
3. If wrong chain, show switch button.
4. Prevent mint/stake/claim actions on wrong chain.
5. Show chain-specific warning.

Example messages:

```text
This page requires Base.
Switch to Base to continue.
```

```text
This page requires Ethereum.
Switch to Ethereum to continue.
```

```text
Your valid stake must exist on this same chain.
```

---

## 10. Contract Config

`lib/contracts/collectionConfig.ts` should define each supported collection:

```ts
type ChainSet = "base" | "ethereum";
type CollectionKey = "roty" | "melting" | "amanda";

type CollectionConfig = {
  chainSet: ChainSet;
  collectionKey: CollectionKey;
  name: string;
  symbol: string;
  contractAddress: `0x${string}`;
  stakingAddress: `0x${string}`;
  rewardDistributorAddress: `0x${string}`;
  oioiTokenAddress: `0x${string}`;
  mintPageUrl: string;
  explorerBaseUrl: string;
  mintType: "roty" | "gated";
};
```

The config should be generated from env variables and selected by:

```text
NEXT_PUBLIC_APP_ENV
route collection
route chain
current domain
```

---

## 11. Mint Page Behavior

### 11.1 ROTY Mint Page

Required reads:

- name
- symbol
- totalMinted
- remainingSupply
- mintPrice
- whitelistMintEnabled
- publicMintEnabled
- whitelistClaimed(address)
- merkle proof availability

Required actions:

- whitelistMint(proof)
- publicMint(quantity)

UI states:

```text
Not connected
Wrong chain
Whitelist closed
Public mint closed
Whitelist eligible
Whitelist already claimed
Public mint available
Sold out
Transaction pending
Transaction success
Transaction failed
```

### 11.2 Melting Mint Page

Required reads:

- totalMinted
- remainingSupply
- mintPrice
- gatedMintEnabled
- hasValidStake(user, ROTY)

Required action:

- mint(quantity)

UI states:

```text
Not connected
Wrong chain
Gated mint closed
No valid ROTY stake
Eligible to mint
Transaction pending
Transaction success
Transaction failed
```

### 11.3 Amanda Mint Page

Required reads:

- totalMinted
- remainingSupply
- mintPrice
- gatedMintEnabled
- hasValidStakeInCollections(user, [ROTY, Melting])

Required action:

- mint(quantity)

UI states:

```text
Not connected
Wrong chain
Gated mint closed
No valid ROTY or Melting stake
Eligible to mint
Transaction pending
Transaction success
Transaction failed
```

---

## 12. Dashboard Behavior

Dashboard has two chain views:

```text
Base
Ethereum
```

For each chain view:

### 12.1 Supported collections

Show:

- ROTY
- Melting
- Amanda

### 12.2 NFT ownership

MVP options:

1. Use indexer/backend owned NFT API.
2. Use RPC/event scan fallback.
3. Use marketplace/indexer API later if needed.

Preferred v1:

```text
Indexer/backend owned NFT API
```

### 12.3 Stake status

For each NFT:

- owned by connected wallet
- staked active
- stake valid
- stake invalid because NFT left wallet
- unstaked

Direct contract reads:

```solidity
getStakePosition(user, collection, tokenId)
isStakeActive(user, collection, tokenId)
isStakeValid(user, collection, tokenId)
hasValidStake(user, collection)
```

### 12.4 Actions

Actions:

```text
stake
unstake
```

Rules:

- user can stake only owned NFT
- user can unstake own active stake
- NFT does not leave wallet
- frontend must explain soft staking clearly

---

## 13. Reward Claim Behavior

Reward claim requires backend/indexer output.

Frontend needs:

```text
roundId
amount
proof
claimed status
claim paused status
round funded status
```

Direct contract reads:

```solidity
hasClaimed(roundId, account)
claimable(roundId, account, amount, proof)
getRewardRound(roundId)
```

Claim action:

```solidity
claim(roundId, amount, proof)
```

Reward UI states:

```text
No reward rounds
Reward round not funded
Not eligible
Already claimed
Claimable
Claim pending
Claim success
Claim failed
```

---

## 14. Data Sources

### 14.1 Direct on-chain reads

Use for:

- mint phase
- price
- supply
- treasury-independent user actions
- stake validity
- claim status
- reward distributor status

### 14.2 Static/generated data

Use for:

- ROTY whitelist proofs
- reward Merkle proofs during MVP
- collection metadata config

### 14.3 Indexer/backend data

Use for:

- owned NFTs
- staking timeline
- transfer timeline
- valid staking duration
- reward allocation
- reward round list
- claim proof endpoint

---

## 15. Whitelist Proof Strategy

ROTY whitelist proof must be available to frontend.

Preferred options:

### Option A — static JSON by address

Pros:

- simple
- no backend required

Cons:

- potentially large public file
- less flexible

### Option B — API route

Example:

```text
/api/whitelist/roty/base/:address
/api/whitelist/roty/ethereum/:address
```

Pros:

- lighter frontend load
- easier future changes

Cons:

- needs server/API deployment

v1 recommendation:

```text
Use API route or address-indexed JSON, whichever is fastest to implement cleanly.
```

The proof must match the deployed Merkle root.

---

## 16. Reward Proof Strategy

Reward proof should not be bundled into the frontend app directly.

Use backend/static endpoint:

```text
/api/rewards/:chain/:roundId/:address
```

Response:

```json
{
  "roundId": "1",
  "address": "0x...",
  "amountWei": "1000000000000000000",
  "proof": ["0x..."],
  "claimed": false
}
```

The frontend then calls:

```solidity
claim(roundId, amount, proof)
```

---

## 17. Explorer Links

Explorer helper should support:

```text
Base Sepolia
Ethereum Sepolia
Base Mainnet
Ethereum Mainnet
```

Use cases:

- tx link
- address link
- token link
- NFT contract link

---

## 18. UX Copy Requirements

Use clear wallet-first language.

Examples:

```text
Connect your wallet to continue.
```

```text
This wallet is your identity in OiOi Melting Dashboard.
```

```text
Use the same wallet to mint, stake, and claim.
```

```text
Your NFT stays in your wallet. Soft staking only records your staking intent.
```

```text
This stake is valid only while the NFT remains in this wallet.
```

Avoid:

```text
Login with email
Create account
Create wallet
Link identity
Smart wallet
Gasless by default
```

---

## 19. Frontend MVP Implementation Order

Recommended order:

1. Install frontend dependencies.
2. Add Tailwind if not already available.
3. Add wagmi/viem/TanStack Query setup.
4. Add wallet connector config.
5. Build custom wallet modal.
6. Add chain guard.
7. Add contract address config.
8. Add shared transaction status component.
9. Build ROTY mint page on Sepolia.
10. Build Melting mint page on Sepolia.
11. Build Amanda mint page on Sepolia.
12. Build dashboard chain selector.
13. Build owned NFT display.
14. Build stake/unstake UI.
15. Add reward panel placeholder.
16. Add whitelist proof integration.
17. Add reward proof integration later with indexer/backend.
18. Run browser E2E test on Base Sepolia and Ethereum Sepolia.
19. Switch env to mainnet after mainnet deployment.
20. Final mint opening review.

---

## 20. Frontend Launch Gate

Frontend is ready for public launch only when:

- wallet connect works
- wrong-chain guard works
- ROTY mint works
- Melting eligibility works
- Amanda eligibility works
- dashboard shows owned NFTs
- staking works
- unstaking works
- reward claim data source exists
- claim works on testnet
- mainnet contracts are verified
- read-check passes on mainnet
- mint phases are intentionally enabled

---

## 21. Non-Goals for v1

Do not include in v1:

```text
embedded wallets
email login
phone login
passkey login
social login
smart accounts
gas sponsorship
account abstraction
identity linking
custodial staking
cross-chain staking aggregation
automatic reward calculation in frontend
```

---

## 22. Open Items Before Implementation

Before starting frontend implementation, confirm:

1. WalletConnect project ID is available.
2. Sepolia frontend env values are filled.
3. Mainnet env values will be filled only after mainnet deployment.
4. Domain routing strategy is selected.
5. Whitelist proof delivery method is selected.
6. Indexer API shape is drafted.
7. UI copy direction is accepted.

---

P.S. Read this document freely for information and guidance. Do not redistribute or restate—no quotes, summaries, paraphrases, or derivatives—without prior written permission from [**Prof. NOTA**](https://nota.endhonesa.com/). Sharing the link is allowed. So, share the link, not the text. Do not discuss or re-tell the contents in any form—written, spoken, or recorded—without prior written permission.

---
