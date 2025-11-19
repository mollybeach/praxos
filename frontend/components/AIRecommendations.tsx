'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api';
import type { VaultRecommendation, RwaToken } from '@/types';

export function AIRecommendations() {
  const [riskTolerance, setRiskTolerance] = useState(3);
  const [horizon, setHorizon] = useState(365);
  const [targetYield, setTargetYield] = useState(600);
  const [recommendations, setRecommendations] = useState<VaultRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock RWA tokens - in production, fetch from contracts
  const mockRwaTokens: RwaToken[] = [
    {
      address: '0x...',
      asset_type: 'corporate-bond',
      annual_yield: 500,
      maturity_timestamp: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,
      risk_tier: 2,
    },
    {
      address: '0x...',
      asset_type: 'real-estate',
      annual_yield: 700,
      maturity_timestamp: Math.floor(Date.now() / 1000) + 1825 * 24 * 60 * 60,
      risk_tier: 3,
    },
  ];

  const handleGetRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getRecommendations({
        user_risk_tolerance: riskTolerance,
        investment_horizon_days: horizon,
        target_yield_bps: targetYield,
        available_rwa_tokens: mockRwaTokens,
      });
      setRecommendations(response.recommendations);
    } catch (err: any) {
      setError(err.message || 'Failed to get recommendations');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">AI Vault Recommendations</h2>
      
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Risk Tolerance: {riskTolerance}
          </label>
          <input
            type="range"
            min="1"
            max="5"
            value={riskTolerance}
            onChange={(e) => setRiskTolerance(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Conservative</span>
            <span>Aggressive</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Investment Horizon (days)
          </label>
          <input
            type="number"
            value={horizon}
            onChange={(e) => setHorizon(Number(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            min="1"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Target Yield (basis points): {targetYield}
          </label>
          <input
            type="range"
            min="0"
            max="2000"
            step="100"
            value={targetYield}
            onChange={(e) => setTargetYield(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <button
          onClick={handleGetRecommendations}
          disabled={loading}
          className="w-full px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors"
        >
          {loading ? 'Getting Recommendations...' : 'Get AI Recommendations'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {recommendations.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-900">Recommended Vaults</h3>
          {recommendations.map((rec, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-gray-900">{rec.vault_name}</h4>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                  {rec.match_score.toFixed(1)}% match
                </span>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <p>Risk Tier: {rec.risk_tier}</p>
                <p>Expected Yield: {rec.expected_yield.toFixed(2)}%</p>
                <p className="mt-2 text-gray-700">{rec.reasoning}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

