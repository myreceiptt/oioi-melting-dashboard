# OiOi Melting Dashboard — Frontend Architecture v3

This document defines the current frontend architecture for the OiOi Melting Dashboard ecosystem.

---

## 1. Decision Lock — Wallet Connection v1

Guiding sentence:

```text
Required wallet compatibility, strict EOA-first identity.
```

Frontend v1 identity model:

```text
Wallet-first
Chain-aware
Contract-state-driven
EOA-first
No embedded wallet
No smart account / account abstraction
No email login
No phone login
No passkey login
No social login
No identity linking
```

The connected Web3 wallet address is the user identity.

---

## 2. Frontend Stack

```text
Next.js
TypeScript
Tailwind
wagmi
viem
TanStack Query
custom wallet modal
Supabase-backed API routes
Alchemy NFT API through backend route
```

Do not use embedded wallet, social login, or account abstraction SDKs in v1.

---

## 3. Product Surfaces

### Main app

Domain:

```text
softstaking.endhonesa.com
```

Routes:

```text
/
/mint
/mint/[collection]
/mint/[collection]/[chain]
/dashboard
/dashboard/base
/dashboard/ethereum
/admin
/admin/base
/admin/ethereum
```

### Dedicated mint subdomains

Current Sepolia rehearsal uses production-intended domains while `NEXT_PUBLIC_APP_ENV=sepolia`.

```text
rotybase.endhonesa.com      -> /mint/roty/base
rotydeth.endhonesa.com      -> /mint/roty/ethereum
meltingbase.endhonesa.com   -> /mint/melting/base
meltingdeth.endhonesa.com   -> /mint/melting/ethereum
amandabase.endhonesa.com    -> /mint/amanda/base
amandadeth.endhonesa.com    -> /mint/amanda/ethereum
```

The proxy currently rewrites `/` for those hosts to the mapped mint route.

---

## 4. Current Frontend Status

Completed:

```text
Next.js app shell
Tailwind baseline
wagmi config
wallet connectors
custom wallet modal
ChainGuard
env validation
contract address config
explorer helpers
homepage links
invalid page handling
invalid API route handling
six mint pages
ROTY public mint UI
ROTY whitelist proof lookup
ROTY whitelist mint UI
Melting gated mint UI
Amanda gated mint UI
dashboard stake/unstake UI
owned NFT discovery with thumbnails/media modal
reward claim UI backed by Supabase proof API and on-chain reads
admin dashboard
admin reward operations
BASE / dETH theme foundation
App Navbar
App Footer
App Menu
Theme Switcher
copyright footer modal
```

Current polish state:

```text
UI/layout/footer/navbar implemented.
Subdomain Surface Behavior v1 done.
Full Testnet Browser QA v1 done/pass.
Full Testnet Mutation QA v1 done/pass.
Full Testnet E2E QA v1 done/pass.
Mainnet public surface live.
Minting, staking, reward claim, and admin surfaces live.
Current mode is evergreen maintenance.
```

---

## 5. App Shell

The app shell includes:

```text
AppEnvironmentBanner
Web3Providers
ThemeProvider
AppNavbar
AppFooter
ThemeSwitcher
AppMenu
```

App Navbar and App Footer are intended to render broadly across the app.

Theme Switcher is route-aware and may be hidden/disabled for forced-theme pages.

BASE and dETH themes are aesthetic themes only. They do not change contract addresses by themselves.

---

## 6. Theme and Subdomain Behavior

Current implemented behavior:

```text
theme can be forced by route
theme can be switched on eligible app surfaces
dedicated mint subdomains rewrite / to the matching mint route
app shell resolves effective route from host + pathname
dedicated mint subdomain roots hide Theme Switcher
dedicated mint subdomain menu state follows the mapped mint surface
```

Final Subdomain Surface Behavior v1 behavior:

```text
softstaking.endhonesa.com / is the real home surface
Theme Switcher is visible on softstaking home
Home menu is active on softstaking home
softstaking mint links point to the six dedicated mint subdomains
```

For dedicated mint subdomain roots:

```text
proxy.ts rewrites / to the correct internal mint route
browser URL remains /
Theme Switcher is hidden
BASE/dETH theme is forced from the effective route
top-level Mint is active
top-level Home is not active
current mint child is active
current mint child href is / with target _self
current anchors use /#mint-card and /#soft-staking
other mint surfaces use absolute dedicated-domain links with target _blank
Home/Dashboard/Admin menu links point to https://softstaking.endhonesa.com/...
```

Production-intended Sepolia rehearsal domain QA passed for the main app domain and six dedicated mint domains.

---

## 7. Dashboard Architecture

Dashboard uses live contract reads for wallet-specific transaction readiness and safe API routes for indexed/cached data.

Stake/unstake NFT selector uses:

```text
Alchemy NFT API through backend route
metadata/media normalization
Supabase dashboard wallet NFT cache
on-chain staking reads
selected NFT state
asset modal for image/animation/html media
```

Reward claim uses:

```text
reward rounds API
proof API
on-chain round reads
hasClaimed read
claim transaction
post-transaction refresh
```

---

## 8. Admin Dashboard Architecture

Admin dashboard is implemented for owner-controlled operations.

Admin surfaces include:

```text
contract read cards
mint phase controls
metadata controls
pricing / treasury / royalty controls
staking registry controls
reward operations
emergency / rescue controls
```

Admin reward operations use:

```text
Supabase-generated reward rounds
live on-chain state
single next-action button model
tapal batas submission
worker job status
advanced diagnostics
```

Reward event sync after admin transactions is optional reconciliation; UI action readiness follows live on-chain reads.

---

## 9. API Routes

Current important API routes:

```text
app/api/admin/boundary-sync/route.ts
app/api/admin/reward-rounds/route.ts
app/api/cron/boundary-sync/route.ts
app/api/dashboard/wallet-nfts/route.ts
app/api/rewards/proof/route.ts
app/api/rewards/rounds/route.ts
app/api/whitelist/roty/[chain]/[address]/route.ts
app/api/[...missing]/route.ts
app/api/route.ts
```

Browser code must not directly use unsafe Supabase service-role operations.

---

## 10. Testing Strategy

Canonical checks:

```bash
npm run lint:frontend
npm run build
npm run compile
npm run test
```

Browser QA should cover:

```text
wallet connect
chain switch
mint pages
stake / unstake NFT selector
asset modal
admin reads/writes
boundary worker status
reward create / approve / fund / pause / unpause
reward claim
invalid pages
theme switcher
app menu
subdomain surface behavior
```

Current canonical QA result:

```text
docs/qa/FULL_TESTNET_E2E_QA_V1.md
Full Testnet Browser QA v1: PASS
Full Testnet Mutation QA v1: PASS
Full Testnet E2E QA v1: PASS
Blockers observed: none
```

---

## 11. Mainnet Switch

Mainnet switch happens only after Testnet Release Candidate preparation / RC lock is complete and explicitly approved.

Mainnet switch steps:

```text
deploy mainnet contracts
record mainnet deployment blocks
fill mainnet env values
set NEXT_PUBLIC_APP_ENV=mainnet
deploy Vercel production
run mainnet read-only QA
confirm mint phases OFF
```

Do not open mint during mainnet env wiring.

---

P.S. Read this document freely for information and guidance. Do not redistribute or restate—no quotes, summaries, paraphrases, or derivatives—without prior written permission from [**Prof. NOTA**](https://nota.endhonesa.com/). Sharing the link is allowed. So, share the link, not the text. Do not discuss or re-tell the contents in any form—written, spoken, or recorded—without prior written permission.

---
