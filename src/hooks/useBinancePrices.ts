// hooks/useBinancePrices.ts (Fixed - No Infinite Calls)
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import type { PortfolioToken } from "@/hooks/usePortfolioDetailed";

export interface PriceData {
  [tokenAddress: string]: {
    usd: number;
    lastUpdated: number;
    change24h?: number;
  };
}

interface BinanceTickerResponse {
  symbol: string;
  price: string;
  priceChangePercent?: string;
}

const DEBUG_BINANCE = false;
const log = (...args: any[]) =>
  DEBUG_BINANCE && console.log("[BinancePrices]", ...args);

// Map tokens to Binance trading pairs
const getTokenBinanceSymbol = (token: PortfolioToken): string | null => {
  const symbol = token.symbol.toLowerCase();

  const symbolMap: { [key: string]: string } = {
    eth: "ETHUSDT",
    weth: "ETHUSDT",
    wbtc: "BTCUSDT",
    usdc: "USDCUSDT",
    usdt: "USDTUSDT",
    link: "LINKUSDT",
    uni: "UNIUSDT",
    aave: "AAVEUSDT",
    comp: "COMPUSDT",
    mkr: "MKRUSDT",
    snx: "SNXUSDT",
    yfi: "YFIUSDT",
    sushi: "SUSHIUSDT",
    crv: "CRVUSDT",
    "1inch": "1INCHUSDT",
    matic: "MATICUSDT",
    bnb: "BNBUSDT",
    ada: "ADAUSDT",
    dot: "DOTUSDT",
    avax: "AVAXUSDT",
    sol: "SOLUSDT",
    ftm: "FTMUSDT",
    atom: "ATOMUSDT",
    near: "NEARUSDT",
    algo: "ALGOUSDT",
    xlm: "XLMUSDT",
    xrp: "XRPUSDT",
    doge: "DOGEUSDT",
    shib: "SHIBUSDT",
    ltc: "LTCUSDT",
    bch: "BCHUSDT",
    etc: "ETCUSDT",
    fil: "FILUSDT",
    xtz: "XTZUSDT",
    eos: "EOSUSDT",
    trx: "TRXUSDT",
    xmr: "XMRUSDT",
    dash: "DASHUSDT",
    zec: "ZECUSDT",
    dcr: "DCRUSDT",
  };

  return symbolMap[symbol] || null;
};

// Fetch multiple prices in batch
const fetchBinancePricesBatch = async (
  symbols: string[],
  signal?: AbortSignal
): Promise<BinanceTickerResponse[]> => {
  try {
    const symbolsParam = symbols.map((s) => `"${s}"`).join(",");
    const url = `https://api.binance.com/api/v3/ticker/24hr?symbols=[${symbolsParam}]`;

    log("Fetching batch prices:", symbols);

    const response = await fetch(url, { signal });

    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status}`);
    }

    const data = await response.json();

    return data.map((item: any) => ({
      symbol: item.symbol,
      price: item.lastPrice,
      priceChangePercent: item.priceChangePercent,
    }));
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw error;
    }
    log("Batch fetch error:", error);
    throw error;
  }
};

export const useBinancePrices = (tokens: PortfolioToken[] = []) => {
  const [prices, setPrices] = useState<PriceData>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number>(0);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const fetchCountRef = useRef(0);

  // Create stable tokens signature
  const tokensSignature = useMemo(() => {
    return tokens
      .map((t) => `${t.chain_id}-${t.contract_address}-${t.symbol}`)
      .sort()
      .join("|");
  }, [tokens]);

  // Stable function to fetch prices
  const fetchPricesStable = useCallback(async () => {
    fetchCountRef.current++;
    const fetchId = fetchCountRef.current;
    log(`Starting fetch #${fetchId}`);

    // Get current binance tokens from current tokens
    const currentBinanceTokens = tokens
      .map((token) => ({
        token,
        binanceSymbol: getTokenBinanceSymbol(token),
      }))
      .filter((item) => item.binanceSymbol !== null) as Array<{
      token: PortfolioToken;
      binanceSymbol: string;
    }>;

    if (currentBinanceTokens.length === 0) {
      log(`Fetch #${fetchId}: No supported tokens`);
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

      const symbols = currentBinanceTokens.map((item) => item.binanceSymbol);
      const uniqueSymbols = [...new Set(symbols)];

      log(`Fetch #${fetchId}: Fetching ${uniqueSymbols.length} symbols`);

      const priceData = await fetchBinancePricesBatch(
        uniqueSymbols,
        abortControllerRef.current.signal
      );

      if (priceData.length === 0) {
        throw new Error("No price data received from Binance");
      }

      log(`Fetch #${fetchId}: Received ${priceData.length} prices`);

      // Create price lookup map
      const priceMap = new Map<string, BinanceTickerResponse>();
      priceData.forEach((item) => {
        priceMap.set(item.symbol, item);
      });

      // Map prices back to tokens
      const newPrices: PriceData = {};

      currentBinanceTokens.forEach(({ token, binanceSymbol }) => {
        const priceInfo = priceMap.get(binanceSymbol);
        if (priceInfo) {
          const tokenKey = `${token.chain_id}-${token.contract_address}`;
          newPrices[tokenKey] = {
            usd: parseFloat(priceInfo.price),
            lastUpdated: Date.now(),
            change24h: priceInfo.priceChangePercent
              ? parseFloat(priceInfo.priceChangePercent)
              : undefined,
          };
        }
      });

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

      log(`Fetch #${fetchId}: Error occurred:`, err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to fetch prices from Binance";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      log(`Fetch #${fetchId}: Completed`);
    }
  }, [tokens]); // Only depend on tokens

  // Main effect - only runs when tokensSignature changes
  useEffect(() => {
    log("Main effect triggered, tokens count:", tokens.length);

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
    fetchPricesStable();

    // Set up interval
    log("Setting up 10-second interval");
    intervalRef.current = setInterval(() => {
      log("Interval tick - fetching prices");
      fetchPricesStable();
    }, 10000);

    return () => {
      log("Effect cleanup");
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [tokensSignature]); // ONLY tokensSignature

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      log("Component unmounting");
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Memoized helper functions
  const getTokenPrice = useCallback(
    (token: PortfolioToken): number | null => {
      const tokenKey = `${token.chain_id}-${token.contract_address}`;
      return prices[tokenKey]?.usd || null;
    },
    [prices]
  );

  const getTokenChange24h = useCallback(
    (token: PortfolioToken): number | null => {
      const tokenKey = `${token.chain_id}-${token.contract_address}`;
      return prices[tokenKey]?.change24h || null;
    },
    [prices]
  );

  const hasPrice = useCallback(
    (token: PortfolioToken): boolean => {
      const tokenKey = `${token.chain_id}-${token.contract_address}`;
      return tokenKey in prices;
    },
    [prices]
  );

  const isTokenSupported = useCallback((token: PortfolioToken): boolean => {
    return getTokenBinanceSymbol(token) !== null;
  }, []);

  // Memoized computed values
  const unsupportedTokens = useMemo(() => {
    return tokens.filter((token) => !isTokenSupported(token));
  }, [tokens, isTokenSupported]);

  const supportedTokensCount = useMemo(() => {
    return tokens.filter((token) => isTokenSupported(token)).length;
  }, [tokens, isTokenSupported]);

  const refresh = useCallback(() => {
    log("Manual refresh triggered");
    fetchPricesStable();
  }, [fetchPricesStable]);

  return {
    prices,
    getTokenPrice,
    getTokenChange24h,
    hasPrice,
    isTokenSupported,
    unsupportedTokens,
    isLoading,
    error,
    lastUpdated,
    refresh,
    supportedTokensCount,
    totalTokensCount: tokens.length,
  };
};
