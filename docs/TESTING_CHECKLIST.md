# OiOi Melting Dashboard — Testing Checklist v2

This checklist defines required testing layers for contracts, deployment, frontend, admin dashboard, indexer, reward calculator, and browser E2E.

---

## 1. Core Repository Health

Run:

```bash
git status
npm run build
npm run compile
npm run test
```

Required:

```text
working tree clean
build passes
compile passes
tests pass
```

---

## 2. Contract Tests

Required:

```bash
npm run compile
npm run test
```

Must cover:

```text
ROTY minting
whitelist mint
public mint
max supply
max mint per tx
gated mint eligibility
soft staking
stake/unstake
valid stake checks
reward round creation
reward funding
claim
double claim prevention
claim pause
royalty
metadata controls
ownership controls
```

---

## 3. Deployment Tests

### Local Smoke

```bash
rm -rf deployments/hardhat-base deployments/hardhat-mainnet
npm run deploy:local-full -- --network hardhatBase
npm run deploy:local-full -- --network hardhatMainnet
```

Required:

```text
all contracts deployed
registrations true
mock reward token deployed
deployment.json written
```

### Testnet Read Checks

```bash
npm run deploy:read-check -- --network baseSepolia
npm run deploy:read-check -- --network ethereumSepolia
```

Required:

```text
owners correct
treasury correct
royalty correct
prices correct
URIs correct
mint phases expected
staking approvals true
reward token correct
reward counters valid
```

---

## 4. Frontend Sepolia Current MVP QA

Defined in:

```text
docs/FRONTEND_SEPOLIA_BROWSER_QA.md
```

Current status:

```text
PASS for read/OFF-phase/stake flows.
```

---

## 5. Admin Dashboard Testing

Status: PASS for testnet.

Latest canonical QA:

```text
docs/qa/FULL_TESTNET_E2E_QA_V1.md
```

Validated:

```text
owner wallet can access admin controls
non-owner wallet cannot execute writes
read surfaces display current contract state
mint phase controls work
phase restore OFF works
metadata/reveal controls show warnings
lockMetadata requires typed confirmation
staking approval controls work
reward round creation works
reward round funding works
claim pause/unpause works
post-transaction state refresh works
errors are readable
explorer links work
```

---

## 6. Supabase Indexer Testing

Status: PASS for testnet worker/boundary flow.

Validated / required coverage:

```text
Supabase migration runs
tables exist
service role can write
browser cannot access service-only operations
contracts seeded correctly
FROM_BLOCK fallback works
checkpoint resume works
TO_BLOCK bounded backfill works
duplicate event insert is prevented
event decoding works
RPC rate limit handling works
current owners match ownerOf
stake state matches isStakeActive/isStakeValid
reward events match RewardDistributor reads
```

---

## 7. Reward Calculator Testing

Status: PASS for testnet worker/boundary flow.

Validated / required coverage:

```text
ownership windows built correctly
stake windows built correctly
reward period boundaries handled correctly
transfer-out period excluded
transfer-back period included
unstaked period excluded
collection weights applied correctly
wallet weighted duration calculated correctly
allocation sum equals reward amount
dust assigned explicitly
Merkle proof verifies
```

---

## 8. Reward Claim Browser Testing

Status: PASS for testnet.

Validated:

```text
reward rounds displayed
wallet allocation displayed
proof fetched
claimable amount displayed
claim transaction succeeds
claimed status updates
already claimed wallet is blocked
non-eligible wallet gets safe empty state
claim pause state respected
```

---

## 9. Stage-by-Stage Browser Testing

Each stage passed before Full Testnet E2E QA v1:

```text
Mint page testing
User dashboard stake/unstake testing
Admin dashboard testing
Indexer/reward API testing
Reward claim browser testing
```

---

## 10. Full Testnet Browser E2E

Status: PASS.

Canonical report:

```text
docs/qa/FULL_TESTNET_E2E_QA_V1.md
```

Validated Base Sepolia and Ethereum Sepolia flow:

```text
connect wallet
mint ROTY
stake ROTY
mint Melting
stake Melting
mint Amanda
stake Amanda
admin create reward round
admin fund reward round
indexer sync
reward calculation
proof API
claim $OiOi
claimed status refresh
restore phases OFF if needed
```

Repeat on Ethereum Sepolia.

---

## 11. Testnet Release Candidate Gate

Required and completed for Testnet Release Candidate Lock v1:

```text
all contract tests pass ✅
frontend lint passes ✅
build passes ✅
compile passes ✅
tests pass ✅
Base Sepolia read-check passes ✅
Ethereum Sepolia read-check passes ✅
all stage browser tests pass ✅
full browser E2E pass on both testnets ✅
worker/boundary reward flow passes ✅
docs updated ✅
no critical blocker ✅
```

Current status:

```text
Testnet Release Candidate Lock v1 is complete and passed.
Canonical RC lock report: docs/qa/TESTNET_RELEASE_CANDIDATE_LOCK_V1.md
Current next stage is Mainnet deployment planning / approval gate.
```

---

## 12. Mainnet Testing

Mainnet deployment is deferred until explicit approval after Testnet Release Candidate Lock v1.

After mainnet deployment:

```text
verification
read-check
mainnet frontend env wiring
mainnet read-only browser QA
admin read-only state check
mint phases remain OFF
```

Do not run mainnet functional mint tests unless intentionally minting real NFTs.

---

## 13. Public Opening Testing

Before controlled opening:

```text
enable one phase at a time
small controlled mint
monitor tx
restore/disable if needed
confirm frontend state
confirm explorer indexing
confirm admin controls
```

Reward claim opening requires production reward proof flow.

---

P.S. Read this document freely for information and guidance. Do not redistribute or restate—no quotes, summaries, paraphrases, or derivatives—without prior written permission from [**Prof. NOTA**](https://nota.endhonesa.com/). Sharing the link is allowed. So, share the link, not the text. Do not discuss or re-tell the contents in any form—written, spoken, or recorded—without prior written permission.

---
