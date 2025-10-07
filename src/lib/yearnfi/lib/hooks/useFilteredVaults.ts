'use client';

import { useMemo } from 'react';
import { useYearn } from '@/lib/yearnfi/lib/contexts/useYearn';
import type { TYDaemonVault } from '@/lib/yearnfi/lib/utils/schemas/yDaemonVaultsSchemas';

export function useVaultFilter(
  types: string[] | null,
  chains: number[] | null,
  v3Only: boolean = true
) {
  const { vaults } = useYearn();
  

  const filteredVaults = useMemo(() => {
    let filtered = vaults;

    // Filter by V3 only
    if (v3Only) {
      filtered = filtered.filter(v => v.version?.startsWith('3'));
    }

    // Filter by chains
    if (chains && chains.length > 0) {
      filtered = filtered.filter(v => chains.includes(v.chainID));
    }

    // Filter by types (kind)
    if (types && types.length > 0 && types.length < 2) {
      filtered = filtered.filter(v => types.includes(v.kind || ''));
    }
    console.log(filtered);
    
    return filtered;
  }, [vaults, types, chains, v3Only]);

  const activeVaults = useMemo(() => {
    return filteredVaults.filter(v => v.status !== 'retired' && v.status !== 'withdraw-only');
  }, [filteredVaults]);

  const retiredVaults = useMemo(() => {
    return filteredVaults.filter(v => v.status === 'retired' || v.status === 'withdraw-only');
  }, [filteredVaults]);

  const migratableVaults = useMemo(() => {
    return filteredVaults.filter(v => v.migration?.available === true);
  }, [filteredVaults]);

  return {
    activeVaults,
    retiredVaults,
    migratableVaults,
  };
}