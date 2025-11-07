// hooks/useEquityTrend.ts
import { BACKEND_URL } from "@/utils/constants";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

interface EquityDataPoint {
  timestamp: string;
  balance: number;
  date: string;
}

interface EquityTrendResponse {
  status: string;
  msg: string;
  data: {
    walletAddress: string;
    chainId: number;
    totalRecords: number;
    history: EquityDataPoint[];
  };
}

/**
 * Hook to fetch equity trend data for a user
 * @param walletAddress - User's wallet address
 * @param enabled - Whether to enable the query (default: true if address exists)
 */
export function useEquityTrend(
  walletAddress: string | undefined,
  enabled: boolean = true
) {
  return useQuery<EquityTrendResponse, Error>({
    queryKey: ["equityTrend", walletAddress],
    queryFn: async () => {
      if (!walletAddress) {
        throw new Error("Wallet address is required");
      }

      const response = await axios.get(
        `${BACKEND_URL}/user/equity-trend/${walletAddress}`,
        { timeout: 10000 }
      );

      return response.data;
    },
    enabled: enabled && !!walletAddress,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    retry: 2,
  });
}

export type { EquityDataPoint, EquityTrendResponse };
