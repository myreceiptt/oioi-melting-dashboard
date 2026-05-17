# Testnet Route / Domain Mapping

## Status

- Environment: testnet rehearsal
- App env: `NEXT_PUBLIC_APP_ENV=sepolia`
- Main testnet domain: `https://testnet.softstaking.endhonesa.com`
- Mainnet production domains: deferred

## Routes

| Surface | Testnet URL |
|---|---|
| Home | https://testnet.softstaking.endhonesa.com/ |
| ROTY BASE mint | https://testnet.softstaking.endhonesa.com/mint/roty/base |
| ROTY dETH mint | https://testnet.softstaking.endhonesa.com/mint/roty/ethereum |
| Melting BASE mint | https://testnet.softstaking.endhonesa.com/mint/melting/base |
| Melting dETH mint | https://testnet.softstaking.endhonesa.com/mint/melting/ethereum |
| Amanda BASE mint | https://testnet.softstaking.endhonesa.com/mint/amanda/base |
| Amanda dETH mint | https://testnet.softstaking.endhonesa.com/mint/amanda/ethereum |
| Dashboard | https://testnet.softstaking.endhonesa.com/dashboard |
| Base dashboard | https://testnet.softstaking.endhonesa.com/dashboard/base |
| Ethereum dashboard | https://testnet.softstaking.endhonesa.com/dashboard/ethereum |
| Admin home | https://testnet.softstaking.endhonesa.com/admin |
| Base admin | https://testnet.softstaking.endhonesa.com/admin/base |
| Ethereum admin | https://testnet.softstaking.endhonesa.com/admin/ethereum |

## Production Domains Deferred

The following domains are reserved for mainnet production and must not be pointed to testnet rehearsal unless intentionally changed later:

- https://rotybase.endhonesa.com/
- https://rotydeth.endhonesa.com/
- https://meltingbase.endhonesa.com/
- https://meltingdeth.endhonesa.com/
- https://amandabase.endhonesa.com/
- https://amandadeth.endhonesa.com/
- https://softstaking.endhonesa.com/

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

