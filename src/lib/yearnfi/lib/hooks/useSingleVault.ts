import useSWR from "swr";
import type { TYDaemonVault } from "@/lib/yearnfi/lib/utils/schemas/yDaemonVaultsSchemas";

type UseSingleVaultParams = {
  chainID: number;
  address: string;
};

type UseSingleVaultReturn = {
  vault: TYDaemonVault | undefined;
  isLoading: boolean;
  error: Error | undefined;
};

const fetcher = async (url: string): Promise<TYDaemonVault> => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch vault: ${res.statusText}`);
  }
  return res.json();
};

export function useSingleVault({
  chainID,
  address,
}: UseSingleVaultParams): UseSingleVaultReturn {
  const url = `https://ydaemon.yearn.fi/${chainID}/vaults/${address}?strategiesDetails=withDetails&strategiesCondition=inQueue`;

  const { data, error, isLoading } = useSWR<TYDaemonVault>(
    address && chainID ? url : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      shouldRetryOnError: false,
    }
  );

  return {
    vault: data,
    isLoading,
    error,
  };
}