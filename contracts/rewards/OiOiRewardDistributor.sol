//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////                                                                                                           ///////
////     Our Signature v.4.74                                                                                  ///////
////                                                                                                           ///////
////    *    ##     ######  ######   ######  #######        ###    ##  ######  ########  #####      ##    *    ///////
////    *    ##     ##   ## ##   ## ##    ## ##             ####   ## ##    ##    ##    ##   ##     ##    *    ///////
////    *    ##     ######  ######  ##    ## #####          ## ##  ## ##    ##    ##    #######     ##    *    ///////
////    *           ##      ##   ## ##    ## ##             ##  ## ## ##    ##    ##    ##   ##           *    ///////
////    *    ##     ##      ##   ##  ######  ##      ##     ##   ####  ######     ##    ##   ##     ##    *    ///////
////                                                                                                           ///////
////    ENDHONESA.COM by Prof. NOTA Inc. - Prof. NOTA - @MyReceipt                                             ///////
////    Deep Links: https://deeplink.endhonesa.com/                                                            ///////
////                                                                                                           ///////
////    Regards,                                                                                               ///////
////    Prof. NOTA v11.47                                                                                      ///////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {
    ReentrancyGuard
} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {
    MerkleProof
} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

import {IERC20Minimal} from "../interfaces/IERC20Minimal.sol";

/**
 * @title OiOiRewardDistributor
 * @notice Merkle-based $OiOi reward distributor for OiOi Melting Dashboard.
 * @dev One codebase, two deployments:
 * - Base deployment pays $OiOi Base.
 * - Ethereum deployment pays $OiOi Ethereum.
 *
 * This contract does not calculate reward allocation.
 * Reward allocation is calculated off-chain from staking events + NFT transfer events,
 * then published as a Merkle root per reward round.
 *
 * Reward leaf format follows OpenZeppelin StandardMerkleTree:
 * leaf = keccak256(bytes.concat(keccak256(abi.encode(roundId, account, amount))))
 */
contract OiOiRewardDistributor is Ownable2Step, ReentrancyGuard {
    string public constant BUILD_STAGE = "REWARD_DISTRIBUTOR_V1";

    IERC20Minimal public immutable rewardToken;

    struct RewardRound {
        bool exists;
        bool claimPaused;
        uint64 periodStart;
        uint64 periodEnd;
        uint256 rewardAmount;
        uint256 fundedAmount;
        uint256 claimedAmount;
        bytes32 merkleRoot;
    }

    mapping(uint256 roundId => RewardRound) private _rewardRounds;
    mapping(uint256 roundId => mapping(address account => bool claimed))
        public hasClaimed;

    uint256 public totalRewardFunded;
    uint256 public totalRewardClaimed;

    event RewardRoundCreated(
        uint256 indexed roundId,
        uint64 periodStart,
        uint64 periodEnd,
        uint256 rewardAmount,
        bytes32 indexed merkleRoot
    );

    event RewardRoundFunded(
        uint256 indexed roundId,
        address indexed funder,
        uint256 amount,
        uint256 fundedAmount
    );

    event MerkleRootUpdated(
        uint256 indexed roundId,
        bytes32 indexed oldMerkleRoot,
        bytes32 indexed newMerkleRoot
    );

    event ClaimPausedUpdated(uint256 indexed roundId, bool paused);

    event Claimed(
        uint256 indexed roundId,
        address indexed account,
        uint256 amount
    );

    event ETHRescued(address indexed to, uint256 amount);
    event ERC20Rescued(
        address indexed token,
        address indexed to,
        uint256 amount
    );

    error InvalidAddress();
    error InvalidRoundId();
    error InvalidPeriod();
    error InvalidAmount();
    error RoundAlreadyExists(uint256 roundId);
    error RoundDoesNotExist(uint256 roundId);
    error RoundNotFunded(uint256 roundId);
    error ClaimPaused(uint256 roundId);
    error EmptyMerkleRoot(uint256 roundId);
    error AlreadyClaimed(uint256 roundId, address account);
    error InvalidMerkleProof();
    error TransferFailed();
    error InsufficientBalance();
    error CannotUpdateMerkleRootAfterClaims();
    error FundingExceedsRewardAmount();
    error CannotRescueAllocatedRewards();

    constructor(
        address rewardToken_,
        address initialOwner_
    ) Ownable(initialOwner_) {
        if (rewardToken_ == address(0) || initialOwner_ == address(0)) {
            revert InvalidAddress();
        }

        rewardToken = IERC20Minimal(rewardToken_);
    }

    function createRewardRound(
        uint256 roundId,
        uint64 periodStart,
        uint64 periodEnd,
        uint256 rewardAmount,
        bytes32 merkleRoot
    ) external onlyOwner {
        if (roundId == 0) revert InvalidRoundId();
        if (_rewardRounds[roundId].exists) revert RoundAlreadyExists(roundId);
        if (periodEnd <= periodStart) revert InvalidPeriod();
        if (rewardAmount == 0) revert InvalidAmount();

        _rewardRounds[roundId] = RewardRound({
            exists: true,
            claimPaused: false,
            periodStart: periodStart,
            periodEnd: periodEnd,
            rewardAmount: rewardAmount,
            fundedAmount: 0,
            claimedAmount: 0,
            merkleRoot: merkleRoot
        });

        emit RewardRoundCreated(
            roundId,
            periodStart,
            periodEnd,
            rewardAmount,
            merkleRoot
        );
    }

    function fundRewardRound(
        uint256 roundId,
        uint256 amount
    ) external onlyOwner nonReentrant {
        RewardRound storage round = _getExistingRound(roundId);

        if (amount == 0) revert InvalidAmount();

        if (round.fundedAmount + amount > round.rewardAmount) {
            revert FundingExceedsRewardAmount();
        }

        bool success = rewardToken.transferFrom(
            msg.sender,
            address(this),
            amount
        );
        if (!success) revert TransferFailed();

        round.fundedAmount += amount;
        totalRewardFunded += amount;

        emit RewardRoundFunded(roundId, msg.sender, amount, round.fundedAmount);
    }

    function setMerkleRoot(
        uint256 roundId,
        bytes32 newMerkleRoot
    ) external onlyOwner {
        RewardRound storage round = _getExistingRound(roundId);

        if (round.claimedAmount > 0) {
            revert CannotUpdateMerkleRootAfterClaims();
        }

        bytes32 oldMerkleRoot = round.merkleRoot;
        round.merkleRoot = newMerkleRoot;

        emit MerkleRootUpdated(roundId, oldMerkleRoot, newMerkleRoot);
    }

    function setClaimPaused(uint256 roundId, bool paused) external onlyOwner {
        RewardRound storage round = _getExistingRound(roundId);

        round.claimPaused = paused;

        emit ClaimPausedUpdated(roundId, paused);
    }

    function claim(
        uint256 roundId,
        uint256 amount,
        bytes32[] calldata proof
    ) external nonReentrant {
        _claim(roundId, msg.sender, amount, proof);
    }

    function batchClaim(
        uint256[] calldata roundIds,
        uint256[] calldata amounts,
        bytes32[][] calldata proofs
    ) external nonReentrant {
        if (
            roundIds.length != amounts.length ||
            roundIds.length != proofs.length
        ) {
            revert InvalidAmount();
        }

        for (uint256 i = 0; i < roundIds.length; i++) {
            _claim(roundIds[i], msg.sender, amounts[i], proofs[i]);
        }
    }

    function getRewardRound(
        uint256 roundId
    ) external view returns (RewardRound memory) {
        return _rewardRounds[roundId];
    }

    function isRoundFunded(uint256 roundId) public view returns (bool) {
        RewardRound memory round = _rewardRounds[roundId];

        return round.exists && round.fundedAmount >= round.rewardAmount;
    }

    function claimable(
        uint256 roundId,
        address account,
        uint256 amount,
        bytes32[] calldata proof
    ) external view returns (bool) {
        RewardRound memory round = _rewardRounds[roundId];

        if (!round.exists) return false;
        if (round.claimPaused) return false;
        if (round.merkleRoot == bytes32(0)) return false;
        if (round.fundedAmount < round.rewardAmount) return false;
        if (hasClaimed[roundId][account]) return false;

        bytes32 leaf = rewardLeaf(roundId, account, amount);

        return MerkleProof.verify(proof, round.merkleRoot, leaf);
    }

    function rewardLeaf(
        uint256 roundId,
        address account,
        uint256 amount
    ) public pure returns (bytes32) {
        return
            keccak256(
                bytes.concat(keccak256(abi.encode(roundId, account, amount)))
            );
    }

    function allocatedUnclaimedRewardBalance() public view returns (uint256) {
        return totalRewardFunded - totalRewardClaimed;
    }

    function excessRewardTokenBalance() public view returns (uint256) {
        uint256 balance = rewardToken.balanceOf(address(this));
        uint256 allocated = allocatedUnclaimedRewardBalance();

        if (balance <= allocated) {
            return 0;
        }

        return balance - allocated;
    }

    function rescueETH(
        address payable to,
        uint256 amount
    ) external onlyOwner nonReentrant {
        if (to == address(0)) revert InvalidAddress();
        if (amount > address(this).balance) revert InsufficientBalance();

        (bool success, ) = to.call{value: amount}("");
        if (!success) revert TransferFailed();

        emit ETHRescued(to, amount);
    }

    function rescueERC20(
        address token,
        address to,
        uint256 amount
    ) external onlyOwner nonReentrant {
        if (token == address(0) || to == address(0)) revert InvalidAddress();

        if (token == address(rewardToken)) {
            if (amount > excessRewardTokenBalance()) {
                revert CannotRescueAllocatedRewards();
            }
        }

        bool success = IERC20Minimal(token).transfer(to, amount);
        if (!success) revert TransferFailed();

        emit ERC20Rescued(token, to, amount);
    }

    function _claim(
        uint256 roundId,
        address account,
        uint256 amount,
        bytes32[] calldata proof
    ) internal {
        RewardRound storage round = _getExistingRound(roundId);

        if (amount == 0) revert InvalidAmount();
        if (round.claimPaused) revert ClaimPaused(roundId);
        if (round.merkleRoot == bytes32(0)) revert EmptyMerkleRoot(roundId);
        if (round.fundedAmount < round.rewardAmount)
            revert RoundNotFunded(roundId);
        if (hasClaimed[roundId][account])
            revert AlreadyClaimed(roundId, account);

        bytes32 leaf = rewardLeaf(roundId, account, amount);

        if (!MerkleProof.verify(proof, round.merkleRoot, leaf)) {
            revert InvalidMerkleProof();
        }

        hasClaimed[roundId][account] = true;
        round.claimedAmount += amount;
        totalRewardClaimed += amount;

        bool success = rewardToken.transfer(account, amount);
        if (!success) revert TransferFailed();

        emit Claimed(roundId, account, amount);
    }

    function _getExistingRound(
        uint256 roundId
    ) internal view returns (RewardRound storage round) {
        round = _rewardRounds[roundId];

        if (!round.exists) {
            revert RoundDoesNotExist(roundId);
        }
    }

    receive() external payable {}
}
