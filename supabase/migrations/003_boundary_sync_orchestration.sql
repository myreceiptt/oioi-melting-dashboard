begin;

create table if not exists public.indexer_sync_jobs (
  id uuid primary key default gen_random_uuid(),
  job_kind text not null,
  status text not null default 'queued',
  reward_amount_wei text,
  requested_by text,
  started_at timestamptz,
  finished_at timestamptz,
  error_message text,
  request_payload jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint indexer_sync_jobs_job_kind_check check (
    job_kind in ('reward_boundary_sync')
  ),
  constraint indexer_sync_jobs_status_check check (
    status in ('queued', 'running', 'paused', 'success', 'failed', 'cancelled')
  ),
  constraint indexer_sync_jobs_reward_amount_wei_check check (
    reward_amount_wei is null or reward_amount_wei ~ '^[0-9]+$'
  )
);

create index if not exists indexer_sync_jobs_status_created_idx
  on public.indexer_sync_jobs(status, created_at asc);

create index if not exists indexer_sync_jobs_kind_status_idx
  on public.indexer_sync_jobs(job_kind, status, created_at desc);

create unique index if not exists indexer_sync_jobs_one_active_boundary_job_idx
  on public.indexer_sync_jobs(job_kind)
  where job_kind = 'reward_boundary_sync'
    and status in ('queued', 'running', 'paused');

drop trigger if exists indexer_sync_jobs_set_updated_at on public.indexer_sync_jobs;

create trigger indexer_sync_jobs_set_updated_at
before update on public.indexer_sync_jobs
for each row execute function public.set_updated_at();

create table if not exists public.indexer_sync_job_targets (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.indexer_sync_jobs(id) on delete cascade,
  chain_key text not null references public.chains(chain_key) on delete cascade,
  task_key text not null,
  status text not null default 'queued',
  from_block bigint,
  target_block bigint,
  last_processed_block bigint,
  block_range_size integer,
  attempts integer not null default 0,
  next_attempt_at timestamptz,
  started_at timestamptz,
  finished_at timestamptz,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint indexer_sync_job_targets_task_key_check check (
    task_key in (
      'roty',
      'melting',
      'amanda',
      'staking',
      'rewardDistributor',
      'rebuildOwnership',
      'rebuildStakePositions',
      'calculateValidIntervals',
      'calculateRewards',
      'generateMerkle'
    )
  ),
  constraint indexer_sync_job_targets_status_check check (
    status in ('queued', 'running', 'paused', 'success', 'failed', 'cancelled', 'skipped')
  ),
  constraint indexer_sync_job_targets_block_order_check check (
    from_block is null
    or target_block is null
    or target_block >= from_block
  ),
  constraint indexer_sync_job_targets_processed_block_check check (
    last_processed_block is null
    or from_block is null
    or last_processed_block >= from_block - 1
  ),
  constraint indexer_sync_job_targets_block_range_check check (
    block_range_size is null or block_range_size > 0
  ),
  constraint indexer_sync_job_targets_attempts_check check (attempts >= 0),
  unique (job_id, chain_key, task_key)
);

create index if not exists indexer_sync_job_targets_job_status_idx
  on public.indexer_sync_job_targets(job_id, status, task_key);

create index if not exists indexer_sync_job_targets_chain_task_idx
  on public.indexer_sync_job_targets(chain_key, task_key, status);

create index if not exists indexer_sync_job_targets_retry_idx
  on public.indexer_sync_job_targets(status, next_attempt_at)
  where status in ('queued', 'paused', 'failed');

drop trigger if exists indexer_sync_job_targets_set_updated_at on public.indexer_sync_job_targets;

create trigger indexer_sync_job_targets_set_updated_at
before update on public.indexer_sync_job_targets
for each row execute function public.set_updated_at();

create table if not exists public.reward_boundary_snapshots (
  id uuid primary key default gen_random_uuid(),
  sync_job_id uuid not null references public.indexer_sync_jobs(id) on delete restrict,
  chain_key text not null references public.chains(chain_key) on delete cascade,
  status text not null default 'pending',
  from_block bigint not null,
  to_block bigint not null,
  from_block_timestamp timestamptz,
  to_block_timestamp timestamptz,
  reward_amount_wei text,
  completed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reward_boundary_snapshots_status_check check (
    status in ('pending', 'running', 'success', 'failed', 'cancelled')
  ),
  constraint reward_boundary_snapshots_block_order_check check (to_block >= from_block),
  constraint reward_boundary_snapshots_reward_amount_wei_check check (
    reward_amount_wei is null or reward_amount_wei ~ '^[0-9]+$'
  ),
  unique (sync_job_id, chain_key)
);

create index if not exists reward_boundary_snapshots_chain_block_idx
  on public.reward_boundary_snapshots(chain_key, to_block desc);

create index if not exists reward_boundary_snapshots_status_idx
  on public.reward_boundary_snapshots(status, created_at desc);

drop trigger if exists reward_boundary_snapshots_set_updated_at on public.reward_boundary_snapshots;

create trigger reward_boundary_snapshots_set_updated_at
before update on public.reward_boundary_snapshots
for each row execute function public.set_updated_at();

create table if not exists public.indexer_locks (
  lock_key text primary key,
  holder_id text not null,
  chain_key text references public.chains(chain_key) on delete cascade,
  task_key text,
  acquired_at timestamptz not null default now(),
  expires_at timestamptz not null,
  metadata jsonb not null default '{}'::jsonb,
  constraint indexer_locks_expiry_check check (expires_at > acquired_at)
);

create index if not exists indexer_locks_expires_idx
  on public.indexer_locks(expires_at);

alter table public.reward_calculations
  add column if not exists boundary_snapshot_id uuid references public.reward_boundary_snapshots(id) on delete set null,
  add column if not exists boundary_from_block bigint,
  add column if not exists boundary_to_block bigint,
  add column if not exists boundary_from_block_timestamp timestamptz,
  add column if not exists boundary_to_block_timestamp timestamptz;

create index if not exists reward_calculations_boundary_snapshot_idx
  on public.reward_calculations(boundary_snapshot_id);

alter table public.reward_rounds
  add column if not exists boundary_snapshot_id uuid references public.reward_boundary_snapshots(id) on delete set null,
  add column if not exists boundary_from_block bigint,
  add column if not exists boundary_to_block bigint,
  add column if not exists boundary_from_block_timestamp timestamptz,
  add column if not exists boundary_to_block_timestamp timestamptz;

create index if not exists reward_rounds_boundary_snapshot_idx
  on public.reward_rounds(boundary_snapshot_id);

commit;
