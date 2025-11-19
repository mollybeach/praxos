// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title IERC3643
 * @notice Simplified ERC-3643 interface for RWA tokens
 * @dev Represents tokenized real-world assets with compliance features
 * @dev ERC-3643 tokens are ERC-20 compatible, so this extends IERC20
 */
interface IERC3643 is IERC20 {
    /**
     * @notice Returns the asset type (bond, real estate, startup fund, etc.)
     * @return The asset type identifier
     */
    function assetType() external view returns (string memory);

    /**
     * @notice Returns the maturity date (timestamp)
     * @return The maturity timestamp, 0 if no maturity
     */
    function maturityDate() external view returns (uint256);

    /**
     * @notice Returns the annual yield percentage (basis points, e.g., 500 = 5%)
     * @return The yield in basis points
     */
    function annualYield() external view returns (uint256);

    /**
     * @notice Returns the risk tier (1-5, where 1 is lowest risk)
     * @return The risk tier
     */
    function riskTier() external view returns (uint8);
}

