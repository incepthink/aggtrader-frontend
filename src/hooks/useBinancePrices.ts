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

export interface SingleTokenPriceData {
  usd: number;
  lastUpdated: number;
  change24h?: number;
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

// Map single token address to Binance symbol (Ethereum only)
const getTokenAddressBinanceSymbol = (
  tokenAddress: string,
  chainId: number
): string | null => {
  const address = tokenAddress?.toLowerCase();

  // Only Ethereum (chainId: 1)
  if (chainId === 1) {
    const ethereumMap: { [key: string]: string } = {
      "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2": "ETHUSDT", // WETH
      "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": "USDCUSDT", // USDC
      "0xdac17f958d2ee523a2206206994597c13d831ec7": "USDTUSDT", // USDT
      "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599": "BTCUSDT", // WBTC
      "0x514910771af9ca656af840dff83e8264ecf986ca": "LINKUSDT", // LINK
      "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984": "UNIUSDT", // UNI
      "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9": "AAVEUSDT", // AAVE
      "0xc00e94cb662c3520282e6f5717214004a7f26888": "COMPUSDT", // COMP
      "0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2": "MKRUSDT", // MKR
      "0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f": "SNXUSDT", // SNX
      "0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e": "YFIUSDT", // YFI
      "0x6b3595068778dd592e39a122f4f5a5cf09c90fe2": "SUSHIUSDT", // SUSHI
      "0xd533a949740bb3306d119cc777fa900ba034cd52": "CRVUSDT", // CRV
      "0x111111111117dc0aa78b770fa6a738034120c302": "1INCHUSDT", // 1INCH
    };
    return ethereumMap[address] || null;
  }

  return null;
};

// Fetch single token price from Binance
const fetchBinancePrice = async (
  symbol: string,
  signal?: AbortSignal
): Promise<BinanceTickerResponse> => {
  try {
    const url = `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`;

    log("Fetching price for symbol:", symbol);

    const response = await fetch(url, { signal });

    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      symbol: data.symbol,
      price: data.lastPrice,
      priceChangePercent: data.priceChangePercent,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw error;
    }
    log("Single price fetch error:", error);
    throw error;
  }
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

// Hook for single token price
// Hook for single token price - Updated to accept symbol
export const useBinancePrice = (
  symbol: string,
  options: {
    enabled?: boolean;
    refetchInterval?: number;
    staleTime?: number;
  } = {}
) => {
  const {
    enabled = true,
    refetchInterval = 30000, // 30 seconds
    staleTime = 15000, // 15 seconds
  } = options;

  const [price, setPrice] = useState<SingleTokenPriceData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number>(0);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const fetchCountRef = useRef(0);

  // Get Binance symbol directly from the symbol
  const binanceSymbol = useMemo(() => {
    const symbolLower = symbol.toLowerCase();
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
    return symbolMap[symbolLower] || null;
  }, [symbol]);

  // Stable function to fetch price
  const fetchPriceStable = useCallback(async () => {
    console.log("binanceSymbol", binanceSymbol);

    if (!binanceSymbol || !enabled) return;

    fetchCountRef.current++;
    const fetchId = fetchCountRef.current;
    log(`[Single] Starting fetch #${fetchId} for ${binanceSymbol}`);

    // Cancel previous request
    if (abortControllerRef.current) {
      log(`[Single] Fetch #${fetchId}: Aborting previous request`);
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      setIsLoading(true);
      setError(null);

      const priceData = await fetchBinancePrice(
        binanceSymbol,
        abortControllerRef.current.signal
      );

      log(`[Single] Fetch #${fetchId}: Received price data`, priceData);

      const newPrice: SingleTokenPriceData = {
        usd: parseFloat(priceData.price),
        lastUpdated: Date.now(),
        change24h: priceData.priceChangePercent
          ? parseFloat(priceData.priceChangePercent)
          : undefined,
      };

      setPrice(newPrice);
      setLastUpdated(Date.now());
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        log(`[Single] Fetch #${fetchId}: Request was aborted`);
        return;
      }

      log(`[Single] Fetch #${fetchId}: Error occurred:`, err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to fetch price from Binance";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      log(`[Single] Fetch #${fetchId}: Completed`);
    }
  }, [binanceSymbol, enabled]);

  // Main effect - fetch price and set up interval
  useEffect(() => {
    if (!binanceSymbol || !enabled) {
      log("[Single] No binance symbol or disabled, skipping setup");
      return;
    }

    // Clear any existing interval
    if (intervalRef.current) {
      log("[Single] Clearing existing interval");
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Check if data is stale
    const isStale = !lastUpdated || Date.now() - lastUpdated > staleTime;

    if (isStale) {
      // Initial fetch
      log("[Single] Starting initial fetch");
      fetchPriceStable();
    }

    // Set up interval if refetchInterval is provided
    if (refetchInterval > 0) {
      log(`[Single] Setting up ${refetchInterval}ms interval`);
      intervalRef.current = setInterval(() => {
        log("[Single] Interval tick - fetching price");
        fetchPriceStable();
      }, refetchInterval);
    }

    return () => {
      log("[Single] Effect cleanup");
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [
    binanceSymbol,
    enabled,
    fetchPriceStable,
    refetchInterval,
    staleTime,
    lastUpdated,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      log("[Single] Component unmounting");
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const refetch = useCallback(() => {
    log("[Single] Manual refetch triggered");
    fetchPriceStable();
  }, [fetchPriceStable]);

  const isSupported = useMemo(() => {
    return binanceSymbol !== null;
  }, [binanceSymbol]);

  return {
    tokenPrice: price?.usd || null,
    change24h: price?.change24h || null,
    isLoading,
    isError: !!error,
    error,
    lastUpdated,
    refetch,
    isSupported,
  };
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
