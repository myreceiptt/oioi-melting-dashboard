# Dashboard Stake / Unstake Browser QA

## Deployment

- Date:
- Commit:
- Testnet domain: https://testnet.softstaking.endhonesa.com
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

### MELTING dETH

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

