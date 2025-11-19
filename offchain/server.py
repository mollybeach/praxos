#!/usr/bin/env python3
"""
Praxos Backend Server
Exposes AI models and vault generation via REST API for frontend integration
"""

try:
    from flask import Flask, request, jsonify  # type: ignore
    from flask_cors import CORS  # type: ignore
except ImportError:
    raise ImportError("Please install flask and flask-cors: pip install flask flask-cors")
import json
from typing import List, Dict
from simulation.risk_model import RiskSimulator, RiskSignature
from ai_engine.allocation_engine import PraxosAIEngine, VaultStrategy
from ai_agent.suggestion_engine import PraxosAIAgent, VaultRecommendation
from vault_generator import VaultGenerator

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend

# Initialize components
risk_simulator = RiskSimulator()
ai_engine = PraxosAIEngine(risk_simulator)
ai_agent = PraxosAIAgent(ai_engine)
vault_generator = VaultGenerator()


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "service": "Praxos AI Backend"})


@app.route('/api/vaults/generate', methods=['POST'])
def generate_vaults():
    """
    Generate vault strategies from RWA tokens
    
    Request body:
    {
        "rwa_tokens": [
            {
                "address": "0x...",
                "asset_type": "corporate-bond",
                "annual_yield": 500,
                "maturity_timestamp": 1234567890,
                "risk_tier": 2
            }
        ],
        "strategy_types": ["conservative-short-term", "balanced-diversified"]  # optional
    }
    
    Returns:
    {
        "strategies": [
            {
                "strategy_id": "...",
                "name": "...",
                "risk_tier": 3,
                "target_duration": 1095,
                "assets": ["0x..."],
                "weights": [6000, 4000],
                "expected_yield": 6.5,
                "diversification_score": 85.0
            }
        ]
    }
    """
    try:
        data = request.get_json()
        rwa_tokens = data.get('rwa_tokens', [])
        strategy_types = data.get('strategy_types', None)
        
        if not rwa_tokens:
            return jsonify({"error": "rwa_tokens is required"}), 400
        
        # Generate strategies
        strategies = vault_generator.process_rwa_tokens(rwa_tokens)
        
        # Filter by strategy types if provided
        if strategy_types:
            strategies = [s for s in strategies if s.strategy_id in strategy_types]
        
        # Convert to JSON-serializable format
        result = {
            "strategies": [
                {
                    "strategy_id": s.strategy_id,
                    "name": s.name,
                    "risk_tier": s.risk_tier,
                    "target_duration": s.target_duration,
                    "assets": s.assets,
                    "weights": s.weights,
                    "expected_yield": getattr(s, 'expected_yield', 0.0),
                    "diversification_score": s.diversification_score
                }
                for s in strategies
            ]
        }
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/vaults/recommend', methods=['POST'])
def recommend_vaults():
    """
    Get AI-powered vault recommendations based on user preferences
    
    Request body:
    {
        "user_risk_tolerance": 3,  # 1-5
        "investment_horizon_days": 365,
        "target_yield_bps": 600,  # basis points
        "available_rwa_tokens": [...]  # same format as generate_vaults
    }
    
    Returns:
    {
        "recommendations": [
            {
                "vault_strategy": {...},  # strategy object
                "match_score": 0.95,
                "reasoning": "..."
            }
        ]
    }
    """
    try:
        data = request.get_json()
        user_risk = data.get('user_risk_tolerance', 3)
        horizon = data.get('investment_horizon_days', 365)
        target_yield = data.get('target_yield_bps', 600)
        rwa_tokens = data.get('available_rwa_tokens', [])
        
        if not rwa_tokens:
            return jsonify({"error": "available_rwa_tokens is required"}), 400
        
        # Generate strategies first
        strategies = vault_generator.process_rwa_tokens(rwa_tokens)
        
        # Convert strategies to vault registry format
        for strategy in strategies:
            ai_agent.register_vault({
                "address": strategy.assets[0] if strategy.assets else "0x0",  # Use first asset as placeholder
                "name": strategy.name,
                "risk_tier": strategy.risk_tier,
                "target_duration": strategy.target_duration,
                "expected_yield": getattr(strategy, 'expected_yield', 0.0),
                "strategy": strategy.strategy_id,
                "assets": strategy.assets
            })
        
        # Create user preferences
        from ai_agent.suggestion_engine import UserPreferences, RiskTolerance, Timeframe
        
        # Map risk tolerance
        risk_map = {1: RiskTolerance.CONSERVATIVE, 2: RiskTolerance.MODERATE, 
                    3: RiskTolerance.BALANCED, 4: RiskTolerance.GROWTH, 5: RiskTolerance.AGGRESSIVE}
        user_risk_enum = risk_map.get(user_risk, RiskTolerance.BALANCED)
        
        # Map timeframe
        if horizon <= 365:
            timeframe = Timeframe.SHORT_TERM
        elif horizon <= 1095:
            timeframe = Timeframe.MEDIUM_TERM
        else:
            timeframe = Timeframe.LONG_TERM
        
        user_prefs = UserPreferences(
            timeframe=timeframe,
            risk_tolerance=user_risk_enum,
            amount=10000.0,  # Default amount
            min_yield=target_yield / 100.0 if target_yield else None
        )
        
        # Get recommendations
        recommendations = ai_agent.suggest_vaults(user_prefs)
        
        # Convert to JSON-serializable format
        result = {
            "recommendations": [
                {
                    "vault_address": rec.vault_address,
                    "vault_name": rec.vault_name,
                    "match_score": rec.match_score,
                    "risk_tier": rec.risk_tier,
                    "expected_yield": rec.expected_yield,
                    "timeframe_match": rec.timeframe_match,
                    "reasoning": rec.reasoning
                }
                for rec in recommendations
            ]
        }
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/risk/analyze', methods=['POST'])
def analyze_risk():
    """
    Analyze risk for a single RWA token
    
    Request body:
    {
        "asset_address": "0x...",
        "asset_type": "corporate-bond",
        "annual_yield": 500,
        "maturity_timestamp": 1234567890,
        "risk_tier": 2
    }
    
    Returns:
    {
        "risk_signature": {
            "asset_address": "0x...",
            "asset_type": "...",
            "risk_score": 0.65,
            "volatility": 0.12,
            "liquidity_score": 0.8,
            ...
        }
    }
    """
    try:
        data = request.get_json()
        
        signature = risk_simulator.simulate_risk(
            asset_address=data.get('asset_address'),
            asset_type=data.get('asset_type'),
            annual_yield=data.get('annual_yield'),
            maturity_timestamp=data.get('maturity_timestamp', 0),
            risk_tier=data.get('risk_tier', 3)
        )
        
        # Convert to dict
        result = {
            "risk_signature": {
                "asset_address": signature.asset_address,
                "asset_type": signature.asset_type,
                "risk_score": signature.risk_score,
                "volatility": signature.volatility,
                "liquidity_score": signature.liquidity_score,
                "credit_score": signature.credit_score,
                "correlation_factors": signature.correlation_factors
            }
        }
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    print("🚀 Starting Praxos AI Backend Server...")
    print("📡 API endpoints:")
    print("   GET  /health")
    print("   POST /api/vaults/generate")
    print("   POST /api/vaults/recommend")
    print("   POST /api/risk/analyze")
    print("\n🌐 Server running on http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)

