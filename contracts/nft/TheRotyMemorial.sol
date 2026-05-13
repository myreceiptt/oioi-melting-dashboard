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
 * @title TheRotyMemorial
 * @notice Collection contract for The ROTY BASE and The ROTY dETH.
 * @dev ROTY-specific Merkle whitelist and public mint logic will be added next.
 */
contract TheRotyMemorial is MemorialNFTCore {
    uint256 public constant ORIGIN_CHAIN_ID = 137;
    address public constant ORIGIN_CONTRACT =
        0x6D2723Cb02c558cF67473Dc959aC08737b6129a9;
    string public constant ORIGIN_NAME = "THE ROTY BROI";

    uint256 public constant ROTY_MAX_SUPPLY = 1047;
    uint256 public constant ROTY_MAX_MINT_PER_TX = 11;
    uint96 public constant ROTY_ROYALTY_FEE = 1_100;

    bytes32 public merkleRoot;

    constructor(
        string memory name_,
        string memory symbol_,
        uint256 mintPrice_,
        bytes32 merkleRoot_,
        address payable treasury_,
        address royaltyReceiver_,
        string memory unrevealedURI_,
        string memory revealedBaseURI_,
        address initialOwner_
    )
        MemorialNFTCore(
            name_,
            symbol_,
            ROTY_MAX_SUPPLY,
            ROTY_MAX_MINT_PER_TX,
            mintPrice_,
            treasury_,
            unrevealedURI_,
            revealedBaseURI_,
            ".json",
            royaltyReceiver_,
            ROTY_ROYALTY_FEE,
            initialOwner_
        )
    {
        merkleRoot = merkleRoot_;
    }
}
