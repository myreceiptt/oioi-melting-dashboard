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

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {
    ERC721Royalty
} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {
    ReentrancyGuard
} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

import {IERC20Minimal} from "../interfaces/IERC20Minimal.sol";

/**
 * @title MemorialNFTCore
 * @notice Shared ERC721 core for the OiOi Melting Dashboard NFT collections.
 * @dev This contract intentionally contains only shared NFT mechanics:
 * metadata, mint accounting, royalty, treasury forwarding, and owner controls.
 *
 * Collection-specific mint access rules belong in child contracts:
 * - TheRotyMemorial: Merkle whitelist + public mint
 * - MeltingMemorial: staking-gated paid mint
 * - AmandaMemorial: staking-gated paid mint
 */
abstract contract MemorialNFTCore is
    ERC721Royalty,
    Ownable2Step,
    ReentrancyGuard
{
    using Strings for uint256;

    string public constant BUILD_STAGE = "CORE_V1";

    uint96 public constant MAX_ROYALTY_FEE_NUMERATOR = 1_100; // 11%

    uint256 public immutable maxSupply;
    uint256 public immutable maxMintPerTx;

    uint256 public totalMinted;
    uint256 public mintPrice;

    address payable public treasury;

    bool public revealed;
    bool public metadataLocked;

    string public unrevealedURI;
    string public revealedBaseURI;
    string public baseExtension;

    event TokensMinted(
        address indexed operator,
        address indexed to,
        uint256 quantity,
        uint256 indexed firstTokenId
    );

    event PaidMint(
        address indexed operator,
        address indexed to,
        uint256 quantity,
        uint256 indexed firstTokenId,
        uint256 paidAmount
    );

    event MintPriceUpdated(uint256 oldPrice, uint256 newPrice);
    event TreasuryUpdated(
        address indexed oldTreasury,
        address indexed newTreasury
    );
    event RevealedUpdated(bool revealed);
    event MetadataLocked();
    event UnrevealedURIUpdated(string newUnrevealedURI);
    event RevealedBaseURIUpdated(string newRevealedBaseURI);
    event BaseExtensionUpdated(string newBaseExtension);
    event DefaultRoyaltyUpdated(address indexed receiver, uint96 feeNumerator);
    event ETHRescued(address indexed to, uint256 amount);
    event ERC20Rescued(
        address indexed token,
        address indexed to,
        uint256 amount
    );

    error InvalidAddress();
    error InvalidSupply();
    error InvalidQuantity();
    error MaxMintPerTxExceeded();
    error MaxSupplyExceeded();
    error InvalidPayment(uint256 received, uint256 expected);
    error TreasuryTransferFailed();
    error MetadataIsLocked();
    error MetadataNotRevealed();
    error EmptyURI();
    error TokenDoesNotExist(uint256 tokenId);
    error RoyaltyTooHigh(uint96 feeNumerator, uint96 maxFeeNumerator);
    error InsufficientBalance();
    error ERC20TransferFailed();

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
    ) ERC721(name_, symbol_) Ownable(initialOwner_) {
        if (initialOwner_ == address(0)) revert InvalidAddress();
        if (treasury_ == address(0)) revert InvalidAddress();
        if (royaltyReceiver_ == address(0)) revert InvalidAddress();

        if (maxSupply_ == 0) revert InvalidSupply();
        if (maxMintPerTx_ == 0 || maxMintPerTx_ > maxSupply_) {
            revert InvalidSupply();
        }

        if (bytes(unrevealedURI_).length == 0) revert EmptyURI();
        if (bytes(baseExtension_).length == 0) revert EmptyURI();

        _validateRoyaltyFee(royaltyFeeNumerator_);

        maxSupply = maxSupply_;
        maxMintPerTx = maxMintPerTx_;
        mintPrice = mintPrice_;
        treasury = treasury_;

        unrevealedURI = unrevealedURI_;
        revealedBaseURI = revealedBaseURI_;
        baseExtension = baseExtension_;

        _setDefaultRoyalty(royaltyReceiver_, royaltyFeeNumerator_);
    }

    function totalSupply() external view returns (uint256) {
        return totalMinted;
    }

    function nextTokenId() external view returns (uint256) {
        if (totalMinted >= maxSupply) {
            return 0;
        }

        return totalMinted + 1;
    }

    function remainingSupply() external view returns (uint256) {
        return maxSupply - totalMinted;
    }

    function exists(uint256 tokenId) public view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }

    function tokenURI(
        uint256 tokenId
    ) public view virtual override returns (string memory) {
        if (!exists(tokenId)) revert TokenDoesNotExist(tokenId);

        if (!revealed) {
            return unrevealedURI;
        }

        return
            string.concat(revealedBaseURI, tokenId.toString(), baseExtension);
    }

    function publicMintCost(uint256 quantity) external view returns (uint256) {
        return _requiredPayment(quantity);
    }

    function setMintPrice(uint256 newMintPrice) external onlyOwner {
        uint256 oldMintPrice = mintPrice;
        mintPrice = newMintPrice;

        emit MintPriceUpdated(oldMintPrice, newMintPrice);
    }

    function setTreasury(address payable newTreasury) external onlyOwner {
        if (newTreasury == address(0)) revert InvalidAddress();

        address oldTreasury = treasury;
        treasury = newTreasury;

        emit TreasuryUpdated(oldTreasury, newTreasury);
    }

    function setRevealed(bool newRevealed) external onlyOwner {
        if (metadataLocked) revert MetadataIsLocked();

        if (newRevealed && bytes(revealedBaseURI).length == 0) {
            revert EmptyURI();
        }

        revealed = newRevealed;

        emit RevealedUpdated(newRevealed);
    }

    function setUnrevealedURI(
        string calldata newUnrevealedURI
    ) external onlyOwner {
        if (metadataLocked) revert MetadataIsLocked();
        if (bytes(newUnrevealedURI).length == 0) revert EmptyURI();

        unrevealedURI = newUnrevealedURI;

        emit UnrevealedURIUpdated(newUnrevealedURI);
    }

    function setRevealedBaseURI(
        string calldata newRevealedBaseURI
    ) external onlyOwner {
        if (metadataLocked) revert MetadataIsLocked();
        if (bytes(newRevealedBaseURI).length == 0) revert EmptyURI();

        revealedBaseURI = newRevealedBaseURI;

        emit RevealedBaseURIUpdated(newRevealedBaseURI);
    }

    function setBaseExtension(
        string calldata newBaseExtension
    ) external onlyOwner {
        if (metadataLocked) revert MetadataIsLocked();
        if (bytes(newBaseExtension).length == 0) revert EmptyURI();

        baseExtension = newBaseExtension;

        emit BaseExtensionUpdated(newBaseExtension);
    }

    function lockMetadata() external onlyOwner {
        if (metadataLocked) revert MetadataIsLocked();
        if (!revealed) revert MetadataNotRevealed();
        if (bytes(revealedBaseURI).length == 0) revert EmptyURI();

        metadataLocked = true;

        emit MetadataLocked();
    }

    function setDefaultRoyalty(
        address receiver,
        uint96 feeNumerator
    ) external onlyOwner {
        if (receiver == address(0)) revert InvalidAddress();

        _validateRoyaltyFee(feeNumerator);
        _setDefaultRoyalty(receiver, feeNumerator);

        emit DefaultRoyaltyUpdated(receiver, feeNumerator);
    }

    function rescueETH(
        address payable to,
        uint256 amount
    ) external onlyOwner nonReentrant {
        if (to == address(0)) revert InvalidAddress();
        if (amount > address(this).balance) revert InsufficientBalance();

        (bool success, ) = to.call{value: amount}("");
        if (!success) revert TreasuryTransferFailed();

        emit ETHRescued(to, amount);
    }

    function rescueERC20(
        address token,
        address to,
        uint256 amount
    ) external onlyOwner nonReentrant {
        if (token == address(0) || to == address(0)) revert InvalidAddress();

        bool success = IERC20Minimal(token).transfer(to, amount);
        if (!success) revert ERC20TransferFailed();

        emit ERC20Rescued(token, to, amount);
    }

    function _mintSequential(
        address to,
        uint256 quantity
    ) internal returns (uint256 firstTokenId) {
        _validateMintRequest(to, quantity);

        firstTokenId = totalMinted + 1;
        totalMinted += quantity;

        uint256 endTokenId = firstTokenId + quantity;

        for (uint256 tokenId = firstTokenId; tokenId < endTokenId; tokenId++) {
            _safeMint(to, tokenId);
        }

        emit TokensMinted(_msgSender(), to, quantity, firstTokenId);
    }

    function _paidMint(
        address to,
        uint256 quantity
    ) internal returns (uint256 firstTokenId) {
        uint256 totalPrice = _requiredPayment(quantity);

        if (msg.value != totalPrice) {
            revert InvalidPayment(msg.value, totalPrice);
        }

        firstTokenId = _mintSequential(to, quantity);

        _forwardPayment(totalPrice);

        emit PaidMint(_msgSender(), to, quantity, firstTokenId, totalPrice);
    }

    function _requiredPayment(
        uint256 quantity
    ) internal view returns (uint256) {
        return mintPrice * quantity;
    }

    function _validateMintRequest(address to, uint256 quantity) internal view {
        if (to == address(0)) revert InvalidAddress();
        if (quantity == 0) revert InvalidQuantity();

        if (quantity > maxMintPerTx) {
            revert MaxMintPerTxExceeded();
        }

        if (totalMinted + quantity > maxSupply) {
            revert MaxSupplyExceeded();
        }
    }

    function _forwardPayment(uint256 amount) internal {
        if (amount == 0) {
            return;
        }

        (bool success, ) = treasury.call{value: amount}("");
        if (!success) revert TreasuryTransferFailed();
    }

    function _validateRoyaltyFee(uint96 feeNumerator) internal pure {
        if (feeNumerator > MAX_ROYALTY_FEE_NUMERATOR) {
            revert RoyaltyTooHigh(feeNumerator, MAX_ROYALTY_FEE_NUMERATOR);
        }
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC721Royalty) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    receive() external payable {}
}
