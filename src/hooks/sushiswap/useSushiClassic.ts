import { useState, useCallback, useEffect } from "react";
import { ChainId } from "sushi";
import { getQuote, getSwap } from "sushi/evm";
import { type Address } from "viem";
import {
  useAccount,
  usePublicClient,
  useSendTransaction,
  useWaitForTransactionReceipt,
} from "wagmi";
import { useSpotStore } from "@/store/spotStore";
import { saveTradeMarker } from "@/utils/localStorage/tradeMarkers";
import { usePriceBackend } from "./usePriceBackend";

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

export const useSushiClassic = () => {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const chainId = useSpotStore((s) => s.chainId);

  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

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
} = useWaitForTransactionReceipt({ hash: txHash });

console.log("TRX DATA:", receiptData);

// Get chartToken from store
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

// Save trade marker when transaction completes
useEffect(() => {
  if (isDone && receiptData && quote) {
    const saveTradeData = async () => {
      try {
        // Get block timestamp
        if (!publicClient) return;
        
        const block = await publicClient.getBlock({
          blockNumber: receiptData.blockNumber,
        });

        // Determine if buy or sell based on chartToken
        const isBuy = chartToken.address.toLowerCase() === quote.tokenTo.address.toLowerCase();

        const normalizedTokenAddress = chartToken.address.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
  ? '0xee7d8bcfb72bc1880d0cf19822eb0a2e6577ab62'
  : chartToken.address;

  const needsInversion = chartToken.address.toLowerCase() !== quote.tokenFrom.address.toLowerCase();
const finalPrice = needsInversion ? (1 / quote.swapPrice) : quote.swapPrice;
        
        const tradeMarker = {
          id: receiptData.transactionHash,
          timestamp: Number(block.timestamp) * 1000, // Convert to milliseconds
          tokenAddress: normalizedTokenAddress,
          price: currentPriceForMarker || finalPrice,
          amount: isBuy ? quote.amountOut : quote.amountIn,
          type: isBuy ? 'buy' as const : 'sell' as const,
          txHash: receiptData.transactionHash,
          blockNumber: Number(receiptData.blockNumber),
        };

        console.log('Saving trade marker:', tradeMarker);
        saveTradeMarker(tradeMarker);
        
      } catch (error) {
        console.error('Error saving trade marker:', error);
      }
    };

    saveTradeData();
  }
}, [isDone, receiptData, quote, chartToken, publicClient]);

  // Convert chainId to Sushi ChainId
  const getSushiChainId = useCallback(() => {
    return chainId === 1 ? ChainId.ETHEREUM : ChainId.KATANA;
  }, [chainId]);

  // Get quote from Sushi API
  const fetchQuote = useCallback(
    async ({ tokenIn, tokenOut, amount, slippage }: SwapParams) => {
      if (!amount || parseFloat(amount) === 0) {
        setQuote(null);
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
          maxSlippage: slippage / 100, // Convert percentage to decimal
        });

        console.log("Quote response:", quoteData);

        // Check if the response has the expected structure
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
        return null;
      } finally {
        setIsLoadingQuote(false);
      }
    },
    [getSushiChainId]
  );

  // Execute swap
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

        // Get swap transaction data from Sushi API
        const swapData = await getSwap({
          chainId: getSushiChainId(),
          tokenIn: tokenIn.address,
          tokenOut: tokenOut.address,
          sender: address,
          amount: amountWei,
          maxSlippage: slippage / 100, // Convert percentage to decimal
        });

        console.log("Swap response:", swapData);

        // Check if the response has the expected structure
        if (swapData && swapData.status === "Success" && swapData.tx) {
          const { tx } = swapData;

          // Optional: Simulate the transaction first
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
            // Continue with the transaction even if simulation fails
          }

          // Execute the transaction
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

  // Calculate price ratio for UI
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
    // Quote state
    quote,
    isLoadingQuote,
    quoteError,

    // Transaction state
    txHash,
    isSending,
    isConfirming,
    isDone,
    sendError,
    confirmError,

    // Functions
    fetchQuote,
    executeSwap,
    getPriceRatio,

    // Helpers
    isConnected,
    chainId: getSushiChainId(),
  };
};
