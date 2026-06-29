# OiOi Melting Dashboard — Admin Dashboard Architecture v1

This document defines the Admin Dashboard architecture for the OiOi Melting Dashboard ecosystem.

The Admin Dashboard exists so the owner/deployer can safely operate deployed contracts from the frontend instead of relying only on CLI commands or block explorers.

Current rollout position:

```text
1. Lock Testnet Contract Deployment — DONE
2. Complete Testnet Frontend Application — DONE
3. Admin Dashboard Architecture v1 — DONE
4. Mainnet public/admin operations — LIVE
5. Current mode — EVERGREEN MAINTENANCE
```

---

## 1. Decision Lock

Admin Dashboard v1 was required before full Testnet Browser E2E and is now
implemented, QA-passed, and operational.

Admin Dashboard v1 must be:

```text
wallet-first
chain-aware
contract-state-driven
owner-gated for write actions
readable for operational review
safe-by-default
warning-heavy for dangerous actions
```

The connected wallet remains the identity.

The Admin Dashboard must not introduce:

```text
email login
phone login
passkey login
social login
embedded wallet
smart account / account abstraction
off-chain admin identity
```

---

## 2. Route Structure

Recommended routes:

```text
/admin
/admin/base
/admin/ethereum
```

Optional later routes:

```text
/admin/base/rewards
/admin/ethereum/rewards
/admin/base/metadata
/admin/ethereum/metadata
/admin/base/emergency
/admin/ethereum/emergency
```

Reason for `/admin/*` instead of nesting under `/dashboard/*`:

```text
User dashboard = user staking/reward surface.
Admin dashboard = owner/operator control surface.
```

---

## 3. Access Model

### 3.1 Read access

The Admin Dashboard can display read-only operational state even when the connected wallet is not owner.

This helps diagnose wrong-wallet and wrong-chain situations.

### 3.2 Write access

All write controls must be disabled unless:

```text
wallet is connected
wallet is on the correct chain
wallet address equals owner() for the relevant contract
```

Client-side owner checks are UX protection only.

The final security layer remains on-chain `onlyOwner` checks.

### 3.3 Owner mismatch warning

If the connected wallet is not owner, show:

```text
Connected wallet is not the owner for this contract. Write actions are disabled.
```

### 3.4 Cross-contract owner review

The admin overview must show owner state for:

```text
ROTY
Melting
Amanda
OiOi Soft Staking
OiOi Reward Distributor
```

If any owner differs from the expected deployer/owner, show a warning.

---

## 4. Contract Surface Audit

This section audits the actual smart contract surface that must be represented in Admin Dashboard design.

---

## 4.1 Shared NFT Core Surface

Applies to:

```text
TheRotyMemorial
MeltingMemorial
AmandaMemorial
```

Inherited core contract:

```text
MemorialNFTCore
```

### Core read functions / public variables

```text
owner()
pendingOwner()
name()
symbol()
BUILD_STAGE()
MAX_ROYALTY_FEE_NUMERATOR()
maxSupply()
maxMintPerTx()
totalMinted()
totalSupply()
nextTokenId()
remainingSupply()
mintPrice()
treasury()
revealed()
metadataLocked()
unrevealedURI()
revealedBaseURI()
baseExtension()
exists(tokenId)
tokenURI(tokenId)
publicMintCost(quantity)
royaltyInfo(tokenId, salePrice)
supportsInterface(interfaceId)
```

### Core owner write functions

```text
setMintPrice(newMintPrice)
setTreasury(newTreasury)
setRevealed(newRevealed)
setUnrevealedURI(newUnrevealedURI)
setRevealedBaseURI(newRevealedBaseURI)
setBaseExtension(newBaseExtension)
lockMetadata()
setDefaultRoyalty(receiver, feeNumerator)
rescueETH(to, amount)
rescueERC20(token, to, amount)
transferOwnership(newOwner)
acceptOwnership()
```

### Core write functions intentionally hidden by default

```text
renounceOwnership()
```

`renounceOwnership()` should not be exposed in Admin Dashboard v1. It can permanently break owner operations.

---

## 4.2 ROTY-specific Surface

Applies to:

```text
TheRotyMemorial
```

### ROTY read functions / public variables

```text
ORIGIN_CHAIN_ID()
ORIGIN_CONTRACT()
ORIGIN_NAME()
ROTY_MAX_SUPPLY()
ROTY_MAX_MINT_PER_TX()
ROTY_ROYALTY_FEE()
merkleRoot()
whitelistMintEnabled()
publicMintEnabled()
whitelistClaimed(account)
whitelistLeaf(account)
```

### ROTY owner write functions

```text
setMerkleRoot(newMerkleRoot)
setWhitelistMintEnabled(enabled)
setPublicMintEnabled(enabled)
```

### ROTY public/user write functions

These belong in mint pages, not Admin Dashboard primary controls:

```text
whitelistMint(proof)
publicMint(quantity)
```

Admin Dashboard may link to mint pages but should not duplicate user mint flows as admin controls.

---

## 4.3 Melting-specific Surface

Applies to:

```text
MeltingMemorial
```

### Melting read functions / public variables

```text
MELTING_MAX_SUPPLY()
MELTING_MAX_MINT_PER_TX()
MELTING_ROYALTY_FEE()
stakingContract()
rotyCollection()
gatedMintEnabled()
```

### Melting owner write functions

```text
setGatedMintEnabled(enabled)
```

### Melting public/user write functions

These belong in mint pages:

```text
mint(quantity)
```

---

## 4.4 Amanda-specific Surface

Applies to:

```text
AmandaMemorial
```

### Amanda read functions / public variables

```text
AMANDA_MAX_SUPPLY()
AMANDA_MAX_MINT_PER_TX()
AMANDA_ROYALTY_FEE()
stakingContract()
rotyCollection()
meltingCollection()
gatedMintEnabled()
```

### Amanda owner write functions

```text
setGatedMintEnabled(enabled)
```

### Amanda public/user write functions

These belong in mint pages:

```text
mint(quantity)
```

---

## 4.5 Soft Staking Surface

Applies to:

```text
OiOiSoftStaking
```

### Staking read functions / public variables

```text
owner()
pendingOwner()
BUILD_STAGE()
approvedCollection(collection)
getStakePosition(user, collection, tokenId)
getUserStakedTokenIds(user, collection)
isStakeActive(user, collection, tokenId)
isStakeValid(user, collection, tokenId)
hasValidStake(user, collection)
hasValidStakeInCollections(user, collections)
```

### Staking owner write functions

```text
setCollectionApproved(collection, approved)
transferOwnership(newOwner)
acceptOwnership()
```

### Staking public/user write functions

These belong in user dashboard, not Admin Dashboard primary controls:

```text
stake(collection, tokenId)
unstake(collection, tokenId)
```

---

## 4.6 Reward Distributor Surface

Applies to:

```text
OiOiRewardDistributor
```

### Reward read functions / public variables

```text
owner()
pendingOwner()
BUILD_STAGE()
rewardToken()
hasClaimed(roundId, account)
totalRewardFunded()
totalRewardClaimed()
getRewardRound(roundId)
isRoundFunded(roundId)
claimable(roundId, account, amount, proof)
rewardLeaf(roundId, account, amount)
allocatedUnclaimedRewardBalance()
excessRewardTokenBalance()
```

### Reward owner write functions

```text
createRewardRound(roundId, periodStart, periodEnd, rewardAmount, merkleRoot)
fundRewardRound(roundId, amount)
setMerkleRoot(roundId, newMerkleRoot)
setClaimPaused(roundId, paused)
rescueETH(to, amount)
rescueERC20(token, to, amount)
transferOwnership(newOwner)
acceptOwnership()
```

### Reward public/user write functions

These belong in reward claim UI, not Admin Dashboard primary controls:

```text
claim(roundId, amount, proof)
batchClaim(roundIds, amounts, proofs)
```

Admin Dashboard may include claim status lookups for debugging.

---

## 4.7 ERC20 $OiOi Surface Needed by Admin

Applies to the chain-specific `$OiOi` token.

### ERC20 read functions

```text
name()
symbol()
decimals()
balanceOf(account)
allowance(owner, spender)
```

### ERC20 write function needed for reward funding

```text
approve(spender, amount)
```

Funding a reward round requires:

```text
1. Owner wallet has enough $OiOi.
2. Owner approves RewardDistributor for amount.
3. Owner calls fundRewardRound(roundId, amount).
```

Admin Dashboard should show allowance and balance before funding.

---

## 5. Admin Dashboard Sections

## 5.1 Admin Home

Route:

```text
/admin
```

Purpose:

```text
Choose Base or Ethereum admin surface.
Show connected wallet.
Show environment mode.
Show warning that admin actions affect live contracts on the selected chain.
```

Links:

```text
/admin/base
/admin/ethereum
```

---

## 5.2 Chain Admin Overview

Route:

```text
/admin/base
/admin/ethereum
```

Cards:

```text
Network status
Connected wallet
Expected chain
Contract addresses
Owner status per contract
Pending owner status per contract
Mint phase summary
Reward distributor summary
Staking registry summary
```

---

## 5.3 Mint Phase Controls

Purpose:

```text
Operational control for opening/closing mint phases.
```

Controls:

```text
ROTY whitelist mint ON/OFF
ROTY public mint ON/OFF
Melting gated mint ON/OFF
Amanda gated mint ON/OFF
```

Required reads after transaction:

```text
whitelistMintEnabled()
publicMintEnabled()
gatedMintEnabled()
```

Risk level:

```text
Medium / High
```

Warning:

```text
Enabling mint opens real user transactions on this chain. Confirm frontend, price, treasury, and eligibility before enabling.
```

---

## 5.4 Metadata and Reveal Controls

Purpose:

```text
Prepare and execute reveal operations without block explorer usage.
```

Controls per collection:

```text
setUnrevealedURI(newUnrevealedURI)
setRevealedBaseURI(newRevealedBaseURI)
setBaseExtension(newBaseExtension)
setRevealed(true/false)
lockMetadata()
```

Required reads:

```text
revealed()
metadataLocked()
unrevealedURI()
revealedBaseURI()
baseExtension()
tokenURI(tokenId)
```

Risk level:

```text
High / Critical
```

Warnings:

```text
setRevealed(true): Confirm revealedBaseURI and baseExtension are correct. This changes tokenURI behavior.
lockMetadata(): Irreversible. Only lock after all metadata is final, uploaded, checked, and indexed.
setUnrevealedURI/setRevealedBaseURI: Wrong URI may break collection display.
```

Recommended guard:

```text
typed confirmation for lockMetadata: type LOCK METADATA
```

---

## 5.5 Pricing, Treasury, and Royalty Controls

Controls per collection:

```text
setMintPrice(newMintPrice)
setTreasury(newTreasury)
setDefaultRoyalty(receiver, feeNumerator)
```

Required reads:

```text
mintPrice()
treasury()
royaltyInfo(tokenId, salePrice)
MAX_ROYALTY_FEE_NUMERATOR()
```

Risk level:

```text
High
```

Warnings:

```text
setMintPrice: New mints immediately use this price.
setTreasury: Mint proceeds immediately go to the new treasury.
setDefaultRoyalty: Affects marketplace royalty information.
```

Recommended guard:

```text
show old value + new value
require explicit modal confirmation
```

---

## 5.6 Staking Registry Controls

Controls:

```text
setCollectionApproved(ROTY, true/false)
setCollectionApproved(Melting, true/false)
setCollectionApproved(Amanda, true/false)
```

Required reads:

```text
approvedCollection(collection)
```

Risk level:

```text
Medium / High
```

Warning:

```text
Disabling a collection can block new staking or eligibility checks that depend on approved collections.
```

---

## 5.7 Reward Round Controls

Purpose:

```text
Create, fund, pause, and maintain reward rounds.
```

Controls:

```text
createRewardRound(roundId, periodStart, periodEnd, rewardAmount, merkleRoot)
approve $OiOi spending for RewardDistributor
fundRewardRound(roundId, amount)
setClaimPaused(roundId, paused)
setMerkleRoot(roundId, newMerkleRoot)
```

Required reads:

```text
rewardToken()
$OiOi balanceOf(owner)
$OiOi allowance(owner, rewardDistributor)
getRewardRound(roundId)
isRoundFunded(roundId)
totalRewardFunded()
totalRewardClaimed()
allocatedUnclaimedRewardBalance()
excessRewardTokenBalance()
hasClaimed(roundId, account)
claimable(roundId, account, amount, proof)
```

Risk level:

```text
High
```

Warnings:

```text
createRewardRound: Confirm period, reward amount, and Merkle root match reviewed allocation file.
fundRewardRound: Requires prior $OiOi approval and transfers tokens into RewardDistributor.
setMerkleRoot: Cannot update after claims. Wrong root makes valid users unable to claim.
setClaimPaused: Pausing blocks claims; unpausing enables claims for eligible users.
```

Recommended guards:

```text
show allocation summary hash / root before createRewardRound
show allowance and balance before fundRewardRound
post-transaction read check after create/fund/pause
```

---

## 5.8 Emergency and Rescue Controls

Controls:

```text
NFT rescueETH(to, amount)
NFT rescueERC20(token, to, amount)
RewardDistributor rescueETH(to, amount)
RewardDistributor rescueERC20(token, to, amount)
```

RewardDistributor rescueERC20 must respect allocated rewards and may revert if rescue would touch allocated reward balances.

Risk level:

```text
Critical
```

Warnings:

```text
Rescue functions move assets out of contracts. Use only for recovery, dust, or explicitly reviewed excess funds.
```

Recommended guard:

```text
disable by default behind an “Emergency” section
require typed confirmation
show contract balance and target address
```

---

## 5.9 Ownership Controls

Controls:

```text
transferOwnership(newOwner)
acceptOwnership()
```

Hidden by default:

```text
renounceOwnership()
```

Risk level:

```text
Critical
```

Warning:

```text
Ownership controls affect who can operate the contract. Incorrect transfer may lock operational access.
```

Recommended guard:

```text
separate Ownership section
typed confirmation
never show renounceOwnership in v1
```

---

## 6. Risk Levels

Use these risk categories in UI:

```text
Low: read-only or harmless diagnostics.
Medium: reversible operational settings.
High: settings that affect minting, metadata, rewards, treasury, or user access.
Critical: irreversible, asset-moving, or ownership-changing operations.
```

Every Medium/High/Critical action should have an info icon.

High/Critical actions should also have a confirmation modal.

Critical actions should require typed confirmation.

---

## 7. Info Icon / Warning Pattern

Each admin action should show an `(i)` info icon.

Clicking or hovering displays:

```text
What this function does.
Who can call it.
What can go wrong.
Whether it is reversible.
What should be checked before calling it.
```

Example for `setRevealed(true)`:

```text
This changes tokenURI behavior from unrevealedURI to revealedBaseURI + tokenId + baseExtension. Confirm the revealed metadata is uploaded and checked before enabling reveal.
```

Example for `lockMetadata()`:

```text
This is irreversible. After locking, metadata URI settings cannot be changed. Only call this after final artwork and metadata are verified.
```

---

## 8. Required ABI Expansion

Admin-capable frontend ABIs are required for the owner control surface.

Add admin-capable ABIs for:

```text
shared NFT core admin reads/writes
ROTY admin reads/writes
Gated NFT admin reads/writes
Soft Staking admin reads/writes
Reward Distributor admin reads/writes
Ownable2Step reads/writes
ERC20 allowance/approve/balance reads
```

Suggested file strategy:

```text
lib/contracts/abis.ts          existing user + shared ABIs
lib/contracts/adminAbis.ts     admin-specific ABIs
```

Alternative:

```text
keep all ABIs in lib/contracts/abis.ts but clearly group admin fragments
```

Recommended:

```text
Create lib/contracts/adminAbis.ts
```

Reason:

```text
keeps high-risk admin functions visibly separated from user-facing ABI usage
```

---

## 9. Required Frontend Components

Suggested structure:

```text
app/admin/page.tsx
app/admin/[chain]/page.tsx

components/admin/AdminShell.tsx
components/admin/AdminAccessGuard.tsx
components/admin/AdminChainOverview.tsx
components/admin/OwnerStatusCard.tsx
components/admin/MintPhaseControls.tsx
components/admin/MetadataControls.tsx
components/admin/PricingTreasuryRoyaltyControls.tsx
components/admin/StakingRegistryControls.tsx
components/admin/RewardRoundControls.tsx
components/admin/EmergencyControls.tsx
components/admin/OwnershipControls.tsx
components/admin/AdminActionButton.tsx
components/admin/AdminWarningTooltip.tsx
components/admin/AdminConfirmDialog.tsx
components/admin/ValueChangePreview.tsx

lib/hooks/admin/useAdminOwnerState.ts
lib/hooks/admin/useAdminNftState.ts
lib/hooks/admin/useAdminRewardState.ts
lib/hooks/admin/useAdminWriteAction.ts
lib/hooks/admin/useErc20ApprovalState.ts
```

---

## 10. Admin Write Flow

Every write action should follow this flow:

```text
1. Confirm wallet connected.
2. Confirm correct chain.
3. Confirm connected wallet is contract owner.
4. Show current value.
5. Show proposed value.
6. Show risk warning.
7. Require confirmation.
8. Submit transaction.
9. Wait for receipt.
10. Refetch relevant reads.
11. Show explorer link.
12. Show success or failure message.
```

For High/Critical actions, also:

```text
require typed confirmation
```

---

## 11. Testing Plan

### 11.1 Non-owner Browser Test

Use a wallet that is not owner.

Expected:

```text
admin page loads
read-only state visible
write controls disabled
owner mismatch warning visible
no transaction can be submitted from UI
```

### 11.2 Owner Browser Test

Use deployer/owner wallet.

Expected:

```text
admin page loads
owner recognized
correct-chain guard works
read state visible
safe write actions enabled
High/Critical confirmations appear
transaction lifecycle works
post-write reads update
```

### 11.3 Base Sepolia Admin Test

Test:

```text
ROTY whitelist mint ON/OFF
ROTY public mint ON/OFF
Melting gated mint ON/OFF
Amanda gated mint ON/OFF
Staking collection approval read/write check
Reward round create/fund/pause test with test $OiOi
Metadata reads
Reveal controls not executed unless intentionally testing reveal behavior
```

### 11.4 Ethereum Sepolia Admin Test

Repeat Base Sepolia tests on Ethereum Sepolia.

### 11.5 Do Not Test Casually

Do not casually test:

```text
lockMetadata
transferOwnership
rescueETH
rescueERC20
setTreasury
setDefaultRoyalty
```

unless the purpose, values, and rollback limitations are explicitly understood.

---

## 12. Implementation Order

### Step 1 — Admin ABI Expansion

Add admin ABIs.

Validate:

```bash
npm run build
npm run compile
npm run test
```

### Step 2 — Admin Routes + Shell

Add:

```text
/admin
/admin/base
/admin/ethereum
```

Validate:

```text
routes load
wallet connect appears
ChainGuard works
```

### Step 3 — Admin Read Panels

Add overview, owner status, mint phase state, staking state, reward state.

Validate:

```text
Base Sepolia reads pass
Ethereum Sepolia reads pass
non-owner can view read-only state
```

### Step 4 — Mint Phase Controls

Add ON/OFF controls for ROTY, Melting, Amanda.

Validate:

```text
owner can toggle testnet phases
non-owner cannot toggle
post-write read updates
```

### Step 5 — Reward Admin Controls

Add reward round create/fund/pause controls and ERC20 approve flow.

Validate:

```text
owner can approve $OiOi
owner can create reward round
owner can fund reward round
owner can pause/unpause claim
post-write read updates
```

### Step 6 — Metadata Controls

Add URI/reveal/lock controls with High/Critical warnings.

Validate:

```text
read state visible
write controls guarded
lockMetadata requires typed confirmation
```

Do not execute metadata lock except in intentionally disposable test deployment.

### Step 7 — Pricing/Treasury/Royalty Controls

Add controls with warnings.

Validate cautiously on testnet only.

### Step 8 — Emergency/Ownership Controls

Add rescue and ownership controls behind separate Emergency/Ownership sections.

Keep `renounceOwnership()` hidden.

### Step 9 — Admin Dashboard Browser QA

Create or update checklist.

Validate owner and non-owner flows on Base Sepolia and Ethereum Sepolia.

---

## 13. Done Criteria

Admin Dashboard Architecture v1 is done when:

```text
contract surface audit completed
routes selected
access model locked
risk levels defined
warning/tooltip pattern defined
required ABI expansion listed
implementation order defined
testing plan defined
```

Admin Dashboard Implementation v1 is done when:

```text
/admin, /admin/base, /admin/ethereum exist
owner access guard works
read panels work
mint phase controls work
reward controls work
metadata controls exist with warnings
High/Critical actions have confirmations
non-owner cannot submit writes
Base Sepolia admin QA passes
Ethereum Sepolia admin QA passes
```

---

## 14. Current Status

Completed:

```text
Admin Routes + Shell v1
Admin Read Panels v1
Admin Mint Phase Controls v1
Admin Reward Controls v1
Admin Metadata Controls v1
Admin Dashboard Browser QA v1
Mainnet admin operations
Evergreen maintenance
```

---

P.S. Read this document freely for information and guidance. Do not redistribute or restate—no quotes, summaries, paraphrases, or derivatives—without prior written permission from [**Prof. NOTA**](https://nota.endhonesa.com/). Sharing the link is allowed. So, share the link, not the text. Do not discuss or re-tell the contents in any form—written, spoken, or recorded—without prior written permission.

---
