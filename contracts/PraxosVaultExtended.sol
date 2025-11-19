// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {PraxosVault} from "./PraxosVault.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title PraxosVaultExtended
 * @notice Extended version of PraxosVault with APR storage
 * @dev This shows how to add APR and metadata URI to the base vault
 * 
 * NOTE: This is an example. To use this, you would need to:
 * 1. Deploy this contract instead of PraxosVault
 * 2. Update PraxosFactory to deploy PraxosVaultExtended
 * 3. Or create a new factory that uses this extended version
 */
contract PraxosVaultExtended is PraxosVault {
    uint256 public aprBps; // APR in basis points (542 = 5.42%)
    string public description; // Vault description
    string public metadataURI; // IPFS hash or API endpoint for full metadata
    
    event APRUpdated(uint256 newAPR);
    event DescriptionUpdated(string newDescription);
    event MetadataURIUpdated(string newURI);

    constructor(
        ERC20 asset,
        string memory name,
        string memory symbol,
        string memory strategy_,
        uint8 riskTier_,
        uint256 targetDuration_,
        uint256 aprBps_,
        string memory description_
    ) PraxosVault(asset, name, symbol, strategy_, riskTier_, targetDuration_) {
        aprBps = aprBps_;
        description = description_;
    }

    /**
     * @notice Update the APR for this vault
     * @param _aprBps APR in basis points (542 = 5.42%)
     */
    function setAPR(uint256 _aprBps) external onlyOwner {
        require(_aprBps <= 10000, "APR cannot exceed 100%");
        aprBps = _aprBps;
        emit APRUpdated(_aprBps);
    }

    /**
     * @notice Update the vault description
     * @param _description New description
     */
    function setDescription(string memory _description) external onlyOwner {
        description = _description;
        emit DescriptionUpdated(_description);
    }

    /**
     * @notice Set metadata URI (IPFS hash or API endpoint)
     * @param _uri IPFS hash (e.g., "ipfs://Qm...") or API URL
     */
    function setMetadataURI(string memory _uri) external onlyOwner {
        metadataURI = _uri;
        emit MetadataURIUpdated(_uri);
    }

    /**
     * @notice Get extended vault info including APR
     * @return strategy The strategy identifier
     * @return risk The risk tier
     * @return duration The target duration
     * @return assetCount The number of assets
     * @return apr The APR in basis points
     */
    function getExtendedVaultInfo() external view returns (
        string memory strategy,
        uint8 risk,
        uint256 duration,
        uint256 assetCount,
        uint256 apr
    ) {
        (strategy, risk, duration, assetCount) = this.getVaultInfo();
        apr = aprBps;
    }
}

