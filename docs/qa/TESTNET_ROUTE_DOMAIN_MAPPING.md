# Testnet Route / Domain Mapping

## Status

- Environment: testnet rehearsal
- App env: `NEXT_PUBLIC_APP_ENV=sepolia`
- Main testnet domain: `https://testnet.softstaking.endhonesa.com`
- Mainnet production domains: deferred

## Routes

| Surface            | Testnet URL                                                                          |
| ------------------ | ------------------------------------------------------------------------------------ |
| Home               | [Home](https://testnet.softstaking.endhonesa.com/)                                   |
| ROTY BASE mint     | [ROTY BASE mint](https://testnet.softstaking.endhonesa.com/mint/roty/base)           |
| ROTY dETH mint     | [ROTY dETH mint](https://testnet.softstaking.endhonesa.com/mint/roty/ethereum)       |
| Melting BASE mint  | [Melting BASE mint](https://testnet.softstaking.endhonesa.com/mint/melting/base)     |
| Melting dETH mint  | [Melting dETH mint](https://testnet.softstaking.endhonesa.com/mint/melting/ethereum) |
| Amanda BASE mint   | [Amanda BASE mint](https://testnet.softstaking.endhonesa.com/mint/amanda/base)       |
| Amanda dETH mint   | [Amanda dETH mint](https://testnet.softstaking.endhonesa.com/mint/amanda/ethereum)   |
| Dashboard          | [Dashboard](https://testnet.softstaking.endhonesa.com/dashboard)                     |
| Base dashboard     | [Base dashboard](https://testnet.softstaking.endhonesa.com/dashboard/base)           |
| Ethereum dashboard | [Ethereum dashboard](https://testnet.softstaking.endhonesa.com/dashboard/ethereum)   |
| Admin home         | [Admin home](https://testnet.softstaking.endhonesa.com/admin)                        |
| Base admin         | [Base admin](https://testnet.softstaking.endhonesa.com/admin/base)                   |
| Ethereum admin     | [Ethereum admin](https://testnet.softstaking.endhonesa.com/admin/ethereum)           |

## Production Domains Deferred

The following domains are reserved for mainnet production and must not be pointed to testnet rehearsal unless intentionally changed later:

- [rotybase](https://rotybase.endhonesa.com/)
- [rotydeth](https://rotydeth.endhonesa.com/)
- [meltingbase](https://meltingbase.endhonesa.com/)
- [meltingdeth](https://meltingdeth.endhonesa.com/)
- [amandabase](https://amandabase.endhonesa.com/)
- [amandadeth](https://amandadeth.endhonesa.com/)
- [softstaking](https://softstaking.endhonesa.com/)

## QA Checklist

- [ ] Domain resolves
- [ ] SSL active
- [ ] `NEXT_PUBLIC_APP_ENV=sepolia`
- [ ] All routes open
- [ ] Wallet connect works
- [ ] Base Sepolia reads work
- [ ] Ethereum Sepolia reads work
- [ ] Admin reads work
- [ ] Mint phases OFF
- [ ] No missing env error
- [ ] No major console error

---
