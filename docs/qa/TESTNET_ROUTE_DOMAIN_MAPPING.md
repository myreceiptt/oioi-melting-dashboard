# Testnet Route / Domain Mapping

## Status

- Environment: Sepolia rehearsal
- App env: `NEXT_PUBLIC_APP_ENV=sepolia`
- Main app domain: `https://softstaking.endhonesa.com`
- Dedicated mint domains are production-intended domains currently connected to Sepolia contracts for rehearsal.

This document is a current mapping reference, not a completed subdomain QA report.

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

The current proxy rewrites `/` for these hosts to the mapped internal mint route.

| Domain                                                          | Internal route           |
| --------------------------------------------------------------- | ------------------------ |
| [rotybase.endhonesa.com](https://rotybase.endhonesa.com/)       | `/mint/roty/base`        |
| [rotydeth.endhonesa.com](https://rotydeth.endhonesa.com/)       | `/mint/roty/ethereum`    |
| [meltingbase.endhonesa.com](https://meltingbase.endhonesa.com/) | `/mint/melting/base`     |
| [meltingdeth.endhonesa.com](https://meltingdeth.endhonesa.com/) | `/mint/melting/ethereum` |
| [amandabase.endhonesa.com](https://amandabase.endhonesa.com/)   | `/mint/amanda/base`      |
| [amandadeth.endhonesa.com](https://amandadeth.endhonesa.com/)   | `/mint/amanda/ethereum`  |

---

## Known Issue / Next Task

Subdomain routing exists, but full surface behavior is not yet declared complete.

Next task:

```text
Subdomain Surface Behavior v1
```

That task must verify and/or fix:

```text
Theme Switcher behavior per effective route/subdomain
App Menu active state per effective route/subdomain
host-aware menu links
dedicated mint subdomains behaving like their mapped mint pages
```

Do not mark this issue resolved until the dedicated subdomain behavior is implemented and browser-checked.

---

## QA Checklist

- [ ] Main app domain resolves
- [ ] Dedicated mint domains resolve
- [ ] SSL active on all domains
- [ ] `NEXT_PUBLIC_APP_ENV=sepolia`
- [ ] Main app routes open
- [ ] Dedicated mint domains rewrite to correct mint surfaces
- [ ] Wallet connect works
- [ ] Base Sepolia reads work
- [ ] Ethereum Sepolia reads work
- [ ] Admin reads work
- [ ] Mint phases expected state is visible
- [ ] Theme behavior matches route/subdomain rules
- [ ] App Menu active state matches effective surface
- [ ] No missing env error
- [ ] No major console error

---

P.S. Read this document freely for information and guidance. Do not redistribute or restate—no quotes, summaries, paraphrases, or derivatives—without prior written permission from [**Prof. NOTA**](https://nota.endhonesa.com/). Sharing the link is allowed. So, share the link, not the text. Do not discuss or re-tell the contents in any form—written, spoken, or recorded—without prior written permission.

---
