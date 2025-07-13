import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";

export interface EquityPoint {
  t: string;
  v: number;
}

export interface EquityTrendData {
  points: EquityPoint[];
  hasRealData: boolean;
  source: "moralis" | "none";
}

// Format timestamp to date string
const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  return `${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
};

// Moralis API - Get wallet historical data
async function getMoralisPortfolioHistory(
  userAddress: string,
  timeRange: "7" | "30"
): Promise<EquityPoint[]> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_MORALIS_API_KEY;
    if (!apiKey) {
      console.error("Moralis API key missing");
      throw new Error("Moralis API key is required");
    }

    console.log("Fetching from Moralis for address:", userAddress);

    // Get wallet transaction history with portfolio values
    const response = await fetch(
      `https://deep-index.moralis.io/api/v2.2/wallets/${userAddress}/history?chain=eth&limit=100&order=DESC`,
      {
        headers: {
          accept: "application/json",
          "X-API-Key": apiKey,
        },
      }
    );

    if (!response.ok) {
      console.error(
        `Moralis API error: ${response.status} - ${response.statusText}`
      );
      throw new Error(`Moralis API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Moralis history response:", data);

    if (data.result && Array.isArray(data.result)) {
      // Process Moralis historical balance data
      const portfolioByDate: Map<string, number> = new Map();

      data.result.forEach((item: any) => {
        if (item.block_timestamp && item.portfolio_value_usd) {
          const date = formatDate(new Date(item.block_timestamp).getTime());
          // Keep the latest (highest) value for each date
          const existingValue = portfolioByDate.get(date);
          if (!existingValue || item.portfolio_value_usd > existingValue) {
            portfolioByDate.set(date, parseFloat(item.portfolio_value_usd));
          }
        }
      });

      console.log("Processed portfolio by date:", portfolioByDate);

      // Convert to chart format
      const chartData = Array.from(portfolioByDate.entries())
        .map(([date, value]) => ({
          t: date,
          v: Math.round(value * 100) / 100,
        }))
        .sort((a, b) => {
          // Sort by date
          const dateA = new Date(a.t.split("-").reverse().join("-"));
          const dateB = new Date(b.t.split("-").reverse().join("-"));
          return dateA.getTime() - dateB.getTime();
        })
        .slice(-parseInt(timeRange)); // Take only the last N days

      console.log("Final chart data:", chartData);
      return chartData;
    }

    // If no portfolio history, try to get current balance as fallback
    return await getMoralisCurrentBalance(userAddress);
  } catch (error) {
    console.error("Moralis portfolio history error:", error);

    // Try fallback to current balance
    try {
      return await getMoralisCurrentBalance(userAddress);
    } catch (fallbackError) {
      console.error("Moralis current balance fallback failed:", fallbackError);
      return [];
    }
  }
}

// Fallback: Get current portfolio value from Moralis
async function getMoralisCurrentBalance(
  userAddress: string
): Promise<EquityPoint[]> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_MORALIS_API_KEY;
    if (!apiKey) {
      throw new Error("Moralis API key is required");
    }

    console.log(
      "Fetching current balance from Moralis for address:",
      userAddress
    );

    // Get current token balances
    const response = await fetch(
      `https://deep-index.moralis.io/api/v2/${userAddress}/erc20?chain=eth`,
      {
        headers: {
          accept: "application/json",
          "X-API-Key": apiKey,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Moralis current balance API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Moralis current balance response:", data);

    if (data && Array.isArray(data)) {
      // Calculate total USD value from current balances
      let totalValue = 0;

      data.forEach((token: any) => {
        if (token.usd_value) {
          totalValue += parseFloat(token.usd_value);
        }
      });

      // Get ETH balance as well
      const ethResponse = await fetch(
        `https://deep-index.moralis.io/api/v2/${userAddress}/balance?chain=eth`,
        {
          headers: {
            accept: "application/json",
            "X-API-Key": apiKey,
          },
        }
      );

      if (ethResponse.ok) {
        const ethData = await ethResponse.json();
        if (ethData.usd_value) {
          totalValue += parseFloat(ethData.usd_value);
        }
      }

      const today = formatDate(Date.now());

      // Return current value as single point
      return [
        {
          t: today,
          v: Math.round(totalValue * 100) / 100,
        },
      ];
    }

    return [];
  } catch (error) {
    console.error("Moralis current balance error:", error);
    return [];
  }
}

// Alternative Moralis endpoint - Wallet stats
async function getMoralisWalletStats(
  userAddress: string,
  timeRange: "7" | "30"
): Promise<EquityPoint[]> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_MORALIS_API_KEY;
    if (!apiKey) {
      throw new Error("Moralis API key is required");
    }

    console.log("Fetching wallet stats from Moralis for address:", userAddress);

    // Get wallet stats (might include historical data)
    const response = await fetch(
      `https://deep-index.moralis.io/api/v2/wallets/${userAddress}/stats?chain=eth`,
      {
        headers: {
          accept: "application/json",
          "X-API-Key": apiKey,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Moralis wallet stats API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Moralis wallet stats response:", data);

    // Process stats data if available
    if (data && data.portfolio_value_usd) {
      const today = formatDate(Date.now());
      return [
        {
          t: today,
          v: Math.round(parseFloat(data.portfolio_value_usd) * 100) / 100,
        },
      ];
    }

    return [];
  } catch (error) {
    console.error("Moralis wallet stats error:", error);
    return [];
  }
}

// Main function to fetch equity trend data using only Moralis
async function fetchEquityTrend(
  address: string,
  timeRange: "7" | "30"
): Promise<EquityTrendData> {
  if (!address) {
    throw new Error("Address is required");
  }

  try {
    let equityData: EquityPoint[] = [];

    console.log("Fetching equity data from Moralis for address:", address);

    // Try Moralis wallet history first (best option)
    equityData = await getMoralisPortfolioHistory(address, timeRange);

    if (equityData.length === 0) {
      // Try wallet stats as fallback
      console.log("Trying Moralis wallet stats fallback...");
      equityData = await getMoralisWalletStats(address, timeRange);
    }

    console.log("Final equity data:", equityData);

    return {
      points: equityData,
      hasRealData: equityData.length > 0,
      source: equityData.length > 0 ? "moralis" : "none",
    };
  } catch (error) {
    console.error("Error fetching equity trend from Moralis:", error);

    return {
      points: [],
      hasRealData: false,
      source: "none",
    };
  }
}

// Custom hook with TanStack Query - Moralis only
export function useEquityTrend(timeRange: "7" | "30" = "7") {
  const { address, isConnected } = useAccount();

  return useQuery({
    queryKey: ["equityTrend", "moralis", address, timeRange],
    queryFn: () => fetchEquityTrend(address!, timeRange),
    enabled: Boolean(
      isConnected && address && process.env.NEXT_PUBLIC_MORALIS_API_KEY
    ),
    staleTime: 10 * 60 * 1000, // 10 minutes - balance data doesn't change too often
    gcTime: 30 * 60 * 1000, // 30 minutes cache time
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    retry: (failureCount, error: any) => {
      // Don't retry on 4xx errors (likely API key issues)
      if (error?.message?.includes("40")) {
        return false;
      }
      return failureCount < 2; // Retry up to 2 times for other errors
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

// Hook for getting just the latest portfolio value
export function useLatestPortfolioValue() {
  const { data } = useEquityTrend("7");

  const latestValue = data?.points?.length
    ? data.points[data.points.length - 1]?.v || 0
    : 0;

  return {
    value: latestValue,
    hasData: data?.hasRealData || false,
    source: data?.source || "none",
  };
}
