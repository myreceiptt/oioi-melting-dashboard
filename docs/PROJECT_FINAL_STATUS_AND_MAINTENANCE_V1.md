# OiOi Melting Dashboard - Final Public Status and Maintenance v1

Date: 2026-06-29

Status:

```text
PROJECT STATUS: COMPLETE / PUBLIC / OPERATIONAL
MAINNET PUBLIC SURFACE: LIVE
MINTING: LIVE
SOFT STAKING: LIVE
REWARD ROUND OPERATIONS: LIVE
REWARD CLAIM: LIVE
ADMIN OPERATIONS: LIVE
WORKER / INDEXER DATA PLANE: OPERATIONAL
DOCUMENTATION STATUS: FINAL STATUS SYNCHRONIZED
MAINTENANCE MODE: EVERGREEN
```

This is the current canonical status document for the OiOi Melting Dashboard.

Older planning, approval, QA, and runbook documents remain in the repository as
historical records. If an older document says a stage was "not approved",
"deferred", "not ready", "pending", or "not started", read that statement as
historical unless it is repeated in this final status document.

---

## 1. Current Product Status

The OiOi Melting Dashboard is complete, public, and operational.

The production surfaces are live:

```text
https://softstaking.endhonesa.com/
https://rotybase.endhonesa.com/
https://rotydeth.endhonesa.com/
https://meltingbase.endhonesa.com/
https://meltingdeth.endhonesa.com/
https://amandabase.endhonesa.com/
https://amandadeth.endhonesa.com/
```

The product includes:

- public mint pages,
- user dashboard,
- owned NFT discovery,
- soft staking,
- unstaking,
- reward claim,
- admin dashboard,
- admin contract read surfaces,
- admin write controls,
- reward round operations,
- boundary worker operations,
- Supabase-backed indexer/reward data plane,
- BASE/dETH theme shell,
- App Navbar,
- App Footer,
- App Menu,
- dedicated mint subdomain behavior,
- and production mainnet routing.

---

## 2. Completed Scope

The following project areas are complete and operational:

```text
Smart contracts
Deployment tooling
Base Sepolia rehearsal
Ethereum Sepolia rehearsal
Full testnet browser QA
Full testnet mutation QA
Full testnet E2E QA
Testnet Release Candidate lock
Mainnet deployment
Mainnet verification
Mainnet env wiring
Production domain routing
Public mint opening
Dashboard owned NFT discovery
Soft staking / unstaking
Reward data plane
Reward boundary worker
Reward round creation / approval / funding
Reward claim
Admin read/write operations
Subdomain Surface Behavior v1
Mainnet Supabase data plane
Mainnet worker/data plane setup
Mainnet public QA
Documentation synchronization
```

---

## 3. Current Operating Model

The project is now in maintenance mode.

Operationally, Prof. NOTA runs the project in an evergreen mode:

- keep dependencies current,
- replace deprecated tooling when needed,
- keep lint/build/test commands healthy,
- maintain documentation when operations change,
- run worker/indexer jobs when reward distribution requires it,
- perform reward distributions when OiOi is available,
- maintain production environment variables safely,
- and keep public surfaces operational.

This is not an unfinished implementation mode. It is normal production
maintenance.

---

## 4. Reward Round Operating Model

Reward distribution is not scheduled.

The operator creates a reward round when OiOi is available for distribution.

The reward workflow remains:

1. Submit Tapal Batas blocks and reward amount.
2. Run the boundary worker.
3. Sync/rebuild/calculate/generate Merkle data.
4. Create reward round on-chain.
5. Approve OiOi.
6. Fund reward round.
7. Users claim from the dashboard.
8. Later worker/indexer runs reconcile historical event state.

Smart contracts and on-chain reads are the live source of truth for operational
reward state. Supabase remains the calculation, proof, reconciliation, and
history layer.

It is normal for Supabase tx hash fields to lag until RewardDistributor events
are indexed. This is not a product blocker when on-chain state is correct.

---

## 5. Documentation Model

Use this document as the canonical current status reference.

Use historical documents to understand how the system was built, reviewed, and
approved over time.

Important historical document groups:

- testnet QA reports,
- mainnet approval gates,
- mainnet deployment completion reports,
- env wiring plans,
- reward round operation notes,
- context documents,
- architecture documents,
- and runbooks.

Historical documents may preserve old gate language such as "not approved" or
"deferred" because that was true at the time of the document. Those historical
statements are superseded by this final public status unless a later document
explicitly says otherwise.

---

## 6. Lore Surface

The repository includes a Lore page for readers who want the story behind the
OiOi Melting Dashboard and The Melting Land universe.

The Lore page is part of the public site surface and can be maintained as
narrative content by Prof. NOTA.

---

## 7. No Active Product Blockers

There are no active product blockers recorded for the current complete/public
state.

Future work should be treated as maintenance, content updates, dependency
updates, or optional improvements unless Prof. NOTA explicitly opens a new
project phase.

---

## 8. Evergreen Maintenance Checklist

Recommended periodic maintenance:

```bash
npm run lint:frontend
npm run build
npm run compile
npm run test
```

Optional operational checks when relevant:

```bash
npm run deploy:read-check -- --network baseMainnet
npm run deploy:read-check -- --network ethereumMainnet
npm run supabase:check
```

Worker execution remains an operator-controlled action and should be run only
when the operator intends to process reward/indexer work.

---

## 9. Final Statement

OiOi Melting Dashboard is complete, public, operational, and ready for ongoing
evergreen maintenance by Prof. NOTA.
