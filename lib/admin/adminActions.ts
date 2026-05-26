import type { AdminAction } from "@/lib/admin/adminTypes";

function readAction({
  key,
  label,
  functionName,
  description,
}: {
  key: string;
  label: string;
  functionName: string;
  description: string;
}): AdminAction {
  return {
    key,
    label,
    mode: "read",
    functionName,
    risk: "info",
    confirmation: "none",
    description,
  };
}

function writeAction({
  key,
  label,
  functionName,
  risk,
  description,
  warning,
  typedConfirmationText,
}: Omit<AdminAction, "mode" | "confirmation">): AdminAction {
  return {
    key,
    label,
    mode: "write",
    functionName,
    risk,
    confirmation:
      risk === "critical"
        ? "typed-confirmation"
        : risk === "medium" || risk === "high"
          ? "confirm"
          : "none",
    description,
    warning,
    typedConfirmationText,
  };
}

export const ownableReadActions: AdminAction[] = [
  readAction({
    key: "owner",
    label: "Owner",
    functionName: "owner",
    description: "Read the current owner/admin wallet.",
  }),
  readAction({
    key: "pendingOwner",
    label: "Pending owner",
    functionName: "pendingOwner",
    description: "Read the pending owner for Ownable2Step transfer.",
  }),
];

export const ownableWriteActions: AdminAction[] = [
  writeAction({
    key: "transferOwnership",
    label: "Transfer ownership",
    functionName: "transferOwnership",
    risk: "critical",
    description: "Start two-step ownership transfer to a new admin wallet.",
    warning:
      "Ownership controls all admin functions. Only transfer to a wallet you fully control.",
    typedConfirmationText: "TRANSFER OWNERSHIP",
  }),
  writeAction({
    key: "acceptOwnership",
    label: "Accept ownership",
    functionName: "acceptOwnership",
    risk: "critical",
    description: "Accept ownership from the pending owner wallet.",
    warning:
      "Only the pending owner can call this. Confirm the connected wallet is intended to become owner.",
    typedConfirmationText: "ACCEPT OWNERSHIP",
  }),
  writeAction({
    key: "renounceOwnership",
    label: "Renounce ownership",
    functionName: "renounceOwnership",
    risk: "critical",
    description: "Renounce ownership permanently.",
    warning:
      "This can permanently remove admin control. This action should normally never be used.",
    typedConfirmationText: "RENOUNCE OWNERSHIP",
  }),
];

export const nftCoreReadActions: AdminAction[] = [
  ...ownableReadActions,
  readAction({
    key: "name",
    label: "Name",
    functionName: "name",
    description: "Read collection name.",
  }),
  readAction({
    key: "symbol",
    label: "Symbol",
    functionName: "symbol",
    description: "Read collection symbol.",
  }),
  readAction({
    key: "totalMinted",
    label: "Total minted",
    functionName: "totalMinted",
    description: "Read total minted supply.",
  }),
  readAction({
    key: "remainingSupply",
    label: "Remaining supply",
    functionName: "remainingSupply",
    description: "Read remaining mintable supply.",
  }),
  readAction({
    key: "maxSupply",
    label: "Max supply",
    functionName: "maxSupply",
    description: "Read max supply.",
  }),
  readAction({
    key: "maxMintPerTx",
    label: "Max mint per transaction",
    functionName: "maxMintPerTx",
    description: "Read max mint quantity per transaction.",
  }),
  readAction({
    key: "mintPrice",
    label: "Mint price",
    functionName: "mintPrice",
    description: "Read current mint price.",
  }),
  readAction({
    key: "treasury",
    label: "Treasury",
    functionName: "treasury",
    description: "Read mint proceeds treasury address.",
  }),
  readAction({
    key: "revealed",
    label: "Revealed",
    functionName: "revealed",
    description: "Read current reveal state.",
  }),
  readAction({
    key: "metadataLocked",
    label: "Metadata locked",
    functionName: "metadataLocked",
    description: "Read whether metadata is permanently locked.",
  }),
  readAction({
    key: "unrevealedURI",
    label: "Unrevealed URI",
    functionName: "unrevealedURI",
    description: "Read unrevealed metadata URI.",
  }),
  readAction({
    key: "revealedBaseURI",
    label: "Revealed base URI",
    functionName: "revealedBaseURI",
    description: "Read revealed metadata base URI.",
  }),
  readAction({
    key: "baseExtension",
    label: "Base extension",
    functionName: "baseExtension",
    description: "Read tokenURI base extension.",
  }),
];

export const nftCoreWriteActions: AdminAction[] = [
  writeAction({
    key: "setMintPrice",
    label: "Set mint price",
    functionName: "setMintPrice",
    risk: "high",
    description: "Update mint price for future paid mints.",
    warning:
      "Changing price affects future mint transactions immediately after confirmation.",
  }),
  writeAction({
    key: "setTreasury",
    label: "Set treasury",
    functionName: "setTreasury",
    risk: "critical",
    description: "Update the mint proceeds receiver.",
    warning:
      "Mint proceeds will be sent to the new treasury immediately. Confirm the address carefully.",
    typedConfirmationText: "SET TREASURY",
  }),
  writeAction({
    key: "setRevealed",
    label: "Set revealed state",
    functionName: "setRevealed",
    risk: "high",
    description: "Enable or disable revealed tokenURI behavior.",
    warning:
      "Before revealing, verify the revealed base URI, metadata files, and marketplace rendering.",
  }),
  writeAction({
    key: "setUnrevealedURI",
    label: "Set unrevealed URI",
    functionName: "setUnrevealedURI",
    risk: "high",
    description: "Update unrevealed metadata URI.",
    warning:
      "This affects unrevealed token metadata. Confirm the URI points to the intended JSON metadata.",
  }),
  writeAction({
    key: "setRevealedBaseURI",
    label: "Set revealed base URI",
    functionName: "setRevealedBaseURI",
    risk: "high",
    description: "Update revealed token metadata base URI.",
    warning:
      "This affects revealed tokenURI output. Confirm the base URI and trailing slash before signing.",
  }),
  writeAction({
    key: "setBaseExtension",
    label: "Set base extension",
    functionName: "setBaseExtension",
    risk: "medium",
    description: "Update tokenURI base extension.",
    warning:
      "Changing extension affects tokenURI formatting. Only change if metadata path format requires it.",
  }),
  writeAction({
    key: "setDefaultRoyalty",
    label: "Set default royalty",
    functionName: "setDefaultRoyalty",
    risk: "high",
    description: "Update ERC2981 royalty receiver and fee numerator.",
    warning:
      "Royalty changes affect marketplace royalty information. Confirm receiver and percentage.",
  }),
  writeAction({
    key: "lockMetadata",
    label: "Lock metadata",
    functionName: "lockMetadata",
    risk: "critical",
    description: "Permanently lock metadata configuration.",
    warning:
      "This action is irreversible. Only lock after final revealed metadata is checked and approved.",
    typedConfirmationText: "LOCK METADATA",
  }),
  writeAction({
    key: "rescueETH",
    label: "Rescue ETH",
    functionName: "rescueETH",
    risk: "critical",
    description: "Rescue ETH from the contract.",
    warning:
      "Use only for accidental ETH stuck in contract. Confirm recipient and amount carefully.",
    typedConfirmationText: "RESCUE ETH",
  }),
  writeAction({
    key: "rescueERC20",
    label: "Rescue ERC20",
    functionName: "rescueERC20",
    risk: "critical",
    description: "Rescue ERC20 tokens from the contract.",
    warning:
      "Use only for accidental ERC20 tokens stuck in contract. Confirm token, recipient, and amount.",
    typedConfirmationText: "RESCUE ERC20",
  }),
  ...ownableWriteActions,
];

export const rotyReadActions: AdminAction[] = [
  ...nftCoreReadActions,
  readAction({
    key: "merkleRoot",
    label: "Merkle root",
    functionName: "merkleRoot",
    description: "Read ROTY whitelist Merkle root.",
  }),
  readAction({
    key: "whitelistMintEnabled",
    label: "Whitelist mint enabled",
    functionName: "whitelistMintEnabled",
    description: "Read ROTY whitelist mint phase.",
  }),
  readAction({
    key: "publicMintEnabled",
    label: "Public mint enabled",
    functionName: "publicMintEnabled",
    description: "Read ROTY public mint phase.",
  }),
  readAction({
    key: "ORIGIN_CHAIN_ID",
    label: "Origin chain ID",
    functionName: "ORIGIN_CHAIN_ID",
    description: "Read Polygon origin chain ID.",
  }),
  readAction({
    key: "ORIGIN_CONTRACT",
    label: "Origin contract",
    functionName: "ORIGIN_CONTRACT",
    description: "Read Polygon origin contract.",
  }),
  readAction({
    key: "ORIGIN_NAME",
    label: "Origin name",
    functionName: "ORIGIN_NAME",
    description: "Read Polygon origin collection name.",
  }),
];

export const rotyWriteActions: AdminAction[] = [
  writeAction({
    key: "setWhitelistMintEnabled",
    label: "Set whitelist mint enabled",
    functionName: "setWhitelistMintEnabled",
    risk: "medium",
    description: "Enable or disable ROTY whitelist mint.",
    warning:
      "Only enable after whitelist proof data and frontend state have been verified.",
  }),
  writeAction({
    key: "setPublicMintEnabled",
    label: "Set public mint enabled",
    functionName: "setPublicMintEnabled",
    risk: "medium",
    description: "Enable or disable ROTY public mint.",
    warning:
      "Only enable after frontend, pricing, supply, and monitoring are ready.",
  }),
  writeAction({
    key: "setMerkleRoot",
    label: "Set Merkle root",
    functionName: "setMerkleRoot",
    risk: "high",
    description: "Update ROTY whitelist Merkle root.",
    warning:
      "Changing the root changes whitelist eligibility. Confirm generated proofs match this root.",
  }),
  ...nftCoreWriteActions,
];

export const gatedMintReadActions: AdminAction[] = [
  ...nftCoreReadActions,
  readAction({
    key: "gatedMintEnabled",
    label: "Gated mint enabled",
    functionName: "gatedMintEnabled",
    description: "Read gated mint phase.",
  }),
  readAction({
    key: "stakingContract",
    label: "Staking contract",
    functionName: "stakingContract",
    description: "Read staking contract used for eligibility.",
  }),
  readAction({
    key: "rotyCollection",
    label: "ROTY collection",
    functionName: "rotyCollection",
    description: "Read ROTY collection used for eligibility.",
  }),
  readAction({
    key: "meltingCollection",
    label: "Melting collection",
    functionName: "meltingCollection",
    description: "Read Melting collection used for Amanda eligibility.",
  }),
];

export const gatedMintWriteActions: AdminAction[] = [
  writeAction({
    key: "setGatedMintEnabled",
    label: "Set gated mint enabled",
    functionName: "setGatedMintEnabled",
    risk: "medium",
    description: "Enable or disable gated mint.",
    warning:
      "Only enable after staking eligibility, frontend, and mint price are verified.",
  }),
  ...nftCoreWriteActions,
];

export const stakingReadActions: AdminAction[] = [
  ...ownableReadActions,
  readAction({
    key: "BUILD_STAGE",
    label: "Build stage",
    functionName: "BUILD_STAGE",
    description: "Read staking contract build stage.",
  }),
  readAction({
    key: "approvedCollection",
    label: "Approved collection",
    functionName: "approvedCollection",
    description: "Read whether a collection is approved for staking.",
  }),
];

export const stakingWriteActions: AdminAction[] = [
  writeAction({
    key: "setCollectionApproved",
    label: "Set collection approved",
    functionName: "setCollectionApproved",
    risk: "high",
    description: "Approve or unapprove a collection for staking.",
    warning:
      "Disabling a collection can affect future staking behavior. Existing data should be reviewed first.",
  }),
  ...ownableWriteActions,
];

export const rewardDistributorReadActions: AdminAction[] = [
  ...ownableReadActions,
  readAction({
    key: "BUILD_STAGE",
    label: "Build stage",
    functionName: "BUILD_STAGE",
    description: "Read reward distributor build stage.",
  }),
  readAction({
    key: "rewardToken",
    label: "Reward token",
    functionName: "rewardToken",
    description: "Read reward ERC20 token address.",
  }),
  readAction({
    key: "totalRewardFunded",
    label: "Total reward funded",
    functionName: "totalRewardFunded",
    description: "Read cumulative reward funded amount.",
  }),
  readAction({
    key: "totalRewardClaimed",
    label: "Total reward claimed",
    functionName: "totalRewardClaimed",
    description: "Read cumulative reward claimed amount.",
  }),
  readAction({
    key: "allocatedUnclaimedRewardBalance",
    label: "Allocated unclaimed reward balance",
    functionName: "allocatedUnclaimedRewardBalance",
    description: "Read funded reward allocated but not yet claimed.",
  }),
  readAction({
    key: "excessRewardTokenBalance",
    label: "Excess reward token balance",
    functionName: "excessRewardTokenBalance",
    description:
      "Read reward token balance not allocated to active claim obligations.",
  }),
  readAction({
    key: "getRewardRound",
    label: "Get reward round",
    functionName: "getRewardRound",
    description: "Read reward round details.",
  }),
  readAction({
    key: "isRoundFunded",
    label: "Is round funded",
    functionName: "isRoundFunded",
    description: "Read whether reward round is fully funded.",
  }),
  readAction({
    key: "hasClaimed",
    label: "Has claimed",
    functionName: "hasClaimed",
    description: "Read whether account has claimed a round.",
  }),
];

export const rewardDistributorWriteActions: AdminAction[] = [
  writeAction({
    key: "createRewardRound",
    label: "Create reward round",
    functionName: "createRewardRound",
    risk: "high",
    description:
      "Create a reward round with period, reward amount, and Merkle root.",
    warning:
      "Confirm period, total allocation amount, and Merkle root match the reward calculator output.",
  }),
  writeAction({
    key: "fundRewardRound",
    label: "Fund reward round",
    functionName: "fundRewardRound",
    risk: "high",
    description: "Fund a reward round using approved $OiOi allowance.",
    warning:
      "Approve $OiOi first. Confirm reward amount and round ID before funding.",
  }),
  writeAction({
    key: "setMerkleRoot",
    label: "Set reward Merkle root",
    functionName: "setMerkleRoot",
    risk: "critical",
    description: "Update Merkle root for an existing reward round.",
    warning:
      "Changing reward root changes claim eligibility. Only use to fix a reviewed reward data issue.",
    typedConfirmationText: "SET REWARD ROOT",
  }),
  writeAction({
    key: "setClaimPaused",
    label: "Set claim paused",
    functionName: "setClaimPaused",
    risk: "medium",
    description: "Pause or unpause claims for a reward round.",
    warning:
      "Pause claims when investigating reward data or proof issues. Unpause only after review.",
  }),
  writeAction({
    key: "rescueETH",
    label: "Rescue ETH",
    functionName: "rescueETH",
    risk: "critical",
    description: "Rescue ETH from Reward Distributor.",
    warning:
      "Use only for accidental ETH. Confirm recipient and amount carefully.",
    typedConfirmationText: "RESCUE ETH",
  }),
  writeAction({
    key: "rescueERC20",
    label: "Rescue ERC20",
    functionName: "rescueERC20",
    risk: "critical",
    description: "Rescue ERC20 from Reward Distributor.",
    warning:
      "Rescuing reward token may affect claim solvency. Confirm excess balance before signing.",
    typedConfirmationText: "RESCUE ERC20",
  }),
  ...ownableWriteActions,
];

export const erc20ReadActions: AdminAction[] = [
  readAction({
    key: "name",
    label: "Name",
    functionName: "name",
    description: "Read ERC20 token name.",
  }),
  readAction({
    key: "symbol",
    label: "Symbol",
    functionName: "symbol",
    description: "Read ERC20 token symbol.",
  }),
  readAction({
    key: "decimals",
    label: "Decimals",
    functionName: "decimals",
    description: "Read ERC20 decimals.",
  }),
  readAction({
    key: "totalSupply",
    label: "Total supply",
    functionName: "totalSupply",
    description: "Read ERC20 total supply.",
  }),
  readAction({
    key: "balanceOf",
    label: "Balance of",
    functionName: "balanceOf",
    description: "Read ERC20 balance.",
  }),
  readAction({
    key: "allowance",
    label: "Allowance",
    functionName: "allowance",
    description: "Read allowance for reward distributor funding.",
  }),
];

export const erc20WriteActions: AdminAction[] = [
  writeAction({
    key: "approve",
    label: "Approve reward funding",
    functionName: "approve",
    risk: "high",
    description: "Approve Reward Distributor to spend $OiOi for funding.",
    warning:
      "Approve only the amount intended for reward funding. Avoid unlimited approval for admin operations.",
  }),
];
