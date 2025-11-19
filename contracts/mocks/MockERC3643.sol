// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC3643} from "../interfaces/IERC3643.sol";

/**
 * @title MockERC3643
 * @notice Mock implementation of ERC-3643 RWA token for testing
 * @dev Simplified version without full compliance features for hackathon demo
 */
contract MockERC3643 is ERC20, IERC3643 {
    string private _assetType;
    uint256 private _maturityDate;
    uint256 private _annualYield; // in basis points (500 = 5%)
    uint8 private _riskTier; // 1-5, where 1 is lowest risk

    constructor(
        string memory name,
        string memory symbol,
        string memory assetType_,
        uint256 maturityDate_,
        uint256 annualYield_,
        uint8 riskTier_,
        uint256 initialSupply
    ) ERC20(name, symbol) {
        _assetType = assetType_;
        _maturityDate = maturityDate_;
        _annualYield = annualYield_;
        _riskTier = riskTier_;
        _mint(msg.sender, initialSupply);
    }

    function assetType() external view override returns (string memory) {
        return _assetType;
    }

    function maturityDate() external view override returns (uint256) {
        return _maturityDate;
    }

    function annualYield() external view override returns (uint256) {
        return _annualYield;
    }

    function riskTier() external view override returns (uint8) {
        return _riskTier;
    }

    /**
     * @notice Mint tokens for testing (only in mock)
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

