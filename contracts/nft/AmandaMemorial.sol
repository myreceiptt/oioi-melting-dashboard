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

import {MemorialNFTCore} from "./MemorialNFTCore.sol";
import {IOiOiSoftStaking} from "../interfaces/IOiOiSoftStaking.sol";

/**
 * @title AmandaMemorial
 * @notice Collection contract for Amanda BASE and Amanda dETH.
 * @dev One codebase, two deployments:
 * - Base: Amanda BASE / AMANBASE
 * - Ethereum: Amanda dETH / AMANDETH
 *
 * Mint model:
 * - No free mint
 * - No open public mint
 * - Staking-gated paid mint only
 *
 * Eligibility:
 * - User must have a valid soft-staked ROTY NFT
 *   OR a valid soft-staked Melting NFT in the same chain set.
 */
contract AmandaMemorial is MemorialNFTCore {
    uint256 public constant AMANDA_MAX_SUPPLY = 2020;
    uint256 public constant AMANDA_MAX_MINT_PER_TX = 11;
    uint96 public constant AMANDA_ROYALTY_FEE = 1_100;

    address public immutable stakingContract;
    address public immutable rotyCollection;
    address public immutable meltingCollection;

    bool public gatedMintEnabled;

    event GatedMintEnabledUpdated(bool enabled);
    event GatedMinted(
        address indexed minter,
        uint256 quantity,
        uint256 indexed firstTokenId
    );

    error InvalidDependency();
    error GatedMintClosed();
    error MintAccessDenied(address user);

    constructor(
        string memory name_,
        string memory symbol_,
        uint256 mintPrice_,
        address stakingContract_,
        address rotyCollection_,
        address meltingCollection_,
        address payable treasury_,
        address royaltyReceiver_,
        string memory unrevealedURI_,
        string memory revealedBaseURI_,
        address initialOwner_
    )
        MemorialNFTCore(
            name_,
            symbol_,
            AMANDA_MAX_SUPPLY,
            AMANDA_MAX_MINT_PER_TX,
            mintPrice_,
            treasury_,
            unrevealedURI_,
            revealedBaseURI_,
            ".json",
            royaltyReceiver_,
            AMANDA_ROYALTY_FEE,
            initialOwner_
        )
    {
        if (
            stakingContract_ == address(0) ||
            rotyCollection_ == address(0) ||
            meltingCollection_ == address(0)
        ) {
            revert InvalidDependency();
        }

        stakingContract = stakingContract_;
        rotyCollection = rotyCollection_;
        meltingCollection = meltingCollection_;
    }

    function setGatedMintEnabled(bool enabled) external onlyOwner {
        gatedMintEnabled = enabled;

        emit GatedMintEnabledUpdated(enabled);
    }

    function mint(
        uint256 quantity
    ) external payable nonReentrant returns (uint256 firstTokenId) {
        if (!gatedMintEnabled) revert GatedMintClosed();

        address[] memory eligibleCollections = new address[](2);
        eligibleCollections[0] = rotyCollection;
        eligibleCollections[1] = meltingCollection;

        if (
            !IOiOiSoftStaking(stakingContract).hasValidStakeInCollections(
                msg.sender,
                eligibleCollections
            )
        ) {
            revert MintAccessDenied(msg.sender);
        }

        firstTokenId = _paidMint(msg.sender, quantity);

        emit GatedMinted(msg.sender, quantity, firstTokenId);
    }
}
