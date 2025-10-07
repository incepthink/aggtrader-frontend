import { useMemo } from 'react';
import type { TYDaemonVault } from '@/lib/yearnfi/lib/utils/schemas/yDaemonVaultsSchemas';
import type { TSortDirection } from '@/lib/yearnfi/lib/types';
import type { TPossibleSortBy } from './useVaultsQueryArgs';

export function useSortVaults(
  vaults: TYDaemonVault[],
  sortBy: TPossibleSortBy,
  sortDirection: TSortDirection
): TYDaemonVault[] {
  return useMemo(() => {
    if (!sortDirection || sortBy === 'featuringScore') {
      return vaults;
    }

    const sorted = [...vaults].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'apy':
        case 'APY':
          aValue = a.apy?.net_apy || 0;
          bValue = b.apy?.net_apy || 0;
          break;
        case 'estAPY':
          aValue = a.apy?.gross_apr || 0;
          bValue = b.apy?.gross_apr || 0;
          break;
        case 'tvl':
          aValue = a.tvl?.tvl || 0;
          bValue = b.tvl?.tvl || 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [vaults, sortBy, sortDirection]);
}