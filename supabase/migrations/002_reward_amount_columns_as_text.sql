begin;

-- Drop old numeric CHECK constraints that reference wei/score columns.
-- They can break when columns are converted from numeric/bigint to text.
do $$
declare
  constraint_record record;
begin
  for constraint_record in
    select
      conrelid::regclass as table_name,
      conname as constraint_name
    from pg_constraint
    where contype = 'c'
      and connamespace = 'public'::regnamespace
      and conrelid in (
        'public.reward_round_events'::regclass,
        'public.reward_rounds'::regclass,
        'public.reward_calculations'::regclass,
        'public.reward_allocations'::regclass,
        'public.reward_claims'::regclass
      )
      and (
        pg_get_constraintdef(oid) ilike '%amount_wei%'
        or pg_get_constraintdef(oid) ilike '%funded_amount_wei%'
        or pg_get_constraintdef(oid) ilike '%claimed_amount_wei%'
        or pg_get_constraintdef(oid) ilike '%reward_amount_wei%'
        or pg_get_constraintdef(oid) ilike '%total_reward_amount_wei%'
        or pg_get_constraintdef(oid) ilike '%raw_score%'
      )
  loop
    execute format(
      'alter table %s drop constraint %I',
      constraint_record.table_name,
      constraint_record.constraint_name
    );
  end loop;
end $$;

-- Convert large wei / score values to text.
-- This avoids JavaScript unsafe integer precision problems for values like 1110000000000000000.
alter table public.reward_round_events
  alter column amount_wei type text using amount_wei::text,
  alter column funded_amount_wei type text using funded_amount_wei::text;

alter table public.reward_rounds
  alter column reward_amount_wei type text using reward_amount_wei::text,
  alter column funded_amount_wei type text using funded_amount_wei::text,
  alter column claimed_amount_wei type text using claimed_amount_wei::text;

alter table public.reward_calculations
  alter column total_reward_amount_wei type text using total_reward_amount_wei::text;

alter table public.reward_allocations
  alter column amount_wei type text using amount_wei::text,
  alter column raw_score type text using raw_score::text;

alter table public.reward_claims
  alter column amount_wei type text using amount_wei::text;

-- Drop v2 constraints if this migration is retried manually.
alter table public.reward_round_events
  drop constraint if exists reward_round_events_amount_wei_text_check,
  drop constraint if exists reward_round_events_funded_amount_wei_text_check;

alter table public.reward_rounds
  drop constraint if exists reward_rounds_reward_amount_wei_text_check,
  drop constraint if exists reward_rounds_funded_amount_wei_text_check,
  drop constraint if exists reward_rounds_claimed_amount_wei_text_check;

alter table public.reward_calculations
  drop constraint if exists reward_calculations_total_reward_amount_wei_text_check;

alter table public.reward_allocations
  drop constraint if exists reward_allocations_amount_wei_text_check,
  drop constraint if exists reward_allocations_raw_score_text_check;

alter table public.reward_claims
  drop constraint if exists reward_claims_amount_wei_text_check;

-- Re-add text-safe non-negative integer checks.
alter table public.reward_round_events
  add constraint reward_round_events_amount_wei_text_check
    check (amount_wei is null or amount_wei ~ '^[0-9]+$'),
  add constraint reward_round_events_funded_amount_wei_text_check
    check (funded_amount_wei is null or funded_amount_wei ~ '^[0-9]+$');

alter table public.reward_rounds
  add constraint reward_rounds_reward_amount_wei_text_check
    check (reward_amount_wei ~ '^[0-9]+$'),
  add constraint reward_rounds_funded_amount_wei_text_check
    check (funded_amount_wei ~ '^[0-9]+$'),
  add constraint reward_rounds_claimed_amount_wei_text_check
    check (claimed_amount_wei ~ '^[0-9]+$');

alter table public.reward_calculations
  add constraint reward_calculations_total_reward_amount_wei_text_check
    check (total_reward_amount_wei ~ '^[0-9]+$');

alter table public.reward_allocations
  add constraint reward_allocations_amount_wei_text_check
    check (amount_wei ~ '^[0-9]+$'),
  add constraint reward_allocations_raw_score_text_check
    check (raw_score is null or raw_score ~ '^[0-9]+$');

alter table public.reward_claims
  add constraint reward_claims_amount_wei_text_check
    check (amount_wei ~ '^[0-9]+$');

commit;
