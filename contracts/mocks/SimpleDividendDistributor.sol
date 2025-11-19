// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IDividendDistributor} from "../interfaces/IDividendDistributor.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SimpleDividendDistributor
 * @notice Simple dividend distributor for ERC-3643 tokens (Pull scenario)
 * @dev Institutions deposit dividends here, and vaults can claim them
 */
contract SimpleDividendDistributor is IDividendDistributor, Ownable {
    // RWA token => claimer => claimable amount
    mapping(address => mapping(address => uint256)) public claimableDividends;
    
    // RWA token => total deposited
    mapping(address => uint256) public totalDeposited;
    
    IERC20 public immutable dividendToken; // Usually USDC

    event DividendsDeposited(address indexed rwaToken, uint256 amount);
    event DividendsClaimed(address indexed rwaToken, address indexed claimer, uint256 amount);

    constructor(address _dividendToken) Ownable(msg.sender) {
        dividendToken = IERC20(_dividendToken);
    }

    /**
     * @notice Deposit dividends for an RWA token
     * @dev Called by institutions to distribute dividends
     * @param rwaToken The RWA token address
     * @param amount The dividend amount
     */
    function depositDividends(address rwaToken, uint256 amount) external {
        require(amount > 0, "Amount must be > 0");
        dividendToken.transferFrom(msg.sender, address(this), amount);
        
        // Distribute to all holders proportionally
        // In a real implementation, you'd track balances and distribute accordingly
        // For simplicity, we'll allow vaults to claim based on their balance
        totalDeposited[rwaToken] += amount;
        emit DividendsDeposited(rwaToken, amount);
    }

    /**
     * @notice Claim dividends for a specific RWA token
     */
    function claimDividends(address rwaToken, address claimer) external override returns (uint256) {
        uint256 claimable = claimableDividends[rwaToken][claimer];
        if (claimable > 0) {
            claimableDividends[rwaToken][claimer] = 0;
            dividendToken.transfer(claimer, claimable);
            emit DividendsClaimed(rwaToken, claimer, claimable);
            return claimable;
        }
        return 0;
    }

    /**
     * @notice Get claimable dividends
     */
    function getClaimableDividends(address rwaToken, address claimer) external view override returns (uint256) {
        return claimableDividends[rwaToken][claimer];
    }

    /**
     * @notice Check if dividends are available
     */
    function hasClaimableDividends(address rwaToken, address claimer) external view override returns (bool) {
        return claimableDividends[rwaToken][claimer] > 0;
    }

    /**
     * @notice Set claimable dividends for a claimer (called by RWA token or admin)
     * @dev In production, this would be calculated based on token balance
     */
    function setClaimableDividends(
        address rwaToken,
        address claimer,
        uint256 amount
    ) external onlyOwner {
        claimableDividends[rwaToken][claimer] = amount;
    }
}

