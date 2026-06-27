# Mainnet Supabase Setup Runbook v1

Status: PLAN / SAFE PREP ONLY
Mainnet Supabase setup: NOT APPLIED BY THIS DOCUMENT
Remote Supabase action: NOT PERFORMED
Testnet data copy: PROHIBITED
Worker execution: NOT APPROVED
Mainnet reward claim launch: NOT APPROVED

## Purpose

This runbook prepares the empty mainnet Supabase project so it can become the
clean production data plane for OiOi Melting Dashboard.

The mainnet Supabase project must have the same schema shape as the existing
Sepolia rehearsal data plane, but it must not keep Sepolia seed/config rows or
copy any Sepolia operational rows. Mainnet indexer, dashboard wallet NFT cache,
reward calculations, reward rounds, and Merkle proof data must be built from
mainnet contracts and mainnet events only.

## Safety Rules

- Do not copy testnet Supabase rows into mainnet Supabase.
- Do not keep Sepolia chain/contract seed rows in the mainnet Supabase project.
- Do not run workers until the schema and seed records are verified.
- Do not create reward rounds during schema setup.
- Do not run on-chain transactions during schema setup.
- Do not run `supabase db push` unless explicitly approved.
- Do not run `psql` against the remote mainnet database unless explicitly
  approved.
- Do not expose or paste service-role secrets in docs, terminal output, commit
  messages, GitHub issues, or screenshots.
- Keep mainnet reward claim disabled until the mainnet indexer/reward/proof
  production flow is separately validated and approved.

## Required Environment Variables

These values must exist locally or in the approved operator environment before
post-setup verification scripts are run. Do not print their values.

Server/Supabase:

```text
NEXT_PUBLIC_APP_ENV=mainnet
MAINNET_SUPABASE_URL
MAINNET_SUPABASE_SERVICE_ROLE_KEY
```

RPC/indexer:

```text
BASE_MAINNET_RPC_URL
ETHEREUM_MAINNET_RPC_URL
BASE_MAINNET_INDEXER_FROM_BLOCK
ETHEREUM_MAINNET_INDEXER_FROM_BLOCK
```

Public frontend contract addresses are sourced from the mainnet deployment
records and should already match the Vercel/mainnet env wiring plan before any
mainnet frontend QA begins.

## Migration Order

Apply the migrations in this exact order:

```text
001_initial_schema.sql
002_reward_amount_columns_as_text.sql
003_boundary_sync_orchestration.sql
004_dashboard_wallet_nft_cache.sql
005_dashboard_wallet_nft_media_html.sql
```

All five migrations are required for the current mainnet data plane:

- `001` creates the core indexer, ownership, staking, reward, allocation, and
  claim tables.
- `002` converts reward amount columns to text-safe wei fields.
- `003` adds boundary sync orchestration tables, locks, snapshots, and boundary
  metadata columns.
- `004` adds dashboard wallet NFT cache tables.
- `005` keeps dashboard NFT media type constraints compatible with HTML media.

## Migration Safety Notes

### `001_initial_schema.sql`

Creates:

- `pgcrypto` extension
- `public.set_updated_at()`
- `chains`
- `contracts`
- `indexer_runs`
- `indexer_checkpoints`
- `block_timestamps`
- `nft_transfer_events`
- `collection_approval_events`
- `staking_events`
- `reward_round_events`
- `current_nft_owners`
- `current_stake_positions`
- `valid_stake_intervals`
- `reward_calculations`
- `reward_rounds`
- `reward_allocations`
- `reward_claims`
- indexes and update triggers

It also upserts Sepolia rehearsal seed rows for:

- `baseSepolia`
- `ethereumSepolia`
- Sepolia contract records

Safety:

- Safe on an empty mainnet Supabase project.
- Does not require existing data.
- Contains Sepolia-specific static config seed rows for `chains` and
  `contracts`. These are not operational testnet history rows, but a clean
  mainnet Supabase project should remove them immediately after `001` is
  applied.
- Later migrations depend on the `chains` and `contracts` schema, but not on
  the specific `baseSepolia` or `ethereumSepolia` seed rows.
- Must be followed by explicit `baseMainnet` and `ethereumMainnet` seed/upsert
  statements before mainnet workers can run.
- Can be applied through Supabase SQL Editor.
- Can be applied through CLI/psql if explicitly approved.
- Mostly idempotent through `if not exists` and `on conflict`, but triggers in
  this migration are not all guarded with `drop trigger if exists`; treat it as
  a first-time migration for a clean project.

### `002_reward_amount_columns_as_text.sql`

Modifies:

- reward amount / score columns in `reward_round_events`
- reward amount columns in `reward_rounds`
- `total_reward_amount_wei` in `reward_calculations`
- `amount_wei` and `raw_score` in `reward_allocations`
- `amount_wei` in `reward_claims`
- text-safe numeric check constraints for those columns

Safety:

- Safe after `001`.
- Does not assume production data.
- Does not contain chain-specific or testnet-specific rows.
- Can be applied through Supabase SQL Editor.
- Can be applied through CLI/psql if explicitly approved.
- Designed to tolerate manual retry of the new text constraints, but type
  conversion is still best treated as a one-time migration after `001`.

### `003_boundary_sync_orchestration.sql`

Creates/adds:

- `indexer_sync_jobs`
- `indexer_sync_job_targets`
- `reward_boundary_snapshots`
- `indexer_locks`
- boundary snapshot/from/to block columns on `reward_calculations`
- boundary snapshot/from/to block columns on `reward_rounds`
- related indexes and update triggers

Safety:

- Safe after `001` and `002`.
- Requires `chains`, `reward_calculations`, and `reward_rounds` from `001`.
- Does not contain testnet-specific rows.
- Can be applied through Supabase SQL Editor.
- Can be applied through CLI/psql if explicitly approved.
- Mostly idempotent through `if not exists`, `drop trigger if exists`, and
  `add column if not exists`.

### `004_dashboard_wallet_nft_cache.sql`

Creates:

- `dashboard_wallet_sync_runs`
- `dashboard_wallet_nft_cache`
- indexes and update triggers

Safety:

- Safe after `001`.
- Requires `chains` and `public.set_updated_at()`.
- Does not contain testnet-specific rows.
- Can be applied through Supabase SQL Editor.
- Can be applied through CLI/psql if explicitly approved.
- Mostly idempotent through `if not exists` and `drop trigger if exists`.

### `005_dashboard_wallet_nft_media_html.sql`

Modifies:

- `dashboard_wallet_nft_cache_media_type_check`

Safety:

- Safe after `004`.
- Does not assume existing NFT cache rows.
- Does not contain testnet-specific rows.
- Can be applied through Supabase SQL Editor.
- Can be applied through CLI/psql if explicitly approved.
- Idempotent for repeated constraint replacement.

## Manual SQL Editor Path

Use this path only when explicitly performing setup:

1. Open the mainnet Supabase project.
2. Open SQL Editor.
3. Run `001_initial_schema.sql`.
4. Run the mainnet-only Sepolia static config cleanup SQL below.
5. Run `002_reward_amount_columns_as_text.sql`.
6. Run `003_boundary_sync_orchestration.sql`.
7. Run `004_dashboard_wallet_nft_cache.sql`.
8. Run `005_dashboard_wallet_nft_media_html.sql`.
9. Confirm each migration finishes successfully before running the next one.
10. Do not paste or execute any testnet data export.
11. After migrations complete, run the mainnet chain/contract seed SQL below.
12. Run verification queries.
13. Stop before any worker execution.

## CLI / psql Path

CLI/psql is supported only as an operator-controlled path and only after
explicit approval.

Do not run these commands during planning:

```text
supabase db push
psql "$MAINNET_POSTGRES_URL" -f ...
```

If CLI/psql is approved later, apply the same migration order and the same seed
SQL. Do not use a testnet database URL.

## Mainnet-only Sepolia Static Config Cleanup

Migration `001_initial_schema.sql` seeds static Sepolia config rows because it
was originally created for the Sepolia rehearsal data plane. For a clean
mainnet Supabase project, run this cleanup immediately after `001` succeeds and
before any worker, API refresh, or operational write can occur.

The cleanup targets only `baseSepolia` and `ethereumSepolia` in the mainnet
Supabase project. It deletes contract rows before chain rows. Do not run this
on the testnet Supabase project.

```sql
-- Mainnet cleanup after applying 001_initial_schema.sql.
-- Removes static Sepolia config rows only.
-- Do not run on testnet Supabase.
-- Run before any worker, API refresh, or operational write occurs.

delete from public.contracts
where chain_key in ('baseSepolia', 'ethereumSepolia');

delete from public.chains
where chain_key in ('baseSepolia', 'ethereumSepolia');
```

Stop instead of running this cleanup if any Sepolia operational rows already
exist in the mainnet Supabase project. That would mean the clean setup order was
not followed and the project needs a separate human review before continuing.

## Mainnet Seed Requirements

The mainnet Supabase project must contain `chains` and `contracts` rows for:

```text
baseMainnet
ethereumMainnet
```

These rows are required before the mainnet worker or DB foundation check can
operate safely. The worker verifies Supabase contract rows against committed
deployment records and refuses to continue on mismatch.

Source of truth:

- `deployments/base-mainnet/deployment.json`
- `deployments/ethereum-mainnet/deployment.json`

`from_block` values are not stored in deployment records. The indexer can read
start blocks from env vars:

```text
BASE_MAINNET_INDEXER_FROM_BLOCK
ETHEREUM_MAINNET_INDEXER_FROM_BLOCK
```

Alternatively, `contracts.deployment_block` or `contracts.indexer_from_block`
may be populated in Supabase later. If those DB fields are null, the worker
requires the env vars above.

## Mainnet Chain Seed SQL

Run only in the mainnet Supabase project after migrations complete:

```sql
insert into public.chains (chain_key, chain_id, label, native_symbol, explorer_url, is_testnet)
values
  ('baseMainnet', 8453, 'Base Mainnet', 'ETH', 'https://basescan.org', false),
  ('ethereumMainnet', 1, 'Ethereum Mainnet', 'ETH', 'https://etherscan.io', false)
on conflict (chain_key) do update set
  chain_id = excluded.chain_id,
  label = excluded.label,
  native_symbol = excluded.native_symbol,
  explorer_url = excluded.explorer_url,
  is_testnet = excluded.is_testnet;
```

## Mainnet Contract Seed SQL

Run only in the mainnet Supabase project after the chain seed succeeds:

```sql
insert into public.contracts (chain_key, contract_key, contract_kind, address, label)
values
  ('baseMainnet', 'roty', 'erc721', lower('0x55b74ec648ab9ec3e9557627b3b22cce27e2606c'), 'ROTY BASE'),
  ('baseMainnet', 'melting', 'erc721', lower('0xed1f55128e43699f7ee50ad7ae61bca7d559d991'), 'Melting BASE'),
  ('baseMainnet', 'amanda', 'erc721', lower('0x486a060e304d02aa241a6904fa7cb95777f88b77'), 'Amanda BASE'),
  ('baseMainnet', 'staking', 'staking', lower('0xd2211e042af0d618ec33622417064c761d5f71ea'), 'OiOiSoftStaking Base Mainnet'),
  ('baseMainnet', 'rewardDistributor', 'reward_distributor', lower('0xfa9fe257e99b50547981273d249c04ab7e06d380'), 'OiOiRewardDistributor Base Mainnet'),
  ('baseMainnet', 'oioi', 'erc20', lower('0xba0032620d88D9b16752CbDE75593c080C3d38de'), '$OiOi Base Mainnet'),
  ('ethereumMainnet', 'roty', 'erc721', lower('0xcb89275572ad3fb388d4c8ad78d7b94e05e5f218'), 'ROTY dETH'),
  ('ethereumMainnet', 'melting', 'erc721', lower('0xb2dcc1d826f88a287924480b0f7b73e50ecb0192'), 'Melting dETH'),
  ('ethereumMainnet', 'amanda', 'erc721', lower('0xbfcef50a61847b321c54722a870ec43f49791263'), 'Amanda dETH'),
  ('ethereumMainnet', 'staking', 'staking', lower('0xa0dc510eecabb579ab3744224132ee46c6a2ef6a'), 'OiOiSoftStaking Ethereum Mainnet'),
  ('ethereumMainnet', 'rewardDistributor', 'reward_distributor', lower('0x18d5e33c34d5da020c23ad3849ae28765da84fae'), 'OiOiRewardDistributor Ethereum Mainnet'),
  ('ethereumMainnet', 'oioi', 'erc20', lower('0x1C696882b93d7241d09D55f52693cAD367A5bEaf'), '$OiOi Ethereum Mainnet')
on conflict (chain_key, contract_key) do update set
  contract_kind = excluded.contract_kind,
  address = excluded.address,
  label = excluded.label;
```

## Verification Queries

Run only in the mainnet Supabase SQL Editor after seed SQL succeeds:

```sql
select chain_key, chain_id, label, native_symbol, explorer_url, is_testnet
from public.chains
where chain_key in ('baseSepolia', 'ethereumSepolia')
order by chain_key;
```

Expected:

- No rows. The mainnet data plane should not retain Sepolia static config rows.

```sql
select chain_key, contract_key, contract_kind, address, label
from public.contracts
where chain_key in ('baseSepolia', 'ethereumSepolia')
order by chain_key, contract_key;
```

Expected:

- No rows. The mainnet data plane should not retain Sepolia contract config
  rows.

```sql
select chain_key, chain_id, label, native_symbol, explorer_url, is_testnet
from public.chains
where chain_key in ('baseMainnet', 'ethereumMainnet')
order by chain_id;
```

Expected:

- `baseMainnet`, chain id `8453`, `is_testnet = false`
- `ethereumMainnet`, chain id `1`, `is_testnet = false`

```sql
select chain_key, contract_key, contract_kind, address, label
from public.contracts
where chain_key in ('baseMainnet', 'ethereumMainnet')
order by chain_key, contract_key;
```

Expected:

- 12 rows total.
- 6 rows for `baseMainnet`.
- 6 rows for `ethereumMainnet`.
- Addresses match the committed deployment records exactly after lowercasing.

```sql
select 'indexer_runs' as table_name, count(*) from public.indexer_runs
union all
select 'indexer_checkpoints', count(*) from public.indexer_checkpoints
union all
select 'nft_transfer_events', count(*) from public.nft_transfer_events
union all
select 'staking_events', count(*) from public.staking_events
union all
select 'reward_round_events', count(*) from public.reward_round_events
union all
select 'current_nft_owners', count(*) from public.current_nft_owners
union all
select 'current_stake_positions', count(*) from public.current_stake_positions
union all
select 'valid_stake_intervals', count(*) from public.valid_stake_intervals
union all
select 'reward_calculations', count(*) from public.reward_calculations
union all
select 'reward_rounds', count(*) from public.reward_rounds
union all
select 'reward_allocations', count(*) from public.reward_allocations
union all
select 'dashboard_wallet_sync_runs', count(*) from public.dashboard_wallet_sync_runs
union all
select 'dashboard_wallet_nft_cache', count(*) from public.dashboard_wallet_nft_cache
order by table_name;
```

Expected:

- Mainnet operational/event/cache tables are empty immediately after setup.
- `chains` and `contracts` are seeded.
- `chains` and `contracts` contain the required mainnet rows and no Sepolia
  rows.

## Optional Local Check After Manual Setup

After migrations and seed SQL are manually applied, this read-only check can be
used from a correctly configured local environment:

```bash
NEXT_PUBLIC_APP_ENV=mainnet npm run supabase:check
```

This command reads `chains` and counts `contracts`. It does not run a worker or
perform on-chain transactions.

Expected:

- It finds `baseMainnet` and `ethereumMainnet`.
- It can read the `contracts` table.

If it reports missing chains or contract mismatches, stop and fix the mainnet
Supabase seed rows before any worker rehearsal.

## API Smoke Checks After Schema Setup

After schema and seed records are verified, and only after mainnet frontend env
wiring is explicitly approved, use read-only smoke checks:

- Open the mainnet admin/dashboard read surfaces.
- Confirm no missing table/schema errors.
- Confirm reward claim remains disabled unless separately approved.
- Confirm wallet NFT cache either shows an empty state, refreshed mainnet NFTs,
  or a clear RPC/API error.

Do not treat an empty NFT list as a setup failure by itself. A clean mainnet
cache starts empty and is populated by API-triggered wallet refreshes.

## What Not To Run Yet

Do not run:

```bash
npm run indexer:boundary-worker
```

Do not dispatch:

```text
.github/workflows/mainnet-boundary-worker.yml
```

Do not submit a mainnet boundary block from the admin UI.
Do not create or fund a mainnet reward round.
Do not enable public mint or whitelist mint.
Do not call `lockMetadata()`.

## Stop Conditions

Stop immediately if:

- You are connected to the testnet Supabase project instead of mainnet.
- Any seed SQL targets `baseSepolia` or `ethereumSepolia` as operational
  mainnet data.
- Any migration or script tries to copy event/reward/cache rows from testnet.
- `baseMainnet` or `ethereumMainnet` chain rows are missing after seed.
- Any mainnet contract row mismatches the committed deployment records.
- `MAINNET_SUPABASE_URL` or `MAINNET_SUPABASE_SERVICE_ROLE_KEY` is missing.
- Worker execution is proposed before schema and seed verification.
- Reward claim launch is proposed before mainnet proof flow validation.

## Next Step After Setup

After manual schema setup and seed verification pass, the next step is a manual
one-batch mainnet worker rehearsal. It must be separately approved before
running.

The mainnet worker must remain manual-only at this stage. Do not add a schedule.
