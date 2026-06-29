# Documentation Update Summary v3

Historical note:

```text
This file records an earlier documentation pass. The current canonical project
status is docs/PROJECT_FINAL_STATUS_AND_MAINTENANCE_V1.md:
complete, public, operational, and in evergreen maintenance mode.
```

Updated documents:

- README.md
- docs/SPEC_LOCK.md
- docs/IMPLEMENTATION_ROADMAP.md
- docs/TESTNET_PRODUCT_COMPLETION_PLAN.md
- docs/MAINNET_READINESS_REVIEW.md
- docs/INDEXER_ARCHITECTURE.md
- docs/INDEXER_IMPLEMENTATION_PLAN.md
- docs/INDEXER_OPERATIONAL_MODEL.md
- docs/FRONTEND_ARCHITECTURE.md
- docs/FRONTEND_SEPOLIA_BROWSER_QA.md
- docs/TESTING_CHECKLIST.md
- docs/DEPLOYMENT_RUNBOOK.md

Main changes:

- Locked Supabase Postgres as the primary indexer + reward storage.
- Removed Local JSON as the primary indexer storage.
- Added Testnet Product Completion Plan v2.
- Deferred mainnet deployment until Testnet Release Candidate.
- Added Admin Dashboard as the next required architecture stage.
- Added testing-per-stage discipline and final Full Testnet Browser E2E.
- At that time, updated mainnet readiness to say contract preparation passed
  but deployment was deferred. Mainnet deployment and public opening were later
  completed.
- Clarified verify:args as post-deployment because it needs deployment records.
- Preserved manual FROM_BLOCK / optional TO_BLOCK / checkpoint model.
