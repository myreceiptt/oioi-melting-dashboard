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
REWARD CLAIM: LIVE / OPERATIONAL
REWARD ROUND OPERATIONS: LIVE / OPERATIONAL
UI/UX POLISH: COMPLETED FOR PUBLIC BASELINE
```

This document records the production/mainnet public surface and mint opening
QA. Later reward operations and reward claim work have also completed; the
current canonical final status is
`docs/PROJECT_FINAL_STATUS_AND_MAINTENANCE_V1.md`.

It remains a historical QA record and should be read together with the final
status document.

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

Reward Round Operations data-plane foundation was completed after this public
surface QA:

```text
mainnet Supabase schema and seed complete
mainnet app smoke checks pass
mainnet GitHub Actions worker readiness pass
first mainnet boundary worker job success
first Base/Ethereum calculated reward rounds generated
first Base/Ethereum reward rounds created, approved, and funded on-chain
```

Canonical record:

```text
docs/mainnet/MAINNET_REWARD_ROUND_OPERATIONS_V1.md
```

Locked SOP:

```text
Admin UI reads live on-chain state for create/fund/pause/claim.
Supabase tx hashes and long-term status are reconciled from reward_round_events.
reward_rounds may temporarily remain calculated with null tx hashes until event indexing crosses the tx blocks.
Do not manually update Supabase only to fill tx hashes.
Do not submit Tapal Batas solely for tx hash reconciliation.
```

Later completed:

```text
public reward claim enablement
controlled user claim verification on mainnet
post-claim verification
RewardDistributor event reconciliation SOP
```

Final status:

```text
REWARD CLAIM: LIVE / OPERATIONAL
REWARD ROUND OPERATIONS: LIVE / OPERATIONAL
```

This does not block the already-live mainnet mint/public surface.

---

## 9. Current Maintenance

```text
dependency and tooling upkeep
operator review before any future sensitive production operation
reward distributions only when OiOi is available and a new Tapal Batas is selected
documentation updates when production operations change
```

P.S. Read this document freely for information and guidance. Do not redistribute or restate--no quotes, summaries, paraphrases, or derivatives--without prior written permission from [**Prof. NOTA**](https://nota.endhonesa.com/). Sharing the link is allowed. So, share the link, not the text. Do not discuss or re-tell the contents in any form--written, spoken, or recorded--without prior written permission.

---
