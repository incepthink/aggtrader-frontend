import { useEffect } from "react";
import type { Token, SnackbarSeverity } from "../types";
import { useSushiClassic } from "./usesushiclassic";
import { useSwapPrices } from "./useswapprices";

interface UseSwapEffectsProps {
  tokenOne: Token;
  tokenTwo: Token;
  tokenOneAmount: string; // ADD THIS
  tokenTwoAmount: string; // ADD THIS
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
  const { quoteError, isDone, sendError, confirmError, txHash, quote } = useSushiClassic(); 
  const { fetchPrices, binancePriceError } = useSwapPrices(tokenOne, tokenTwo);

  /* --------- Initial price load --------- */
  useEffect(() => {
    fetchPrices(tokenOne.address, tokenTwo.address);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenOne.address, tokenTwo.address]);

  /* --------- Quote error notifications --------- */
  useEffect(() => {
    if (quoteError) {
      showSnackbar(`Quote error: ${quoteError}`, "error");
    }
  }, [quoteError, showSnackbar]);

  /* --------- Transaction status notifications --------- */
  useEffect(() => {
    if (isSending) {
      setIsInitiatingSwap(false); // Reset since transaction is now being sent
      showSnackbar("Sending tx…", "info");
    } else if (isConfirming) {
      showSnackbar("Confirming…", "info");
    }
  }, [isSending, isConfirming, showSnackbar, setIsInitiatingSwap]);

  /* --------- Transaction completion --------- */
  useEffect(() => {
    if (isDone) {
      console.log("TRADE COMPLETED DATA:", {
      txHash,
      quote,
      tokenOne,
      tokenTwo,
      tokenOneAmount,
      tokenTwoAmount,
      timestamp: Date.now(),
    });

      showSnackbar("Transaction successful!", "success");
      setTokenOneAmount("");
      setTokenTwoAmount("");
      setIsInitiatingSwap(false);
    } else if (sendError || confirmError) {
      showSnackbar("Transaction failed", "error");
      setIsInitiatingSwap(false);
    }
  }, [
    isDone,
  sendError,
  confirmError,
  txHash,
  quote,
  tokenOne,
  tokenTwo,
  tokenOneAmount,
  tokenTwoAmount,
  showSnackbar,
  setTokenOneAmount,
  setTokenTwoAmount,
  setIsInitiatingSwap,
  ]);

  /* --------- Binance price error (silent) --------- */
  useEffect(() => {
    if (binancePriceError) {
      console.warn("Binance price error:", binancePriceError);
      // Don't show error to user, just use fallback prices
    }
  }, [binancePriceError]);

  
}