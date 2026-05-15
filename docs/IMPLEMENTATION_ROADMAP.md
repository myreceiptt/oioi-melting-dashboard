# OiOi Melting Dashboard — Implementation Roadmap v1

This roadmap defines the current execution path after successful Base Sepolia and Ethereum Sepolia validation.

---

## Phase 1 — Contract Suite

Status: Completed.

Completed:

- MemorialNFTCore
- TheRotyMemorial
- MeltingMemorial
- AmandaMemorial
- OiOiSoftStaking
- OiOiRewardDistributor
- MockERC20 for tests
- Unit tests
- Integration lifecycle tests

---

## Phase 2 — Deployment Tooling

Status: Completed.

Completed:

- deployment config
- deployment state helper
- ROTY deploy script
- staking deploy script
- ROTY registration script
- Melting deploy script
- Melting registration script
- Amanda deploy script
- Amanda registration script
- RewardDistributor deploy script
- local full smoke deploy script
- preflight script
- read-check script
- restore mint phases script
- constructor args export script

---

## Phase 3 — Testnet Validation

Status: Completed.

Completed on Base Sepolia:

- deployment
- verification
- read checks
- functional test
- mint phases restored to OFF

Completed on Ethereum Sepolia:

- deployment
- verification
- read checks
- functional test
- mint phases restored to OFF

---

## Phase 4 — Documentation Alignment

Status: In progress.

Completed:

- deployment runbook
- testing checklist
- mainnet readiness review
- frontend architecture
- indexer architecture

To complete:

- README update
- SPEC_LOCK update
- IMPLEMENTATION_ROADMAP update

---

## Phase 5 — Frontend Skeleton v1

Status: Pending.

Goal:

Create the Next.js frontend foundation.

Stack:

```text
Next.js
TypeScript
Tailwind
wagmi
viem
TanStack Query
custom wallet modal
```

Wallet model:

```text
Required wallet compatibility, strict EOA-first identity.
```

Tasks:

1. Install frontend dependencies.
2. Add app layout.
3. Add Tailwind baseline.
4. Add wagmi config.
5. Add wallet connectors.
6. Add custom wallet modal.
7. Add ChainGuard.
8. Add env validation.
9. Add contract address config.
10. Add explorer helpers.

Output:

- frontend app compiles
- wallet connect works
- chain guard works
- config loads Sepolia addresses

---

## Phase 6 — Mint Pages MVP

Status: Pending.

Goal:

Build six mint pages from one codebase.

Routes:

```text
/mint/roty/base
/mint/roty/ethereum
/mint/melting/base
/mint/melting/ethereum
/mint/amanda/base
/mint/amanda/ethereum
```

Tasks:

1. Build shared MintPageShell.
2. Build ROTY mint panel.
3. Build gated mint panel.
4. Add supply/price/phase reads.
5. Add whitelist proof strategy.
6. Add ROTY whitelist mint.
7. Add ROTY public mint.
8. Add Melting eligibility check.
9. Add Melting mint.
10. Add Amanda eligibility check.
11. Add Amanda mint.
12. Test on Base Sepolia.
13. Test on Ethereum Sepolia.

---

## Phase 7 — Dashboard MVP

Status: Pending.

Goal:

Build OiOi Melting Dashboard.

Routes:

```text
/dashboard
/dashboard/base
/dashboard/ethereum
```

Tasks:

1. Add chain selector.
2. Add owned NFT display.
3. Add stake status display.
4. Add stake action.
5. Add unstake action.
6. Add valid stake status.
7. Add reward panel placeholder.
8. Add reward claim panel after proof source exists.
9. Test on Base Sepolia.
10. Test on Ethereum Sepolia.

---

## Phase 8 — Indexer MVP

Status: Pending.

Goal:

Build backend/indexer foundation for ownership, staking history, and reward allocation.

Tasks:

1. Select database.
2. Define migrations.
3. Sync ERC721 Transfer events.
4. Sync staking events.
5. Sync reward distributor events.
6. Build current ownership table.
7. Build current stake table.
8. Build valid duration calculator.
9. Build weighted duration calculator.
10. Build reward allocation generator.
11. Generate Merkle input JSON.
12. Serve owned NFT API.
13. Serve stake status API.
14. Serve reward proof API.
15. Test on Base Sepolia.
16. Test on Ethereum Sepolia.

---

## Phase 9 — Mainnet Deployment

Status: Pending.

Prerequisites:

- frontend architecture committed
- indexer architecture committed
- mainnet readiness review committed
- Base Mainnet preflight passes
- Ethereum Mainnet preflight passes
- deployer wallet funded
- Merkle root final
- mint phases understood to remain OFF

Base Mainnet:

```bash
npm run deploy:preflight -- baseMainnet
npm run deploy:roty -- --network baseMainnet
npm run deploy:staking -- --network baseMainnet
npm run deploy:register-roty -- --network baseMainnet
npm run deploy:melting -- --network baseMainnet
npm run deploy:register-melting -- --network baseMainnet
npm run deploy:amanda -- --network baseMainnet
npm run deploy:register-amanda -- --network baseMainnet
npm run deploy:reward-distributor -- --network baseMainnet
npm run verify:args -- baseMainnet
npm run deploy:read-check -- --network baseMainnet
```

Ethereum Mainnet:

```bash
npm run deploy:preflight -- ethereumMainnet
npm run deploy:roty -- --network ethereumMainnet
npm run deploy:staking -- --network ethereumMainnet
npm run deploy:register-roty -- --network ethereumMainnet
npm run deploy:melting -- --network ethereumMainnet
npm run deploy:register-melting -- --network ethereumMainnet
npm run deploy:amanda -- --network ethereumMainnet
npm run deploy:register-amanda -- --network ethereumMainnet
npm run deploy:reward-distributor -- --network ethereumMainnet
npm run verify:args -- ethereumMainnet
npm run deploy:read-check -- --network ethereumMainnet
```

---

## Phase 10 — Mainnet Frontend Switch

Status: Pending.

Tasks:

1. Fill mainnet frontend env variables.
2. Confirm frontend reads mainnet contracts.
3. Confirm wallet switch works.
4. Confirm mint buttons remain disabled while phases are OFF.
5. Confirm dashboard reads staking contracts.
6. Confirm explorer links point to mainnet explorers.
7. Confirm domains point to correct routes.

---

## Phase 11 — Final Mint Opening

Status: Pending.

Opening order:

1. Enable ROTY whitelist mint.
2. Enable ROTY public mint.
3. Enable staking dashboard.
4. Enable Melting gated mint.
5. Enable Amanda gated mint.
6. Enable reward claim only after indexer/reward pipeline is ready.

Do not open all phases until frontend and monitoring are ready.

---

## Phase 12 — Reward Operations

Status: Pending.

Tasks per reward round:

1. Sync indexer.
2. Confirm sync checkpoint.
3. Calculate weighted duration.
4. Generate allocation JSON.
5. Generate Merkle root/proofs.
6. Review allocation summary.
7. Create reward round.
8. Fund reward round.
9. Publish reward proof data.
10. Monitor claims.

---

## Current Next Step

After this documentation alignment is committed:

```text
Frontend Skeleton v1
```

---

P.S. Read this document freely for information and guidance. Do not redistribute or restate—no quotes, summaries, paraphrases, or derivatives—without prior written permission from [**Prof. NOTA**](https://nota.endhonesa.com/). Sharing the link is allowed. So, share the link, not the text. Do not discuss or re-tell the contents in any form—written, spoken, or recorded—without prior written permission.

---
