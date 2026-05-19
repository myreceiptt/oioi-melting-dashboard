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
 * @title MeltingMemorial
 * @notice Collection contract for Melting BASE and Melting dETH.
 * @dev One codebase, two deployments:
 * - Base: Melting BASE / MELTBASE
 * - Ethereum: Melting dETH / MELTDETH
 *
 * Mint model:
 * - No free mint
 * - No open public mint
 * - Staking-gated paid mint only
 *
 * Eligibility:
 * - User must have a valid soft-staked ROTY NFT in the same chain set.
 */
contract MeltingMemorial is MemorialNFTCore {
    uint256 public constant MELTING_MAX_SUPPLY = 1747;
    uint256 public constant MELTING_MAX_MINT_PER_TX = 11;
    uint96 public constant MELTING_ROYALTY_FEE = 1_100;

    address public immutable stakingContract;
    address public immutable rotyCollection;

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
        address payable treasury_,
        address royaltyReceiver_,
        string memory unrevealedURI_,
        string memory revealedBaseURI_,
        address initialOwner_
    )
        MemorialNFTCore(
            name_,
            symbol_,
            MELTING_MAX_SUPPLY,
            MELTING_MAX_MINT_PER_TX,
            mintPrice_,
            treasury_,
            unrevealedURI_,
            revealedBaseURI_,
            ".json",
            royaltyReceiver_,
            MELTING_ROYALTY_FEE,
            initialOwner_
        )
    {
        if (stakingContract_ == address(0) || rotyCollection_ == address(0)) {
            revert InvalidDependency();
        }

        stakingContract = stakingContract_;
        rotyCollection = rotyCollection_;
    }

    function setGatedMintEnabled(bool enabled) external onlyOwner {
        gatedMintEnabled = enabled;

        emit GatedMintEnabledUpdated(enabled);
    }

    function mint(
        uint256 quantity
    ) external payable nonReentrant returns (uint256 firstTokenId) {
        if (!gatedMintEnabled) revert GatedMintClosed();

        if (
            !IOiOiSoftStaking(stakingContract).hasValidStake(
                msg.sender,
                rotyCollection
            )
        ) {
            revert MintAccessDenied(msg.sender);
        }

        firstTokenId = _paidMint(msg.sender, quantity);

        emit GatedMinted(msg.sender, quantity, firstTokenId);
    }
}
