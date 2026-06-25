# OiOi Melting Dashboard — Mainnet Contract Deployment Completion v1

Date: 2026-06-25

Status:

```text
MAINNET CONTRACT DEPLOYMENT COMPLETION V1: COMPLETE
BASE MAINNET CONTRACT DEPLOYMENT: DONE / VERIFIED / SAFE OFF
ETHEREUM MAINNET CONTRACT DEPLOYMENT: DONE / VERIFIED / SAFE OFF
PUBLIC LAUNCH: NOT APPROVED
MAINNET ENV WIRING: NOT APPROVED
MAINNET REWARD CLAIM LAUNCH: NOT APPROVED
METADATA LOCK: NOT APPROVED
MINT OPENING: NOT APPROVED
```

This document records completion of the Base Mainnet and Ethereum Mainnet contract deployment stage only.

It does not approve public launch, mainnet frontend env wiring, opening mint phases, reward claim launch, metadata reveal, metadata lock, or `lockMetadata()`.

---

## 1. Deployment Records

Base Mainnet deployment record:

```text
commit: c116f0fb3912ee6c1c00308008f5b3a6ba1cdc19
file: deployments/base-mainnet/deployment.json
```

Ethereum Mainnet deployment record:

```text
commit: 592a8945cc78696b9a26a56281c0e91796d503ab
file: deployments/ethereum-mainnet/deployment.json
```

`.env` is not part of this completion record and must not be committed.

Constructor args generated files may remain local/ignored unless repo policy explicitly changes.

---

## 2. Base Mainnet Deployed Addresses

```text
ROTY BASE: 0x55b74ec648ab9ec3e9557627b3b22cce27e2606c
OiOiSoftStaking: 0xd2211e042af0d618ec33622417064c761d5f71ea
Melting BASE: 0xed1f55128e43699f7ee50ad7ae61bca7d559d991
Amanda BASE: 0x486a060e304d02aa241a6904fa7cb95777f88b77
OiOiRewardDistributor: 0xfa9fe257e99b50547981273d249c04ab7e06d380
$OiOi Base: 0xba0032620d88D9b16752CbDE75593c080C3d38de
```

---

## 3. Ethereum Mainnet Deployed Addresses

```text
ROTY dETH: 0xcb89275572ad3fb388d4c8ad78d7b94e05e5f218
OiOiSoftStaking: 0xa0dc510eecabb579ab3744224132ee46c6a2ef6a
Melting dETH: 0xb2dcc1d826f88a287924480b0f7b73e50ecb0192
Amanda dETH: 0xbfcef50a61847b321c54722a870ec43f49791263
OiOiRewardDistributor: 0x18d5e33c34d5da020c23ad3849ae28765da84fae
$OiOi Ethereum: 0x1C696882b93d7241d09D55f52693cAD367A5bEaf
```

---

## 4. Verification Result

```text
BaseScan verification: DONE / already verified
Etherscan verification: DONE / already verified or successfully verified
Base read-check: PASS
Ethereum read-check: PASS
```

---

## 5. Safe-Off Result

```text
ROTY whitelist mint: OFF
ROTY public mint: OFF
Melting gated mint: OFF
Amanda gated mint: OFF
ROTY metadataLocked: false
Melting metadataLocked: false
Amanda metadataLocked: false
ROTY revealed: false
Melting revealed: false
Amanda revealed: false
Reward funded/claimed/unclaimed/excess: 0
```

Mint phases must remain OFF until a later explicit controlled opening approval.

Metadata must remain unlocked. `lockMetadata()` must not be called until final Melting/Amanda revealed metadata is uploaded, checked, updated, indexed, and explicitly approved.

---

## 6. Not Included In This Completion

```text
This completion does not approve public launch.
This completion does not approve mainnet env wiring.
This completion does not approve opening mint.
This completion does not approve reward claim launch.
This completion does not approve metadata reveal or lock.
This completion does not approve `lockMetadata()`.
```

Mainnet indexer/reward/proof flow still requires separate implementation/configuration/validation/approval before any production reward claim launch.

---

## 7. Next Gates

```text
Gate 1: Mainnet env wiring plan
Gate 2: Mainnet read-only frontend QA
Gate 3: Controlled mint opening approval
Gate 4: Mainnet indexer/reward/proof production validation
Gate 5: Reward claim launch approval
Gate 6: Final metadata update/reveal/lock approval
```

---

## 8. Final Status

```text
MAINNET CONTRACT DEPLOYMENT COMPLETION V1: COMPLETE
BASE MAINNET CONTRACT DEPLOYMENT: DONE / VERIFIED / SAFE OFF
ETHEREUM MAINNET CONTRACT DEPLOYMENT: DONE / VERIFIED / SAFE OFF
PUBLIC LAUNCH: NOT APPROVED
MAINNET ENV WIRING: NOT APPROVED
MAINNET REWARD CLAIM LAUNCH: NOT APPROVED
METADATA LOCK: NOT APPROVED
MINT OPENING: NOT APPROVED
```

P.S. Read this document freely for information and guidance. Do not redistribute or restate—no quotes, summaries, paraphrases, or derivatives—without prior written permission from [**Prof. NOTA**](https://nota.endhonesa.com/). Sharing the link is allowed. So, share the link, not the text. Do not discuss or re-tell the contents in any form—written, spoken, or recorded—without prior written permission.

---
