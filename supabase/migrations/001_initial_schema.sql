-- OiOi Melting Dashboard / TheRotyMemorial
-- Supabase Project + Schema v1
-- Purpose: DB foundation for testnet indexer, staking duration, reward calculation, Merkle proofs, and claim state.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.chains (
  chain_key text primary key,
  chain_id integer not null unique,
  label text not null,
  native_symbol text not null default 'ETH',
  explorer_url text not null,
  is_testnet boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chains_chain_key_check check (chain_key in ('baseSepolia', 'ethereumSepolia', 'baseMainnet', 'ethereumMainnet'))
);

create trigger chains_set_updated_at
before update on public.chains
for each row execute function public.set_updated_at();

create table if not exists public.contracts (
  id uuid primary key default gen_random_uuid(),
  chain_key text not null references public.chains(chain_key) on delete cascade,
  contract_key text not null,
  contract_kind text not null,
  address text not null,
  deployment_block bigint,
  indexer_from_block bigint,
  label text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contracts_contract_key_check check (contract_key in ('roty', 'melting', 'amanda', 'staking', 'rewardDistributor', 'oioi')),
  constraint contracts_contract_kind_check check (contract_kind in ('erc721', 'staking', 'reward_distributor', 'erc20')),
  constraint contracts_address_check check (address ~ '^0x[0-9a-fA-F]{40}$'),
  unique (chain_key, contract_key),
  unique (chain_key, address)
);

create index if not exists contracts_chain_kind_idx on public.contracts(chain_key, contract_kind);

create trigger contracts_set_updated_at
before update on public.contracts
for each row execute function public.set_updated_at();

create table if not exists public.indexer_runs (
  id uuid primary key default gen_random_uuid(),
  chain_key text not null references public.chains(chain_key) on delete cascade,
  run_kind text not null,
  status text not null default 'running',
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  constraint indexer_runs_run_kind_check check (run_kind in ('sync', 'rebuild', 'reward_calculation', 'proof_generation')),
  constraint indexer_runs_status_check check (status in ('running', 'success', 'failed'))
);

create index if not exists indexer_runs_chain_started_idx on public.indexer_runs(chain_key, started_at desc);

create table if not exists public.indexer_checkpoints (
  chain_key text not null references public.chains(chain_key) on delete cascade,
  source_key text not null,
  contract_key text not null,
  contract_address text not null,
  from_block bigint not null,
  last_synced_block bigint,
  latest_safe_block bigint,
  block_range_size integer,
  status text not null default 'idle',
  updated_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  primary key (chain_key, source_key),
  constraint indexer_checkpoints_contract_address_check check (contract_address ~ '^0x[0-9a-fA-F]{40}$'),
  constraint indexer_checkpoints_status_check check (status in ('idle', 'syncing', 'success', 'failed', 'paused'))
);

create trigger indexer_checkpoints_set_updated_at
before update on public.indexer_checkpoints
for each row execute function public.set_updated_at();

create table if not exists public.block_timestamps (
  chain_key text not null references public.chains(chain_key) on delete cascade,
  block_number bigint not null,
  block_hash text,
  block_timestamp timestamptz not null,
  created_at timestamptz not null default now(),
  primary key (chain_key, block_number),
  constraint block_timestamps_hash_check check (block_hash is null or block_hash ~ '^0x[0-9a-fA-F]{64}$')
);

create table if not exists public.nft_transfer_events (
  event_key text primary key,
  chain_key text not null references public.chains(chain_key) on delete cascade,
  chain_id integer not null,
  collection_key text not null,
  collection_address text not null,
  token_id numeric(78,0) not null,
  from_address text not null,
  to_address text not null,
  tx_hash text not null,
  log_index integer not null,
  block_number bigint not null,
  block_timestamp timestamptz not null,
  created_at timestamptz not null default now(),
  constraint nft_transfer_collection_key_check check (collection_key in ('roty', 'melting', 'amanda')),
  constraint nft_transfer_collection_address_check check (collection_address ~ '^0x[0-9a-fA-F]{40}$'),
  constraint nft_transfer_from_check check (from_address ~ '^0x[0-9a-fA-F]{40}$'),
  constraint nft_transfer_to_check check (to_address ~ '^0x[0-9a-fA-F]{40}$'),
  constraint nft_transfer_tx_hash_check check (tx_hash ~ '^0x[0-9a-fA-F]{64}$'),
  unique (chain_key, tx_hash, log_index)
);

create index if not exists nft_transfer_token_idx on public.nft_transfer_events(chain_key, collection_key, token_id, block_number, log_index);
create index if not exists nft_transfer_owner_idx on public.nft_transfer_events(chain_key, to_address, block_number desc);
create index if not exists nft_transfer_block_idx on public.nft_transfer_events(chain_key, block_number, log_index);

create table if not exists public.collection_approval_events (
  event_key text primary key,
  chain_key text not null references public.chains(chain_key) on delete cascade,
  chain_id integer not null,
  staking_contract_address text not null,
  collection_key text,
  collection_address text not null,
  approved boolean not null,
  tx_hash text not null,
  log_index integer not null,
  block_number bigint not null,
  block_timestamp timestamptz not null,
  created_at timestamptz not null default now(),
  constraint collection_approval_staking_address_check check (staking_contract_address ~ '^0x[0-9a-fA-F]{40}$'),
  constraint collection_approval_collection_address_check check (collection_address ~ '^0x[0-9a-fA-F]{40}$'),
  constraint collection_approval_tx_hash_check check (tx_hash ~ '^0x[0-9a-fA-F]{64}$'),
  unique (chain_key, tx_hash, log_index)
);

create table if not exists public.staking_events (
  event_key text primary key,
  chain_key text not null references public.chains(chain_key) on delete cascade,
  chain_id integer not null,
  event_type text not null,
  staking_contract_address text not null,
  staker_address text not null,
  collection_key text not null,
  collection_address text not null,
  token_id numeric(78,0) not null,
  staking_timestamp_unix numeric(78,0) not null,
  tx_hash text not null,
  log_index integer not null,
  block_number bigint not null,
  block_timestamp timestamptz not null,
  created_at timestamptz not null default now(),
  constraint staking_events_event_type_check check (event_type in ('staked', 'unstaked')),
  constraint staking_events_collection_key_check check (collection_key in ('roty', 'melting', 'amanda')),
  constraint staking_events_staking_address_check check (staking_contract_address ~ '^0x[0-9a-fA-F]{40}$'),
  constraint staking_events_staker_check check (staker_address ~ '^0x[0-9a-fA-F]{40}$'),
  constraint staking_events_collection_address_check check (collection_address ~ '^0x[0-9a-fA-F]{40}$'),
  constraint staking_events_tx_hash_check check (tx_hash ~ '^0x[0-9a-fA-F]{64}$'),
  unique (chain_key, tx_hash, log_index)
);

create index if not exists staking_events_position_idx on public.staking_events(chain_key, staker_address, collection_key, token_id, block_number, log_index);
create index if not exists staking_events_block_idx on public.staking_events(chain_key, block_number, log_index);

create table if not exists public.reward_round_events (
  event_key text primary key,
  chain_key text not null references public.chains(chain_key) on delete cascade,
  chain_id integer not null,
  event_type text not null,
  reward_distributor_address text not null,
  round_id numeric(78,0),
  account_address text,
  funder_address text,
  amount_wei numeric(78,0),
  funded_amount_wei numeric(78,0),
  period_start_unix numeric(78,0),
  period_end_unix numeric(78,0),
  old_merkle_root text,
  new_merkle_root text,
  merkle_root text,
  claim_paused boolean,
  tx_hash text not null,
  log_index integer not null,
  block_number bigint not null,
  block_timestamp timestamptz not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint reward_round_event_type_check check (event_type in ('reward_round_created', 'reward_round_funded', 'merkle_root_updated', 'claim_paused_updated', 'claimed', 'eth_rescued', 'erc20_rescued')),
  constraint reward_round_distributor_address_check check (reward_distributor_address ~ '^0x[0-9a-fA-F]{40}$'),
  constraint reward_round_account_check check (account_address is null or account_address ~ '^0x[0-9a-fA-F]{40}$'),
  constraint reward_round_funder_check check (funder_address is null or funder_address ~ '^0x[0-9a-fA-F]{40}$'),
  constraint reward_round_tx_hash_check check (tx_hash ~ '^0x[0-9a-fA-F]{64}$'),
  constraint reward_round_old_root_check check (old_merkle_root is null or old_merkle_root ~ '^0x[0-9a-fA-F]{64}$'),
  constraint reward_round_new_root_check check (new_merkle_root is null or new_merkle_root ~ '^0x[0-9a-fA-F]{64}$'),
  constraint reward_round_root_check check (merkle_root is null or merkle_root ~ '^0x[0-9a-fA-F]{64}$'),
  unique (chain_key, tx_hash, log_index)
);

create index if not exists reward_round_events_round_idx on public.reward_round_events(chain_key, round_id, block_number, log_index);
create index if not exists reward_round_events_block_idx on public.reward_round_events(chain_key, block_number, log_index);

create table if not exists public.current_nft_owners (
  chain_key text not null references public.chains(chain_key) on delete cascade,
  collection_key text not null,
  collection_address text not null,
  token_id numeric(78,0) not null,
  owner_address text not null,
  last_transfer_tx_hash text not null,
  last_transfer_block_number bigint not null,
  last_transfer_log_index integer not null,
  last_transfer_block_timestamp timestamptz not null,
  updated_at timestamptz not null default now(),
  primary key (chain_key, collection_key, token_id),
  constraint current_nft_owners_collection_key_check check (collection_key in ('roty', 'melting', 'amanda')),
  constraint current_nft_owners_collection_address_check check (collection_address ~ '^0x[0-9a-fA-F]{40}$'),
  constraint current_nft_owners_owner_check check (owner_address ~ '^0x[0-9a-fA-F]{40}$'),
  constraint current_nft_owners_tx_hash_check check (last_transfer_tx_hash ~ '^0x[0-9a-fA-F]{64}$')
);

create index if not exists current_nft_owners_owner_idx on public.current_nft_owners(chain_key, owner_address, collection_key);

create trigger current_nft_owners_set_updated_at
before update on public.current_nft_owners
for each row execute function public.set_updated_at();

create table if not exists public.current_stake_positions (
  chain_key text not null references public.chains(chain_key) on delete cascade,
  staker_address text not null,
  collection_key text not null,
  collection_address text not null,
  token_id numeric(78,0) not null,
  active boolean not null default false,
  currently_owned boolean not null default false,
  valid boolean not null default false,
  staked_at timestamptz,
  unstaked_at timestamptz,
  staked_at_unix numeric(78,0),
  unstaked_at_unix numeric(78,0),
  last_event_tx_hash text not null,
  last_event_block_number bigint not null,
  last_event_log_index integer not null,
  last_event_block_timestamp timestamptz not null,
  updated_at timestamptz not null default now(),
  primary key (chain_key, staker_address, collection_key, token_id),
  constraint current_stake_staker_check check (staker_address ~ '^0x[0-9a-fA-F]{40}$'),
  constraint current_stake_collection_key_check check (collection_key in ('roty', 'melting', 'amanda')),
  constraint current_stake_collection_address_check check (collection_address ~ '^0x[0-9a-fA-F]{40}$'),
  constraint current_stake_tx_hash_check check (last_event_tx_hash ~ '^0x[0-9a-fA-F]{64}$')
);

create index if not exists current_stake_positions_valid_idx on public.current_stake_positions(chain_key, valid, collection_key);
create index if not exists current_stake_positions_user_idx on public.current_stake_positions(chain_key, staker_address);

create trigger current_stake_positions_set_updated_at
before update on public.current_stake_positions
for each row execute function public.set_updated_at();

create table if not exists public.valid_stake_intervals (
  id uuid primary key default gen_random_uuid(),
  chain_key text not null references public.chains(chain_key) on delete cascade,
  staker_address text not null,
  collection_key text not null,
  collection_address text not null,
  token_id numeric(78,0) not null,
  interval_start timestamptz not null,
  interval_end timestamptz not null,
  interval_start_unix numeric(78,0) not null,
  interval_end_unix numeric(78,0) not null,
  duration_seconds bigint not null,
  valid boolean not null default true,
  invalid_reason text,
  source jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint valid_stake_interval_positive_check check (interval_end > interval_start),
  constraint valid_stake_duration_nonnegative_check check (duration_seconds >= 0),
  constraint valid_stake_staker_check check (staker_address ~ '^0x[0-9a-fA-F]{40}$'),
  constraint valid_stake_collection_key_check check (collection_key in ('roty', 'melting', 'amanda')),
  constraint valid_stake_collection_address_check check (collection_address ~ '^0x[0-9a-fA-F]{40}$')
);

create index if not exists valid_stake_intervals_period_idx on public.valid_stake_intervals(chain_key, interval_start, interval_end);
create index if not exists valid_stake_intervals_user_idx on public.valid_stake_intervals(chain_key, staker_address, collection_key);

create table if not exists public.reward_calculations (
  id uuid primary key default gen_random_uuid(),
  chain_key text not null references public.chains(chain_key) on delete cascade,
  period_start timestamptz not null,
  period_end timestamptz not null,
  period_start_unix numeric(78,0) not null,
  period_end_unix numeric(78,0) not null,
  total_reward_amount_wei numeric(78,0) not null,
  total_valid_duration_seconds bigint not null default 0,
  collection_weights jsonb not null,
  status text not null default 'draft',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reward_calculations_period_check check (period_end > period_start),
  constraint reward_calculations_status_check check (status in ('draft', 'reviewed', 'finalized', 'discarded'))
);

create index if not exists reward_calculations_chain_period_idx on public.reward_calculations(chain_key, period_start, period_end);

create trigger reward_calculations_set_updated_at
before update on public.reward_calculations
for each row execute function public.set_updated_at();

create table if not exists public.reward_rounds (
  chain_key text not null references public.chains(chain_key) on delete cascade,
  round_id numeric(78,0) not null,
  status text not null default 'planned',
  period_start timestamptz not null,
  period_end timestamptz not null,
  period_start_unix numeric(78,0) not null,
  period_end_unix numeric(78,0) not null,
  reward_amount_wei numeric(78,0) not null,
  funded_amount_wei numeric(78,0) not null default 0,
  claimed_amount_wei numeric(78,0) not null default 0,
  merkle_root text,
  claim_paused boolean not null default false,
  calculation_id uuid references public.reward_calculations(id) on delete set null,
  created_tx_hash text,
  funded_tx_hash text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (chain_key, round_id),
  constraint reward_rounds_status_check check (status in ('planned', 'calculated', 'created', 'funded', 'claim_paused', 'closed', 'discarded')),
  constraint reward_rounds_period_check check (period_end > period_start),
  constraint reward_rounds_merkle_root_check check (merkle_root is null or merkle_root ~ '^0x[0-9a-fA-F]{64}$'),
  constraint reward_rounds_created_tx_check check (created_tx_hash is null or created_tx_hash ~ '^0x[0-9a-fA-F]{64}$'),
  constraint reward_rounds_funded_tx_check check (funded_tx_hash is null or funded_tx_hash ~ '^0x[0-9a-fA-F]{64}$')
);

create index if not exists reward_rounds_status_idx on public.reward_rounds(chain_key, status, period_end desc);

create trigger reward_rounds_set_updated_at
before update on public.reward_rounds
for each row execute function public.set_updated_at();

create table if not exists public.reward_allocations (
  chain_key text not null references public.chains(chain_key) on delete cascade,
  round_id numeric(78,0) not null,
  account_address text not null,
  amount_wei numeric(78,0) not null,
  proof jsonb not null default '[]'::jsonb,
  raw_score numeric,
  duration_seconds bigint not null default 0,
  collection_breakdown jsonb not null default '{}'::jsonb,
  claimed boolean not null default false,
  claim_tx_hash text,
  claimed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (chain_key, round_id, account_address),
  foreign key (chain_key, round_id) references public.reward_rounds(chain_key, round_id) on delete cascade,
  constraint reward_allocations_account_check check (account_address ~ '^0x[0-9a-fA-F]{40}$'),
  constraint reward_allocations_amount_check check (amount_wei >= 0),
  constraint reward_allocations_claim_tx_check check (claim_tx_hash is null or claim_tx_hash ~ '^0x[0-9a-fA-F]{64}$')
);

create index if not exists reward_allocations_account_idx on public.reward_allocations(chain_key, account_address, round_id desc);
create index if not exists reward_allocations_claimed_idx on public.reward_allocations(chain_key, round_id, claimed);

create trigger reward_allocations_set_updated_at
before update on public.reward_allocations
for each row execute function public.set_updated_at();

create table if not exists public.reward_claims (
  event_key text primary key,
  chain_key text not null references public.chains(chain_key) on delete cascade,
  round_id numeric(78,0) not null,
  account_address text not null,
  amount_wei numeric(78,0) not null,
  tx_hash text not null,
  log_index integer not null,
  block_number bigint not null,
  block_timestamp timestamptz not null,
  created_at timestamptz not null default now(),
  foreign key (chain_key, round_id) references public.reward_rounds(chain_key, round_id) on delete cascade,
  constraint reward_claims_account_check check (account_address ~ '^0x[0-9a-fA-F]{40}$'),
  constraint reward_claims_tx_hash_check check (tx_hash ~ '^0x[0-9a-fA-F]{64}$'),
  unique (chain_key, tx_hash, log_index)
);

create index if not exists reward_claims_account_idx on public.reward_claims(chain_key, account_address, round_id desc);

-- Seed testnet chains and currently deployed rehearsal contracts.
insert into public.chains (chain_key, chain_id, label, native_symbol, explorer_url, is_testnet)
values
  ('baseSepolia', 84532, 'Base Sepolia', 'ETH', 'https://sepolia.basescan.org', true),
  ('ethereumSepolia', 11155111, 'Ethereum Sepolia', 'ETH', 'https://sepolia.etherscan.io', true)
on conflict (chain_key) do update set
  chain_id = excluded.chain_id,
  label = excluded.label,
  native_symbol = excluded.native_symbol,
  explorer_url = excluded.explorer_url,
  is_testnet = excluded.is_testnet;

insert into public.contracts (chain_key, contract_key, contract_kind, address, label)
values
  ('baseSepolia', 'roty', 'erc721', lower('0x6ce0b10b2c98c1f397c45c695d504a7271677984'), 'The ROTY BASE'),
  ('baseSepolia', 'melting', 'erc721', lower('0x824d8e5028cca6437b01ae3a764105a61d5555e8'), 'Melting BASE'),
  ('baseSepolia', 'amanda', 'erc721', lower('0xdf14908ae4f1d4c7d9a2b4cc094983301c1107fc'), 'Amanda BASE'),
  ('baseSepolia', 'staking', 'staking', lower('0x72939f96cb030235b691ea7716e213c06ae87494'), 'OiOiSoftStaking Base Sepolia'),
  ('baseSepolia', 'rewardDistributor', 'reward_distributor', lower('0x168b41b4a2f59be51917f1c0517b05f7b43f5b44'), 'OiOiRewardDistributor Base Sepolia'),
  ('baseSepolia', 'oioi', 'erc20', lower('0xcB2208E9Fb77591D3A0688C4459d976b1f16Ab53'), '$OiOi Base Sepolia'),
  ('ethereumSepolia', 'roty', 'erc721', lower('0xb444f60600d5c83676d733ce159cc58ddf0a6c50'), 'The ROTY dETH'),
  ('ethereumSepolia', 'melting', 'erc721', lower('0xf43ef187150086ada6f53a15caf3bcdb05be2507'), 'MELTING dETH'),
  ('ethereumSepolia', 'amanda', 'erc721', lower('0x3ef198c94a43167c594f54d19775fdb4a44edcaa'), 'Amanda dETH'),
  ('ethereumSepolia', 'staking', 'staking', lower('0x09392894be59d4711be7920b6efc2acd463dd4e2'), 'OiOiSoftStaking Ethereum Sepolia'),
  ('ethereumSepolia', 'rewardDistributor', 'reward_distributor', lower('0x6bd6a392bf5bd88c28ba7b59816c29c995e9f39a'), 'OiOiRewardDistributor Ethereum Sepolia'),
  ('ethereumSepolia', 'oioi', 'erc20', lower('0x788Eb9930B9f4799f79Bc25a07238A77b8779e91'), '$OiOi Ethereum Sepolia')
on conflict (chain_key, contract_key) do update set
  contract_kind = excluded.contract_kind,
  address = excluded.address,
  label = excluded.label;
