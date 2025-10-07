"use client";

import { createContext, useContext, ReactNode } from "react";
import useSWR from "swr";
import type { TYDaemonVault } from "@/lib/yearnfi/lib/utils/schemas/yDaemonVaultsSchemas";

type TUseYearn = {
  vaults: TYDaemonVault[];
  isLoadingVaultList: boolean;
  getPrice: (params: { address: string; chainID: number }) => {
    normalized: number;
  };
};

const YearnContext = createContext<TUseYearn | undefined>(undefined);

const SUPPORTED_CHAINS = [1, 747474]; // Ethereum + Katana

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

  // Filter for V3 only
  return allVaults.filter((vault: TYDaemonVault) =>
    vault.version?.startsWith("3")
  );
};

export function YearnProvider({ children }: { children: ReactNode }) {
  const urls = SUPPORTED_CHAINS.map(
    (chainId) => `https://ydaemon.yearn.fi/${chainId}/vaults/all`
  );

  const {
    data: vaults,
    error,
    isLoading,
  } = useSWR(["yearn-v3-vaults", ...urls], () => fetcher(urls), {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshInterval: 60000, // Refresh every minute
  });

  const getPrice = ({
    address,
    chainID,
  }: {
    address: string;
    chainID: number;
  }) => {
    const vault = vaults?.find(
      (v) =>
        v.address.toLowerCase() === address.toLowerCase() &&
        v.chainID === chainID
    );
    return { normalized: vault?.tvl?.price || 0 };
  };

  const value: TUseYearn = {
    vaults: vaults || [],
    isLoadingVaultList: isLoading,
    getPrice,
  };

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
