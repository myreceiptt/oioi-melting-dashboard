# OiOi Melting Dashboard — Spec Lock v2

This document defines the locked specification for the OiOi Melting Dashboard ecosystem.

---

## 1. Ecosystem Structure

The ecosystem is split into two chain-specific sets.

### Base Set

```text
3 NFT collections on Base
1 OiOi Soft Staking contract on Base
1 OiOi Reward Distributor contract on Base
1 Base $OiOi token
```

### Ethereum Set

```text
3 NFT collections on Ethereum
1 OiOi Soft Staking contract on Ethereum
1 OiOi Reward Distributor contract on Ethereum
1 Ethereum $OiOi token
```

The two ecosystems are separate.

Rewards are not merged cross-chain.

A user chooses Base or Ethereum based on holdings and preference.

---

## 2. NFT Collections

### ROTY BASE

```text
Name: ROTY BASE
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
Name: ROTY dETH
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

### Melting dETH

```text
Name: Melting dETH
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

Admin Dashboard is required before Testnet Release Candidate.

Admin Dashboard must audit and expose necessary read/write controls from:

```text
TheRotyMemorial
MeltingMemorial
AmandaMemorial
MemorialNFTCore
OiOiSoftStaking
OiOiRewardDistributor
ERC20 $OiOi reads
```

Admin Dashboard must include warnings, tooltips, and confirmations for risky actions.

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

Admin Dashboard must include reveal and metadata controls because they are future-required operations, but these controls must be guarded.

High-risk metadata controls:

```text
setRevealed(...)
setRevealedBaseURI(...)
setUnrevealedURI(...)
setBaseExtension(...)
lockMetadata()
```

`lockMetadata()` is irreversible and must require explicit confirmation.

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

## 10. Indexer / Reward Storage Lock

The indexer + reward pipeline is Supabase Postgres-first.

```text
Supabase Postgres is the primary storage for indexer checkpoints, indexed events, ownership state, stake state, reward rounds, reward allocations, and claim proof data.
```

Local JSON is not the primary indexer storage.

Allowed JSON/static outputs:

```text
Merkle output files
published public proof snapshots
audit exports
backups
```

---

## 11. Frontend Identity Lock

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

## 12. Frontend Surfaces

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

Admin Dashboard routes are required before Testnet Release Candidate.

Suggested admin routes:

```text
/admin
/admin/base
/admin/ethereum
```

One codebase supports all surfaces.

---

## 13. Launch Status

Current status:

```text
CONTRACT SUITE: TESTNET VALIDATED
DEPLOYMENT TOOLING: TESTNET VALIDATED
FRONTEND: SEPOLIA MVP IMPLEMENTED
ADMIN DASHBOARD: ARCHITECTURE NEXT
INDEXER STORAGE: SUPABASE POSTGRES LOCKED
INDEXER IMPLEMENTATION: SKELETON ONLY / TRANSFER SYNC PAUSED
REWARD CALCULATOR: NOT PRODUCTION-COMPLETE
TESTNET RELEASE CANDIDATE: NOT READY
MAINNET DEPLOYMENT: READY BUT DEFERRED UNTIL TESTNET RC
PUBLIC LAUNCH: NOT READY
```

---

## 14. Current Execution Principle

The project will use the following sequence:

```text
Testnet full product completion
→ Testnet full browser E2E
→ Testnet Release Candidate
→ Mainnet deployment
→ Mainnet env wiring
→ Mainnet read-only QA
→ Controlled mainnet opening
```

Mainnet deployment must not happen merely because contract preflight is ready.

Mainnet deployment waits for Testnet Release Candidate unless there is an explicit strategic override.

---

P.S. Read this document freely for information and guidance. Do not redistribute or restate—no quotes, summaries, paraphrases, or derivatives—without prior written permission from [**Prof. NOTA**](https://nota.endhonesa.com/). Sharing the link is allowed. So, share the link, not the text. Do not discuss or re-tell the contents in any form—written, spoken, or recorded—without prior written permission.

---
