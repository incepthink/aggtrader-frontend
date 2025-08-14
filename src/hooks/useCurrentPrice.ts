// hooks/useCurrentPrice.ts (Fixed Version)
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import type { PortfolioToken } from "@/hooks/usePortfolioDetailed";

export interface PriceData {
  [tokenAddress: string]: {
    usd: number;
    lastUpdated: number;
  };
}

interface CoinGeckoPrice {
  usd: number;
  usd_market_cap?: number;
  usd_24h_vol?: number;
  usd_24h_change?: number;
  last_updated_at?: number;
}

interface CoinGeckoResponse {
  [coinId: string]: CoinGeckoPrice;
}

// Enable debug mode to track API calls
const DEBUG_PRICE_HOOKS = false;

const log = (...args: any[]) => {
  if (DEBUG_PRICE_HOOKS) {
    console.log("[useCurrentPrice]", ...args);
  }
};

// Map token symbols/addresses to CoinGecko IDs
const getTokenCoinGeckoId = (token: PortfolioToken): string | null => {
  const symbol = token.symbol.toLowerCase();
  const address = token.contract_address?.toLowerCase();

  // Common token mappings
  const tokenMap: { [key: string]: string } = {
    eth: "ethereum",
    weth: "weth",
    usdc: "usd-coin",
    usdt: "tether",
    wbtc: "wrapped-bitcoin",
    link: "chainlink",
    uni: "uniswap",
    aave: "aave",
    comp: "compound-governance-token",
    mkr: "maker",
    snx: "havven",
    yfi: "yearn-finance",
    sushi: "sushi",
    crv: "curve-dao-token",
    "1inch": "1inch",
    matic: "matic-network",
    bnb: "binancecoin",
    ada: "cardano",
    dot: "polkadot",
    avax: "avalanche-2",
    sol: "solana",
    ftm: "fantom",
    atom: "cosmos",
    near: "near",
    algo: "algorand",
    xlm: "stellar",
    xrp: "ripple",
    doge: "dogecoin",
    shib: "shiba-inu",
    ltc: "litecoin",
    bch: "bitcoin-cash",
    etc: "ethereum-classic",
    fil: "filecoin",
    xtz: "tezos",
    eos: "eos",
    trx: "tron",
    xmr: "monero",
    dash: "dash",
    zcash: "zcash",
    dcr: "decred",
  };

  // Special handling for ETH (native token)
  if (
    symbol === "eth" &&
    (!address || address === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee")
  ) {
    return "ethereum";
  }

  // Check symbol mapping first
  if (tokenMap[symbol]) {
    return tokenMap[symbol];
  }

  // For other tokens, we'd need to map by contract address
  const addressMap: { [key: string]: string } = {
    "0xa0b86a33e6a2ca10a8acaed6e02c9e2c2f91c6e3": "ethereum", // ETH
    "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2": "weth", // WETH
    "0xa0b73e1ff0b80914ab6fe0444e65848c4c34450b": "usd-coin", // USDC
    "0xdac17f958d2ee523a2206206994597c13d831ec7": "tether", // USDT
    "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599": "wrapped-bitcoin", // WBTC
    "0x514910771af9ca656af840dff83e8264ecf986ca": "chainlink", // LINK
    "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984": "uniswap", // UNI
  };

  if (address && addressMap[address]) {
    return addressMap[address];
  }

  return null;
};

export const useCurrentPrice = (tokens: PortfolioToken[] = []) => {
  const [prices, setPrices] = useState<PriceData>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number>(0);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const fetchCountRef = useRef(0);

  // Memoize tokens to prevent unnecessary re-renders
  const stableTokens = useMemo(() => {
    return tokens.map((token) => ({
      symbol: token.symbol,
      contract_address: token.contract_address,
      chain_id: token.chain_id,
      amount: token.amount, // Include amount for calculations but not in comparison
    }));
  }, [tokens]);

  // Create stable token signature for dependency
  const tokensSignature = useMemo(() => {
    const signature = stableTokens
      .map((t) => `${t.chain_id}-${t.contract_address}-${t.symbol}`)
      .sort()
      .join("|");
    log("Tokens signature changed:", signature);
    return signature;
  }, [stableTokens]);

  const fetchPrices = useCallback(async (tokensToFetch: PortfolioToken[]) => {
    fetchCountRef.current++;
    const fetchId = fetchCountRef.current;
    log(`Starting fetch #${fetchId} for ${tokensToFetch.length} tokens`);

    if (!tokensToFetch.length) {
      log(`Fetch #${fetchId} aborted: no tokens`);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      log(`Fetch #${fetchId}: Aborting previous request`);
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      setIsLoading(true);
      setError(null);

      // Map tokens to CoinGecko IDs
      const tokenIdMap = new Map<string, PortfolioToken>();
      const coinGeckoIds: string[] = [];

      tokensToFetch.forEach((token) => {
        const coinGeckoId = getTokenCoinGeckoId(token);
        if (coinGeckoId) {
          tokenIdMap.set(coinGeckoId, token);
          if (!coinGeckoIds.includes(coinGeckoId)) {
            coinGeckoIds.push(coinGeckoId);
          }
        }
      });

      if (coinGeckoIds.length === 0) {
        log(`Fetch #${fetchId}: No valid CoinGecko IDs found`);
        return;
      }

      // Fetch prices from CoinGecko
      const ids = coinGeckoIds.join(",");
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_last_updated_at=true`;

      log(`Fetch #${fetchId}: Making API call to CoinGecko`, {
        url,
        ids: coinGeckoIds,
      });

      const response = await fetch(url, {
        signal: abortControllerRef.current.signal,
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(
          `CoinGecko API error: ${response.status} ${response.statusText}`
        );
      }

      const data: CoinGeckoResponse = await response.json();
      log(`Fetch #${fetchId}: Received response`, data);

      // Map response back to token addresses
      const newPrices: PriceData = {};

      Object.entries(data).forEach(([coinGeckoId, priceInfo]) => {
        const token = tokenIdMap.get(coinGeckoId);
        if (token) {
          const tokenKey = `${token.chain_id}-${token.contract_address}`;
          newPrices[tokenKey] = {
            usd: priceInfo.usd,
            lastUpdated: priceInfo.last_updated_at || Date.now() / 1000,
          };
        }
      });

      log(`Fetch #${fetchId}: Mapped prices`, newPrices);

      setPrices((prevPrices) => ({
        ...prevPrices,
        ...newPrices,
      }));
      setLastUpdated(Date.now());
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        log(`Fetch #${fetchId}: Request was aborted`);
        return;
      }

      log(`Fetch #${fetchId}: Error occurred`, err);
      console.error("Failed to fetch prices from CoinGecko:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch prices");
    } finally {
      setIsLoading(false);
      log(`Fetch #${fetchId}: Completed`);
    }
  }, []); // Empty dependency array to prevent recreation

  // Main effect for setting up the price fetching
  useEffect(() => {
    log("Effect triggered, tokens count:", tokens.length);

    if (tokens.length === 0) {
      log("No tokens, skipping setup");
      return;
    }

    // Clear any existing interval
    if (intervalRef.current) {
      log("Clearing existing interval");
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Initial fetch
    log("Starting initial fetch");
    fetchPrices(tokens);

    // Set up interval for refetching every 15 seconds
    log("Setting up 15-second interval");
    intervalRef.current = setInterval(() => {
      log("Interval triggered, fetching prices");
      fetchPrices(tokens);
    }, 15000);

    return () => {
      log("Effect cleanup triggered");
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [tokensSignature]); // Only depend on stable signature

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      log("Component unmounting, final cleanup");
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Helper function to get price for a specific token
  const getTokenPrice = useCallback(
    (token: PortfolioToken): number | null => {
      const tokenKey = `${token.chain_id}-${token.contract_address}`;
      return prices[tokenKey]?.usd || null;
    },
    [prices]
  );

  // Helper function to check if we have a price for a token
  const hasPrice = useCallback(
    (token: PortfolioToken): boolean => {
      const tokenKey = `${token.chain_id}-${token.contract_address}`;
      return tokenKey in prices;
    },
    [prices]
  );

  // Manual refresh function
  const refresh = useCallback(() => {
    log("Manual refresh triggered");
    if (tokens.length > 0) {
      fetchPrices(tokens);
    }
  }, [tokens, fetchPrices]);

  return {
    prices,
    getTokenPrice,
    hasPrice,
    isLoading,
    error,
    lastUpdated,
    refresh,
  };
};
