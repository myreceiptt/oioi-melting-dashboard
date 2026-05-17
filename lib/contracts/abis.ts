import { parseAbi } from "viem";

const ownable2StepAbiFragments = [
  "function owner() view returns (address)",
  "function pendingOwner() view returns (address)",
  "function transferOwnership(address newOwner)",
  "function acceptOwnership()",
  "function renounceOwnership()",
] as const;

const erc721SharedAbiFragments = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function balanceOf(address owner) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function totalMinted() view returns (uint256)",
  "function nextTokenId() view returns (uint256)",
  "function remainingSupply() view returns (uint256)",
  "function maxSupply() view returns (uint256)",
  "function maxMintPerTx() view returns (uint256)",
  "function mintPrice() view returns (uint256)",
  "function treasury() view returns (address)",
  "function revealed() view returns (bool)",
  "function metadataLocked() view returns (bool)",
  "function unrevealedURI() view returns (string)",
  "function revealedBaseURI() view returns (string)",
  "function baseExtension() view returns (string)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function exists(uint256 tokenId) view returns (bool)",
  "function publicMintCost(uint256 quantity) view returns (uint256)",
  "function royaltyInfo(uint256 tokenId, uint256 salePrice) view returns (address receiver, uint256 royaltyAmount)",
] as const;

const nftAdminAbiFragments = [
  "function setMintPrice(uint256 newMintPrice)",
  "function setTreasury(address newTreasury)",
  "function setRevealed(bool newRevealed)",
  "function setUnrevealedURI(string newUnrevealedURI)",
  "function setRevealedBaseURI(string newRevealedBaseURI)",
  "function setBaseExtension(string newBaseExtension)",
  "function lockMetadata()",
  "function setDefaultRoyalty(address receiver, uint96 feeNumerator)",
  "function rescueETH(address to, uint256 amount)",
  "function rescueERC20(address token, address to, uint256 amount)",
] as const;

const rotySpecificAbiFragments = [
  "function ROTY_MAX_SUPPLY() view returns (uint256)",
  "function ROTY_MAX_MINT_PER_TX() view returns (uint256)",
  "function ROTY_ROYALTY_FEE() view returns (uint96)",
  "function ORIGIN_CHAIN_ID() view returns (uint256)",
  "function ORIGIN_CONTRACT() view returns (address)",
  "function ORIGIN_NAME() view returns (string)",
  "function merkleRoot() view returns (bytes32)",
  "function whitelistMintEnabled() view returns (bool)",
  "function publicMintEnabled() view returns (bool)",
  "function whitelistClaimed(address account) view returns (bool)",
  "function whitelistLeaf(address account) pure returns (bytes32)",
  "function setMerkleRoot(bytes32 newMerkleRoot)",
  "function setWhitelistMintEnabled(bool enabled)",
  "function setPublicMintEnabled(bool enabled)",
  "function whitelistMint(bytes32[] proof)",
  "function publicMint(uint256 quantity) payable",
] as const;

const gatedMintSpecificAbiFragments = [
  "function gatedMintEnabled() view returns (bool)",
  "function stakingContract() view returns (address)",
  "function rotyCollection() view returns (address)",
  "function meltingCollection() view returns (address)",
  "function setGatedMintEnabled(bool enabled)",
  "function mint(uint256 quantity) payable",
] as const;

const stakingAbiFragments = [
  ...ownable2StepAbiFragments,
  "function BUILD_STAGE() view returns (string)",
  "function approvedCollection(address collection) view returns (bool)",
  "function setCollectionApproved(address collection, bool approved)",
  "function stake(address collection, uint256 tokenId)",
  "function unstake(address collection, uint256 tokenId)",
  "function getStakePosition(address user, address collection, uint256 tokenId) view returns ((bool exists, bool active, uint64 stakedAt, uint64 unstakedAt))",
  "function getUserStakedTokenIds(address user, address collection) view returns (uint256[])",
  "function isStakeActive(address user, address collection, uint256 tokenId) view returns (bool)",
  "function isStakeValid(address user, address collection, uint256 tokenId) view returns (bool)",
  "function hasValidStake(address user, address collection) view returns (bool)",
  "function hasValidStakeInCollections(address user, address[] collections) view returns (bool)",
] as const;

const rewardDistributorAbiFragments = [
  ...ownable2StepAbiFragments,
  "function BUILD_STAGE() view returns (string)",
  "function rewardToken() view returns (address)",
  "function totalRewardFunded() view returns (uint256)",
  "function totalRewardClaimed() view returns (uint256)",
  "function hasClaimed(uint256 roundId, address account) view returns (bool)",
  "function getRewardRound(uint256 roundId) view returns ((bool exists, bool claimPaused, uint64 periodStart, uint64 periodEnd, uint256 rewardAmount, uint256 fundedAmount, uint256 claimedAmount, bytes32 merkleRoot))",
  "function isRoundFunded(uint256 roundId) view returns (bool)",
  "function claimable(uint256 roundId, address account, uint256 amount, bytes32[] proof) view returns (bool)",
  "function rewardLeaf(uint256 roundId, address account, uint256 amount) pure returns (bytes32)",
  "function allocatedUnclaimedRewardBalance() view returns (uint256)",
  "function excessRewardTokenBalance() view returns (uint256)",
  "function createRewardRound(uint256 roundId, uint64 periodStart, uint64 periodEnd, uint256 rewardAmount, bytes32 merkleRoot)",
  "function fundRewardRound(uint256 roundId, uint256 amount)",
  "function setMerkleRoot(uint256 roundId, bytes32 newMerkleRoot)",
  "function setClaimPaused(uint256 roundId, bool paused)",
  "function claim(uint256 roundId, uint256 amount, bytes32[] proof)",
  "function batchClaim(uint256[] roundIds, uint256[] amounts, bytes32[][] proofs)",
  "function rescueETH(address to, uint256 amount)",
  "function rescueERC20(address token, address to, uint256 amount)",
] as const;

export const erc20Abi = parseAbi([
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
] as const);

export const ownable2StepAbi = parseAbi(ownable2StepAbiFragments);

export const erc721SharedAbi = parseAbi(erc721SharedAbiFragments);

export const nftCoreAdminAbi = parseAbi([
  ...ownable2StepAbiFragments,
  ...erc721SharedAbiFragments,
  ...nftAdminAbiFragments,
] as const);

export const rotyAbi = parseAbi([
  ...ownable2StepAbiFragments,
  ...erc721SharedAbiFragments,
  ...nftAdminAbiFragments,
  ...rotySpecificAbiFragments,
] as const);

export const rotyAdminAbi = rotyAbi;

export const gatedMintAbi = parseAbi([
  ...ownable2StepAbiFragments,
  ...erc721SharedAbiFragments,
  ...nftAdminAbiFragments,
  ...gatedMintSpecificAbiFragments,
] as const);

export const gatedMintAdminAbi = gatedMintAbi;

export const stakingAbi = parseAbi(stakingAbiFragments);

export const stakingAdminAbi = stakingAbi;

export const rewardDistributorAbi = parseAbi(rewardDistributorAbiFragments);

export const rewardDistributorAdminAbi = rewardDistributorAbi;
