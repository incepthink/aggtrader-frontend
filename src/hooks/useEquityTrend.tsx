// src/hooks/useEquityTrend.ts
import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";

interface EquityPoint {
  t: string;
  v: number;
}

interface UseEquityTrendOptions {
  timeRange?: "7" | "30";
  enabled?: boolean;
}

interface UseEquityTrendResult {
  data: EquityPoint[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  isSuccess: boolean;
  isError: boolean;
}

// Format timestamp to date string (MM-DD format)
const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  return `${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
};

// Fetch portfolio history from Covalent API
const fetchCovalentPortfolioHistory = async (
  userAddress: string,
  timeRange: "7" | "30"
): Promise<EquityPoint[]> => {
  const apiKey = process.env.NEXT_PUBLIC_COVALENT_KEY;
  if (!apiKey) {
    throw new Error("Covalent API key missing");
  }

  // Use more days for better data - extend range based on timeRange
  const days = timeRange === "7" ? "30" : "90";

  const response = await fetch(
    `https://api.covalenthq.com/v1/1/address/${userAddress}/portfolio_v2/?days=${days}&key=${apiKey}`
  );

  if (!response.ok) {
    throw new Error(`Covalent API error: ${response.status}`);
  }

  const data = await response.json();

  // Parse Covalent response to chart format
  if (data.data && data.data.items) {
    // Group portfolio value by date
    const portfolioByDate: Map<string, number> = new Map();

    data.data.items.forEach((token: any) => {
      if (token.holdings && Array.isArray(token.holdings)) {
        token.holdings.forEach((holding: any) => {
          // Extract date from timestamp
          if (holding.timestamp) {
            const date = formatDate(new Date(holding.timestamp).getTime());
            const portfolioValue = portfolioByDate.get(date) || 0;

            // Use the close quote value, fallback to other prices if close is null
            let quoteValue = 0;
            if (holding.close && holding.close.quote !== null) {
              quoteValue = holding.close.quote;
            } else if (holding.high && holding.high.quote !== null) {
              quoteValue = holding.high.quote;
            } else if (holding.low && holding.low.quote !== null) {
              quoteValue = holding.low.quote;
            } else if (holding.open && holding.open.quote !== null) {
              quoteValue = holding.open.quote;
            }

            portfolioByDate.set(date, portfolioValue + quoteValue);
          }
        });
      }
    });

    // Convert to chart format and filter by requested timeRange
    const chartData = Array.from(portfolioByDate.entries())
      .map(([date, value]) => ({
        t: date,
        v: Math.round(value * 100) / 100,
      }))
      .sort((a, b) => a.t.localeCompare(b.t))
      .slice(-parseInt(timeRange)); // Take only the last N days requested

    return chartData;
  }

  return [];
};

export const useEquityTrend = (
  options: UseEquityTrendOptions = {}
): UseEquityTrendResult => {
  const { timeRange = "7", enabled = true } = options;
  const { address, isConnected } = useAccount();

  const { data, isLoading, error, refetch, isSuccess, isError } = useQuery<
    EquityPoint[],
    Error
  >({
    queryKey: ["equityTrend", address, timeRange],
    queryFn: () => fetchCovalentPortfolioHistory(address!, timeRange),
    enabled: enabled && isConnected && !!address,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime)
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  return {
    data: data || [],
    isLoading,
    error: error as Error | null,
    refetch,
    isSuccess,
    isError,
  };
};
