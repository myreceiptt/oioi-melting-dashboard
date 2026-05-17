# Production Subdomain Mapping for Sepolia Rehearsal

## Status

- Environment: Sepolia rehearsal
- Vercel deployment target: Production
- App env: `NEXT_PUBLIC_APP_ENV=sepolia`
- Mainnet deployment: deferred
- Public launch: not started

## Domain Mapping

| Surface | Domain | Internal Route |
|---|---|---|
| Home / dashboard surface | https://softstaking.endhonesa.com/ | `/` |
| Dashboard | https://softstaking.endhonesa.com/dashboard | `/dashboard` |
| Base dashboard | https://softstaking.endhonesa.com/dashboard/base | `/dashboard/base` |
| Ethereum dashboard | https://softstaking.endhonesa.com/dashboard/ethereum | `/dashboard/ethereum` |
| Admin home | https://softstaking.endhonesa.com/admin | `/admin` |
| Base admin | https://softstaking.endhonesa.com/admin/base | `/admin/base` |
| Ethereum admin | https://softstaking.endhonesa.com/admin/ethereum | `/admin/ethereum` |
| ROTY BASE mint | https://rotybase.endhonesa.com/ | `/mint/roty/base` |
| ROTY dETH mint | https://rotydeth.endhonesa.com/ | `/mint/roty/ethereum` |
| Melting BASE mint | https://meltingbase.endhonesa.com/ | `/mint/melting/base` |
| Melting dETH mint | https://meltingdeth.endhonesa.com/ | `/mint/melting/ethereum` |
| Amanda BASE mint | https://amandabase.endhonesa.com/ | `/mint/amanda/base` |
| Amanda dETH mint | https://amandadeth.endhonesa.com/ | `/mint/amanda/ethereum` |

## QA Checklist

- [ ] `softstaking.endhonesa.com` resolves
- [ ] `rotybase.endhonesa.com` resolves
- [ ] `rotydeth.endhonesa.com` resolves
- [ ] `meltingbase.endhonesa.com` resolves
- [ ] `meltingdeth.endhonesa.com` resolves
- [ ] `amandabase.endhonesa.com` resolves
- [ ] `amandadeth.endhonesa.com` resolves
- [ ] SSL active for all domains
- [ ] `NEXT_PUBLIC_APP_ENV=sepolia`
- [ ] Sepolia rehearsal banner visible
- [ ] Mint domains rewrite to correct internal routes
- [ ] softstaking dashboard routes work
- [ ] softstaking admin routes work
- [ ] Wallet connect works
- [ ] Base Sepolia reads work
- [ ] Ethereum Sepolia reads work
- [ ] Mint phases OFF
- [ ] No missing env error
- [ ] No major console error

## Notes

These domains are production-intended domains currently used for Sepolia rehearsal.
Do not switch `NEXT_PUBLIC_APP_ENV` to `mainnet` until mainnet deployment and mainnet read-only QA are ready.
