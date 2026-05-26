begin;

create table if not exists public.dashboard_wallet_sync_runs (
  id uuid primary key default gen_random_uuid(),
  chain_key text not null references public.chains(chain_key) on delete cascade,
  wallet_address text not null,
  status text not null default 'running',
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint dashboard_wallet_sync_runs_wallet_check check (wallet_address ~ '^0x[0-9a-fA-F]{40}$'),
  constraint dashboard_wallet_sync_runs_status_check check (status in ('running', 'success', 'failed'))
);

create index if not exists dashboard_wallet_sync_runs_wallet_idx
  on public.dashboard_wallet_sync_runs(chain_key, wallet_address, started_at desc);

drop trigger if exists dashboard_wallet_sync_runs_set_updated_at on public.dashboard_wallet_sync_runs;

create trigger dashboard_wallet_sync_runs_set_updated_at
before update on public.dashboard_wallet_sync_runs
for each row execute function public.set_updated_at();

create table if not exists public.dashboard_wallet_nft_cache (
  chain_key text not null references public.chains(chain_key) on delete cascade,
  wallet_address text not null,
  collection_key text not null,
  collection_address text not null,
  token_id numeric(78,0) not null,
  owner_address text,
  wallet_owns_token boolean not null default false,
  collection_approved boolean,
  stake_exists boolean not null default false,
  stake_active boolean not null default false,
  stake_valid boolean not null default false,
  can_stake boolean not null default false,
  can_unstake boolean not null default false,
  staked_at_unix numeric(78,0),
  unstaked_at_unix numeric(78,0),
  token_uri text,
  metadata_uri text,
  name text,
  description text,
  image_url text,
  animation_url text,
  media_type text not null default 'unknown',
  thumbnail_url text,
  raw_metadata jsonb,
  source jsonb not null default '{}'::jsonb,
  last_fetched_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (chain_key, wallet_address, collection_key, token_id),
  constraint dashboard_wallet_nft_cache_wallet_check check (wallet_address ~ '^0x[0-9a-fA-F]{40}$'),
  constraint dashboard_wallet_nft_cache_collection_key_check check (collection_key in ('roty', 'melting', 'amanda')),
  constraint dashboard_wallet_nft_cache_collection_address_check check (collection_address ~ '^0x[0-9a-fA-F]{40}$'),
  constraint dashboard_wallet_nft_cache_owner_check check (owner_address is null or owner_address ~ '^0x[0-9a-fA-F]{40}$'),
  constraint dashboard_wallet_nft_cache_media_type_check check (media_type in ('image', 'video', 'audio', 'html', 'unknown'))
);

create index if not exists dashboard_wallet_nft_cache_wallet_idx
  on public.dashboard_wallet_nft_cache(chain_key, wallet_address, collection_key);

create index if not exists dashboard_wallet_nft_cache_stake_idx
  on public.dashboard_wallet_nft_cache(chain_key, wallet_address, stake_active, stake_valid);

create index if not exists dashboard_wallet_nft_cache_fetched_idx
  on public.dashboard_wallet_nft_cache(chain_key, wallet_address, last_fetched_at desc);

drop trigger if exists dashboard_wallet_nft_cache_set_updated_at on public.dashboard_wallet_nft_cache;

create trigger dashboard_wallet_nft_cache_set_updated_at
before update on public.dashboard_wallet_nft_cache
for each row execute function public.set_updated_at();

commit;
