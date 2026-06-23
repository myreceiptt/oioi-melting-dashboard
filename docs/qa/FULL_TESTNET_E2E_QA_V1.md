# Full Testnet E2E QA v1

## Status

- Date: 2026-06-24
- Environment: live Sepolia rehearsal
- Result: PASS
- Blockers observed: none
- Mainnet status: not started, deferred
- Next stage: Testnet Release Candidate preparation / RC lock

This QA report covers the production-intended Sepolia rehearsal domains after Subdomain Surface Behavior v1 was merged, deployed, and documented.

## Scope

QA was performed against the live Sepolia rehearsal surfaces:

- `https://softstaking.endhonesa.com/`
- `https://rotybase.endhonesa.com/`
- `https://rotydeth.endhonesa.com/`
- `https://meltingbase.endhonesa.com/`
- `https://meltingdeth.endhonesa.com/`
- `https://amandabase.endhonesa.com/`
- `https://amandadeth.endhonesa.com/`

The scope included public surfaces, dedicated mint subdomains, dashboard surfaces, admin surfaces, wallet behavior, chain-aware behavior, theme behavior, App Menu behavior, mint flows, staking flows, reward claim flows, admin controlled operations, and worker-driven boundary reward flow.

## Read-Only QA Summary

Result: PASS

Read-only QA passed for:

- Public main surface.
- Six dedicated mint subdomains.
- Dashboard surfaces.
- Admin surfaces.
- Wallet connect/disconnect.
- Wrong-chain guard.
- Theme behavior.
- App Menu behavior.
- Read-only mint status.
- Read-only staking summary.
- Read-only reward claim panel.
- Admin read cards.

The production-intended Sepolia rehearsal domains kept the expected routing behavior:

- `softstaking.endhonesa.com` serves the real app home.
- Dedicated mint subdomain roots render the mapped mint page while the browser URL remains `/`.
- Dedicated mint subdomains hide Theme Switcher.
- BASE/dETH themes are forced correctly.
- App Menu active state follows the effective route.

## Mutation QA Summary

Result: PASS

Mutation QA passed for:

- Mint.
- Stake.
- Unstake.
- Claim reward.
- Enable/disable mint phase.
- Approve/unapprove staking registry.
- Update pricing/treasury/royalty.
- Metadata reveal/lock.
- Reward round mutation.
- Boundary block submit for worker jobs.
- Worker job execution through GitHub Actions.
- Reward round creation on-chain.
- User reward claim after reward round creation.
- Emergency rescue.

All mutation QA was performed on Sepolia rehearsal contracts only.

## Wallet And Chain Coverage

Result: PASS

Wallet and chain behavior covered:

- Wallet connect.
- Wallet disconnect.
- Base Sepolia target surfaces.
- Ethereum Sepolia target surfaces.
- Wrong-chain guard.
- Chain-aware read surfaces.
- Chain-aware mutation surfaces.
- Prepared wallets for reward allocation and reward claim validation.

## Admin Coverage

Result: PASS

Admin QA covered:

- Admin home.
- Base admin surface.
- Ethereum admin surface.
- Admin owner-gated controls.
- Read cards.
- Mint phase controls.
- Staking registry controls.
- Pricing, treasury, and royalty controls.
- Metadata controls.
- Reward round controls.
- Boundary sync job submit/status.
- Emergency rescue controls.

## Reward Worker And Boundary Job Coverage

Result: PASS

Reward worker/boundary flow covered:

1. Admin submitted boundary block and reward amount.
2. Boundary sync job was stored in Supabase.
3. GitHub Actions executed the boundary worker.
4. Worker synced event data in resumable batches.
5. Worker rebuilt derived state.
6. Worker calculated valid intervals and rewards.
7. Worker generated Merkle proof data.
8. Admin created reward round on-chain.
9. Admin approved and funded reward round.
10. Users claimed rewards from the Reward Claim Panel.

Worker jobs / boundary reward flow passed in GitHub Actions.

Earlier worker jobs were also validated through on-chain reward round creation and prepared-wallet reward claim.

## Known Non-Blockers

- Transient GitHub Actions failure is recoverable by rerun when caused by external runner/RPC availability.
- Transient RPC/cache delays are non-blocking when retry or refresh recovers.
- A temporary Alchemy RPC allowlist/origin configuration issue affected GitHub Actions runner access. It was resolved operationally in Alchemy configuration and was not a product or indexer logic blocker.
- User-rejected wallet transactions are not blockers.

## Blockers

None observed.

## Mainnet Status

Mainnet has not started.

Mainnet remains deferred until Testnet Release Candidate preparation / RC lock is complete and explicitly approved.

This report does not authorize mainnet deployment by itself.

---

P.S. Read this document freely for information and guidance. Do not redistribute or restate—no quotes, summaries, paraphrases, or derivatives—without prior written permission from [**Prof. NOTA**](https://nota.endhonesa.com/). Sharing the link is allowed. So, share the link, not the text. Do not discuss or re-tell the contents in any form—written, spoken, or recorded—without prior written permission.

---
