# Testnet Route / Domain Mapping

## Status

- Environment: Sepolia rehearsal
- App env: `NEXT_PUBLIC_APP_ENV=sepolia`
- Main app domain: `https://softstaking.endhonesa.com`
- Dedicated mint domains are production-intended domains currently connected to Sepolia contracts for rehearsal.

This document is the current mapping reference after Subdomain Surface Behavior v1 passed production-intended Sepolia rehearsal domain QA.

---

## Main App Routes

| Surface            | URL                                                                          |
| ------------------ | ---------------------------------------------------------------------------- |
| Home               | [Home](https://softstaking.endhonesa.com/)                                   |
| Mint index         | [Mint](https://softstaking.endhonesa.com/mint)                               |
| ROTY BASE mint     | [ROTY BASE mint](https://softstaking.endhonesa.com/mint/roty/base)           |
| ROTY dETH mint     | [ROTY dETH mint](https://softstaking.endhonesa.com/mint/roty/ethereum)       |
| Melting BASE mint  | [Melting BASE mint](https://softstaking.endhonesa.com/mint/melting/base)     |
| Melting dETH mint  | [Melting dETH mint](https://softstaking.endhonesa.com/mint/melting/ethereum) |
| Amanda BASE mint   | [Amanda BASE mint](https://softstaking.endhonesa.com/mint/amanda/base)       |
| Amanda dETH mint   | [Amanda dETH mint](https://softstaking.endhonesa.com/mint/amanda/ethereum)   |
| Dashboard          | [Dashboard](https://softstaking.endhonesa.com/dashboard)                     |
| Base dashboard     | [Base dashboard](https://softstaking.endhonesa.com/dashboard/base)           |
| Ethereum dashboard | [Ethereum dashboard](https://softstaking.endhonesa.com/dashboard/ethereum)   |
| Admin home         | [Admin home](https://softstaking.endhonesa.com/admin)                        |
| Base admin         | [Base admin](https://softstaking.endhonesa.com/admin/base)                   |
| Ethereum admin     | [Ethereum admin](https://softstaking.endhonesa.com/admin/ethereum)           |

---

## Dedicated Mint Subdomains

`proxy.ts` rewrites only root `/` for these hosts to the mapped internal mint route. The browser URL remains `/`.

| Domain                                                          | Internal route           |
| --------------------------------------------------------------- | ------------------------ |
| [rotybase.endhonesa.com](https://rotybase.endhonesa.com/)       | `/mint/roty/base`        |
| [rotydeth.endhonesa.com](https://rotydeth.endhonesa.com/)       | `/mint/roty/ethereum`    |
| [meltingbase.endhonesa.com](https://meltingbase.endhonesa.com/) | `/mint/melting/base`     |
| [meltingdeth.endhonesa.com](https://meltingdeth.endhonesa.com/) | `/mint/melting/ethereum` |
| [amandabase.endhonesa.com](https://amandabase.endhonesa.com/)   | `/mint/amanda/base`      |
| [amandadeth.endhonesa.com](https://amandadeth.endhonesa.com/)   | `/mint/amanda/ethereum`  |

## Final Effective Route Behavior

```text
softstaking.endhonesa.com / -> /
rotybase.endhonesa.com / -> /mint/roty/base
rotydeth.endhonesa.com / -> /mint/roty/ethereum
meltingbase.endhonesa.com / -> /mint/melting/base
meltingdeth.endhonesa.com / -> /mint/melting/ethereum
amandabase.endhonesa.com / -> /mint/amanda/base
amandadeth.endhonesa.com / -> /mint/amanda/ethereum
```

On `softstaking.endhonesa.com`:

```text
Home is real /
Theme Switcher is visible on Home
Home menu is active
Mint links point to the six dedicated mint subdomains
```

On dedicated mint subdomain roots:

```text
app shell resolves effective route from host + pathname
Theme Switcher is hidden
BASE/dETH theme is forced correctly
top-level Mint is active
top-level Home is not active
current mint child is active
current mint child uses / with target _self
current anchors use /#mint-card and /#soft-staking
other mint items use absolute dedicated-domain links with target _blank
Home/Dashboard/Admin menu links point to https://softstaking.endhonesa.com/...
```

Subdomain Surface Behavior v1 is complete and browser-checked for the production-intended Sepolia rehearsal domains.

---

## QA Checklist

- [x] Main app domain resolves
- [x] Dedicated mint domains resolve
- [x] SSL active on all domains
- [x] `NEXT_PUBLIC_APP_ENV=sepolia`
- [x] Main app routes open
- [x] Dedicated mint domains rewrite to correct mint surfaces
- [x] Browser URL remains `/` on dedicated mint subdomain roots
- [x] Theme Switcher visible on softstaking home
- [x] Theme Switcher hidden on dedicated mint subdomain roots
- [x] BASE/dETH theme forced correctly by effective route
- [x] App Menu active state matches effective surface
- [x] Dedicated subdomain Home/Dashboard/Admin links point to softstaking main app surface
- [x] Current mint child and anchors use same-host `/` targets
- [x] Wallet connect works
- [x] Base Sepolia reads work
- [x] Ethereum Sepolia reads work
- [x] Admin reads work
- [x] Mint phases expected state is visible
- [x] No missing env error
- [x] No major console error

---

P.S. Read this document freely for information and guidance. Do not redistribute or restate—no quotes, summaries, paraphrases, or derivatives—without prior written permission from [**Prof. NOTA**](https://nota.endhonesa.com/). Sharing the link is allowed. So, share the link, not the text. Do not discuss or re-tell the contents in any form—written, spoken, or recorded—without prior written permission.

---
