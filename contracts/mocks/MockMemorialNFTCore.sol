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

import {MemorialNFTCore} from "../nft/MemorialNFTCore.sol";

contract MockMemorialNFTCore is MemorialNFTCore {
    constructor(
        string memory name_,
        string memory symbol_,
        uint256 maxSupply_,
        uint256 maxMintPerTx_,
        uint256 mintPrice_,
        address payable treasury_,
        string memory unrevealedURI_,
        string memory revealedBaseURI_,
        string memory baseExtension_,
        address royaltyReceiver_,
        uint96 royaltyFeeNumerator_,
        address initialOwner_
    )
        MemorialNFTCore(
            name_,
            symbol_,
            maxSupply_,
            maxMintPerTx_,
            mintPrice_,
            treasury_,
            unrevealedURI_,
            revealedBaseURI_,
            baseExtension_,
            royaltyReceiver_,
            royaltyFeeNumerator_,
            initialOwner_
        )
    {}

    function ownerMint(
        address to,
        uint256 quantity
    ) external onlyOwner returns (uint256) {
        return _mintSequential(to, quantity);
    }

    function paidMint(
        uint256 quantity
    ) external payable nonReentrant returns (uint256) {
        return _paidMint(msg.sender, quantity);
    }
}
