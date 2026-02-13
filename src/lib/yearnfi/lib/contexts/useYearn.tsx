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
import type { TNormalizedBN } from "../types/mixed";
import type { TAddress } from "../types/address";

type TTokenAndChain = { address: TAddress; chainID: number };

// inside useYearn.tsx (top-level)
const KATANA_ALLOWED_ASSETS = new Set([
  "vbUSDC",
  "vbUSDT",
  "AUSD",
  "vbETH",
  "vbWBTC",
]);

type TYearnContext = {
  // ✅ Top-level assets (Multi Strategy) — what you render as 5 rows
  assetVaults: TYDaemonVault[];

  // ✅ Child vaults (Single Strategy) — what you render inside dropdown
  childVaults: TYDaemonVault[];

  // ✅ Keep old name for compatibility if needed
  vaults: TYDaemonVault[];

  vaultsMigrations: TYDaemonVault[];
  vaultsRetired: TYDaemonVault[];

  isLoadingVaultList: boolean;

  // ✅ Used for dropdown: tokenAddress -> child vaults
  childVaultsByToken: Record<string, TYDaemonVault[]>;

  getPrice: (params: TTokenAndChain) => TNormalizedBN;
};

const YearnContext = createContext<TYearnContext | undefined>(undefined);

const SUPPORTED_CHAINS = [747474];

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
        }),
    ),
  );

  const allVaults: TYDaemonVault[] = responses.flat();

  // ✅ Split by kind
  const multi = allVaults.filter(
    (v) =>
      v.version?.startsWith("3") &&
      v.kind === "Multi Strategy" &&
      KATANA_ALLOWED_ASSETS.has((v.token?.symbol || v.symbol) as string),
  );

  const single = allVaults.filter(
    (v) => v.version?.startsWith("3") && v.kind === "Single Strategy",
  );

  // Keep your existing migrations/retired logic BUT only for Multi Strategy
  const activeVaults = multi.filter(
    (vault) =>
      vault.migration?.available !== true &&
      vault.status !== "retired" &&
      vault.status !== "withdraw-only",
  );

  const migrations = multi.filter(
    (vault) => vault.migration?.available === true,
  );

  const retired = multi.filter(
    (vault) => vault.status === "retired" || vault.status === "withdraw-only",
  );

  return { activeVaults, migrations, retired, single };
};

export function YearnProvider({ children }: { children: ReactNode }) {
  const urls = SUPPORTED_CHAINS.map(
    (chainId) => `https://ydaemon.yearn.fi/${chainId}/vaults/all`,
  );

  const { data, isLoading } = useSWR(
    ["yearn-v3-vaults", ...urls],
    () => fetcher(urls),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      refreshInterval: 60000,
    },
  );

  // ✅ These are the 5 parent rows
  const assetVaults = useMemo(() => data?.activeVaults || [], [data]);

  // ✅ These are children shown in dropdown
  const childVaults = useMemo(() => data?.single || [], [data]);

  const vaultsMigrations = useMemo(() => data?.migrations || [], [data]);
  const vaultsRetired = useMemo(() => data?.retired || [], [data]);

  // ✅ Backwards compatible: if some code still uses `vaults`
  // make it equal to assetVaults so it no longer includes noisy single strategy vaults
  const vaults = assetVaults;

  // ✅ tokenAddress -> childVaults
  const childVaultsByToken = useMemo(() => {
    const map: Record<string, TYDaemonVault[]> = {};
    for (const v of childVaults) {
      const tokenAddr = v.token?.address?.toLowerCase?.();
      if (!tokenAddr) continue;
      if (!map[tokenAddr]) map[tokenAddr] = [];
      map[tokenAddr].push(v);
    }

    // Optional: stable sort children by TVL desc so it matches official feel
    for (const k of Object.keys(map)) {
      map[k] = map[k].sort((a, b) => (b.tvl?.tvl || 0) - (a.tvl?.tvl || 0));
    }

    return map;
  }, [childVaults]);

  // ✅ Price from vault tvl.price (works for parent + child)
  const getPrice = useCallback(
    ({ address, chainID }: TTokenAndChain): TNormalizedBN => {
      const all = [
        ...assetVaults,
        ...childVaults,
        ...vaultsMigrations,
        ...vaultsRetired,
      ];
      const vault = all.find(
        (v) =>
          v.address.toLowerCase() === address.toLowerCase() &&
          v.chainID === chainID,
      );
      const price = vault?.tvl?.price || 0;

      return {
        raw: BigInt(Math.floor(price * 1_000_000)),
        normalized: price,
        display: price.toFixed(6),
      };
    },
    [assetVaults, childVaults, vaultsMigrations, vaultsRetired],
  );

  const value: TYearnContext = useMemo(
    () => ({
      assetVaults,
      childVaults,
      childVaultsByToken,
      vaults,
      vaultsMigrations,
      vaultsRetired,
      isLoadingVaultList: isLoading,
      getPrice,
    }),
    [
      assetVaults,
      childVaults,
      childVaultsByToken,
      vaults,
      vaultsMigrations,
      vaultsRetired,
      isLoading,
      getPrice,
    ],
  );

  return (
    <YearnContext.Provider value={value}>{children}</YearnContext.Provider>
  );
}

export function useYearn() {
  const context = useContext(YearnContext);
  if (!context) throw new Error("useYearn must be used within YearnProvider");
  return context;
}
