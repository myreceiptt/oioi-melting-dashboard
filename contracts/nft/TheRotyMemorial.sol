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

import {
    MerkleProof
} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

import {MemorialNFTCore} from "./MemorialNFTCore.sol";

/**
 * @title TheRotyMemorial
 * @notice Collection contract for ROTY BASE and ROTY dETH.
 * @dev One codebase, two deployments:
 * - Base: ROTY BASE / ROTYBASE
 * - Ethereum: ROTY dETH / ROTYDETH
 *
 * Whitelist leaf format follows OpenZeppelin StandardMerkleTree:
 * leaf = keccak256(bytes.concat(keccak256(abi.encode(account))))
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

    bool public whitelistMintEnabled;
    bool public publicMintEnabled;

    mapping(address => bool) public whitelistClaimed;

    event MerkleRootUpdated(
        bytes32 indexed oldMerkleRoot,
        bytes32 indexed newMerkleRoot
    );
    event WhitelistMintEnabledUpdated(bool enabled);
    event PublicMintEnabledUpdated(bool enabled);
    event WhitelistMinted(address indexed minter, uint256 indexed tokenId);
    event PublicMinted(
        address indexed minter,
        uint256 quantity,
        uint256 indexed firstTokenId
    );

    error WhitelistMintClosed();
    error PublicMintClosed();
    error EmptyMerkleRoot();
    error AlreadyClaimedWhitelist();
    error InvalidMerkleProof();

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

    function setMerkleRoot(bytes32 newMerkleRoot) external onlyOwner {
        bytes32 oldMerkleRoot = merkleRoot;
        merkleRoot = newMerkleRoot;

        emit MerkleRootUpdated(oldMerkleRoot, newMerkleRoot);
    }

    function setWhitelistMintEnabled(bool enabled) external onlyOwner {
        whitelistMintEnabled = enabled;

        emit WhitelistMintEnabledUpdated(enabled);
    }

    function setPublicMintEnabled(bool enabled) external onlyOwner {
        publicMintEnabled = enabled;

        emit PublicMintEnabledUpdated(enabled);
    }

    function whitelistMint(
        bytes32[] calldata proof
    ) external nonReentrant returns (uint256 tokenId) {
        if (!whitelistMintEnabled) revert WhitelistMintClosed();
        if (merkleRoot == bytes32(0)) revert EmptyMerkleRoot();
        if (whitelistClaimed[msg.sender]) revert AlreadyClaimedWhitelist();

        bytes32 leaf = whitelistLeaf(msg.sender);

        if (!MerkleProof.verify(proof, merkleRoot, leaf)) {
            revert InvalidMerkleProof();
        }

        whitelistClaimed[msg.sender] = true;

        tokenId = _mintSequential(msg.sender, 1);

        emit WhitelistMinted(msg.sender, tokenId);
    }

    function publicMint(
        uint256 quantity
    ) external payable nonReentrant returns (uint256 firstTokenId) {
        if (!publicMintEnabled) revert PublicMintClosed();

        firstTokenId = _paidMint(msg.sender, quantity);

        emit PublicMinted(msg.sender, quantity, firstTokenId);
    }

    function whitelistLeaf(address account) public pure returns (bytes32) {
        return keccak256(bytes.concat(keccak256(abi.encode(account))));
    }
}
