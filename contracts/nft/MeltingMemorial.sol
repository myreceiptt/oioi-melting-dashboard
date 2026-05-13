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

/**
 * @title MeltingMemorial
 * @notice Collection contract for Melting BASE and MELTING dETH.
 * @dev Staking-gated paid mint logic will be added after OiOiSoftStaking v1.
 */
contract MeltingMemorial is MemorialNFTCore {
    uint256 public constant MELTING_MAX_SUPPLY = 1747;
    uint256 public constant MELTING_MAX_MINT_PER_TX = 11;
    uint96 public constant MELTING_ROYALTY_FEE = 1_100;

    address public immutable stakingContract;
    address public immutable rotyCollection;

    error InvalidDependency();

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
}
