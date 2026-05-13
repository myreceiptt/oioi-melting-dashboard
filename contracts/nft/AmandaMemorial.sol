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
 * @title AmandaMemorial
 * @notice Collection contract for Amanda BASE and Amanda dETH.
 * @dev Staking-gated paid mint logic will be added after OiOiSoftStaking v1.
 */
contract AmandaMemorial is MemorialNFTCore {
    uint256 public constant AMANDA_MAX_SUPPLY = 2020;
    uint256 public constant AMANDA_MAX_MINT_PER_TX = 11;
    uint96 public constant AMANDA_ROYALTY_FEE = 1_100;

    address public immutable stakingContract;
    address public immutable rotyCollection;
    address public immutable meltingCollection;

    error InvalidDependency();

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
}
