# Worker's Jobs

Worker's Jobs run the reward boundary worker automatically from GitHub Actions.
The workflow does not create a new indexing path. It runs the same command used
locally:

```bash
npm run indexer:boundary-worker
```

Each run processes one safe batch, writes progress to Supabase, then exits.
The next scheduled run resumes from Supabase checkpoints and job target state.

## Workflow

The workflow file is:

```text
.github/workflows/boundary-worker.yml
```

It runs every 15 minutes and can also be started manually from GitHub Actions
with `workflow_dispatch`.

Concurrency is locked with:

```yaml
concurrency:
  group: boundary-worker
  cancel-in-progress: false
```

This prevents two scheduled worker runs from processing the same job at the same
time. Supabase `indexer_locks` still provides an additional database-level lock.

## GitHub Secrets

Set these in GitHub repository settings:

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
BASE_SEPOLIA_RPC_URL
ETHEREUM_SEPOLIA_RPC_URL
```

`SUPABASE_URL` may also be set as a GitHub Variable because it is not a secret.
The workflow accepts `SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_URL`, but
`SUPABASE_SERVICE_ROLE_KEY` must stay in GitHub Secrets.

Dummy examples:

```text
SUPABASE_URL=https://abcdefghijklmnopqrst.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy-service-role-key
BASE_SEPOLIA_RPC_URL=https://base-sepolia.g.alchemy.com/v2/dummyAlchemyApiKey
ETHEREUM_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/dummyAlchemyApiKey
INDEXER_CRON_SECRET=dummy-random-long-secret-please-replace
```

Do not use the dummy values above. Use the exact names, then paste the real
values from Supabase and Alchemy.

Optional:

```text
INDEXER_CRON_SECRET
```

`INDEXER_CRON_SECRET` is not required for local CLI execution, but keeping it in
the workflow environment makes the CLI worker compatible with the same secret
guard used by the cron API path.

## GitHub Variables

Set these in GitHub repository settings as Variables, not Secrets:

```text
NEXT_PUBLIC_APP_ENV=sepolia
BASE_SEPOLIA_INDEXER_FROM_BLOCK=
ETHEREUM_SEPOLIA_INDEXER_FROM_BLOCK=
INDEXER_BLOCK_RANGE=10
INDEXER_REQUEST_DELAY_MS=250
INDEXER_WORKER_BLOCK_SPAN=100
INDEXER_WORKER_COMMAND_TIMEOUT_MS=55000
INDEXER_WORKER_RETRY_DELAY_SECONDS=60
INDEXER_WORKER_RATE_LIMIT_DELAY_SECONDS=300
INDEXER_WORKER_LOCK_TTL_SECONDS=120
```

Dummy examples:

```text
NEXT_PUBLIC_APP_ENV=sepolia
BASE_SEPOLIA_INDEXER_FROM_BLOCK=41500000
ETHEREUM_SEPOLIA_INDEXER_FROM_BLOCK=10500000
INDEXER_BLOCK_RANGE=10
INDEXER_REQUEST_DELAY_MS=250
INDEXER_WORKER_BLOCK_SPAN=100
INDEXER_WORKER_COMMAND_TIMEOUT_MS=55000
INDEXER_WORKER_RETRY_DELAY_SECONDS=60
INDEXER_WORKER_RATE_LIMIT_DELAY_SECONDS=300
INDEXER_WORKER_LOCK_TTL_SECONDS=120
```

Replace the dummy `*_INDEXER_FROM_BLOCK` values with the earliest project
deployment block for each chain.

Keep `INDEXER_BLOCK_RANGE=10` for limited RPC providers. Increase
`INDEXER_WORKER_BLOCK_SPAN` only after RPC usage is stable.

## Submit Flow

1. Submit Block Tapal Batas and reward amount from Admin Reward Round Controls.
2. The API creates rows in:
   - `indexer_sync_jobs`
   - `indexer_sync_job_targets`
   - `reward_boundary_snapshots`
3. GitHub Actions runs `npm run indexer:boundary-worker` every 15 minutes.
4. Each run processes the next eligible target or block span.
5. If RPC rate limits or provider limits are hit, the worker pauses the target
   and sets `next_attempt_at`.
6. Later runs resume after `next_attempt_at`.
7. When all targets are `success`, the job and boundary snapshots become
   `success`.

After the calculated reward round exists in Supabase with a Merkle root, the
admin can create and fund the round on-chain from the frontend. RewardDistributor
event sync is reconciliation; it is not an input to reward allocation or Merkle
generation.
