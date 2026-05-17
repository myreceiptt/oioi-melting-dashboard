# OiOi Melting Dashboard — Spec Lock v1

This document defines the locked specification for the OiOi Melting Dashboard ecosystem.

---

## 1. Ecosystem Structure

The ecosystem is split into two chain-specific sets.

### Base Set

```text
3 NFT collections on Base
1 OiOiSoftStaking contract on Base
1 OiOiRewardDistributor contract on Base
1 Base $OiOi token
```

### Ethereum Set

```text
3 NFT collections on Ethereum
1 OiOiSoftStaking contract on Ethereum
1 OiOiRewardDistributor contract on Ethereum
1 Ethereum $OiOi token
```

The two ecosystems are separate.

Rewards are not merged cross-chain.

A user chooses Base or Ethereum based on their holdings and preference.

---

## 2. NFT Collections

### ROTY BASE

```text
Name: The ROTY BASE
Symbol: ROTYBASE
Chain: Base
Max supply: 1047
Token IDs: 1–1047
Mint price: 0.001047 ETH
Whitelist: 1 free mint per whitelisted wallet
Public mint: paid
Public mint per-wallet limit: none
Max mint per tx: 11
```

### ROTY dETH

```text
Name: The ROTY dETH
Symbol: ROTYDETH
Chain: Ethereum
Max supply: 1047
Token IDs: 1–1047
Mint price: 0.01047 ETH
Whitelist: 1 free mint per whitelisted wallet
Public mint: paid
Public mint per-wallet limit: none
Max mint per tx: 11
```

### Melting BASE

```text
Name: Melting BASE
Symbol: MELTBASE
Chain: Base
Max supply: 1747
Token IDs: 1–1747
Mint price: 0.001747 ETH
Mint type: staking-gated paid mint only
Eligibility: valid ROTY soft stake
Max mint per tx: 11
```

### MELTING dETH

```text
Name: MELTING dETH
Symbol: MELTDETH
Chain: Ethereum
Max supply: 1747
Token IDs: 1–1747
Mint price: 0.01747 ETH
Mint type: staking-gated paid mint only
Eligibility: valid ROTY soft stake
Max mint per tx: 11
```

### Amanda BASE

```text
Name: Amanda BASE
Symbol: AMANBASE
Chain: Base
Max supply: 2020
Token IDs: 1–2020
Mint price: 0.002020 ETH
Mint type: staking-gated paid mint only
Eligibility: valid ROTY or Melting soft stake
Max mint per tx: 11
```

### Amanda dETH

```text
Name: Amanda dETH
Symbol: AMANDETH
Chain: Ethereum
Max supply: 2020
Token IDs: 1–2020
Mint price: 0.02020 ETH
Mint type: staking-gated paid mint only
Eligibility: valid ROTY or Melting soft stake
Max mint per tx: 11
```

---

## 3. ROTY Origin / Provenance

ROTY Base and ROTY Ethereum reference the Polygon origin collection.

```text
originChainId: 137
originContract: 0x6d2723cb02c558cf67473dc959ac08737b6129a9
originName: THE ROTY BROI
```

Total intended lineage:

```text
Polygon ROTY BROI: 1047
Base ROTY BASE: 1047
Ethereum ROTY dETH: 1047
Total lineage: 3141 NFTs
```

Melting and Amanda are fresh collections and do not have old provenance contracts.

---

## 4. Treasury and Royalty

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

Mint proceeds are sent directly to treasury.

The contracts do not need mint-proceeds withdraw logic.

---

## 5. Owners and Admin

Initial owner / deployer:

```text
0x29bf68e3969e0b6686ea55b7c48241ba3f6b9ba0
```

Admin model:

```text
Owner-only
Ownable2Step where applicable
```

Mint phases default OFF after deployment.

---

## 6. Metadata

### ROTY

Unrevealed URI:

```text
ipfs://bafkreiefsmbkjgw3fs47v52xu6zqzbgw4z2fhdsgvaczh7gstn4txurv2m
```

Revealed base URI:

```text
ipfs://bafybeigzgy6jngo4lvdqukwge2e3nwtgmnt7kpkmg7p2mmi2zrr5atmm3a/
```

### Melting

Unrevealed URI:

```text
ipfs://bafkreiccvibarcxlaq3q2vm23p4jsbtxizkjneivjokh4srdpsi36zzzdi
```

Revealed base URI:

```text
ipfs://pending-melting-revealed/
```

### Amanda

Unrevealed URI:

```text
ipfs://bafkreihvdfz5un5mslexhs2u5zagfw2dsw62hnvt3unvaypiijtyco7agy
```

Revealed base URI:

```text
ipfs://pending-amanda-revealed/
```

Metadata can be updated until `lockMetadata()` is called.

Do not lock metadata until final revealed metadata is checked.

---

## 7. $OiOi Tokens

Base $OiOi:

```text
0xba0032620d88D9b16752CbDE75593c080C3d38de
```

Ethereum $OiOi:

```text
0x1C696882b93d7241d09D55f52693cAD367A5bEaf
```

Supplies are separate.

Each max supply:

```text
47,474,747
```

Reward distribution is chain-specific.

---

## 8. Soft Staking

Staking model:

```text
Non-custodial soft staking
NFT remains in user wallet
Staking contract records staking intent
Validity is checked with ownerOf(tokenId)
```

A stake is valid only if:

```text
stake is active
AND
the staker currently owns the NFT
```

If the NFT leaves the wallet, the stake can remain active but becomes invalid.

If the NFT returns to the same staker wallet, the stake can become valid again.

---

## 9. Reward Model

Reward distribution is irregular.

Rewards may be distributed weekly, monthly, or whenever allocation exists.

RewardDistributor does not calculate rewards.

RewardDistributor only:

```text
stores reward rounds
stores Merkle root
receives/funds $OiOi
verifies claim proofs
prevents double claims
tracks cumulative funded and claimed counters
```

Reward allocation is calculated off-chain from:

```text
staking events
unstaking events
NFT transfer events
valid staking duration
collection weights
```

Weights:

```text
DENOMINATOR = 1,000,000
ROTY        = 217,491
MELTING     = 362,900
AMANDA      = 419,609
```

---

## 10. Frontend Identity Lock

Frontend v1 identity model:

```text
Wallet-first
Chain-aware
Contract-state-driven
EOA-first
```

Frontend v1 does not support:

```text
embedded wallet
smart account / account abstraction
email login
phone login
passkey login
social login
identity linking
```

Required compatibility:

```text
Injected wallets
MetaMask
WalletConnect
Coinbase Wallet in EOA-only mode
EIP-1193
EIP-6963
```

Guiding sentence:

```text
Required wallet compatibility, strict EOA-first identity.
```

---

## 11. Frontend Surfaces

Mint pages:

```text
rotybase.endhonesa.com
rotydeth.endhonesa.com
meltingbase.endhonesa.com
meltingdeth.endhonesa.com
amandabase.endhonesa.com
amandadeth.endhonesa.com
```

Dashboard:

```text
softstaking.endhonesa.com
```

One codebase supports all surfaces.

Implemented frontend routes:

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
/api/whitelist/roty/[chain]/[address]
```

---

## 12. Frontend Implementation Lock

Frontend Sepolia MVP is implemented.

Included:

- wallet connection
- ChainGuard
- live contract reads
- ROTY public mint UI
- ROTY whitelist proof lookup
- ROTY whitelist mint UI
- Melting/Amanda gated mint UI
- dashboard staking summary
- manual tokenId stake/unstake UI
- reward claim placeholder
- homepage links to all mint pages and dashboard routes
- Sepolia browser QA

Not yet included:

- automatic owned NFT discovery
- production reward proof API
- active reward claim button
- mainnet frontend environment switch
- mainnet browser QA

---

## 13. Indexer Lock

Accepted current indexer status:

```text
Indexer skeleton: implemented.
Indexer Transfer Sync: paused / experimental draft.
Indexer Operational Model: required before continuing implementation.
```

Operational decisions:

```text
Do not rewrite deployment scripts only to capture block numbers.
For v1, chain-level FROM_BLOCK may be read manually from block explorer and stored in .env.
TO_BLOCK is optional and only for bounded backfill/testing.
Checkpoint is written after successful sync and controls resume.
Indexer does not run in browser.
Frontend never scans blockchain history.
```

Storage decision:

```text
Local JSON storage first.
Postgres/Supabase or managed indexer later.
```

This means the current indexer work is not production reward infrastructure yet.

---

## 14. Launch Status

Current status:

```text
CONTRACT SUITE: TESTNET VALIDATED
DEPLOYMENT TOOLING: TESTNET VALIDATED
FRONTEND: SEPOLIA MVP IMPLEMENTED AND QA PASSED
DASHBOARD STAKE/UNSTAKE: SEPOLIA MVP IMPLEMENTED AND QA PASSED
REWARD CLAIM: PLACEHOLDER ONLY
INDEXER: SKELETON IMPLEMENTED; TRANSFER SYNC PAUSED / EXPERIMENTAL
MAINNET DEPLOYMENT: PENDING
PUBLIC LAUNCH: NOT READY
PUBLIC REWARD LAUNCH: NOT READY
```

---

P.S. Read this document freely for information and guidance. Do not redistribute or restate—no quotes, summaries, paraphrases, or derivatives—without prior written permission from [**Prof. NOTA**](https://nota.endhonesa.com/). Sharing the link is allowed. So, share the link, not the text. Do not discuss or re-tell the contents in any form—written, spoken, or recorded—without prior written permission.

---
