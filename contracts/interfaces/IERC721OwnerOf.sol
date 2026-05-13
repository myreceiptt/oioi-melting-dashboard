// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC721OwnerOf {
    function ownerOf(uint256 tokenId) external view returns (address);
}
