import { useState, useCallback, useEffect,useRef } from "react";
import { ChainId } from "sushi";
import { type Address } from "viem";
import {
  fetchQuoteFromBackend,
  fetchSwapFromBackend
} from "@/services/sushiswap/classicSwapApi";
import {
  useAccount,
  usePublicClient,
  useSendTransaction,
  useWaitForTransactionReceipt,
} from "wagmi";
import { useQueryClient } from "@tanstack/react-query"; // NEW
import { useSpotStore } from "@/store/spotStore";
import { saveTradeMarker } from "@/utils/localStorage/tradeMarkers";
import { usePriceBackend } from "./usePriceBackend";
import { trackClassicSwap } from "@/utils/tracking/classicSwapTracking";

interface Token {
  address: Address;
  name: string;
  ticker: string;
  img: string;
  decimals: number;
}

interface QuoteData {
  amountOut: string;
  priceImpact: number;
  swapPrice: number;
  amountIn: string;
  tokenFrom: {
    address: string;
    decimals: number;
    symbol: string;
    name: string;
  };
  tokenTo: {
    address: string;
    decimals: number;
    symbol: string;
    name: string;
  };
  status: string;
}

interface SwapParams {
  tokenIn: Token;
  tokenOut: Token;
  amount: string;
  slippage: number;
}

// NEW: Add callback types
interface UseSushiClassicCallbacks {
  onSuccess?: () => void;
  showSnackbar?: (message: string, severity: "success" | "error" | "info") => void;
}

export const useSushiClassic = (callbacks?: UseSushiClassicCallbacks) => {
  const { address, isConnected } = useAccount();
  const chainId = useSpotStore((s) => s.chainId);
  const publicClient = usePublicClient({ chainId });
  const queryClient = useQueryClient(); // NEW
  const hasNotified = useRef(false);
  const lastErrorMessage = useRef<string>("");

  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [quoteWarning, setQuoteWarning] = useState<string | null>(null);
  const [routerAddress, setRouterAddress] = useState<Address | null>(null);

  const {
    data: txHash,
    sendTransaction,
    isPending: isSending,
    error: sendError,
  } = useSendTransaction();

  const {
    data: receiptData,
    isLoading: isConfirming,
    isSuccess: isDone,
    error: confirmError,
  } = useWaitForTransactionReceipt({
    hash: txHash,
    chainId
  });

  console.log("TRX DATA:", receiptData);

  const chartToken = useSpotStore((s) => s.chartToken);

  const {
    tokenPrice: currentPriceForMarker,
  } = usePriceBackend(
    chartToken.address as any,
    undefined,
    747474,
    {
      enabled: true,
      refetchInterval: 30000,
      staleTime: 15000,
    }
  );

  // UPDATED: Combined effect for trade marker + notifications + balance refresh + backend tracking
  useEffect(() => {
    if (isDone && receiptData && quote && !hasNotified.current) {
      hasNotified.current = true; // Set flag immediately

      // Check if transaction was reverted (status === 0 means failed)
      if (receiptData.status === 'reverted') {
        console.error('Transaction was reverted');
        callbacks?.showSnackbar?.("Transaction failed and was reverted", "error");
        // Small delay to ensure notification shows before re-enabling button
        setTimeout(() => {
          callbacks?.onSuccess?.(); // Reset state
        }, 100);
        return;
      }

      const saveTradeData = async () => {
        try {
          if (!publicClient || !address) return;

          const block = await publicClient.getBlock({
            blockNumber: receiptData.blockNumber,
          });

          const isBuy = chartToken.address.toLowerCase() === quote.tokenTo.address.toLowerCase();

          const normalizedTokenAddress = chartToken.address.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
            ? '0xee7d8bcfb72bc1880d0cf19822eb0a2e6577ab62'
            : chartToken.address;

          const needsInversion = chartToken.address.toLowerCase() !== quote.tokenFrom.address.toLowerCase();
          const finalPrice = needsInversion ? (1 / quote.swapPrice) : quote.swapPrice;

          const tradeMarker = {
            id: receiptData.transactionHash,
            timestamp: Number(block.timestamp) * 1000,
            tokenAddress: normalizedTokenAddress,
            price: currentPriceForMarker || finalPrice,
            amount: isBuy ? quote.amountOut : quote.amountIn,
            type: isBuy ? 'buy' as const : 'sell' as const,
            txHash: receiptData.transactionHash,
            blockNumber: Number(receiptData.blockNumber),
          };

          console.log('Saving trade marker:', tradeMarker);
          saveTradeMarker(tradeMarker);

          callbacks?.showSnackbar?.("Transaction successful!", "success");

          // Invalidate balance queries
          console.log("Invalidating balance queries...");
          queryClient.invalidateQueries({ queryKey: ['balance'] });

          // Small delay to ensure notification shows before re-enabling button
          setTimeout(() => {
            callbacks?.onSuccess?.();
          }, 100);

        } catch (error) {
          console.error('Error saving trade marker:', error);
          // Still show success and reset even if trade marker fails
          callbacks?.showSnackbar?.("Transaction successful!", "success");
          setTimeout(() => {
            callbacks?.onSuccess?.();
          }, 100);
        }
      };

      saveTradeData();
    }
  }, [isDone, receiptData, quote, chartToken, publicClient, queryClient, callbacks, address, currentPriceForMarker]);

  // NEW: Reset flag when starting new transaction
  useEffect(() => {
    if (isSending) {
      hasNotified.current = false;
    }
  }, [isSending]);

  // Handle transaction errors - reset state and show error notification
  useEffect(() => {
    if (sendError && !isSending) {
      const errorMessage = sendError.message || "";

      // Prevent duplicate error handling for the same error
      if (lastErrorMessage.current === errorMessage) {
        return;
      }

      lastErrorMessage.current = errorMessage;
      console.error("Transaction send error:", sendError);

      // Check if user rejected the transaction
      const isUserRejection =
        errorMessage.includes("User rejected") ||
        errorMessage.includes("User denied") ||
        errorMessage.includes("user rejected") ||
        errorMessage.includes("rejected the request") 
        // sendError.name === "UserRejectedRequestError";

      if (isUserRejection) {
        callbacks?.showSnackbar?.(
          "Transaction cancelled by user",
          "info"
        );
      } else {
        // For other errors, show a clean message
        const cleanMessage = errorMessage.length > 100
          ? "Transaction failed. Please try again."
          : errorMessage || "Transaction failed to send";

        callbacks?.showSnackbar?.(cleanMessage, "error");
      }

      callbacks?.onSuccess?.(); // Reset state even on error
    } else if (!sendError) {
      // Reset error tracking when error is cleared
      lastErrorMessage.current = "";
    }
  }, [sendError, isSending, callbacks]);

  useEffect(() => {
    if (confirmError && !isConfirming) {
      console.error("Transaction confirmation error:", confirmError);
      callbacks?.showSnackbar?.(
        "Transaction failed during confirmation",
        "error"
      );
      callbacks?.onSuccess?.(); // Reset state even on error
    }
  }, [confirmError, isConfirming, callbacks]);

  const getSushiChainId = useCallback(() => {
    return ChainId.KATANA; // Katana is the only supported chain
  }, []);

  const fetchQuote = useCallback(
    async ({ tokenIn, tokenOut, amount, slippage }: SwapParams) => {
      if (!amount || parseFloat(amount) === 0) {
        setQuote(null);
        setRouterAddress(null);
        setQuoteWarning(null);
        return null;
      }

      setIsLoadingQuote(true);
      setQuoteError(null);
      setQuoteWarning(null);

      try {
        console.log("Fetching quote from backend API");

        const response = await fetchQuoteFromBackend({
          tokenIn: {
            address: tokenIn.address,
            decimals: tokenIn.decimals,
          },
          tokenOut: {
            address: tokenOut.address,
            decimals: tokenOut.decimals,
          },
          amount: amount, // Keep as human-readable decimal string
          slippage: slippage, // Pass directly (backend handles /100)
        });

        console.log("Quote response:", response);

        const quoteData = response.data;

        if (quoteData && quoteData.status === "Success") {
          const quote: QuoteData = {
            amountOut: quoteData.amountOut,
            priceImpact: parseFloat(quoteData.priceImpact),
            swapPrice: parseFloat(quoteData.swapPrice),
            amountIn: quoteData.amountIn,
            tokenFrom: {
              address: quoteData.tokenFrom,
              decimals: tokenIn.decimals,
              symbol: tokenIn.ticker,
              name: tokenIn.name,
            },
            tokenTo: {
              address: quoteData.tokenTo,
              decimals: tokenOut.decimals,
              symbol: tokenOut.ticker,
              name: tokenOut.name,
            },
            status: quoteData.status,
          };

          // Router address is included in quote response
          setRouterAddress(quoteData.routerAddress);
          setQuote(quote);
          return quote;
        } else {
          throw new Error("Failed to get quote");
        }
      } catch (error) {
        console.warn("Quote warning:", error);
        const warningMessage =
          error instanceof Error ? error.message : "Failed to fetch quote";
        setQuoteWarning(warningMessage);
        // Don't set quote to null - allow swap to proceed
        // Swap will get fresh quote from backend
        return null;
      } finally {
        setIsLoadingQuote(false);
      }
    },
    [getSushiChainId, address]
  );

  const executeSwap = useCallback(
    async ({ tokenIn, tokenOut, amount, slippage }: SwapParams) => {
      if (!address || !isConnected || !publicClient) {
        throw new Error("Wallet not connected");
      }

      if (!amount || parseFloat(amount) === 0) {
        throw new Error("Invalid amount");
      }

      try {
        console.log("Fetching swap data from backend API");

        const response = await fetchSwapFromBackend({
          tokenIn: {
            address: tokenIn.address,
            decimals: tokenIn.decimals,
          },
          tokenOut: {
            address: tokenOut.address,
            decimals: tokenOut.decimals,
          },
          amount: amount, // Keep as human-readable decimal string
          slippage: slippage, // Pass directly (backend handles /100)
          userAddress: address,
        });

        console.log("Swap response:", response);

        const txData = response.data;

        if (txData && txData.to && txData.data) {
          // Convert value string to BigInt
          const txValue = txData.value ? BigInt(txData.value) : BigInt(0);

          setRouterAddress(txData.to);

          try {
            const callResult = await publicClient.call({
              account: address,
              data: txData.data as `0x${string}`,
              to: txData.to,
              value: txValue,
            });
            console.log("Simulation output:", callResult);
          } catch (simulationError) {
            console.warn("Simulation failed:", simulationError);
          }

          return sendTransaction({
            to: txData.to,
            data: txData.data as `0x${string}`,
            value: txValue,
          });
        } else {
          throw new Error("Failed to get swap transaction");
        }
      } catch (error) {
        console.error("Swap error:", error);
        throw error;
      }
    },
    [address, isConnected, publicClient, sendTransaction]
  );

  const getPriceRatio = useCallback(
    (tokenIn: Token, tokenOut: Token, amountIn: string) => {
      if (!quote || !amountIn || parseFloat(amountIn) === 0) return 0;

      const amountOutFormatted =
        parseFloat(quote.amountOut) / 10 ** tokenOut.decimals;
      const amountInFloat = parseFloat(amountIn);

      return amountOutFormatted / amountInFloat;
    },
    [quote]
  );

  return {
    quote,
    isLoadingQuote,
    quoteError,
    quoteWarning,
    txHash,
    isSending,
    isConfirming,
    isDone,
    sendError,
    confirmError,
    fetchQuote,
    executeSwap,
    getPriceRatio,
    isConnected,
    chainId: getSushiChainId(),
    routerAddress,
  };
};