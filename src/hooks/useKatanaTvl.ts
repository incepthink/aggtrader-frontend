// hooks/useKatanaTvl.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import axios from "axios";
import { useWallet } from "@/lib/yearnfi/lib/contexts/useWallet";
import { useUserVaultPositions } from "@/hooks/lend-morpho/useUserVaultPosition";
import { useUserMarketPositions } from "@/hooks/lend-morpho/useUserMarketPosition";
import { BACKEND_URL } from "@/utils/constants";

interface SushiswapTvlResponse {
  tvlSushiUSD: number;
}

export interface KatanaTvlData {
  sushiswap: number | null;
  yearnfi: number | null;
  morphoDeposits: number | null;
  morphoBorrow: number | null;
  total: number;
  isLoading: boolean;
  errors: {
    sushiswap?: string;
    yearnfi?: string;
    morphoDeposits?: string;
    morphoBorrow?: string;
  };
}

export const useKatanaTvl = () => {
  const { address } = useAccount();

  // Sushiswap TVL
  const {
    data: sushiswapData,
    isLoading: sushiswapLoading,
    error: sushiswapError,
  } = useQuery<SushiswapTvlResponse>({
    queryKey: ["katana-sushiswap-tvl", address],
    queryFn: async () => {
      if (!address) throw new Error("No wallet connected");
      const response = await axios.get(
        `${BACKEND_URL}/user/tvl/sushiswap/${address}`
      );
      return response.data;
    },
    enabled: !!address,
    staleTime: 30000, // 30 seconds
    retry: 2,
  });

  // Yearnfi TVL
  const { cumulatedValueInV3Vaults, isLoading: yearnfiLoading } = useWallet();

  // Morpho Deposits
  const {
    data: userPositions,
    isLoading: morphoDepositsLoading,
    error: morphoDepositsError,
  } = useUserVaultPositions();

  // Morpho Borrow
  const {
    data: userBorrowPositions,
    isLoading: morphoBorrowLoading,
    error: morphoBorrowError,
  } = useUserMarketPositions();

  // Extract values
  const sushiswapTvl = sushiswapData?.tvlSushiUSD ?? null;
  const yearnfiTvl = cumulatedValueInV3Vaults ?? null;
  const morphoDeposits = userPositions?.totalDepositsUsd ?? null;
  const morphoBorrow = userBorrowPositions?.totalBorrowedUsd ?? null;

  // Calculate total (only include loaded values)
  const total =
    (sushiswapTvl ?? 0) +
    (yearnfiTvl ?? 0) +
    (morphoDeposits ?? 0) +
    (morphoBorrow ?? 0);

  // Overall loading state (true if ANY are still loading)
  const isLoading =
    sushiswapLoading ||
    yearnfiLoading ||
    morphoDepositsLoading ||
    morphoBorrowLoading;

  // Collect errors
  const errors: KatanaTvlData["errors"] = {};
  if (sushiswapError) {
    errors.sushiswap =
      sushiswapError instanceof Error
        ? sushiswapError.message
        : "Failed to fetch Sushiswap TVL";
  }
  if (morphoDepositsError) {
    errors.morphoDeposits =
      morphoDepositsError instanceof Error
        ? morphoDepositsError.message
        : "Failed to fetch Morpho deposits";
  }
  if (morphoBorrowError) {
    errors.morphoBorrow =
      morphoBorrowError instanceof Error
        ? morphoBorrowError.message
        : "Failed to fetch Morpho borrow";
  }

  return {
    sushiswap: sushiswapTvl,
    yearnfi: yearnfiTvl,
    morphoDeposits: morphoDeposits,
    morphoBorrow: morphoBorrow,
    total,
    isLoading,
    errors,
  };
};