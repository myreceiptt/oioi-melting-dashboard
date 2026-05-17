# Sepolia Env Wiring Verification on Vercel

## Deployment

- Date:
- Commit:
- Vercel URL: [testnet.softstaking.endhonesa.com](https://testnet.softstaking.endhonesa.com)
- Testnet domain: [testnet.softstaking.endhonesa.com](https://testnet.softstaking.endhonesa.com)
- NEXT_PUBLIC_APP_ENV: sepolia

## Env Verification

- [ ] NEXT_PUBLIC_APP_ENV=sepolia
- [ ] WalletConnect project ID set
- [ ] Base Sepolia contract env set
- [ ] Ethereum Sepolia contract env set
- [ ] Mainnet env not used by app
- [ ] Deployment redeployed after env update

## Route Verification

- [ ] /
- [ ] /mint/roty/base
- [ ] /mint/roty/ethereum
- [ ] /mint/melting/base
- [ ] /mint/melting/ethereum
- [ ] /mint/amanda/base
- [ ] /mint/amanda/ethereum
- [ ] /dashboard
- [ ] /dashboard/base
- [ ] /dashboard/ethereum
- [ ] /admin
- [ ] /admin/base
- [ ] /admin/ethereum

## Contract Address Verification

### Base Sepolia

- [ ] ROTY 0x6ce0b10b2c98c1f397c45c695d504a7271677984
- [ ] Melting 0x824d8e5028cca6437b01ae3a764105a61d5555e8
- [ ] Amanda 0xdf14908ae4f1d4c7d9a2b4cc094983301c1107fc
- [ ] Staking 0x72939f96cb030235b691ea7716e213c06ae87494
- [ ] RewardDistributor 0x168b41b4a2f59be51917f1c0517b05f7b43f5b44
- [ ] $OiOi 0xcB2208E9Fb77591D3A0688C4459d976b1f16Ab53

### Ethereum Sepolia

- [ ] ROTY 0xb444f60600d5c83676d733ce159cc58ddf0a6c50
- [ ] Melting 0xf43ef187150086ada6f53a15caf3bcdb05be2507
- [ ] Amanda 0x3ef198c94a43167c594f54d19775fdb4a44edcaa
- [ ] Staking 0x09392894be59d4711be7920b6efc2acd463dd4e2
- [ ] RewardDistributor 0x6bd6a392bf5bd88c28ba7b59816c29c995e9f39a
- [ ] $OiOi 0x788Eb9930B9f4799f79Bc25a07238A77b8779e91

## Browser Results

- [ ] Wallet connect works
- [ ] Base Sepolia ChainGuard works
- [ ] Ethereum Sepolia ChainGuard works
- [ ] Admin reads work
- [ ] Dashboard reads work
- [ ] Mint pages read contract state
- [ ] Whitelist proof JSON loads
- [ ] No missing env error
- [ ] No major console error

## Notes
