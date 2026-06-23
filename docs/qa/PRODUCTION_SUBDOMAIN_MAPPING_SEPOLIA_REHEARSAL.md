# Production Subdomain Mapping for Sepolia Rehearsal

## Status

- Environment: Sepolia rehearsal
- Vercel deployment target: Production
- App env: `NEXT_PUBLIC_APP_ENV=sepolia`
- Mainnet deployment: deferred
- Public launch: not started
- Subdomain Surface Behavior v1: passed
- Browser QA: passed for the main app domain and six dedicated mint subdomains
- Full Testnet E2E QA v1: passed

## Domain Mapping

| Surface                  | Domain                                                                     | Internal Route           |
| ------------------------ | -------------------------------------------------------------------------- | ------------------------ |
| Home / dashboard surface | [Home / dashboard surface](https://softstaking.endhonesa.com/)             | `/`                      |
| Dashboard                | [Dashboard](https://softstaking.endhonesa.com/dashboard)                   | `/dashboard`             |
| Base dashboard           | [Base dashboard](https://softstaking.endhonesa.com/dashboard/base)         | `/dashboard/base`        |
| Ethereum dashboard       | [Ethereum dashboard](https://softstaking.endhonesa.com/dashboard/ethereum) | `/dashboard/ethereum`    |
| Admin home               | [Admin home](https://softstaking.endhonesa.com/admin)                      | `/admin`                 |
| Base admin               | [Base admin](https://softstaking.endhonesa.com/admin/base)                 | `/admin/base`            |
| Ethereum admin           | [Ethereum admin](https://softstaking.endhonesa.com/admin/ethereum)         | `/admin/ethereum`        |
| ROTY BASE mint           | [ROTY BASE mint](https://rotybase.endhonesa.com/)                          | `/mint/roty/base`        |
| ROTY dETH mint           | [ROTY dETH mint](https://rotydeth.endhonesa.com/)                          | `/mint/roty/ethereum`    |
| Melting BASE mint        | [Melting BASE mint](https://meltingbase.endhonesa.com/)                    | `/mint/melting/base`     |
| Melting dETH mint        | [Melting dETH mint](https://meltingdeth.endhonesa.com/)                    | `/mint/melting/ethereum` |
| Amanda BASE mint         | [Amanda BASE mint](https://amandabase.endhonesa.com/)                      | `/mint/amanda/base`      |
| Amanda dETH mint         | [Amanda dETH mint](https://amandadeth.endhonesa.com/)                      | `/mint/amanda/ethereum`  |

## QA Checklist

- [x] `softstaking.endhonesa.com` resolves
- [x] `rotybase.endhonesa.com` resolves
- [x] `rotydeth.endhonesa.com` resolves
- [x] `meltingbase.endhonesa.com` resolves
- [x] `meltingdeth.endhonesa.com` resolves
- [x] `amandabase.endhonesa.com` resolves
- [x] `amandadeth.endhonesa.com` resolves
- [x] SSL active for all domains
- [x] `NEXT_PUBLIC_APP_ENV=sepolia`
- [x] Sepolia rehearsal banner visible
- [x] Mint domains rewrite to correct internal routes
- [x] Browser URL remains `/` on dedicated mint domain roots
- [x] softstaking home/dashboard/admin routes work
- [x] Theme Switcher visible on softstaking home
- [x] Theme Switcher hidden on dedicated mint domain roots
- [x] BASE/dETH theme forced correctly by effective route
- [x] App Menu active state follows effective route
- [x] Dedicated mint current child uses `/` target `_self`
- [x] Dedicated mint current anchors use `/#mint-card` and `/#soft-staking`
- [x] Dedicated mint Home/Dashboard/Admin links point to `https://softstaking.endhonesa.com/...`
- [x] Wallet connect works
- [x] Base Sepolia reads work
- [x] Ethereum Sepolia reads work
- [x] Mint phases OFF
- [x] No missing env error
- [x] No major console error

## Final Subdomain Behavior

`softstaking.endhonesa.com` serves the real main app home at `/`. Theme Switcher remains visible on Home, Home menu is active, and mint links go to the six dedicated mint subdomains.

For dedicated mint subdomains, `proxy.ts` rewrites root `/` to the mapped internal mint route without redirecting the browser URL. The app shell resolves the effective route from host + pathname, hides Theme Switcher, forces the correct BASE/dETH theme, marks Mint active instead of Home, marks the current mint child active, keeps the current mint child on `/` with `_self`, keeps current anchors on `/#mint-card` and `/#soft-staking`, and sends Home/Dashboard/Admin links back to `https://softstaking.endhonesa.com/...`.

## Notes

These domains are production-intended domains currently used for Sepolia rehearsal.
Do not switch `NEXT_PUBLIC_APP_ENV` to `mainnet` until mainnet deployment and mainnet read-only QA are ready.

Full Testnet Browser QA v1 and Full Testnet Mutation QA v1 passed on these live Sepolia rehearsal surfaces. See `docs/qa/FULL_TESTNET_E2E_QA_V1.md`.

---

P.S. Read this document freely for information and guidance. Do not redistribute or restate—no quotes, summaries, paraphrases, or derivatives—without prior written permission from [**Prof. NOTA**](https://nota.endhonesa.com/). Sharing the link is allowed. So, share the link, not the text. Do not discuss or re-tell the contents in any form—written, spoken, or recorded—without prior written permission.

---
