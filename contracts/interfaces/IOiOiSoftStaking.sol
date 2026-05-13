// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IOiOiSoftStaking {
    function hasValidStake(
        address user,
        address collection
    ) external view returns (bool);

    function hasValidStakeInCollections(
        address user,
        address[] calldata collections
    ) external view returns (bool);
}
