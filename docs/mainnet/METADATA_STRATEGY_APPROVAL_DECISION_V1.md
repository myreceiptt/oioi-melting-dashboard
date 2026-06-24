# OiOi Melting Dashboard — Metadata Strategy Approval Decision v1

Date: 2026-06-24

Status:

```text
METADATA STRATEGY APPROVAL: NOT YET APPROVED
MAINNET DEPLOYMENT: NOT STARTED
DEPLOYMENT AUTHORIZATION: NOT YET APPROVED
PUBLIC LAUNCH: NOT READY
```

This document prepares the metadata decision that must be made before any mainnet deployment transaction.

It does not approve deployment by itself.

---

## 1. Current Status

Current gate state:

```text
Testnet Release Candidate Lock v1: PASS
Mainnet Deployment Approval Gate v1: READY WITH NOTES
Mainnet deployment: not started
Deployment authorization: not yet approved
Metadata strategy: not yet explicitly approved
Public launch: not ready
```

Stop if deployment is proposed before this metadata strategy is explicitly approved.

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

## 3. Decision Required

Before mainnet deployment, choose one option.

### Option A — Deploy With Pending Revealed URI Placeholders

This option allows contract deployment while Melting and Amanda final revealed metadata is still pending.

Rules:

```text
allowed only if explicitly approved
mint phases must remain OFF
metadata must remain unlocked
no public launch
final Melting/Amanda revealed metadata must be uploaded, checked, updated, indexed, and approved before reveal/lock/public opening
lockMetadata() must not be called until final metadata is approved
```

This option is for contract deployment only.

### Option B — Wait for Final Melting/Amanda Revealed Metadata Before Deployment

This option delays deployment until final revealed metadata is available.

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
Option A is acceptable for contract deployment only if explicitly approved and mint phases remain OFF.
Option B is safer if final Melting/Amanda revealed metadata can be completed soon.
```

In both cases:

```text
public opening remains a separate later approval
metadata lock remains a separate later approval
reward claim remains a separate later approval
```

---

## 5. Stop Conditions

Stop if:

```text
metadata strategy is not explicitly approved
anyone proposes lockMetadata() before final metadata approval
public mint/opening is attempted before final metadata strategy is complete
deployment config differs from the approved metadata decision
Melting/Amanda final metadata cannot be checked
IPFS metadata cannot be accessed reliably
```

---

## 6. Approval Checkbox

```text
METADATA STRATEGY APPROVAL: NOT YET APPROVED

Selected option:
[ ] Option A — Deploy with pending revealed URI placeholders
[ ] Option B — Wait for final revealed metadata before deployment

Approved by:
Date:
Notes:
```

---

## 7. Next Action After Approval

If Option A is approved:

```text
proceed to explicit mainnet deployment approval decision
deploy with mint phases OFF
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
METADATA STRATEGY APPROVAL: NOT YET APPROVED
MAINNET DEPLOYMENT: NOT STARTED
DEPLOYMENT AUTHORIZATION: NOT YET APPROVED
PUBLIC LAUNCH: NOT READY
```

P.S. Read this document freely for information and guidance. Do not redistribute or restate—no quotes, summaries, paraphrases, or derivatives—without prior written permission from [**Prof. NOTA**](https://nota.endhonesa.com/). Sharing the link is allowed. So, share the link, not the text. Do not discuss or re-tell the contents in any form—written, spoken, or recorded—without prior written permission.

---
