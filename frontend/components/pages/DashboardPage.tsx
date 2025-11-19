'use client';

import { FindVaultsPanel, type VaultPreferences } from '@/components/FindVaultsPanel';
import { RecommendedVaultsPanel } from '@/components/RecommendedVaultsPanel';
import type { Vault } from '@/types';
import { useState } from 'react';

interface DashboardPageProps {
  onFindVaults: (preferences: VaultPreferences) => Promise<void>;
  recommendedVaults: Vault[];
  onDepositSuccess?: () => void;
}

export function DashboardPage({ onFindVaults, recommendedVaults, onDepositSuccess }: DashboardPageProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 max-w-7xl mx-auto">
      {/* Left Panel - Find Vaults */}
      <div>
        <FindVaultsPanel onFindVaults={onFindVaults} />
      </div>

      {/* Right Panel - Recommended Vaults */}
      <div>
        <RecommendedVaultsPanel
          vaults={recommendedVaults}
          onDepositSuccess={onDepositSuccess}
        />
      </div>
    </div>
  );
}

