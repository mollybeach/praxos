// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IIdentity
 * @notice Simplified interface for ONCHAINID identity contracts
 * @dev The vault must have its own ONCHAINID to hold ERC-3643 tokens
 */
interface IIdentity {
    /**
     * @notice Get the management key (owner) of the identity
     * @return The address that can manage this identity
     */
    function keyHasPurpose(bytes32 key, uint256 purpose) external view returns (bool);

    /**
     * @notice Check if an identity is valid
     * @return True if identity is valid
     */
    function isClaimed() external view returns (bool);
}

