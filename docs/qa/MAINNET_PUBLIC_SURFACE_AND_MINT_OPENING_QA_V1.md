# OiOi Melting Dashboard - Mainnet Public Surface and Mint Opening QA v1

Date: 2026-06-26

Status:

```text
MAINNET PUBLIC SURFACE: LIVE
PRODUCTION ENV: MAINNET
BASE MAINNET MINT PHASES: OPEN
ETHEREUM MAINNET MINT PHASES: OPEN
PRODUCTION BROWSER QA: PASS
ADMIN MAINNET OPERATIONS QA: PASS
METADATA LOCK: NOT PERFORMED
REWARD CLAIM: DEFERRED
REWARD ROUND OPERATIONS: PENDING MAINNET DATABASE / INDEXER / PROOF SUPPORT
UI/UX POLISH: REMAINING
```

This document records the current production/mainnet public surface and mint opening reality.

It does not approve reward claim launch, metadata lock, final metadata reveal/update/lock, or mainnet reward data-plane operations.

---

## 1. Production Domains Checked

```text
https://softstaking.endhonesa.com/
https://rotybase.endhonesa.com/
https://rotydeth.endhonesa.com/
https://meltingbase.endhonesa.com/
https://meltingdeth.endhonesa.com/
https://amandabase.endhonesa.com/
https://amandadeth.endhonesa.com/
```

Result:

```text
Production domains serve mainnet.
Production browser QA: PASS.
```

---

## 2. Mainnet Mint Phase Status

Base Mainnet:

```text
ROTY whitelist mint: ON
ROTY public mint: ON
Melting gated mint: ON
Amanda gated mint: ON
```

Ethereum Mainnet:

```text
ROTY whitelist mint: ON
ROTY public mint: ON
Melting gated mint: ON
Amanda gated mint: ON
```

Read-check status:

```text
Base Mainnet read-check: PASS with mint phase expectations updated to true
Ethereum Mainnet read-check: PASS with mint phase expectations updated to true
```

---

## 3. Base Mainnet Mint Opening Transactions

```text
ROTY whitelist mint enabled:
0xd890248a4d2b83e4cb00c222c638ebcc6c0481460fa6ff926f9d43f9b4eb5b01

ROTY public mint enabled:
0x430110055b5fe7710a35e4ce2ef284d4f677971b20a1a55fc653545f66dfb490

Melting gated mint enabled:
0xea5484732e75d0e5fc0a53c2de4acb97dd7ef6c6b7068ed67b722fc783823f5f

Amanda gated mint enabled:
0x9feb46cc801907de434b02ea4cbca5a988ec3f849247c12273d4857657e785ce
```

---

## 4. Ethereum Mainnet Mint Opening Transactions

```text
ROTY whitelist mint enabled:
0xc6f2c7fee1dc3dec993568474f99cfca4508ab9fb2c40ca891fac89a7c560ffc

ROTY public mint enabled:
0x5d50a12afd93ef897ece18161a606d75c61b8e1523de234f3b0591557b994965

Melting gated mint enabled:
0x9e0d7d255476230022f479aa57f765a2882dd9bc658b357e5456887815b0ebde

Amanda gated mint enabled:
0xdbff81ae57ea90e016364577e59c49849e9ddf4f7a18fcb4b306c7f91aeb8152
```

---

## 5. Production Browser QA Summary

Result:

```text
6 dedicated mint surfaces: PASS
softstaking.endhonesa.com main surface: PASS
Mint status reflects enabled mainnet phases: PASS
Staking dashboard/admin surface works on mainnet: PASS
```

The production environment uses:

```text
NEXT_PUBLIC_APP_ENV=mainnet
```

---

## 6. Admin Mainnet Operations QA

Admin mainnet operations were tested and worked for:

```text
approve/unapprove staking collections
enable/disable whitelist/public/gated mint phases
mint price changes, restored afterward
treasury changes, restored afterward
royalty changes, restored afterward
metadata changes, restored afterward
```

Result:

```text
ADMIN MAINNET OPERATIONS QA: PASS
```

---

## 7. Metadata Status

```text
Metadata locked: false
lockMetadata(): NOT CALLED
Metadata lock: NOT PERFORMED
```

Current metadata state is intentionally acceptable for public production release.

Metadata remains unlocked until the final reveal/update/lock decision later.

---

## 8. Reward Round Operations Status

Reward Round Operations are deferred for mainnet.

This does not mean the reward flow is broken. The reward flow/process was validated on testnet:

```text
create worker job with boundary/tapal-batas block
run worker jobs via GitHub Actions schedule
worker jobs sync/index/calculate reward data
reward round initially exists off-chain in Supabase
after worker job succeeds, reward round can be created on-chain
next reward operations continue as designed
```

Current mainnet blocker:

```text
Supabase data currently used by Reward Round Operations is still testnet-oriented
GitHub Actions worker jobs still use testnet environment/config
existing reward round data and worker job data shown in admin are testnet-oriented
mainnet database/data plane is not yet separated or configured
mainnet reward/indexer/proof production flow has not been implemented/configured/validated yet
```

Final status:

```text
REWARD CLAIM: DEFERRED
REWARD ROUND OPERATIONS: PENDING MAINNET DATABASE / INDEXER / PROOF SUPPORT
MAINNET REWARD WORK: NEXT MAJOR TECHNICAL TASK
```

This does not block the already-live mainnet mint/public surface.

---

## 9. Remaining Work

```text
UI/UX polish: remaining
Mainnet Reward Round Operations / Production Reward Data Plane: pending
Mainnet reward claim launch: deferred
Final metadata reveal/update/lock decision: pending
```

P.S. Read this document freely for information and guidance. Do not redistribute or restate--no quotes, summaries, paraphrases, or derivatives--without prior written permission from [**Prof. NOTA**](https://nota.endhonesa.com/). Sharing the link is allowed. So, share the link, not the text. Do not discuss or re-tell the contents in any form--written, spoken, or recorded--without prior written permission.

---
