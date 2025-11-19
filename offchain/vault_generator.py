#!/usr/bin/env python3
"""
Praxos Vault Generator
Orchestrates the full pipeline: simulation -> AI allocation -> vault deployment
"""

import json
from typing import List, Dict
from simulation.risk_model import RiskSimulator, RiskSignature
from ai_engine.allocation_engine import PraxosAIEngine, VaultStrategy


class VaultGenerator:
    """Main orchestrator for generating ERC-4626 vaults"""
    
    def __init__(self):
        self.risk_simulator = RiskSimulator()
        self.ai_engine = PraxosAIEngine(self.risk_simulator)
        self.generated_vaults: List[Dict] = []
    
    def process_rwa_tokens(
        self,
        rwa_tokens: List[Dict]
    ) -> List[VaultStrategy]:
        """
        Process RWA tokens through simulation and AI allocation
        
        Args:
            rwa_tokens: List of RWA token metadata:
                {
                    "address": "0x...",
                    "asset_type": "corporate-bond",
                    "annual_yield": 500,  # basis points
                    "maturity_timestamp": 1234567890,
                    "risk_tier": 2
                }
        
        Returns:
            List of generated vault strategies
        """
        # Step 1: Simulate risk for all RWAs
        risk_signatures = []
        for token in rwa_tokens:
            signature = self.risk_simulator.simulate_risk(
                asset_address=token["address"],
                asset_type=token["asset_type"],
                annual_yield=token["annual_yield"],
                maturity_timestamp=token.get("maturity_timestamp", 0),
                risk_tier=token["risk_tier"]
            )
            risk_signatures.append(signature)
        
        # Step 2: Generate vault strategies using AI engine
        strategies = self.ai_engine.generate_vault_strategies(risk_signatures)
        
        # Step 3: Format for deployment
        for strategy in strategies:
            vault_config = {
                "strategy_id": strategy.strategy_id,
                "name": strategy.name,
                "risk_tier": strategy.risk_tier,
                "target_duration": strategy.target_duration,
                "assets": strategy.assets,
                "weights": strategy.weights,
                "expected_yield": strategy.expected_yield,
                "diversification_score": strategy.diversification_score
            }
            self.generated_vaults.append(vault_config)
        
        return strategies
    
    def get_vault_config_for_deployment(
        self,
        strategy_id: str,
        base_asset_address: str,
        vault_name: str = None,
        vault_symbol: str = None
    ) -> Dict:
        """
        Get vault configuration ready for smart contract deployment
        
        Returns:
            Configuration dict compatible with PraxosFactory.createVault()
        """
        strategy = self.ai_engine.get_strategy_by_id(strategy_id)
        if not strategy:
            raise ValueError(f"Strategy {strategy_id} not found")
        
        if vault_name is None:
            vault_name = strategy.name
        if vault_symbol is None:
            vault_symbol = strategy.strategy_id.upper().replace("-", "")
        
        return {
            "baseAsset": base_asset_address,
            "name": vault_name,
            "symbol": vault_symbol,
            "strategy": strategy.strategy_id,
            "riskTier": strategy.risk_tier,
            "targetDuration": strategy.target_duration,
            "assets": strategy.assets,
            "weights": strategy.weights
        }
    
    def export_strategies_json(self, filename: str = "vault_strategies.json"):
        """Export generated strategies to JSON"""
        with open(filename, "w") as f:
            json.dump(self.generated_vaults, f, indent=2)
        print(f"Exported {len(self.generated_vaults)} strategies to {filename}")


if __name__ == "__main__":
    # Example: Generate vaults from RWA tokens
    generator = VaultGenerator()
    
    # Example RWA tokens (would come from on-chain or API in production)
    rwa_tokens = [
        {
            "address": "0x1111111111111111111111111111111111111111",
            "asset_type": "corporate-bond",
            "annual_yield": 500,  # 5%
            "maturity_timestamp": 1735689600,  # 2025-01-01
            "risk_tier": 2
        },
        {
            "address": "0x2222222222222222222222222222222222222222",
            "asset_type": "real-estate",
            "annual_yield": 700,  # 7%
            "maturity_timestamp": 1767225600,  # 2026-01-01
            "risk_tier": 3
        },
        {
            "address": "0x3333333333333333333333333333333333333333",
            "asset_type": "startup-fund",
            "annual_yield": 1500,  # 15%
            "maturity_timestamp": 0,  # No maturity
            "risk_tier": 5
        }
    ]
    
    strategies = generator.process_rwa_tokens(rwa_tokens)
    
    print(f"Generated {len(strategies)} vault strategies:")
    for strategy in strategies:
        print(f"\n{strategy.name}")
        print(f"  Strategy ID: {strategy.strategy_id}")
        print(f"  Risk Tier: {strategy.risk_tier}")
        print(f"  Expected Yield: {strategy.expected_yield:.2f}%")
        print(f"  Assets: {len(strategy.assets)}")
    
    generator.export_strategies_json()

