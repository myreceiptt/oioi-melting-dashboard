# OiOi Melting Dashboard - Codex Conversation Context v1

Date: 2026-06-29
Project: OiOi Melting Dashboard
Context Type: Codex Thread Conversation Context
Owner / Operator: Prof. NOTA

---

## 1. Purpose

This document preserves the major decisions, implementation history, debugging context, and operating rules that emerged in the Codex working thread for the OiOi Melting Dashboard.

It is not a literal transcript.

It is a reconstructed engineering context based on:

- direct conversation with Codex in this thread,
- repository state and documentation used during the thread,
- testnet and mainnet operating results reported by the owner,
- and follow-up decisions made while implementing, testing, and documenting the system.

Use this file as context for future Codex sessions so the project does not have to rediscover the same decisions.

---

## 2. Source Labels

This document uses these labels:

- **Conversation-derived context; not yet independently documented in repo.**
  Information primarily reconstructed from this Codex thread.
- **Repo-documented.**
  Information already reflected in repository documentation, QA reports, runbooks, or code.
- **Unclear / needs owner confirmation.**
  Information that should not be treated as locked until the owner confirms it.

---

## 3. Relationship To Origin Context

**Repo-documented.**

The earlier origin, provenance, and conceptual framing is preserved separately in:

```text
docs/context/OIOI_MELTING_DASHBOARD_ORIGIN_CONTEXT_V1.md
```

That file covers the broader origin of the project: the shift from "move old Polygon ROTY to Base" into a provenance-aware relaunch and multi-chain NFT ecosystem.

This file focuses on the Codex implementation thread: reward round architecture, Supabase/indexer orchestration, dashboard/admin behavior, UI/UX decisions, testnet QA, mainnet staging, and current operating SOP.

---

## 4. High-Level Project State From This Thread

**Repo-documented.**

The project evolved in this thread from an active testnet implementation into a mainnet-deployed, controlled-release system.

Current broad status from the thread:

- Testnet product flow was completed and QA passed.
- Subdomain Surface Behavior v1 was completed and QA passed.
- Testnet Release Candidate Lock v1 was completed and passed.
- Mainnet contracts were deployed and verified on Base Mainnet and Ethereum Mainnet.
- Mainnet public surfaces were prepared.
- Mainnet Supabase data plane was created separately from testnet.
- Mainnet worker/data-plane foundation was prepared.
- First mainnet reward boundary job succeeded.
- First mainnet Base and Ethereum reward rounds were calculated, created on-chain, approved, and funded.
- Public mainnet reward claim launch remains separate and must not be assumed complete unless later explicitly approved and documented.

---

## 5. Reward Round Model

**Conversation-derived context; repo-documented in later QA/runbook docs.**

The owner described the desired reward flow before implementation:

1. Deploy NFT, staking, reward distributor, and token contracts.
2. Record the first deployment/from block per chain.
3. Open minting.
4. Allow soft staking once a user owns an NFT.
5. Later, when OiOi is available, choose a reward amount and a Tapal Batas block.
6. Sync and rebuild state up to that Tapal Batas.
7. Calculate valid staking intervals.
8. Calculate allocations.
9. Generate a Merkle root/proofs.
10. Create reward round on-chain.
11. Approve OiOi.
12. Fund reward round.
13. Users claim if eligible.
14. Later reward rounds repeat with the next range.

Important locked decisions:

- Reward distribution is irregular, not scheduled.
- Reward amount is part of the boundary job input, not a later manual field.
- Merkle root is used to create the on-chain round; Merkle proof is only for user claim.
- Claim surfaces should show funded rounds, including paused or already-claimed rounds, so users can understand reward history.
- A round can exist even if max NFT supply is not reached.
- A round can exist even if not every minted NFT is staked.
- The next reward range should begin after the previous Tapal Batas.
- Valid stake overlap matters: a stake that began before a period can still earn in a later period if it overlaps the later range.

---

## 6. Tapal Batas And Boundary Worker

**Repo-documented.**

Tapal Batas became the operational name for the target end block of a reward distribution range.

The thread produced a boundary job orchestration model in Supabase:

- `indexer_sync_jobs`
- `indexer_sync_job_targets`
- `reward_boundary_snapshots`
- `indexer_locks`
- boundary metadata columns on reward calculation and reward round tables

The worker command became:

```bash
npm run indexer:boundary-worker
```

The worker processes one target/task batch at a time and can be run repeatedly until the job reaches success.

Initial operation used local manual repeated runs. Later, GitHub Actions was added for automated/manual worker execution.

Important decision:

- Testnet and mainnet worker operation should be conservative.
- Mainnet worker is manual-only.
- Testnet worker was later changed to manual-only as well, so it no longer runs on a schedule.
- Worker jobs should not be used casually to chase cosmetic database state.

---

## 7. Supabase Data Plane

**Repo-documented.**

Supabase is used for:

- indexed NFT transfer/staking/reward events,
- ownership/stake reconstruction,
- reward calculation inputs,
- valid interval calculations,
- reward allocations,
- Merkle roots and proofs,
- job orchestration,
- dashboard wallet NFT cache,
- historical reconciliation.

The thread locked a separate data-plane approach:

- Testnet Supabase remains preserved as rehearsal/history evidence.
- Mainnet Supabase is a separate project/data plane.
- Mainnet data must be built from mainnet events only.
- Testnet rows must not be copied into mainnet.
- Mainnet Supabase migrations are applied cleanly.
- Static Sepolia seed rows from migration `001` should be removed from mainnet Supabase after applying schema, then mainnet chain/contract rows should be seeded.

Mainnet Supabase setup facts reported in the thread:

- Migrations `001` through `005` were applied.
- Sepolia static seed rows were removed.
- `baseMainnet` and `ethereumMainnet` were seeded.
- 12 mainnet contract rows were seeded.
- `NEXT_PUBLIC_APP_ENV=mainnet npm run supabase:check` succeeded.

---

## 8. Admin Reward Round Controls

**Repo-documented.**

Admin Reward Round Controls went through multiple redesigns.

The most important decision:

```text
Admin operational buttons should follow live on-chain reads, not stale Supabase status.
```

The UI state model was simplified into statuses such as:

- Not Created
- Created
- Not Funded
- Funded
- Paused
- Closed

Supabase status is still useful for historical calculation/reconciliation, but it is not the live source of truth for create/fund/pause/claim operation availability.

Other UI decisions from the thread:

- Dropdown should not include redundant status text.
- One status pill beside the round selector is easier to read.
- "Copy round values" became unnecessary and was removed.
- Advanced Diagnostics remains available for debugging, but normal operation should not require it.
- Buttons should enable only the next valid action.
- Error messages should wrap safely and not force horizontal overflow.
- Boundary block inputs can use latest block placeholders.
- A helper button can fill current blocks into Tapal Batas inputs.

---

## 9. Reward Claim Panel

**Repo-documented.**

Reward Claim Panel was aligned with Admin Reward Round Controls.

Decisions:

- User claim dropdown should show funded rounds.
- Paused rounds can still be visible.
- Already-claimed rounds can still be visible.
- A user with no allocation should see that there was a reward distribution and be encouraged to stake for future rounds.
- Claim readiness depends on:
  - selected round,
  - proof availability,
  - on-chain funded state,
  - on-chain paused state,
  - whether wallet already claimed,
  - root/proof consistency.

Testnet validation reported in the thread:

- Base Sepolia reward round create/approve/fund/claim/closed flow worked.
- Ethereum Sepolia multi-wallet reward claim worked.
- Allocations were consistent with staking duration and NFT weighting.

---

## 10. Reward Round Event Reconciliation SOP

**Repo-documented and conversation-derived.**

This became one of the most important locked operating decisions.

Admin UI does not write these fields directly after wallet transaction receipt:

- `created_tx_hash`
- `funded_tx_hash`
- funded amount
- claimed amount
- long-term DB status
- pause state

Instead:

- smart contracts/on-chain reads are the live source of truth for operational state,
- Supabase stores calculation/proof/reconciliation/history,
- RewardDistributor events are indexed into `reward_round_events`,
- `reward_rounds` is reconciled from indexed events.

Therefore it is expected that Supabase may temporarily show:

```text
status = calculated
created_tx_hash = null
funded_tx_hash = null
```

even after a successful on-chain create/fund transaction.

This is not considered a bug under the current SOP if on-chain reads confirm the round is created/funded.

Default SOP:

- Do not manually update Supabase just to fill tx hashes.
- Do not submit a new Tapal Batas solely to chase tx hash reconciliation.
- Do not run event-only catch-up unless there is a specific operator reason.
- Let the next natural reward distribution worker cycle reconcile events when its target block crosses those transaction blocks.

Reasoning:

- Avoid unnecessary worker/indexer runs only for cosmetic tx hash fields.
- Avoid manual database edits for on-chain state.
- Keep smart contracts as the live operational source of truth.
- Keep Supabase as calculation, proof, reconciliation, and history layer.
- Preserve the irregular reward distribution model.

---

## 11. Soft Staking And Owned NFT Display

**Repo-documented.**

The Dashboard and Mint surfaces were extended so users no longer need to manually type token IDs.

The final direction:

- Show owned NFTs in a grid.
- Allow user selection.
- Cross-check NFT ownership and staking state.
- Allow stake/unstake based on selected NFT state.
- Support NFTs still staked even if not currently owned, where contract logic allows unstake.

The data path uses:

- Alchemy NFT API / token metadata,
- Supabase dashboard wallet NFT cache,
- on-chain staking state checks,
- metadata media handling.

Media handling decisions:

- Thumbnail uses metadata `image`.
- Asset modal uses `animation_url` when present.
- If no `animation_url`, modal uses `image`.
- HTML animation URLs must be supported through a frame-like viewer.
- Broken/missing metadata falls back to `public/artifact.gif`.

---

## 12. UI, Theme, Subdomains, And Public Surfaces

**Repo-documented.**

The thread introduced and refined the BASE/dETH aesthetic system.

Decisions:

- BASE and dETH are aesthetic themes, like a Light/Dark switcher but domain-specific.
- Chain-specific mint/dashboard/admin pages force a theme.
- Generic pages can show the theme switcher.
- Dedicated mint subdomains force theme and hide the switcher.

Subdomain Surface Behavior v1 was implemented and QA passed.

Dedicated mint subdomain behavior:

- Root `/` is rewritten internally by `proxy.ts`.
- Browser URL remains `/`.
- App shell resolves effective route from host + pathname.
- Theme is forced correctly.
- ThemeSwitcher is hidden.
- Top-level Mint menu is active.
- Top-level Home is not active.
- Current mint child uses `/` target `_self`.
- Current mint anchors use `/#mint-card` and `/#soft-staking`.
- Home/Dashboard/Admin links point to the main app surface.

App shell work included:

- AppNavbar
- AppFooter
- AppMenu
- ThemeSwitcher
- AppCopyright
- Lore placeholder page at `/lore`

---

## 13. Error Display And UX Consistency

**Repo-documented.**

The thread repeatedly addressed long error messages causing horizontal overflow.

The locked pattern:

- Error blocks must use safe wrapping utilities.
- Long hashes, calldata, JSON, and RPC messages must not widen the viewport.
- Write errors should display in separate orange blocks.
- Transaction status, last requested action, and write errors should be structurally consistent across Mint, Dashboard, and Admin surfaces.

This pattern was applied across:

- mint panels,
- dashboard claim and stake panels,
- admin staking registry controls,
- admin mint phase controls,
- admin pricing/treasury/royalty controls,
- admin metadata controls,
- admin reward round controls,
- admin emergency rescue controls.

---

## 14. Testnet QA And Release Candidate Lock

**Repo-documented.**

The thread produced a full testnet validation sequence.

Completed testnet milestones:

- Subdomain Surface Behavior v1: DONE / PASS.
- Production-intended Sepolia rehearsal domain QA: DONE / PASS.
- Full Testnet Browser QA v1: DONE / PASS.
- Full Testnet Mutation QA v1: DONE / PASS.
- Full Testnet E2E QA v1: DONE / PASS.
- Worker jobs / boundary reward flow: DONE / PASS.
- Testnet Release Candidate Lock v1: DONE / PASS.

Canonical reports include:

```text
docs/qa/FULL_TESTNET_E2E_QA_V1.md
docs/qa/TESTNET_RELEASE_CANDIDATE_LOCK_V1.md
```

Pre-RC validation included:

- lint,
- build,
- compile,
- tests,
- Base Sepolia read-check,
- Ethereum Sepolia read-check,
- live browser sanity checks.

---

## 15. Mainnet Approval, Deployment, And Controlled Release

**Repo-documented.**

The thread moved mainnet through explicit gates.

Mainnet Deployment Approval Gate:

- Reviewed before deployment.
- Mainnet deployment was not automatic after testnet RC.

Metadata Strategy Approval:

- Option A was approved:
  - deploy with pending Melting/Amanda revealed URI placeholders,
  - keep mint phases OFF until explicitly opened,
  - keep metadata unlocked,
  - public launch remains separate,
  - `lockMetadata()` is prohibited until final metadata approval.

Mainnet contract deployment:

- Base Mainnet contract deployment: DONE / VERIFIED / SAFE OFF.
- Ethereum Mainnet contract deployment: DONE / VERIFIED / SAFE OFF.
- Read-checks passed.
- Deployment records were committed.

Mainnet public launch/opening:

- Later docs in the repo should be consulted for the final launch/opening status.
- Do not infer that reward claim launch is approved from contract deployment or mint launch alone.

---

## 16. Mainnet Reward Data Plane And First Reward Round

**Repo-documented and conversation-derived.**

Mainnet reward data-plane setup completed:

- Mainnet Supabase schema complete.
- Mainnet chain and contract rows seeded.
- Mainnet worker secrets/variables configured.
- Mainnet Boundary Worker no-job smoke passed.
- Mainnet app smoke checks passed.

First mainnet boundary job:

```text
job_id: 0118f1d1-ea0f-44b3-a74e-9d4902ff22a2
status: success
reward amount: 1 OiOi
```

First calculated rounds:

```text
baseMainnet round_id: 1782576147
baseMainnet allocation count: 1

ethereumMainnet round_id: 1782576167
ethereumMainnet allocation count: 1
```

On-chain operations reported:

- Base reward round created.
- Base OiOi approve succeeded.
- Base funding succeeded.
- Ethereum reward round created.
- Ethereum OiOi approve succeeded.
- Ethereum funding succeeded.

Important:

- Do not invent missing transaction hashes.
- If a tx hash was not captured in docs or conversation, leave it as TODO.
- Mainnet public/user claim verification must be treated separately from funding/creation unless later documentation proves it happened.

---

## 17. GitHub Actions And Worker Operation

**Repo-documented.**

The project uses GitHub Actions for worker execution.

Important locked direction:

- Mainnet worker workflow is manual-only.
- Testnet worker workflow was later adjusted to manual-only.
- Do not run workers during documentation or audit tasks unless explicitly instructed.
- Do not run workers just to make tx hashes appear faster.

GitHub Actions setup mistakes from the thread:

- Secrets/variables must be entered one by one in GitHub.
- They must not be pasted as a multi-line `.env` block into one GitHub secret or variable.

This was discovered during testnet worker setup and should be remembered for future environment setup.

---

## 18. Alchemy And RPC Lessons

**Conversation-derived context; partially repo-documented.**

Several Alchemy/RPC issues shaped the project operation:

- Alchemy monthly capacity/spending limits can stop worker/indexer calls.
- Vercel/server-side API calls may not include a browser Origin header.
- Browser allowlists do not solve every server-side Alchemy call.
- ERC20 rescue balance detection via Alchemy token balances needs server-side-safe Alchemy configuration.

Important practical rule:

- Frontend/public RPC env and server/operator RPC env should be treated separately.
- Secrets used only by scripts or GitHub Actions are not automatically needed in Vercel.
- Do not expose service role keys or private RPC secrets to browser code.

---

## 19. Current Pending Local Workspace Items At Time Of This Context

**Conversation-derived context; needs owner confirmation if workspace has changed.**

At the time this context document was created, the workspace had local uncommitted or untracked work related to:

- `/lore` placeholder page,
- AppMenu `Lore` entry,
- docs/context origin/context files,
- mainnet reward round context documentation,
- possibly manual-only testnet boundary worker workflow change if not already committed by the owner.

These should not be treated as canonical until the owner reviews and commits them.

Future Codex sessions should always run:

```bash
git status --short
```

before making changes.

---

## 20. True Remaining Items

**Repo-documented and conversation-derived.**

The remaining work should be interpreted carefully. Do not reopen completed testnet or deployment work as uncertainty.

Known remaining categories include:

- mainnet reward claim launch approval if still disabled,
- controlled mainnet user claim verification if not already documented,
- future reward distribution cycles with new Tapal Batas values,
- event reconciliation after later worker cycles,
- final Melting/Amanda revealed metadata approval,
- metadata update/reveal/lock approval,
- operator-friendly event-only catch-up workflow if wanted later,
- lore content population,
- future UI polish if owner wants further visual refinement.

---

## 21. Optional Future Improvements

**Conversation-derived context; not required for current release unless owner approves.**

Possible future improvements:

- Dedicated event-only RewardDistributor catch-up workflow.
- Better operator dashboard for event reconciliation progress.
- More explicit UI note when Supabase tx hashes are stale but on-chain state is valid.
- More automated mainnet read-only smoke checks.
- Expanded lore page with Markdown/image ingestion.
- More structured design token extraction for BASE/dETH themes.
- More defensive RPC/provider fallback strategy.

These are not blockers by default.

---

## 22. Unclear / Needs Owner Confirmation

The following should not be assumed without checking latest repo docs or asking the owner:

- Whether mainnet public reward claim has been enabled after this document.
- Whether a controlled mainnet user claim has been completed and documented after first funding.
- Whether final Melting/Amanda revealed metadata has been uploaded and approved.
- Whether `lockMetadata()` has been approved.
- Whether the local `/lore` placeholder and AppMenu updates have been committed.
- Whether any pending local docs were later merged.

---

## 23. Working Rules For Future Codex Sessions

**Conversation-derived context; repo-aligned.**

When continuing this project:

1. Check `git status --short` first.
2. Do not overwrite user changes.
3. Do not run workers unless explicitly requested.
4. Do not run on-chain transactions unless explicitly requested.
5. Do not edit `.env` unless explicitly requested.
6. Treat testnet Supabase and mainnet Supabase as separate data planes.
7. Treat smart contracts as live source of truth for reward operation state.
8. Treat Supabase as calculation/proof/reconciliation/history layer.
9. Do not manually edit tx hash fields to make the DB look caught up.
10. Do not submit Tapal Batas solely for tx hash reconciliation.
11. Use docs as the canonical release/status source, but verify against code when implementing.

---

## 24. Summary

The Codex thread transformed the OiOi Melting Dashboard from an active implementation into a staged, QA-validated, mainnet-deployed operational system.

The most important locked ideas are:

- reward distribution is irregular and Tapal Batas-based,
- worker jobs are conservative and resumable,
- live reward operations follow on-chain reads,
- Supabase reconciliation can lag without being a bug,
- testnet and mainnet data planes are separate,
- public launch and reward claim launch are separate approval gates,
- documentation is part of the operating system, not an afterthought.

Future work should preserve these decisions unless the owner explicitly changes them.
