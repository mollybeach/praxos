"""
Example API endpoints for storing and retrieving vault metadata
This shows how to link on-chain vaults with off-chain metadata
"""

from flask import Flask, request, jsonify
from typing import Dict, List, Optional

# In-memory storage (in production, use a database)
vault_metadata_db: Dict[str, Dict] = {}

def register_vault_metadata_endpoints(app: Flask):
    """
    Register vault metadata API endpoints
    Add these to your existing Flask app
    """
    
    @app.route('/api/vaults/<vault_address>/metadata', methods=['GET'])
    def get_vault_metadata(vault_address: str):
        """
        Get metadata for a specific vault
        
        Returns:
        {
            "vaultAddress": "0x...",
            "description": "Diversified exposure...",
            "apr": 5.42,
            "isNew": true,
            "assets": [
                {
                    "address": "0x...",
                    "name": "BL",
                    "type": "bond",
                    "provider": "BlackRock",
                    "country": "US",
                    "rating": "AAA",
                    "description": "US Treasury"
                }
            ]
        }
        """
        metadata = vault_metadata_db.get(vault_address.lower())
        if not metadata:
            return jsonify({"error": "Vault metadata not found"}), 404
        
        return jsonify(metadata)
    
    @app.route('/api/vaults/<vault_address>/metadata', methods=['POST'])
    def set_vault_metadata(vault_address: str):
        """
        Store metadata for a vault
        
        Request body:
        {
            "description": "Diversified exposure...",
            "apr": 5.42,
            "isNew": true,
            "assets": [
                {
                    "address": "0x...",
                    "name": "BL",
                    "type": "bond",
                    "provider": "BlackRock",
                    "country": "US",
                    "rating": "AAA",
                    "description": "US Treasury"
                }
            ]
        }
        """
        data = request.get_json()
        
        vault_metadata_db[vault_address.lower()] = {
            "vaultAddress": vault_address,
            "description": data.get("description", ""),
            "apr": data.get("apr", 0),
            "isNew": data.get("isNew", False),
            "assets": data.get("assets", []),
        }
        
        return jsonify({"status": "success", "vaultAddress": vault_address})
    
    @app.route('/api/vaults/metadata/batch', methods=['POST'])
    def get_batch_vault_metadata():
        """
        Get metadata for multiple vaults at once
        
        Request body:
        {
            "vaultAddresses": ["0x...", "0x..."]
        }
        
        Returns:
        {
            "0x...": {
                "description": "...",
                "apr": 5.42,
                ...
            },
            "0x...": {
                ...
            }
        }
        """
        data = request.get_json()
        addresses = data.get("vaultAddresses", [])
        
        result = {}
        for addr in addresses:
            metadata = vault_metadata_db.get(addr.lower())
            if metadata:
                result[addr] = metadata
        
        return jsonify(result)

