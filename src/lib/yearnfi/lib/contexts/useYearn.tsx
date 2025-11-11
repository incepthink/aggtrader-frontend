// ============================================================================
// FILE: lib/contexts/useYearn.tsx
// ============================================================================
"use client";

import {
  createContext,
  useContext,
  ReactNode,
  useCallback,
  useMemo,
} from "react";
import useSWR from "swr";
import type { TYDaemonVault } from "../utils/schemas/yDaemonVaultsSchemas";
import type { TDict, TNormalizedBN } from "../types/mixed";
import type { TAddress } from "../types/address";
import { toNormalizedBN } from "../utils";

type TTokenAndChain = { address: TAddress; chainID: number };

type TYearnContext = {
  vaults: TYDaemonVault[];
  vaultsMigrations: TYDaemonVault[];
  vaultsRetired: TYDaemonVault[];
  isLoadingVaultList: boolean;
  getPrice: (params: TTokenAndChain) => TNormalizedBN;
};

const YearnContext = createContext<TYearnContext | undefined>(undefined);

const SUPPORTED_CHAINS = [747474]; // Ethereum + Katana

const fetcher = async (urls: string[]) => {
  const responses = await Promise.all(
    urls.map((url) =>
      fetch(url)
        .then((res) => {
          if (!res.ok) throw new Error(`Failed to fetch ${url}`);
          return res.json();
        })
        .catch((err) => {
          console.error(`Error fetching ${url}:`, err);
          return [];
        })
    )
  );

  // Flatten all vaults from all chains
  const allVaults = responses.flat();

  // Separate vaults by type
  const activeVaults = allVaults.filter(
    (vault: TYDaemonVault) =>
      vault.version?.startsWith("3") &&
      vault.migration?.available !== true &&
      !(vault as any).info?.isRetired // Use type assertion for optional property
  );

  const migrations = allVaults.filter(
    (vault: TYDaemonVault) =>
      vault.version?.startsWith("3") && vault.migration?.available === true
  );

  const retired = allVaults.filter(
    (vault: TYDaemonVault) =>
      vault.version?.startsWith("3") && (vault as any).info?.isRetired === true // Use type assertion for optional property
  );

  return { activeVaults, migrations, retired };
};

export function YearnProvider({ children }: { children: ReactNode }) {
  const urls = SUPPORTED_CHAINS.map(
    (chainId) => `https://ydaemon.yearn.fi/${chainId}/vaults/all`
  );

  const { data, error, isLoading } = useSWR(
    ["yearn-v3-vaults", ...urls],
    () => fetcher(urls),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      refreshInterval: 60000, // Refresh every minute
    }
  );

  const vaults = useMemo(() => data?.activeVaults || [], [data]);
  const vaultsMigrations = useMemo(() => data?.migrations || [], [data]);
  const vaultsRetired = useMemo(() => data?.retired || [], [data]);

  const getPrice = useCallback(
    ({ address, chainID }: TTokenAndChain): TNormalizedBN => {
      const allVaults = [...vaults, ...vaultsMigrations, ...vaultsRetired];
      const vault = allVaults.find(
        (v) =>
          v.address.toLowerCase() === address.toLowerCase() &&
          v.chainID === chainID
      );

      const price = vault?.tvl?.price || 0;

      // Return TNormalizedBN with all required properties
      return {
        raw: BigInt(Math.floor(price * 1_000_000)), // Convert to 6 decimals
        normalized: price,
        display: price.toFixed(6),
      };
    },
    [vaults, vaultsMigrations, vaultsRetired]
  );

  const value: TYearnContext = useMemo(
    () => ({
      vaults,
      vaultsMigrations,
      vaultsRetired,
      isLoadingVaultList: isLoading,
      getPrice,
    }),
    [vaults, vaultsMigrations, vaultsRetired, isLoading, getPrice]
  );

  return (
    <YearnContext.Provider value={value}>{children}</YearnContext.Provider>
  );
}

export function useYearn() {
  const context = useContext(YearnContext);
  if (!context) {
    throw new Error("useYearn must be used within YearnProvider");
  }
  return context;
}
