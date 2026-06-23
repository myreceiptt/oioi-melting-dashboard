# Urutan Sehat - Abadi Nan Jaya

1. Multi-chain NFT Relaunch Concept & Provenance — DONE
   - ✅ Ide relaunch ROTY dari Polygon origin dikunci.
   - ✅ Polygon ROTY BROI diposisikan sebagai origin/provenance.
   - ✅ Base dan Ethereum dipilih sebagai dua chain relaunch.
   - ✅ Nama TheRotyMemorial dipakai sebagai shared contract/codebase concept.
   - ✅ Total lineage dipahami: Polygon + Base + Ethereum.
   - ✅ Main intent dikunci: memorial, provenance, minting, staking, reward.

2. Collection Specification Lock — DONE
   - ✅ ROTY BASE / ROTY dETH specs dikunci.
   - ✅ Melting BASE / MELTING dETH specs dikunci.
   - ✅ Amanda BASE / Amanda dETH specs dikunci.
   - ✅ Max supply dikunci:
     - ROTY: 1047
     - Melting: 1747
     - Amanda: 2020
   - ✅ Mint price dikunci per chain.
   - ✅ Public mint / whitelist / gated mint model dikunci.
   - ✅ Treasury receiver dikunci.
   - ✅ Royalty receiver dan 11% royalty dikunci.
   - ✅ Metadata can be changed until lockMetadata() dikunci sebagai rule.

3. Soft Staking & Reward Architecture Lock — DONE
   - ✅ Non-custodial soft staking dipilih.
   - ✅ NFT tetap di wallet user.
   - ✅ Staking contract mencatat participation.
   - ✅ Validity dicek via ownerOf(tokenId).
   - ✅ Transfer-aware staking duration menjadi prinsip reward.
   - ✅ Base Set dan Ethereum Set dipisah.
   - ✅ Satu staking contract per chain.
   - ✅ Satu reward distributor per chain.
   - ✅ $OiOi reward token per chain.
   - ✅ OiOi Melting Dashboard dikunci sebagai frontend name.
   - ✅ Collection weights dikunci:
     - ROTY: 217491
     - MELTING: 362900
     - AMANDA: 419609
     - denominator: 1,000,000

4. Asset, Metadata, Token, Whitelist, and Deployment Input Lock — DONE
   - ✅ $OiOi Base address dikunci.
   - ✅ $OiOi Ethereum address dikunci.
   - ✅ Ethereum $OiOi deployment detail dicatat.
   - ✅ Melting unrevealedURI dikunci.
   - ✅ Amanda unrevealedURI dikunci.
   - ✅ ROTY revealed/unrevealed metadata path dicatat.
   - ✅ Whitelist source disiapkan.
   - ✅ Whitelist cleaning + Merkle generation flow disiapkan.
   - ✅ Deployer wallet dikunci.
   - ✅ Treasury wallet dikunci.
   - ✅ Domain plan awal dicatat:
     - rotybase
     - rotydeth
     - meltingbase
     - meltingdeth
     - amandabase
     - amandadeth
     - softstaking

5. Repository Foundation & Smart Contract Suite Implementation — DONE
   - ✅ Repo oioi-melting-dashboard disiapkan.
   - ✅ Struktur contracts/scripts/test/docs mulai dibangun.
   - ✅ NFT contracts diimplementasikan.
   - ✅ Soft staking contract diimplementasikan.
   - ✅ Reward distributor contract diimplementasikan.
   - ✅ Supporting ABI / scripts / config mulai disiapkan.
   - ✅ Contract design tetap modular per chain.
   - ✅ Mint phases default OFF setelah deployment dijadikan prinsip.
   - ✅ Owner-only admin model dipertahankan.

6. Local Hardhat Simulation & Contract Test Foundation — DONE
   - ✅ Unit tests dijalankan dan pass.
   - ✅ Integration lifecycle tests dijalankan dan pass.
   - ✅ Reward Merkle generator bekerja.
   - ✅ Local deployment / smoke deployment disiapkan.
   - ✅ Hardhat local simulation dipakai sebelum testnet.
   - ✅ Deployment records lokal/simulasi dipisahkan dari deployment testnet/mainnet.
   - ✅ Repo cleanup dilakukan untuk file generated/local output.
   - ✅ .gitignore disesuaikan agar artifacts/generated output tidak ikut tracked.

7. Deployment Tooling & Operational Runbook — DONE
   - ✅ Deployment scripts disusun bertahap.
   - ✅ Script deploy ROTY dibuat.
   - ✅ Script deploy staking dibuat.
   - ✅ Script register ROTY dibuat.
   - ✅ Script deploy/register Melting dibuat.
   - ✅ Script deploy/register Amanda dibuat.
   - ✅ Script deploy Reward Distributor dibuat.
   - ✅ Read-check script dibuat.
   - ✅ Functional test script dibuat.
   - ✅ Restore mint phases script dibuat.
   - ✅ Constructor args export disiapkan sebagai post-deployment step.
   - ✅ DEPLOYMENT_RUNBOOK.md diperbarui sesuai urutan nyata.
   - ✅ verify:args dipahami sebagai post-deployment, bukan pre-deployment.

8. Base Sepolia Deployment, Verification, Read Checks, and Functional Test — DONE
   - ✅ Base Sepolia deployment selesai.
   - ✅ Base Sepolia deployment record committed.
   - ✅ Constructor args exported.
   - ✅ Verification berhasil.
   - ✅ Read-check berhasil.
   - ✅ Functional test berhasil:
     - ROTY mint
     - ROTY stake
     - Melting mint
     - Melting stake
     - Amanda mint
     - Amanda stake
     - reward round create/fund/claim
   - ✅ Mint phases restored OFF.
   - ✅ Read-check disesuaikan agar toleran terhadap cumulative reward counters.

9. Ethereum Sepolia Deployment, Verification, Read Checks, and Functional Test — DONE
   - ✅ Ethereum Sepolia deployment selesai.
   - ✅ Ethereum Sepolia verification selesai.
   - ✅ Ethereum Sepolia read-check selesai.
   - ✅ Ethereum Sepolia functional test selesai.
   - ✅ Testnet contract behavior konsisten dengan Base Sepolia.
   - ✅ Deployment runbook diperbarui dari pengalaman Base + Ethereum Sepolia.

10. Lock Testnet Contract Deployment — DONE
    - ✅ Testnet deployment completed.
    - ✅ Verification completed.
    - ✅ Read checks completed.
    - ✅ Functional tests completed.
    - ✅ Mint phases restored OFF.
    - ✅ Do not change deploy scripts unless fatal bug.
    - ✅ Indexer block number recorded manually from explorer, not by changing deploy flow.
    - ✅ Testnet contract layer dianggap locked sebagai rehearsal baseline.

11. Mainnet Readiness Review & Deliberate Deferral — DONE
    - ✅ Mainnet preparation reviewed.
    - ✅ Repo health checked.
    - ✅ build / compile / test pass.
    - ✅ RPC chain IDs verified.
    - ✅ Preflight Base Mainnet pass.
    - ✅ Preflight Ethereum Mainnet pass.
    - ✅ Whitelist root finalized.
    - ✅ Deployer funded.
    - ✅ verify:args failure before deployment correctly understood as expected.
    - ✅ Mainnet deployment declared ready-but-deferred.
    - ✅ Decision locked: mainnet waits until Testnet Release Candidate.

12. Documentation Alignment & Product Completion Plan — DONE
    - ✅ README updated.
    - ✅ IMPLEMENTATION_ROADMAP updated.
    - ✅ SPEC_LOCK updated.
    - ✅ MAINNET_READINESS_REVIEW updated.
    - ✅ INDEXER_ARCHITECTURE updated.
    - ✅ INDEXER_IMPLEMENTATION_PLAN updated.
    - ✅ INDEXER_OPERATIONAL_MODEL created/updated.
    - ✅ TESTNET_PRODUCT_COMPLETION_PLAN created.
    - ✅ Supabase Postgres-first decision documented.
    - ✅ Local JSON demoted from primary indexer storage.
    - ✅ Mainnet deferred until full testnet rehearsal documented.

13. Frontend Architecture & Wallet Identity Lock — DONE
    - ✅ Wallet-first identity model locked.
    - ✅ Chain-aware UX locked.
    - ✅ Contract-state-driven frontend locked.
    - ✅ EOA-first identity locked.
    - ✅ No embedded wallet.
    - ✅ No smart account / account abstraction.
    - ✅ No email login.
    - ✅ No phone login.
    - ✅ No passkey login.
    - ✅ No social login.
    - ✅ No identity linking.
    - ✅ Stack locked:
      - Next.js
      - TypeScript
      - Tailwind
      - wagmi
      - viem
      - TanStack Query
      - custom wallet modal
    - ✅ Required wallet support locked:
      - injected
      - MetaMask
      - WalletConnect
      - Coinbase Wallet EOA-only
      - EIP-1193
      - EIP-6963

14. Testnet Frontend User Surface Implementation — DONE
    - ✅ Frontend skeleton done.
    - ✅ Next + Tailwind base setup done.
    - ✅ Web3Providers done.
    - ✅ chain config done.
    - ✅ wagmi config done.
    - ✅ wallet connect button done.
    - ✅ ChainGuard done.
    - ✅ contract config done.
    - ✅ ABI expansion for user reads/writes done.
    - ✅ ROTY mint UI done.
    - ✅ Whitelist proof strategy done.
    - ✅ Gated mint UI done.
    - ✅ Dashboard stake/unstake UI done.
    - ✅ Reward claim panel done.
    - ✅ Active reward claim panel wired to Supabase proof API.
    - ✅ Homepage links done.
    - ✅ Build errors fixed.
    - ✅ Sepolia browser local QA done.

15. Admin Dashboard Architecture & Implementation — DONE
    - ✅ Admin Dashboard Architecture v1 done.
    - ✅ Admin ABI Expansion v1 done.
    - ✅ Admin Contract Config v1 done.
    - ✅ Admin Route Skeleton v1 done.
    - ✅ Admin Read Cards v1 done.
    - ✅ Admin Mint Phase Controls v1 done.
    - ✅ Admin Reward Round Controls v1 created.
    - ✅ Admin Reward Round Controls v2 improved.
    - ✅ Admin Reward Operations connected to Supabase reward rounds and live on-chain reads.
    - ✅ Admin reward create / approve / fund / pause / unpause flow completed on testnet.
    - ✅ roundId = timestamp periodEnd decision locked.
    - ✅ Existing reward rounds dropdown implemented with Supabase-backed round list.
    - ✅ Approval understood as global ERC20 allowance, not per-round approval.
    - ✅ Admin Metadata Controls v1 done.
    - ✅ Admin Pricing Treasury Royalty Controls v1 done.
    - ✅ Admin Staking Registry Controls v1 done.
    - ✅ Admin Emergency / Rescue Controls v1 done.
    - ✅ Rescue Excess $OiOi placed in Emergency/Rescue, not Reward Round Controls.
    - ✅ Emergency rescue limited to excessRewardTokenBalance, not allocated/unclaimed rewards.

16. Vercel Deployment & Sepolia Rehearsal Routing — DONE
    - ✅ Vercel preview/testnet deployment done.
    - ✅ Sepolia env wiring on Vercel verified.
    - ✅ Initial testnet route/domain mapping documented.
    - ✅ Later decision changed: use production-intended subdomains immediately for Sepolia rehearsal.
    - ✅ Production Subdomain Mapping for Sepolia Rehearsal v1 done.
    - ✅ One Vercel project serves all final subdomains.
    - ✅ Vercel Production env remains NEXT_PUBLIC_APP_ENV=sepolia.
    - ✅ testnet.softstaking.endhonesa.com no longer main rehearsal URL.
    - ✅ softstaking.endhonesa.com serves home/dashboard/admin.
    - ✅ rotybase.endhonesa.com routes to ROTY BASE mint.
    - ✅ rotydeth.endhonesa.com routes to ROTY dETH mint.
    - ✅ meltingbase.endhonesa.com routes to Melting BASE mint.
    - ✅ meltingdeth.endhonesa.com routes to Melting dETH mint.
    - ✅ amandabase.endhonesa.com routes to Amanda BASE mint.
    - ✅ amandadeth.endhonesa.com routes to Amanda dETH mint.
    - ✅ Sepolia rehearsal banner added.

17. Stage-by-Stage Browser QA — DONE
    - ✅ Current Sepolia Browser QA for read/OFF-phase/stake flows done.
    - ✅ Vercel Preview/Testnet QA done.
    - ✅ Sepolia Env Wiring Verification on Vercel done.
    - ✅ Testnet Public Surface QA done.
    - ✅ Mint Page Browser Testing with Phases ON done.
    - ✅ Gated Mint Browser Testing done.
    - ✅ Dashboard Stake/Unstake Browser QA done.
    - ✅ Admin Browser QA v1 done.
    - ✅ Admin Controlled Operations QA v1 done.
    - ✅ Reward claim browser testing with Supabase proof data and funded rounds done.

18. Complete Database Indexer + Reward Pipeline on Testnet — DONE
    - ✅ Storage decision locked: Supabase Postgres.
    - ✅ Supabase Project + Schema v1 migration files.
    - ✅ Indexer with manual FROM_BLOCK + checkpoint implemented.
    - ✅ Transfer event sync implemented.
    - ✅ Staked / Unstaked event sync implemented.
    - ✅ Reward round event sync implemented.
    - ✅ Current ownership state rebuild implemented.
    - ✅ Current staking state rebuild implemented.
    - ✅ Valid duration calculator implemented.
    - ✅ Reward calculator implemented.
    - ✅ Merkle allocation/proof pipeline implemented.
    - ✅ Reward proof API implemented.
    - ✅ Reward claim UI integration implemented.
    - ✅ Supabase env wiring verification.
    - ✅ Database migrations applied in target Supabase project.
    - ✅ Boundary sync orchestration schema implemented.
    - ✅ Dashboard wallet NFT cache schema implemented.
    - ✅ Admin Reward Round Controls validation with Supabase round list.
    - ✅ Boundary worker implemented as resumable local/GitHub Actions job.
    - ✅ End-to-end reward pipeline run on Base Sepolia and Ethereum Sepolia.
    - ✅ Reward claim browser testing.

19. Full Testnet Browser E2E — DONE / PASS
    - ✅ User mint ROTY.
    - ✅ User stake ROTY.
    - ✅ User mint/stake Melting.
    - ✅ User mint/stake Amanda.
    - ✅ Admin create/fund reward round from Supabase-generated data.
    - ✅ Indexer sync + reward calculation.
    - ✅ User claim $OiOi.
    - ✅ Repeat on Base Sepolia and Ethereum Sepolia.
    - ✅ Full Testnet Browser QA v1 read-only pass on live Sepolia rehearsal subdomains.
    - ✅ Full Testnet Mutation QA v1 pass on live Sepolia rehearsal subdomains.
    - ✅ Full Testnet E2E QA v1 report written.
    - ✅ Worker jobs / boundary reward flow pass through GitHub Actions.

20. Final UI/UX Polish — ALMOST DONE
    - ✅ Homepage.
    - ✅ Mint pages.
    - ✅ User dashboard.
    - ✅ Admin dashboard.
    - ✅ Reward claim panel.
    - ✅ Mobile responsiveness baseline.
    - ✅ Error/loading/empty states baseline.
    - ✅ Copywriting baseline.
    - ✅ Admin warnings/tooltips baseline.
    - ✅ Post-indexer/reward UX polish baseline.
    - ✅ Subdomain Surface Behavior v1.
    - 🔜 Final visual QA pass.

21. Subdomain Surface Behavior v1 — DONE
    - ✅ `softstaking.endhonesa.com` keeps `/` as the real home surface.
    - ✅ Dedicated mint subdomain roots rewrite internally to their mapped mint routes while the browser URL stays `/`.
    - ✅ App shell resolves effective route from host + pathname.
    - ✅ Theme Switcher is hidden on dedicated mint subdomain roots.
    - ✅ BASE/dETH theme is forced correctly from effective route.
    - ✅ App Menu active state follows effective route: Mint active, Home not active, current mint child active.
    - ✅ Current mint child uses `/` with `_self`; current anchors use `/#mint-card` and `/#soft-staking`.
    - ✅ Home/Dashboard/Admin links from dedicated mint subdomains point to `https://softstaking.endhonesa.com/...`.
    - ✅ Production-intended Sepolia rehearsal domain QA passed for all 7 domains.

22. Testnet Release Candidate — READY FOR PREPARATION / RC LOCK
    - ✅ Core testnet flows pass.
    - ✅ Reward round flow pass.
    - ✅ Worker/indexer flow pass.
    - ✅ Subdomain Surface Behavior v1 pass.
    - ✅ Full Testnet Browser QA v1 pass.
    - ✅ Full Testnet Mutation QA v1 pass.
    - ✅ Full Testnet E2E QA v1 pass.
    - ✅ No blockers observed.
    - ✅ QA report documented in `docs/qa/FULL_TESTNET_E2E_QA_V1.md`.
    - 🔜 RC lock review.
    - 🔜 Runbook final.
    - 🔜 Admin procedures documented.
    - 🔜 Indexer/reward procedures documented.
    - 🔜 Supabase/reward operation documented.

23. Mainnet Deployment — READY BUT DEFERRED
    - ✅ Mainnet preparation mostly passed.
    - ✅ RPC verified.
    - ✅ Preflight passed.
    - ✅ Whitelist root final.
    - ✅ Deployer funded.
    - ⏸ Deferred until Testnet Release Candidate.

24. Mainnet Env Wiring — NOT STARTED
    - 🔜 Fill mainnet contract env.
    - 🔜 Set NEXT_PUBLIC_APP_ENV=mainnet.
    - 🔜 Deploy Vercel production with mainnet env.
    - 🔜 Keep production-intended domains, but switch app env only when ready.
    - 🔜 Confirm no Sepolia address remains in mainnet build.

25. Mainnet Read-Only QA — NOT STARTED
    - 🔜 Verify frontend reads mainnet contracts.
    - 🔜 Mint phases still OFF.
    - 🔜 Admin dashboard reads owner/admin state.
    - 🔜 Dashboard reads staking contracts.
    - 🔜 Reward/indexer production config verified.
    - 🔜 Production domains verified under mainnet env.

26. Controlled Mainnet Opening — NOT STARTED
    - 🔜 Enable ROTY whitelist.
    - 🔜 Controlled mint.
    - 🔜 Enable public mint.
    - 🔜 Enable staking dashboard.
    - 🔜 Enable Melting/Amanda gated mint.
    - 🔜 Enable reward claim only after production reward flow is ready.

---

P.S. Read this document freely for information and guidance. Do not redistribute or restate—no quotes, summaries, paraphrases, or derivatives—without prior written permission from [**Prof. NOTA**](https://nota.endhonesa.com/). Sharing the link is allowed. So, share the link, not the text. Do not discuss or re-tell the contents in any form—written, spoken, or recorded—without prior written permission.

---
