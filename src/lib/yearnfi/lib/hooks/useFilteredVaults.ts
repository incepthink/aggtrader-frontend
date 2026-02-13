'use client';

import { useMemo } from 'react';
import { useYearn } from '@/lib/yearnfi/lib/contexts/useYearn';
import type { TYDaemonVault } from '@/lib/yearnfi/lib/utils/schemas/yDaemonVaultsSchemas';

const KATANA_ASSETS = ['vbUSDC', 'vbETH', 'vbUSDT', 'vbWBTC', 'AUSD'] as const;
type KatanaAsset = (typeof KATANA_ASSETS)[number];

const STABLECOIN_ASSETS: KatanaAsset[] = ['vbUSDC', 'vbUSDT', 'AUSD'];
const VOLATILE_ASSETS: KatanaAsset[] = ['vbETH', 'vbWBTC'];

export function useVaultFilter(
  types: string[] | null,
  categories: string[] | null,
  chains: number[] | null,
  v3Only: boolean = true
) {
  const { vaults } = useYearn();

  const filteredVaults = useMemo(() => {
    let filtered: TYDaemonVault[] = vaults;

    if (v3Only) {
      filtered = filtered.filter(v => v.version?.startsWith('3'));
    }

    if (chains && chains.length > 0) {
      filtered = filtered.filter(v => chains.includes(v.chainID));
    }

    // ✅ Keep only the 5 assets (removes vbUSDS + wstETH automatically)
    filtered = filtered.filter(v => {
      const sym = v.token?.symbol;
      return sym && (KATANA_ASSETS as readonly string[]).includes(sym);
    });

    // ✅ Category filter maps to those asset buckets
    if (categories && categories.length > 0) {
      const wantsStable = categories.includes('stablecoin');
      const wantsVol = categories.includes('volatile');

      filtered = filtered.filter(v => {
        const sym = v.token?.symbol as KatanaAsset | undefined;
        if (!sym) return false;

        if (wantsStable && STABLECOIN_ASSETS.includes(sym)) return true;
        if (wantsVol && VOLATILE_ASSETS.includes(sym)) return true;
        return false;
      });
    }

    // ✅ Type filter: you said All and Single Asset show same data
    // So do NOTHING here intentionally.

    return filtered;
  }, [vaults, types, categories, chains, v3Only]);

  const activeVaults = useMemo(() => {
    return filteredVaults.filter(v => v.status !== 'retired' && v.status !== 'withdraw-only');
  }, [filteredVaults]);

  return { activeVaults };
}
