import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Token, SnackbarSeverity } from "../types";
import { useSushiClassic } from "./usesushiclassic";
import { useSwapPrices } from "./useswapprices";

interface UseSwapEffectsProps {
  tokenOne: Token;
  tokenTwo: Token;
  tokenOneAmount: string;
  tokenTwoAmount: string;
  isSending: boolean;
  isConfirming: boolean;
  showSnackbar: (message: string, severity: SnackbarSeverity) => void;
  setTokenOneAmount: (amount: string) => void;
  setTokenTwoAmount: (amount: string) => void;
  setIsInitiatingSwap: (value: boolean) => void;
}

export function useSwapEffects({
  tokenOne,
  tokenTwo,
  isSending,
  isConfirming,
  showSnackbar,
  setTokenOneAmount,
  setTokenTwoAmount,
  setIsInitiatingSwap,
  tokenOneAmount,
  tokenTwoAmount
}: UseSwapEffectsProps) {
  const queryClient = useQueryClient(); // NEW
  const { quoteError, isDone, sendError, confirmError, txHash, quote } = useSushiClassic(); 
  const { fetchPrices, binancePriceError } = useSwapPrices(tokenOne, tokenTwo);

  useEffect(() => {
    fetchPrices(tokenOne.address, tokenTwo.address);
  }, [tokenOne.address, tokenTwo.address]);

  useEffect(() => {
    if (quoteError) {
      showSnackbar(`Quote error: ${quoteError}`, "error");
    }
  }, [quoteError, showSnackbar]);

  useEffect(() => {
    if (isSending) {
      setIsInitiatingSwap(false);
      showSnackbar("Sending tx…", "info");
    } else if (isConfirming) {
      showSnackbar("Confirming…", "info");
    }
  }, [isSending, isConfirming, showSnackbar, setIsInitiatingSwap]);

  // UPDATED: Add balance refresh

  useEffect(() => {
    if (binancePriceError) {
      console.warn("Binance price error:", binancePriceError);
    }
  }, [binancePriceError]);
}