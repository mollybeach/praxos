// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IPriceOracle} from "../interfaces/IPriceOracle.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SimplePriceOracle
 * @notice Simple price oracle implementation for RWA tokens
 * @dev In production, this would integrate with Chainlink, Uniswap, or custom oracles
 */
contract SimplePriceOracle is IPriceOracle, Ownable {
    mapping(address => uint256) public prices; // RWA token => price in USDC (18 decimals)
    
    event PriceUpdated(address indexed token, uint256 oldPrice, uint256 newPrice);

    constructor() Ownable(msg.sender) {}

    /**
     * @notice Get the price of an RWA token in USDC
     */
    function getPrice(address rwaToken) external view override returns (uint256) {
        uint256 price = prices[rwaToken];
        require(price > 0, "Price not set");
        return price;
    }

    /**
     * @notice Get prices for multiple RWA tokens
     */
    function getPrices(address[] calldata rwaTokens) external view override returns (uint256[] memory) {
        uint256[] memory result = new uint256[](rwaTokens.length);
        for (uint256 i = 0; i < rwaTokens.length; i++) {
            result[i] = prices[rwaTokens[i]];
        }
        return result;
    }

    /**
     * @notice Update price for an RWA token
     */
    function updatePrice(address rwaToken, uint256 price) external override onlyOwner {
        require(price > 0, "Price must be > 0");
        uint256 oldPrice = prices[rwaToken];
        prices[rwaToken] = price;
        emit PriceUpdated(rwaToken, oldPrice, price);
    }

    /**
     * @notice Batch update prices
     */
    function updatePrices(address[] calldata rwaTokens, uint256[] calldata newPrices) external onlyOwner {
        require(rwaTokens.length == newPrices.length, "Arrays length mismatch");
        for (uint256 i = 0; i < rwaTokens.length; i++) {
            require(newPrices[i] > 0, "Price must be > 0");
            prices[rwaTokens[i]] = newPrices[i];
        }
    }
}

