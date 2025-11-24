import { useState, useCallback, useEffect,useRef } from "react";
import { ChainId } from "sushi";
import { getQuote, getSwap } from "sushi/evm";
import { type Address } from "viem";
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

  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
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
        callbacks?.onSuccess?.(); // Reset state
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

          // Backend tracking for classic swap
          const amountInFormatted = parseFloat(quote.amountIn) / (10 ** quote.tokenFrom.decimals);
          const amountOutFormatted = parseFloat(quote.amountOut) / (10 ** quote.tokenTo.decimals);

          // Calculate USD volume using current price or swap price
          const usdVolume = currentPriceForMarker
            ? amountInFormatted * currentPriceForMarker
            : amountInFormatted * (quote.tokenFrom.symbol === chartToken.ticker ? finalPrice : 1/finalPrice);

          await trackClassicSwap({
            walletAddress: address,
            txHash: receiptData.transactionHash,
            tokenFrom: {
              address: quote.tokenFrom.address,
              symbol: quote.tokenFrom.symbol,
              amount: amountInFormatted.toString(),
            },
            tokenTo: {
              address: quote.tokenTo.address,
              symbol: quote.tokenTo.symbol,
              amount: amountOutFormatted.toString(),
            },
            usdVolume,
            executionPrice: finalPrice,
          });

          callbacks?.showSnackbar?.("Transaction successful!", "success");
          console.log("Invalidating balance queries...");
          queryClient.invalidateQueries({ queryKey: ['balance'] });
          callbacks?.onSuccess?.();

        } catch (error) {
          console.error('Error saving trade marker:', error);
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
      console.error("Transaction send error:", sendError);
      callbacks?.showSnackbar?.(
        sendError.message || "Transaction failed to send",
        "error"
      );
      callbacks?.onSuccess?.(); // Reset state even on error
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
        return null;
      }

      setIsLoadingQuote(true);
      setQuoteError(null);

      try {
        const amountWei = BigInt(
          (parseFloat(amount) * 10 ** tokenIn.decimals).toFixed(0)
        );

        console.log("chainId", getSushiChainId());

        const quoteData = await getQuote({
          chainId: getSushiChainId(),
          tokenIn: tokenIn.address,
          tokenOut: tokenOut.address,
          amount: amountWei,
          maxSlippage: slippage / 100,
        });

        console.log("Quote response:", quoteData);

        if (address && quoteData && quoteData.status === "Success") {
          try {
            const swapData = await getSwap({
              chainId: getSushiChainId(),
              tokenIn: tokenIn.address,
              tokenOut: tokenOut.address,
              sender: address,
              amount: amountWei,
              maxSlippage: slippage / 100,
            });
            
            if (swapData && 'tx' in swapData && swapData.tx?.to) {
              setRouterAddress(swapData.tx.to);
              console.log("Router address:", swapData.tx.to);
            }
          } catch (swapError) {
            console.warn("Failed to get router address:", swapError);
          }
        }

        if (quoteData && quoteData.status === "Success") {
          const quote: QuoteData = {
            amountOut: quoteData.assumedAmountOut,
            priceImpact: quoteData.priceImpact,
            swapPrice: quoteData.swapPrice,
            amountIn: quoteData.amountIn,
            tokenFrom: quoteData.tokenFrom,
            tokenTo: quoteData.tokenTo,
            status: quoteData.status,
          };

          setQuote(quote);
          return quote;
        } else {
          throw new Error("Failed to get quote");
        }
      } catch (error) {
        console.error("Quote error:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to fetch quote";
        setQuoteError(errorMessage);
        setQuote(null);
        setRouterAddress(null);
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
        const amountWei = BigInt(
          (parseFloat(amount) * 10 ** tokenIn.decimals).toFixed(0)
        );

        const swapData = await getSwap({
          chainId: getSushiChainId(),
          tokenIn: tokenIn.address,
          tokenOut: tokenOut.address,
          sender: address,
          amount: amountWei,
          maxSlippage: slippage / 100,
        });

        console.log("Swap response:", swapData);

        if (swapData && 'tx' in swapData && swapData.tx) {
          const { tx } = swapData;

          setRouterAddress(tx.to!);

          try {
            const callResult = await publicClient.call({
              account: address,
              data: tx.data,
              to: tx.to,
              value: tx.value || BigInt(0),
            });
            console.log("Simulation output:", callResult);
          } catch (simulationError) {
            console.warn("Simulation failed:", simulationError);
          }

          return sendTransaction({
            to: tx.to!,
            data: tx.data!,
            value: tx.value || BigInt(0),
          });
        } else {
          throw new Error("Failed to get swap transaction");
        }
      } catch (error) {
        console.error("Swap error:", error);
        throw error;
      }
    },
    [address, isConnected, publicClient, sendTransaction, getSushiChainId]
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