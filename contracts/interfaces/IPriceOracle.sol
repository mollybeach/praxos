// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IPriceOracle
 * @notice Interface for price oracles to get RWA token prices
 * @dev RWA tokens often don't have real-time public spot prices like ETH
 */
interface IPriceOracle {
    /**
     * @notice Get the price of an RWA token in USDC (with 18 decimals)
     * @param rwaToken The ERC-3643 token address
     * @return price The price in USDC (scaled to 18 decimals)
     */
    function getPrice(address rwaToken) external view returns (uint256 price);

    /**
     * @notice Get prices for multiple RWA tokens
     * @param rwaTokens Array of ERC-3643 token addresses
     * @return prices Array of prices in USDC (scaled to 18 decimals)
     */
    function getPrices(address[] calldata rwaTokens) external view returns (uint256[] memory prices);

    /**
     * @notice Update price for an RWA token (only oracle admin)
     * @param rwaToken The ERC-3643 token address
     * @param price The new price in USDC (scaled to 18 decimals)
     */
    function updatePrice(address rwaToken, uint256 price) external;
}

