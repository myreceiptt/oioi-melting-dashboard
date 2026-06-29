# OiOi Melting Dashboard — Metadata Strategy Approval Decision v1

> Current status note (2026-06-29): this is a historical metadata strategy
> decision. The current canonical project status is
> `docs/PROJECT_FINAL_STATUS_AND_MAINTENANCE_V1.md`: complete, public,
> operational, and in evergreen maintenance mode. Any "not approved",
> "pending", or "not ready" wording below describes the decision state at the
> time this document was written, not the current production state.

Date: 2026-06-24

Status:

```text
METADATA STRATEGY APPROVAL: APPROVED
SELECTED OPTION: OPTION A — DEPLOY WITH PENDING REVEALED URI PLACEHOLDERS
MAINNET CONTRACT DEPLOYMENT: DONE / VERIFIED / SAFE OFF
DEPLOYMENT AUTHORIZATION: COMPLETED FOR CONTRACT DEPLOYMENT ONLY
MAINNET PUBLIC SURFACE: LIVE
MINT OPENING: DONE / LIVE
MAINNET REWARD CLAIM LAUNCH: NOT READY
```

This document records the metadata strategy decision that allowed mainnet contract deployment planning to proceed with pending Melting/Amanda revealed URI placeholders.

The separate mainnet contract deployment approval was later granted and the contract deployment scope is now complete.

This approval still does not authorize metadata reveal, metadata lock, reward claim launch, or `lockMetadata()`.

Later production mainnet env wiring and mint opening were completed and are recorded in `docs/qa/MAINNET_PUBLIC_SURFACE_AND_MINT_OPENING_QA_V1.md`.

---

## 1. Current Status

Current gate state:

```text
Testnet Release Candidate Lock v1: PASS
Mainnet Deployment Approval Gate v1: READY WITH NOTES
Mainnet contract deployment: done / verified / safe-off baseline
Deployment authorization: completed for contract deployment only
Metadata strategy: approved as Option A
Mainnet public surface: live
Mint opening: done / live
Mainnet reward claim launch: not ready
```

Stop if metadata reveal, metadata lock, reward claim launch, or `lockMetadata()` is proposed without a separate explicit approval.

---

## 2. Current Config

Current metadata config is defined in:

```text
scripts/deploy/00-config.ts
```

### ROTY

ROTY unrevealed metadata:

```text
ipfs://bafkreiefsmbkjgw3fs47v52xu6zqzbgw4z2fhdsgvaczh7gstn4txurv2m
```

ROTY revealed base metadata:

```text
ipfs://bafybeianxpgfjiggplxqsfafku3mrmvozbsanmwml4mhohgqwusqvqvc4m/
```

ROTY does not currently use a pending revealed placeholder.

### Melting

Melting unrevealed metadata:

```text
ipfs://bafkreiccvibarcxlaq3q2vm23p4jsbtxizkjneivjokh4srdpsi36zzzdi
```

Melting revealed base metadata is currently pending:

```text
ipfs://pending-melting-revealed/
```

### Amanda

Amanda unrevealed metadata:

```text
ipfs://bafkreihvdfz5un5mslexhs2u5zagfw2dsw62hnvt3unvaypiijtyco7agy
```

Amanda revealed base metadata is currently pending:

```text
ipfs://pending-amanda-revealed/
```

### Metadata Mutability

Metadata can still be updated until `lockMetadata()` is called.

`lockMetadata()` must not be called while any final revealed metadata is pending or unapproved.

---

## 3. Approved Decision

Approved option:

```text
Option A — Deploy with pending revealed URI placeholders
```

This approval is limited to contract deployment planning. It does not approve mainnet deployment, public launch, metadata lock, reveal, or reward claim launch.

### Option A — Deploy With Pending Revealed URI Placeholders

This option allows a later explicitly approved contract deployment while Melting and Amanda final revealed metadata is still pending.

Rules:

```text
approved for contract deployment planning only
mint phases had to remain OFF at deployment completion
metadata must remain unlocked
production mint opening completed later as a separate step
final Melting/Amanda revealed metadata must be uploaded, checked, updated, indexed, and approved before reveal/lock/public opening
lockMetadata() must not be called until final metadata is approved
```

This option is for contract deployment only.

### Option B — Wait for Final Melting/Amanda Revealed Metadata Before Deployment

This option was not selected for the current approval decision.

Benefits:

```text
safer metadata posture
avoids deploying mainnet contracts with placeholder revealed URI values
reduces operational risk around post-deployment metadata updates
```

Tradeoff:

```text
slower deployment
```

---

## 4. Recommendation

Practical recommendation:

```text
Option A was acceptable for contract deployment planning only because it was explicitly approved and mint phases had to remain OFF at deployment completion.
Option B is safer if final Melting/Amanda revealed metadata can be completed soon.
```

In both cases:

```text
public opening remains a separate later approval
metadata lock remains a separate later approval
reward claim remains a separate later approval
```

Mainnet deployment remains a separate later approval.

---

## 5. Stop Conditions

Stop if:

```text
mainnet deployment is proposed without separate explicit deployment approval
anyone proposes lockMetadata() before final metadata approval
public mint/opening is attempted before final metadata strategy is complete
deployment config differs from the approved metadata decision
Melting/Amanda final metadata cannot be checked
IPFS metadata cannot be accessed reliably
```

---

## 6. Approval Checkbox

```text
METADATA STRATEGY APPROVAL: APPROVED

Selected option:
[x] Option A — Deploy with pending revealed URI placeholders
[ ] Option B — Wait for final revealed metadata before deployment

Approved by: Prof. NOTA
Date: 2026-06-24
Notes: Approved for contract deployment planning only. Mint phases had to remain OFF at deployment completion. Later production mint opening was completed separately. Metadata must remain unlocked, and lockMetadata() must not be called until final Melting/Amanda revealed metadata is approved.
```

---

## 7. Next Action After Approval

If Option A is approved:

```text
proceed to explicit mainnet deployment approval decision
deploy with mint phases OFF only after separate explicit mainnet deployment approval
keep metadata unlocked
do not call lockMetadata()
do not open public mint
```

If Option B is approved:

```text
prepare final Melting revealed metadata
prepare final Amanda revealed metadata
upload final metadata
verify metadata availability
update deployment config before mainnet deployment approval
review deployment config again
```

---

## 8. Final Status

```text
METADATA STRATEGY APPROVAL: APPROVED
SELECTED OPTION: OPTION A — DEPLOY WITH PENDING REVEALED URI PLACEHOLDERS
MAINNET CONTRACT DEPLOYMENT: DONE / VERIFIED / SAFE OFF
DEPLOYMENT AUTHORIZATION: COMPLETED FOR CONTRACT DEPLOYMENT ONLY
PUBLIC LAUNCH: NOT READY
MAINNET REWARD CLAIM LAUNCH: NOT READY
```

P.S. Read this document freely for information and guidance. Do not redistribute or restate—no quotes, summaries, paraphrases, or derivatives—without prior written permission from [**Prof. NOTA**](https://nota.endhonesa.com/). Sharing the link is allowed. So, share the link, not the text. Do not discuss or re-tell the contents in any form—written, spoken, or recorded—without prior written permission.

---
