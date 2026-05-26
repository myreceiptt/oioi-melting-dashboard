begin;

alter table public.dashboard_wallet_nft_cache
  drop constraint if exists dashboard_wallet_nft_cache_media_type_check;

alter table public.dashboard_wallet_nft_cache
  add constraint dashboard_wallet_nft_cache_media_type_check
  check (media_type in ('image', 'video', 'audio', 'html', 'unknown'));

commit;
