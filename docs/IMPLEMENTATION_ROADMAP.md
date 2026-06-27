# OiOi Melting Dashboard — Implementation Roadmap v3

This roadmap reflects the current state after Sepolia contract validation, frontend implementation, Supabase reward pipeline implementation, GitHub Actions worker setup, BASE/dETH app shell work, Subdomain Surface Behavior v1, Full Testnet E2E QA v1, Testnet Release Candidate Lock v1, Mainnet Deployment Approval Gate v1, Mainnet Contract Deployment Completion v1, and Mainnet Public Surface / Mint Opening QA v1.

Current execution path:

```text
Mainnet public mint/staking surface live
→ Mainnet Reward Round Operations / Production Reward Data Plane foundation done
→ controlled mainnet reward claim verification / launch approval
→ final metadata update/reveal/lock decision later
```

---

## Phase 1 — Contract Suite

Status: Completed.

Completed:

```text
MemorialNFTCore
TheRotyMemorial
MeltingMemorial
AmandaMemorial
OiOiSoftStaking
OiOiRewardDistributor
MockERC20 for tests
unit tests
integration lifecycle tests
```

---

## Phase 2 — Deployment Tooling

Status: Completed.

Completed:

```text
deployment config
deployment state helper
ROTY deploy script
staking deploy script
ROTY registration script
Melting deploy/register scripts
Amanda deploy/register scripts
RewardDistributor deploy script
local full smoke deploy script
preflight script
read-check script
restore mint phases script
constructor args export script
```

Decision:

```text
Do not rewrite deployment scripts only to record block numbers.
For indexer v1, start blocks are manually read from block explorers and stored in env.
verify:args is post-deployment because it needs deployment records.
```

---

## Phase 3 — Testnet Contract Validation

Status: Completed.

Completed on Base Sepolia and Ethereum Sepolia:

```text
deployment
verification
read checks
functional tests
mint phases restored OFF
```

---

## Phase 4 — Frontend Sepolia MVP

Status: Completed.

Completed:

```text
Next.js frontend shell
wallet-first wagmi/viem setup
custom wallet modal
ChainGuard
contract env config
homepage
mint pages
dashboard stake/unstake
owned NFT selector
reward claim panel
invalid page handling
BASE/dETH theme foundation
```

---

## Phase 5 — Admin Dashboard

Status: Completed.

Completed:

```text
admin owner guard
admin read cards
mint phase controls
metadata controls
pricing / treasury / royalty controls
staking registry controls
reward operations
emergency / rescue controls
```

Reward operations completed:

```text
tapal batas submission
worker status display
Supabase reward round selector
live on-chain status
create reward round
approve $OiOi
fund reward round
pause / unpause claims
closed state display
advanced diagnostics
```

---

## Phase 6 — Supabase Postgres Indexer + Reward Pipeline

Status: Completed for testnet.

Completed:

```text
Supabase migrations
DB-backed checkpoints
Transfer event sync
Staked / Unstaked event sync
Reward Distributor event sync
current ownership rebuild
current stake-position rebuild
valid interval calculation
reward allocation calculation
Merkle proof storage
reward proof API
reward rounds API
boundary sync orchestration
GitHub Actions worker
```

Canonical worker command:

```bash
npm run indexer:boundary-worker
```

Canonical manual commands:

```bash
npm run indexer:db-check -- <chain>
npm run indexer:sync-transfers -- <chain>
npm run indexer:rebuild-ownership -- <chain>
npm run indexer:sync-staking -- <chain>
npm run indexer:rebuild-stake-positions -- <chain>
npm run indexer:sync-rewards -- <chain>
npm run indexer:calculate-valid-intervals -- <chain>
npm run rewards:calculate -- <chain>
npm run rewards:merkle-db -- <chain>
```

---

## Phase 7 — Dashboard NFT Discovery

Status: Completed.

Completed:

```text
Alchemy-backed wallet NFT discovery
Supabase dashboard wallet NFT cache
on-chain staking state enrichment
NFT thumbnails
asset modal for image / animation / HTML media
stake / unstake selected NFT flow
```

---

## Phase 8 — Reward Claim Browser Flow

Status: Completed and QA-passed for testnet.

Completed:

```text
funded reward round selector
wallet allocation display
proof fetch
on-chain state checks
claim transaction
already-claimed state
closed round state
paused/funded/not-funded states
```

---

## Phase 9 — UI / Layout / App Shell

Status: Completed for current testnet rehearsal; final visual review may continue during RC lock.

Completed:

```text
BASE / dETH theme foundation
App Navbar
App Footer
App Menu
Theme Switcher
copyright footer
wallet modal color alignment
mint page color pass
dashboard color pass
admin color pass
```

Current next stage:

```text
Controlled mainnet reward claim verification / launch approval planning
```

Canonical planning document:

```text
docs/mainnet/MAINNET_ENV_WIRING_PLAN_V1.md
```

Canonical read-only approval decision:

```text
docs/mainnet/MAINNET_ENV_WIRING_APPROVAL_DECISION_V1.md
```

Status remains:

```text
READ-ONLY MAINNET ENV WIRING: APPROVED
MAINNET READ-ONLY FRONTEND QA V1: PASSED FOR LOCALHOST READ-ONLY QA
PRODUCTION MAINNET ENV: LIVE
MAINNET PUBLIC SURFACE: LIVE
MINT OPENING: DONE / LIVE
MAINNET REWARD CLAIM LAUNCH: NOT APPROVED
METADATA LOCK: NOT APPROVED
MAINNET REWARD ROUND OPERATIONS: DATA PLANE FOUNDATION DONE / CLAIM LAUNCH PENDING
```

---

## Phase 10 — Subdomain Surface Behavior v1

Status: Done.

Completed behavior:

```text
softstaking.endhonesa.com / remains the real home surface
dedicated mint subdomain roots rewrite to mapped internal mint routes
browser URL remains / on dedicated mint subdomains
app shell resolves effective route from host + pathname
Theme Switcher hidden on dedicated mint subdomain roots
BASE/dETH theme forced correctly by effective route
App Menu marks Mint active and Home inactive on dedicated mint subdomain roots
current mint child uses / target _self
current mint anchors use /#mint-card and /#soft-staking
Home/Dashboard/Admin links point to https://softstaking.endhonesa.com/...
```

QA:

```text
Production-intended Sepolia rehearsal domain QA passed for softstaking.endhonesa.com and the six dedicated mint subdomains.
```

---

## Phase 11 — Testnet Release Candidate

Status: Done / PASS.

Done criteria:

```text
Subdomain Surface Behavior v1 passed ✅
final deployed browser QA passes ✅
Full Testnet Mutation QA passes ✅
Worker Jobs reward round QA documented ✅
Full Testnet E2E QA documented ✅
no critical blockers ✅
pre-RC health checks passed ✅
Base Sepolia read-check passed ✅
Ethereum Sepolia read-check passed ✅
browser sanity checks passed ✅
Testnet Release Candidate Lock v1 documented ✅
```

---

## Phase 12 — Mainnet Deployment

Status: Completed for contract deployment only; verified and safe-off.

Preparation already passed:

```text
repo health
build / compile / test
RPC chain IDs
mainnet preflight
deployer wallet funded
whitelist finalized
```

Completed:

```text
Base Mainnet contract deployment
Ethereum Mainnet contract deployment
BaseScan verification / already verified
Etherscan verification / already verified or successfully verified
Base read-check
Ethereum read-check
deployment records committed
mint phases OFF
metadata UNLOCKED
```

Still not approved / not started:

```text
mainnet reward claim launch
metadata lock
final metadata update/reveal/lock
public reward claim launch
```

Approval-sensitive items:

```text
metadata strategy approved as Option A for contract deployment planning only
mainnet reward data-plane foundation completed and first rounds prepared
mainnet public mint/staking surface live
mainnet reward claim launch remains not approved
metadata lock remains not approved
mint opening done / live
```

---

## Phase 13 — Mainnet Deployment Approval Gate v1

Status: Approved for Base Mainnet + Ethereum Mainnet contract deployment only.

Documented in:

```text
docs/mainnet/MAINNET_DEPLOYMENT_APPROVAL_GATE_V1.md
```

Gate status:

```text
MAINNET DEPLOYMENT APPROVAL GATE V1: READY WITH NOTES
DEPLOYMENT AUTHORIZATION: APPROVED FOR CONTRACT DEPLOYMENT ONLY
APPROVED DEPLOYMENT SCOPE: BASE MAINNET + ETHEREUM MAINNET
MAINNET CONTRACT DEPLOYMENT: DONE / VERIFIED / SAFE OFF
MAINNET PUBLIC SURFACE: LIVE
READ-ONLY MAINNET ENV WIRING: APPROVED
PRODUCTION MAINNET ENV: LIVE
MAINNET REWARD CLAIM LAUNCH: NOT READY / NOT APPROVED
METADATA LOCK: NOT APPROVED
MINT OPENING: DONE / LIVE
MAINNET REWARD ROUND OPERATIONS: DATA PLANE FOUNDATION DONE / CLAIM LAUNCH PENDING
```

Final deployment approval form:

```text
docs/mainnet/MAINNET_DEPLOYMENT_APPROVAL_DECISION_V1.md
```

Contract deployment completion:

```text
docs/mainnet/MAINNET_CONTRACT_DEPLOYMENT_COMPLETION_V1.md
```

Mainnet read-only frontend QA:

```text
docs/qa/MAINNET_READ_ONLY_FRONTEND_QA_V1.md
```

---

## Current Next Step

```text
Controlled mainnet reward claim verification / approval planning
```

Do not launch public reward claim, reveal metadata, or lock metadata until each later gate is explicitly approved.

Mainnet reward round operations status:

```text
Mainnet Supabase schema and seed complete.
Mainnet worker readiness pass.
First mainnet boundary worker job success.
First Base/Ethereum calculated reward rounds generated.
First Base/Ethereum reward rounds created, approved, and funded on-chain.
Reward claim public enablement remains not approved.
```

Canonical SOP / decision log:

```text
docs/mainnet/MAINNET_REWARD_ROUND_OPERATIONS_V1.md
```

---

P.S. Read this document freely for information and guidance. Do not redistribute or restate—no quotes, summaries, paraphrases, or derivatives—without prior written permission from [**Prof. NOTA**](https://nota.endhonesa.com/). Sharing the link is allowed. So, share the link, not the text. Do not discuss or re-tell the contents in any form—written, spoken, or recorded—without prior written permission.

---
