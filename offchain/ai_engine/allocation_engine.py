#!/usr/bin/env python3
"""
HoneyVaiult AI Allocation Engine
Constructs optimal ERC-4626 vault strategies from risk signatures
"""

from dataclasses import dataclass
from typing import List, Dict, Tuple
from datetime import datetime, timedelta
from simulation.risk_model import RiskSignature, RiskSimulator
import random


@dataclass
class VaultStrategy:
    """Represents a vault allocation strategy"""
    strategy_id: str
    name: str
    risk_tier: int  # Target risk tier (1-5)
    target_duration: int  # Target duration in days
    assets: List[str]  # Asset addresses
    weights: List[int]  # Allocation weights in basis points (10000 = 100%)
    expected_yield: float  # Expected annual yield
    diversification_score: float  # 0-100


class AIAllocationEngine:
    """AI engine that constructs optimal vault strategies"""
    
    # Predefined strategy templates
    STRATEGY_TEMPLATES = {
        "conservative-short-term": {
            "risk_tier": 1,
            "target_duration": 90,
            "max_assets": 5,
            "min_credit_score": 80
        },
        "real-estate-heavy": {
            "risk_tier": 3,
            "target_duration": 1825,  # 5 years
            "max_assets": 4,
            "preferred_types": ["real-estate"]
        },
        "startup-exposure": {
            "risk_tier": 4,
            "target_duration": 0,  # No fixed duration
            "max_assets": 6,
            "preferred_types": ["startup-fund"]
        },
        "balanced-diversified": {
            "risk_tier": 3,
            "target_duration": 1095,  # 3 years
            "max_assets": 8,
            "min_diversification": 5
        },
        "high-yield-long-term": {
            "risk_tier": 5,
            "target_duration": 3650,  # 10 years
            "max_assets": 6,
            "min_yield": 10.0
        }
    }
    
    def __init__(self, risk_simulator: RiskSimulator):
        self.risk_simulator = risk_simulator
        self.generated_strategies: List[VaultStrategy] = []
    
    def generate_vault_strategies(
        self,
        available_assets: List[RiskSignature],
        strategy_types: List[str] = None
    ) -> List[VaultStrategy]:
        """
        Generate vault strategies from available RWA assets
        
        Args:
            available_assets: List of risk signatures for available RWAs
            strategy_types: List of strategy types to generate (None = all)
            
        Returns:
            List of vault strategies
        """
        if strategy_types is None:
            strategy_types = list(self.STRATEGY_TEMPLATES.keys())
        
        strategies = []
        for strategy_type in strategy_types:
            if strategy_type not in self.STRATEGY_TEMPLATES:
                continue
            
            template = self.STRATEGY_TEMPLATES[strategy_type]
            strategy = self._construct_strategy(
                strategy_type,
                template,
                available_assets
            )
            
            if strategy:
                strategies.append(strategy)
                self.generated_strategies.append(strategy)
        
        return strategies
    
    def _construct_strategy(
        self,
        strategy_id: str,
        template: Dict,
        available_assets: List[RiskSignature]
    ) -> VaultStrategy:
        """Construct a single vault strategy"""
        # Filter assets based on template criteria
        candidates = self._filter_assets(available_assets, template)
        
        if len(candidates) == 0:
            return None
        
        # Select assets for diversification
        selected = self._select_assets(candidates, template)
        
        if len(selected) == 0:
            return None
        
        # Calculate optimal weights
        weights = self._calculate_weights(selected, template)
        
        # Calculate expected metrics
        expected_yield = self._calculate_expected_yield(selected, weights)
        diversification_score = self._calculate_diversification(selected)
        
        # Generate human-readable name
        name = self._generate_name(strategy_id, selected)
        
        return VaultStrategy(
            strategy_id=strategy_id,
            name=name,
            risk_tier=template["risk_tier"],
            target_duration=template["target_duration"],
            assets=[sig.asset_address for sig in selected],
            weights=weights,
            expected_yield=expected_yield,
            diversification_score=diversification_score
        )
    
    def _filter_assets(
        self,
        assets: List[RiskSignature],
        template: Dict
    ) -> List[RiskSignature]:
        """Filter assets based on template criteria"""
        candidates = []
        
        for asset in assets:
            # Check risk tier (allow ±1 tier flexibility)
            if abs(asset.risk_tier - template["risk_tier"]) > 1:
                continue
            
            # Check credit score if specified
            if "min_credit_score" in template:
                if asset.credit_score < template["min_credit_score"]:
                    continue
            
            # Check preferred asset types
            if "preferred_types" in template:
                if asset.asset_type not in template["preferred_types"]:
                    # Still allow, but lower priority
                    pass
            
            # Check minimum yield
            if "min_yield" in template:
                if asset.annual_yield < template["min_yield"]:
                    continue
            
            # Check duration alignment
            if template["target_duration"] > 0:
                # Prefer assets with similar duration
                duration_diff = abs(asset.maturity_days - template["target_duration"])
                if duration_diff > template["target_duration"] * 0.5:
                    continue
            
            candidates.append(asset)
        
        return candidates
    
    def _select_assets(
        self,
        candidates: List[RiskSignature],
        template: Dict
    ) -> List[RiskSignature]:
        """Select assets for optimal diversification"""
        max_assets = min(template["max_assets"], len(candidates))
        min_diversification = template.get("min_diversification", 2)
        
        # Prioritize diversification
        selected = []
        asset_types_seen = set()
        
        # First pass: ensure type diversification
        for asset in candidates:
            if len(selected) >= max_assets:
                break
            if asset.asset_type not in asset_types_seen:
                selected.append(asset)
                asset_types_seen.add(asset.asset_type)
        
        # Second pass: fill remaining slots
        for asset in candidates:
            if len(selected) >= max_assets:
                break
            if asset not in selected:
                selected.append(asset)
        
        # Ensure minimum diversification
        if len(selected) < min_diversification:
            selected = candidates[:max(max_assets, min_diversification)]
        
        return selected[:max_assets]
    
    def _calculate_weights(
        self,
        assets: List[RiskSignature],
        template: Dict
    ) -> List[int]:
        """Calculate optimal allocation weights"""
        n = len(assets)
        if n == 0:
            return []
        
        # Base equal weight
        base_weight = 10000 // n
        weights = [base_weight] * n
        
        # Adjust based on risk and yield
        total_score = sum(
            asset.credit_score * 0.4 + asset.annual_yield * 10 * 0.6
            for asset in assets
        )
        
        adjusted_weights = []
        for i, asset in enumerate(assets):
            score = asset.credit_score * 0.4 + asset.annual_yield * 10 * 0.6
            weight = int((score / total_score) * 10000) if total_score > 0 else base_weight
            adjusted_weights.append(weight)
        
        # Normalize to sum to 10000
        total = sum(adjusted_weights)
        if total > 0:
            normalized = [int((w * 10000) / total) for w in adjusted_weights]
            # Adjust for rounding
            diff = 10000 - sum(normalized)
            if diff != 0:
                normalized[0] += diff
            return normalized
        
        return weights
    
    def _calculate_expected_yield(
        self,
        assets: List[RiskSignature],
        weights: List[int]
    ) -> float:
        """Calculate expected annual yield"""
        if len(assets) != len(weights):
            return 0.0
        
        weighted_yield = sum(
            asset.annual_yield * (weight / 10000.0)
            for asset, weight in zip(assets, weights)
        )
        return weighted_yield
    
    def _calculate_diversification(
        self,
        assets: List[RiskSignature]
    ) -> float:
        """Calculate diversification score (0-100)"""
        if len(assets) == 0:
            return 0.0
        
        # Count unique asset types
        unique_types = len(set(asset.asset_type for asset in assets))
        type_diversity = (unique_types / max(5, len(assets))) * 50
        
        # Risk tier spread
        risk_tiers = [asset.risk_tier for asset in assets]
        risk_spread = max(risk_tiers) - min(risk_tiers)
        risk_diversity = min(50, risk_spread * 10)
        
        return min(100, type_diversity + risk_diversity)
    
    def _generate_name(
        self,
        strategy_id: str,
        assets: List[RiskSignature]
    ) -> str:
        """Generate human-readable vault name"""
        name_map = {
            "conservative-short-term": "Conservative Short-Term Vault",
            "real-estate-heavy": "Real Estate Heavy Vault",
            "startup-exposure": "Startup Exposure Vault",
            "balanced-diversified": "Balanced Diversified Vault",
            "high-yield-long-term": "High-Yield Long-Term Vault"
        }
        
        base_name = name_map.get(strategy_id, strategy_id.replace("-", " ").title())
        
        # Add asset count
        if len(assets) > 0:
            base_name += f" ({len(assets)} Assets)"
        
        return base_name
    
    def get_strategy_by_id(self, strategy_id: str) -> VaultStrategy:
        """Get a specific strategy by ID"""
        for strategy in self.generated_strategies:
            if strategy.strategy_id == strategy_id:
                return strategy
        return None


if __name__ == "__main__":
    # Example usage
    from simulation.risk_model import RiskSimulator
    
    simulator = RiskSimulator()
    
    # Simulate some assets
    assets = [
        simulator.simulate_risk(
            "0x111...", "corporate-bond", 500, 
            int((datetime.now() + timedelta(days=365)).timestamp()), 2
        ),
        simulator.simulate_risk(
            "0x222...", "real-estate", 700,
            int((datetime.now() + timedelta(days=1825)).timestamp()), 3
        ),
        simulator.simulate_risk(
            "0x333...", "startup-fund", 1500,
            0, 5
        )
    ]
    
    engine = AIAllocationEngine(simulator)
    strategies = engine.generate_vault_strategies(assets)
    
    for strategy in strategies:
        print(f"\n{strategy.name}:")
        print(f"  Risk Tier: {strategy.risk_tier}")
        print(f"  Expected Yield: {strategy.expected_yield:.2f}%")
        print(f"  Diversification: {strategy.diversification_score:.1f}")
        print(f"  Assets: {len(strategy.assets)}")

