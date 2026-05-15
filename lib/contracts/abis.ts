import { parseAbi } from "viem";

const erc721SharedAbiFragments = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function balanceOf(address owner) view returns (uint256)",
  "function totalMinted() view returns (uint256)",
  "function remainingSupply() view returns (uint256)",
  "function maxSupply() view returns (uint256)",
  "function maxMintPerTx() view returns (uint256)",
  "function mintPrice() view returns (uint256)",
  "function revealed() view returns (bool)",
  "function metadataLocked() view returns (bool)",
  "function tokenURI(uint256 tokenId) view returns (string)",
] as const;

export const erc20Abi = parseAbi([
  "function balanceOf(address account) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
]);

export const erc721SharedAbi = parseAbi(erc721SharedAbiFragments);

export const rotyAbi = parseAbi([
  ...erc721SharedAbiFragments,
  "function whitelistMintEnabled() view returns (bool)",
  "function publicMintEnabled() view returns (bool)",
  "function whitelistClaimed(address account) view returns (bool)",
  "function merkleRoot() view returns (bytes32)",
  "function whitelistMint(bytes32[] proof)",
  "function publicMint(uint256 quantity) payable",
  "function publicMintCost(uint256 quantity) view returns (uint256)",
] as const);

export const gatedMintAbi = parseAbi([
  ...erc721SharedAbiFragments,
  "function gatedMintEnabled() view returns (bool)",
  "function stakingContract() view returns (address)",
  "function rotyCollection() view returns (address)",
  "function meltingCollection() view returns (address)",
  "function mint(uint256 quantity) payable",
] as const);

export const stakingAbi = parseAbi([
  "function approvedCollection(address collection) view returns (bool)",
  "function hasValidStake(address user, address collection) view returns (bool)",
  "function hasValidStakeInCollections(address user, address[] collections) view returns (bool)",
  "function isStakeActive(address user, address collection, uint256 tokenId) view returns (bool)",
  "function isStakeValid(address user, address collection, uint256 tokenId) view returns (bool)",
  "function getUserStakedTokenIds(address user, address collection) view returns (uint256[])",
  "function stake(address collection, uint256 tokenId)",
  "function unstake(address collection, uint256 tokenId)",
]);

export const rewardDistributorAbi = parseAbi([
  "function rewardToken() view returns (address)",
  "function hasClaimed(uint256 roundId, address account) view returns (bool)",
  "function isRoundFunded(uint256 roundId) view returns (bool)",
  "function claimable(uint256 roundId, address account, uint256 amount, bytes32[] proof) view returns (bool)",
  "function claim(uint256 roundId, uint256 amount, bytes32[] proof)",
  "function totalRewardFunded() view returns (uint256)",
  "function totalRewardClaimed() view returns (uint256)",
  "function allocatedUnclaimedRewardBalance() view returns (uint256)",
  "function excessRewardTokenBalance() view returns (uint256)",
]);
