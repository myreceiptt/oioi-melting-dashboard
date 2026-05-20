# Supabase Schema v1

This document describes the database foundation for the OiOi Melting Dashboard indexer and reward pipeline.

## Scope

This schema supports testnet Stage 18:

- DB-backed indexer checkpoints
- ERC721 Transfer event storage
- Soft staking event storage
- Reward distributor event storage
- Current ownership rebuild
- Current staking state rebuild
- Valid staking duration calculation
- Reward calculation
- Merkle allocation/proof storage
- Reward claim tracking

The schema does not change any deployed smart contract.

## Security model

For v1, write access should be server-side only.

Use:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Do not expose `SUPABASE_SERVICE_ROLE_KEY` in browser code.

The frontend reward claim flow should later read proof data through a Next.js API route, not direct unrestricted table access.

## Important tables

### `chains`

Stores chain metadata.

Current seeded chains:

- `baseSepolia`
- `ethereumSepolia`

### `contracts`

Stores deployed contract addresses per chain.

Seeded contract keys:

- `roty`
- `melting`
- `amanda`
- `staking`
- `rewardDistributor`
- `oioi`

`deployment_block` and `indexer_from_block` are nullable in v1 because deployment block numbers are recorded manually from explorers.

### `indexer_checkpoints`

Stores source-specific sync progress.

Recommended `source_key` values:

- `nft_transfers:roty`
- `nft_transfers:melting`
- `nft_transfers:amanda`
- `staking_events`
- `reward_events`

### `nft_transfer_events`

Stores ERC721 `Transfer` logs for ROTY, Melting, and Amanda collections.

### `staking_events`

Stores `Staked` and `Unstaked` events from `OiOiSoftStaking`.

### `collection_approval_events`

Stores `CollectionApprovalUpdated` events from `OiOiSoftStaking`.

### `reward_round_events`

Stores RewardDistributor events:

- `RewardRoundCreated`
- `RewardRoundFunded`
- `MerkleRootUpdated`
- `ClaimPausedUpdated`
- `Claimed`
- rescue events if needed

### `current_nft_owners`

Derived table rebuilt from `nft_transfer_events`.

### `current_stake_positions`

Derived table rebuilt from `staking_events` and current NFT ownership.

`valid = active && currently_owned`.

### `valid_stake_intervals`

Derived table for reward calculation. It stores valid holding/staking intervals for each staker, collection, and token.

### `reward_calculations`

Stores calculation runs before a reward round is created/funded on-chain.

### `reward_rounds`

Stores planned and synced reward round metadata.

Important convention:

```text
roundId = timestamp periodEnd
```

The smart contract does not auto-generate round IDs. The backend/Admin UI generates the round ID.

### `reward_allocations`

Stores Merkle allocation rows and proofs.

This table powers the later reward proof API and user claim UI.

### `reward_claims`

Stores synced `Claimed` events.

## Stage 18 sequence

1. Apply `supabase/migrations/001_initial_schema.sql`.
2. Add Supabase env variables.
3. Add Supabase server utility.
4. Move checkpoints from JSON to Supabase.
5. Sync Transfer events into `nft_transfer_events`.
6. Sync staking events into `staking_events`.
7. Sync reward events into `reward_round_events`.
8. Rebuild `current_nft_owners`.
9. Rebuild `current_stake_positions`.
10. Calculate valid staking intervals.
11. Calculate reward allocations.
12. Generate Merkle root/proofs.
13. Store allocation/proof rows in `reward_allocations`.
14. Serve proof through a Next.js API route.
15. Replace `RewardClaimPlaceholder` with live claim flow.
16. Connect `AdminRewardRoundControls` to Supabase round list.
