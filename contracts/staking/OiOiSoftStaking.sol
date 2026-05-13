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

import {IERC721OwnerOf} from "../interfaces/IERC721OwnerOf.sol";
import {IOiOiSoftStaking} from "../interfaces/IOiOiSoftStaking.sol";

/**
 * @title OiOiSoftStaking
 * @notice Non-custodial Proof-of-Holding soft staking registry.
 * @dev NFTs never leave the holder wallet. This contract records staking intent.
 *
 * Valid stake = active staking record + user is still current ownerOf(tokenId).
 *
 * Important:
 * - This contract does not calculate final reward duration.
 * - Reward duration is calculated off-chain from Staked/Unstaked events
 *   plus ERC721 Transfer events.
 * - A token may have historical active intent records from multiple wallets,
 *   but only the current owner can be considered valid at any moment.
 */
contract OiOiSoftStaking is Ownable2Step, IOiOiSoftStaking {
    string public constant BUILD_STAGE = "SOFT_STAKING_V1";

    struct StakePosition {
        bool exists;
        bool active;
        uint64 stakedAt;
        uint64 unstakedAt;
    }

    mapping(address => bool) public approvedCollection;

    mapping(address user => mapping(address collection => mapping(uint256 tokenId => StakePosition)))
        private _stakePositions;

    mapping(address user => mapping(address collection => uint256[] tokenIds))
        private _userStakedTokenIds;

    event CollectionApprovalUpdated(address indexed collection, bool approved);

    event Staked(
        address indexed staker,
        address indexed collection,
        uint256 indexed tokenId,
        uint256 timestamp
    );

    event Unstaked(
        address indexed staker,
        address indexed collection,
        uint256 indexed tokenId,
        uint256 timestamp
    );

    error InvalidAddress();
    error CollectionNotApproved(address collection);
    error NotTokenOwner(address user, address collection, uint256 tokenId);
    error AlreadyStaked(address user, address collection, uint256 tokenId);
    error StakeNotActive(address user, address collection, uint256 tokenId);

    constructor(address initialOwner_) Ownable(initialOwner_) {
        if (initialOwner_ == address(0)) revert InvalidAddress();
    }

    function setCollectionApproved(
        address collection,
        bool approved
    ) external onlyOwner {
        if (collection == address(0)) revert InvalidAddress();

        approvedCollection[collection] = approved;

        emit CollectionApprovalUpdated(collection, approved);
    }

    function stake(address collection, uint256 tokenId) external {
        if (!approvedCollection[collection]) {
            revert CollectionNotApproved(collection);
        }

        if (!_isCurrentOwner(msg.sender, collection, tokenId)) {
            revert NotTokenOwner(msg.sender, collection, tokenId);
        }

        StakePosition storage position = _stakePositions[msg.sender][
            collection
        ][tokenId];

        if (position.active) {
            revert AlreadyStaked(msg.sender, collection, tokenId);
        }

        if (!position.exists) {
            position.exists = true;
            _userStakedTokenIds[msg.sender][collection].push(tokenId);
        }

        position.active = true;
        position.stakedAt = uint64(block.timestamp);
        position.unstakedAt = 0;

        emit Staked(msg.sender, collection, tokenId, block.timestamp);
    }

    function unstake(address collection, uint256 tokenId) external {
        StakePosition storage position = _stakePositions[msg.sender][
            collection
        ][tokenId];

        if (!position.active) {
            revert StakeNotActive(msg.sender, collection, tokenId);
        }

        position.active = false;
        position.unstakedAt = uint64(block.timestamp);

        emit Unstaked(msg.sender, collection, tokenId, block.timestamp);
    }

    function getStakePosition(
        address user,
        address collection,
        uint256 tokenId
    ) external view returns (StakePosition memory) {
        return _stakePositions[user][collection][tokenId];
    }

    function getUserStakedTokenIds(
        address user,
        address collection
    ) external view returns (uint256[] memory) {
        return _userStakedTokenIds[user][collection];
    }

    function isStakeActive(
        address user,
        address collection,
        uint256 tokenId
    ) external view returns (bool) {
        return _stakePositions[user][collection][tokenId].active;
    }

    function isStakeValid(
        address user,
        address collection,
        uint256 tokenId
    ) public view returns (bool) {
        StakePosition memory position = _stakePositions[user][collection][
            tokenId
        ];

        if (!position.active) {
            return false;
        }

        return _isCurrentOwner(user, collection, tokenId);
    }

    function hasValidStake(
        address user,
        address collection
    ) external view override returns (bool) {
        if (!approvedCollection[collection]) {
            return false;
        }

        uint256[] memory tokenIds = _userStakedTokenIds[user][collection];

        for (uint256 i = 0; i < tokenIds.length; i++) {
            if (isStakeValid(user, collection, tokenIds[i])) {
                return true;
            }
        }

        return false;
    }

    function hasValidStakeInCollections(
        address user,
        address[] calldata collections
    ) external view override returns (bool) {
        for (uint256 i = 0; i < collections.length; i++) {
            if (!approvedCollection[collections[i]]) {
                continue;
            }

            uint256[] memory tokenIds = _userStakedTokenIds[user][
                collections[i]
            ];

            for (uint256 j = 0; j < tokenIds.length; j++) {
                if (isStakeValid(user, collections[i], tokenIds[j])) {
                    return true;
                }
            }
        }

        return false;
    }

    function _isCurrentOwner(
        address user,
        address collection,
        uint256 tokenId
    ) internal view returns (bool) {
        if (user == address(0) || collection == address(0)) {
            return false;
        }

        try IERC721OwnerOf(collection).ownerOf(tokenId) returns (
            address currentOwner
        ) {
            return currentOwner == user;
        } catch {
            return false;
        }
    }
}
