# Admin Controlled Operations QA

## Deployment

- Date:
- Commit:
- Testnet domain: [testnet.softstaking.endhonesa.com](https://testnet.softstaking.endhonesa.com)
- App env: sepolia

## Pre-QA

- [ ] git status clean
- [ ] build pass
- [ ] compile pass
- [ ] test pass
- [ ] Base Sepolia read-check pass
- [ ] Ethereum Sepolia read-check pass

## Admin Routes

- [ ] /admin opens
- [ ] /admin/base opens
- [ ] /admin/ethereum opens
- [ ] wallet connect appears
- [ ] ChainGuard works
- [ ] owner gate works
- [ ] no missing env error
- [ ] no major console error

## Non-owner Guard

- [ ] non-owner sees read-only admin view
- [ ] write buttons disabled
- [ ] no transaction can be sent

## Owner Guard

- [ ] owner wallet recognized
- [ ] write buttons enabled/disabled according to state
- [ ] confirmations/warnings appear

## Mint Phase Controls

### Base Sepolia

- [ ] ROTY whitelist enable/disable works
- [ ] ROTY public enable/disable works
- [ ] Melting gated enable/disable works
- [ ] Amanda gated enable/disable works
- [ ] all phases restored OFF
- [ ] read-check pass

### Ethereum Sepolia

- [ ] ROTY whitelist enable/disable works
- [ ] ROTY public enable/disable works
- [ ] Melting gated enable/disable works
- [ ] Amanda gated enable/disable works
- [ ] all phases restored OFF
- [ ] read-check pass

## Reward Round Controls

- [ ] Create new / existing mode visible
- [ ] periodEnd generates roundId
- [ ] reward amount auto-fills approve amount
- [ ] reward amount auto-fills fund amount
- [ ] input validation works
- [ ] existing/manual round ID read works
- [ ] buttons follow round status
- [ ] approval tested or intentionally skipped
- [ ] create/fund/pause/unpause skipped until reward pipeline or tested with notes

## Metadata Controls

- [ ] metadata state reads
- [ ] unrevealedURI reads
- [ ] revealedBaseURI reads
- [ ] baseExtension reads
- [ ] revealed reads
- [ ] metadataLocked reads
- [ ] reveal blocked when URI pending
- [ ] lockMetadata typed confirmation appears
- [ ] lockMetadata not executed
- [ ] final metadataLocked false
- [ ] final revealed false

## Pricing / Treasury / Royalty Controls

- [ ] mintPrice reads
- [ ] treasury reads
- [ ] royalty receiver reads
- [ ] royalty amount reads
- [ ] input validation works
- [ ] write actions tested with same values or intentionally skipped
- [ ] read-check pass after test

## Staking Registry Controls

- [ ] ROTY approved reads true
- [ ] Melting approved reads true
- [ ] Amanda approved reads true
- [ ] unapprove/approve test performed or intentionally skipped
- [ ] all approvals restored true
- [ ] read-check pass

## Emergency / Rescue Controls

- [ ] allocatedUnclaimedRewardBalance reads
- [ ] excessRewardTokenBalance reads
- [ ] excess rescue validation works
- [ ] amount > excess blocked
- [ ] NFT ETH balance reads
- [ ] ERC20 validation works
- [ ] typed confirmation appears
- [ ] no rescue transaction executed

## Final State

- [ ] Base Sepolia read-check pass
- [ ] Ethereum Sepolia read-check pass
- [ ] all mint phases OFF
- [ ] all staking approvals true
- [ ] metadataLocked false
- [ ] no unintended financial config change
- [ ] no major console error

## Notes

---

P.S. Read this document freely for information and guidance. Do not redistribute or restate—no quotes, summaries, paraphrases, or derivatives—without prior written permission from [**Prof. NOTA**](https://nota.endhonesa.com/). Sharing the link is allowed. So, share the link, not the text. Do not discuss or re-tell the contents in any form—written, spoken, or recorded—without prior written permission.

---
