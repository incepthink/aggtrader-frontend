import { useMemo } from 'react';
import type { TDict } from '../types/mixed';
import type { TUseBalancesTokens } from '../hooks/useBalances.multichains';
import { toAddress } from '../utils/tools.address';
import { ETH_TOKEN_ADDRESS } from '../../vaults-v3/constants';
import type { TYDaemonVault } from '../utils/schemas/yDaemonVaultsSchemas';

export function useYearnTokens({
  vaults,
  vaultsMigrations,
  vaultsRetired,
  isLoadingVaultList
}: {
  vaults: TYDaemonVault[];
  vaultsMigrations: TYDaemonVault[];
  vaultsRetired: TYDaemonVault[];
  isLoadingVaultList: boolean;
}): TUseBalancesTokens[] {
  const allVaults = useMemo(
    (): TYDaemonVault[] => [...vaults, ...vaultsMigrations, ...vaultsRetired],
    [vaults, vaultsMigrations, vaultsRetired]
  );

  const availableTokens = useMemo((): TDict<TUseBalancesTokens> => {
    if (isLoadingVaultList) {
      return {};
    }

    const tokens: TDict<TUseBalancesTokens> = {};
    const extraTokens: TUseBalancesTokens[] = [
      { chainID: 1, address: toAddress(ETH_TOKEN_ADDRESS), decimals: 18, name: 'Ether', symbol: 'ETH' },
      { chainID: 747474, address: toAddress(ETH_TOKEN_ADDRESS), decimals: 18, name: 'Ether', symbol: 'ETH' }
    ];

    for (const token of extraTokens) {
      const key = `${token.chainID}/${token.address}`;
      tokens[key] = token;
    }

    allVaults.forEach((vault?: TYDaemonVault): void => {
      if (!vault) return;

      // Add vault token
      if (vault?.address && !tokens[`${vault.chainID}/${toAddress(vault.address)}`]) {
        tokens[`${vault.chainID}/${toAddress(vault.address)}`] = {
          address: toAddress(vault.address),
          chainID: vault.chainID,
          symbol: vault.symbol,
          decimals: vault.decimals,
          name: vault.name
        };
      }

      // Add underlying token
      if (vault?.token?.address && !tokens[`${vault.chainID}/${toAddress(vault?.token.address)}`]) {
        const tokenData = vault.token as any; // Type assertion to access decimals
        tokens[`${vault.chainID}/${toAddress(vault?.token.address)}`] = {
          address: toAddress(vault.token.address),
          chainID: vault.chainID,
          symbol: tokenData.symbol || vault.symbol || '',
          decimals: tokenData.decimals || vault.decimals || 18,
          name: tokenData.name || vault.name || ''
        };
      }

      // Add staking token
      if (vault?.staking?.available && vault?.staking?.address) {
        const stakingKey = `${vault.chainID}/${toAddress(vault.staking.address)}`;
        if (!tokens[stakingKey]) {
          tokens[stakingKey] = {
            address: toAddress(vault.staking.address),
            chainID: vault.chainID,
            symbol: vault.symbol,
            decimals: vault.decimals,
            name: vault.name
          };
        }
      }
    });

    return tokens;
  }, [isLoadingVaultList, allVaults]);

  const allTokens = useMemo((): TUseBalancesTokens[] => {
    return Object.values(availableTokens);
  }, [availableTokens]);

  return allTokens;
}
