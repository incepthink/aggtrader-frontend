import { useCallback, useMemo } from "react";
import { formatUnits } from "viem";
import type { Token, SnackbarSeverity } from "../types";
import { useSushiClassic } from "./usesushiclassic";
import { usePriceBackend } from "@/hooks/sushiswap/usePriceBackend";
import { useQuoteDebounce } from "./usequotedebounce";
import { useTokenApproval, ApprovalState } from "./useTokenApproval";
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
    routerAddress,
  } = useSushiClassic({
    // NEW: Pass callbacks
    showSnackbar,
    onSuccess: () => {
      setTokenOneAmount("");
      setTokenTwoAmount("");
      setIsInitiatingSwap(false);
    },
  });

  const switchTokens = useSpotStore((s) => s.switchTokens);
  const chainId = useSpotStore((s) => s.chainId);

  // CHANGED: Use usePriceBackend for both tokens with optimized settings
  const {
    tokenPrice: tokenOnePrice,
    isLoading: isLoadingTokenOnePrice,
    isError: tokenOnePriceError,
  } = usePriceBackend(
    tokenOne.address as any,
    undefined,
    chainId,
    {
      enabled: true,
      refetchInterval: 30000, // 30 seconds - matches your chart
      staleTime: 15000, // 15 seconds cache
    }
  );

  const {
    tokenPrice: tokenTwoPrice,
    isLoading: isLoadingTokenTwoPrice,
    isError: tokenTwoPriceError,
  } = usePriceBackend(
    tokenTwo.address as any,
    undefined,
    chainId,
    {
      enabled: true,
      refetchInterval: 30000,
      staleTime: 15000,
    }
  );

  // CHANGED: Calculate prices object manually
  const prices = useMemo(() => {
    if (!tokenOnePrice || !tokenTwoPrice) return null;
    
    return {
      ratio: tokenOnePrice / tokenTwoPrice,
      tokenOne: tokenOnePrice,
      tokenTwo: tokenTwoPrice,
    };
  }, [tokenOnePrice, tokenTwoPrice]);

  const isLoadingPrices = isLoadingTokenOnePrice || isLoadingTokenTwoPrice;
  const binancePriceError = tokenOnePriceError || tokenTwoPriceError;

  // Token approval hook
  const {
    state: approvalState,
    approve,
    isApproving,
    isConfirmingApproval,
    isApprovalConfirmed,
    approvalError,
  } = useTokenApproval({
    token: tokenOne,
    spender: routerAddress,
    amount: tokenOneAmount,
    enabled: !!tokenOneAmount && !!routerAddress && isConnected,
    approveMax: false,
  });

  const needsApproval = approvalState === ApprovalState.NOT_APPROVED;

  useQuoteDebounce({
    tokenOneAmount,
    tokenOne,
    tokenTwo,
    slippage,
    fetchQuote,
    setTokenTwoAmount,
  });

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

      if (value && prices) {
        setTokenOneAmount((parseFloat(value) / prices.ratio).toFixed(6));
      } else {
        setTokenOneAmount("");
      }
    },
    [prices, setTokenOneAmount, setTokenTwoAmount]
  );

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

  const handleSwitchTokens = useCallback(() => {
    setTokenOneAmount("");
    setTokenTwoAmount("");
    switchTokens();
    // No need to fetch prices - hooks will auto-update when tokens change
  }, [
    switchTokens,
    setTokenOneAmount,
    setTokenTwoAmount,
  ]);

  const handleApprove = useCallback(async () => {
    if (isApproving || isConfirmingApproval) return;

    try {
      await approve();
      showSnackbar(`Approving ${tokenOne.ticker}...`, "info");
    } catch (error: any) {
      console.error("Approval error:", error);
      showSnackbar(
        error?.message || "Approval failed",
        "error"
      );
    }
  }, [approve, isApproving, isConfirmingApproval, tokenOne, showSnackbar]);

  const handleSwap = useCallback(async () => {
    if (isInitiatingSwap || isSending || isConfirming) {
      return;
    }

    if (!tokenOneAmount || !address || !isConnected) {
      showSnackbar("Connect wallet and enter an amount", "warning");
      return;
    }

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
    handleApprove,
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
    approvalState,
    needsApproval,
    isApproving,
    isConfirmingApproval,
    approvalError,
  };
}