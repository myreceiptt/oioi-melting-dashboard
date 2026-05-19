# Dashboard Stake / Unstake Browser QA

## Deployment

- Date:
- Commit:
- Testnet domain: [testnet.softstaking.endhonesa.com](https://testnet.softstaking.endhonesa.com)
- App env: sepolia

## Base Sepolia

### ROTY

- [ ] ownerOf reads connected wallet
- [ ] stake active initially Yes
- [ ] stake valid initially Yes
- [ ] unstake tx succeeds
- [ ] stake active becomes No
- [ ] stake tx succeeds
- [ ] stake active returns Yes
- [ ] stake valid returns Yes

### Melting

- [ ] ownerOf reads connected wallet
- [ ] stake active initially Yes
- [ ] stake valid initially Yes
- [ ] unstake tx succeeds
- [ ] stake active becomes No
- [ ] stake tx succeeds
- [ ] stake active returns Yes
- [ ] stake valid returns Yes

### Amanda

- [ ] ownerOf reads connected wallet
- [ ] stake active initially Yes
- [ ] stake valid initially Yes
- [ ] unstake tx succeeds
- [ ] stake active becomes No
- [ ] stake tx succeeds
- [ ] stake active returns Yes
- [ ] stake valid returns Yes

## Ethereum Sepolia

### ROTY dETH

- [ ] ownerOf reads connected wallet
- [ ] stake active initially Yes
- [ ] stake valid initially Yes
- [ ] unstake tx succeeds
- [ ] stake active becomes No
- [ ] stake tx succeeds
- [ ] stake active returns Yes
- [ ] stake valid returns Yes

### Melting dETH

- [ ] ownerOf reads connected wallet
- [ ] stake active initially Yes
- [ ] stake valid initially Yes
- [ ] unstake tx succeeds
- [ ] stake active becomes No
- [ ] stake tx succeeds
- [ ] stake active returns Yes
- [ ] stake valid returns Yes

### Amanda dETH

- [ ] ownerOf reads connected wallet
- [ ] stake active initially Yes
- [ ] stake valid initially Yes
- [ ] unstake tx succeeds
- [ ] stake active becomes No
- [ ] stake tx succeeds
- [ ] stake active returns Yes
- [ ] stake valid returns Yes

## Negative Case

- [ ] tokenId not owned by wallet handled safely
- [ ] UI does not crash
- [ ] no invalid transaction sent

## ChainGuard

- [ ] Base dashboard requires Base Sepolia
- [ ] Ethereum dashboard requires Ethereum Sepolia
- [ ] reads resume after chain switch

## Final Check

- [ ] Base Sepolia read-check pass
- [ ] Ethereum Sepolia read-check pass
- [ ] mint phases remain OFF
- [ ] staking approvals remain true
- [ ] no major console error

## Notes

---

P.S. Read this document freely for information and guidance. Do not redistribute or restate—no quotes, summaries, paraphrases, or derivatives—without prior written permission from [**Prof. NOTA**](https://nota.endhonesa.com/). Sharing the link is allowed. So, share the link, not the text. Do not discuss or re-tell the contents in any form—written, spoken, or recorded—without prior written permission.

---
