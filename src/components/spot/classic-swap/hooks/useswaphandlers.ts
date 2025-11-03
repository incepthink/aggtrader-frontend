import { useCallback } from "react";
import { formatUnits } from "viem";
import type { Token, SnackbarSeverity } from "../types";
import { useSushiClassic } from "./usesushiclassic";
import { useSwapPrices } from "./useswapprices";
import { useQuoteDebounce } from "./usequotedebounce";
import { useSpotStore } from "@/store/spotStore";

interface UseSwapHandlersProps {
  tokenOne: Token;
  tokenTwo: Token;
  tokenOneAmount: string;
  tokenTwoAmount: string;
  slippage: number;
  isInitiatingSwap: boolean;
  address: string | undefined;
  isConnected: boolean;
  setTokenOne: (token: Token) => void;
  setTokenTwo: (token: Token) => void;
  setTokenOneAmount: (amount: string) => void;
  setTokenTwoAmount: (amount: string) => void;
  setIsInitiatingSwap: (value: boolean) => void;
  showSnackbar: (message: string, severity: SnackbarSeverity) => void;
}

export function useSwapHandlers({
  tokenOne,
  tokenTwo,
  tokenOneAmount,
  tokenTwoAmount,
  slippage,
  isInitiatingSwap,
  address,
  isConnected,
  setTokenOne,
  setTokenTwo,
  setTokenOneAmount,
  setTokenTwoAmount,
  setIsInitiatingSwap,
  showSnackbar,
}: UseSwapHandlersProps) {
  /* --------- Custom hooks --------- */
  const {
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
  } = useSushiClassic();

  const switchTokens = useSpotStore((s) => s.switchTokens);

  const {
    prices,
    isLoadingPrices,
    tokenOnePrice,
    tokenTwoPrice,
    binancePriceError,
    fetchPrices,
  } = useSwapPrices(tokenOne, tokenTwo);

  /* --------- Quote fetching with debounce --------- */
  useQuoteDebounce({
    tokenOneAmount,
    tokenOne,
    tokenTwo,
    slippage,
    fetchQuote,
    setTokenTwoAmount,
  });

  /* --------- Amount change handlers --------- */
  const handleSellAmountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setTokenOneAmount(value);

      if (!value) {
        setTokenTwoAmount("");
      }
    },
    [setTokenOneAmount, setTokenTwoAmount]
  );

  const handleBuyAmountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setTokenTwoAmount(value);

      // Use price ratio for reverse calculation
      if (value && prices) {
        setTokenOneAmount((parseFloat(value) / prices.ratio).toFixed(6));
      } else {
        setTokenOneAmount("");
      }
    },
    [prices, setTokenOneAmount, setTokenTwoAmount]
  );

  /* --------- Max balance handler --------- */
  const handleMaxBalance = useCallback(
    async (balance: string) => {
      setTokenOneAmount(balance);

      if (balance && parseFloat(balance) > 0) {
        const quoteResult = await fetchQuote({
          tokenIn: tokenOne,
          tokenOut: tokenTwo,
          amount: balance,
          slippage,
        });

        if (quoteResult) {
          const amountOut = formatUnits(
            BigInt(quoteResult.amountOut),
            tokenTwo.decimals
          );
          setTokenTwoAmount(parseFloat(amountOut).toFixed(6));
        }
      } else {
        setTokenTwoAmount("");
      }
    },
    [tokenOne, tokenTwo, slippage, fetchQuote, setTokenOneAmount, setTokenTwoAmount]
  );

  /* --------- Switch tokens --------- */
const handleSwitchTokens = useCallback(() => {
  setTokenOneAmount("");
  setTokenTwoAmount("");

  // Use store's switchTokens method (doesn't update chartToken)
  switchTokens();

  // Fetch new prices
  fetchPrices(tokenTwo.address, tokenOne.address); // Note: swapped order
}, [
  tokenOne,
  tokenTwo,
  switchTokens,
  setTokenOneAmount,
  setTokenTwoAmount,
  fetchPrices,
]);

  /* --------- Swap execution --------- */
  const handleSwap = useCallback(async () => {
    // Prevent multiple calls
    if (isInitiatingSwap || isSending || isConfirming) {
      return;
    }

    if (!tokenOneAmount || !address || !isConnected) {
      showSnackbar("Connect wallet and enter an amount", "warning");
      return;
    }

    // Set loading state immediately
    setIsInitiatingSwap(true);

    try {
      await executeSwap({
        tokenIn: tokenOne,
        tokenOut: tokenTwo,
        amount: tokenOneAmount,
        slippage,
      });
    } catch (error: any) {
      console.error("Swap error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Swap failed";
      showSnackbar(errorMessage, "error");

      // Reset loading state on error
      setIsInitiatingSwap(false);
    }
  }, [
    isInitiatingSwap,
    isSending,
    isConfirming,
    tokenOneAmount,
    address,
    isConnected,
    tokenOne,
    tokenTwo,
    slippage,
    executeSwap,
    setIsInitiatingSwap,
    showSnackbar,
  ]);

  return {
    handleSellAmountChange,
    handleBuyAmountChange,
    handleMaxBalance,
    handleSwitchTokens,
    handleSwap,
    quote,
    isLoadingQuote,
    quoteError,
    txHash,
    isSending,
    isConfirming,
    isDone,
    sendError,
    confirmError,
    prices,
    isLoadingPrices,
    tokenOnePrice,
    tokenTwoPrice,
    binancePriceError,
  };
}