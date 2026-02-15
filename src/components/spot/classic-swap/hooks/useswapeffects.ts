import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Token } from "../types";
import { useSushiClassic } from "./usesushiclassic";
import { useSwapPrices } from "./useswapprices";

interface UseSwapEffectsProps {
  tokenOne: Token;
  tokenTwo: Token;
  tokenOneAmount: string;
  tokenTwoAmount: string;
  isSending: boolean;
  isConfirming: boolean;
  setTokenOneAmount: (amount: string) => void;
  setTokenTwoAmount: (amount: string) => void;
  setIsInitiatingSwap: (value: boolean) => void;
  triggerPortfolioRefresh: () => void;
}

export function useSwapEffects({
  tokenOne,
  tokenTwo,
  isSending,
  isConfirming,
  setTokenOneAmount,
  setTokenTwoAmount,
  setIsInitiatingSwap,
  tokenOneAmount,
  tokenTwoAmount,
  triggerPortfolioRefresh,
}: UseSwapEffectsProps) {
  const queryClient = useQueryClient();
  const { isDone, txHash } = useSushiClassic();
  const { fetchPrices, binancePriceError } = useSwapPrices(tokenOne, tokenTwo);

  useEffect(() => {
    fetchPrices(tokenOne.address, tokenTwo.address);
  }, [tokenOne.address, tokenTwo.address]);

  useEffect(() => {
    if (isSending) {
      setIsInitiatingSwap(false);
    }
  }, [isSending, setIsInitiatingSwap]);

  // Add balance refresh when swap completes (notification is handled in useSushiClassic)
  useEffect(() => {
    if (isDone && txHash) {
      console.log("✅ Swap completed successfully, refreshing portfolio...");
      // Invalidate price queries
      queryClient.invalidateQueries({
        queryKey: ["sushiBatchTokenPrices"]
      });
      queryClient.invalidateQueries({
        queryKey: ["sushiTokenPrice"]
      });

      // Trigger portfolio balance refresh
      setTimeout(() => {
        triggerPortfolioRefresh();
      }, 1000); // Small delay to allow chain to update
    }
  }, [isDone, txHash, queryClient, triggerPortfolioRefresh]);

  useEffect(() => {
    if (binancePriceError) {
      console.warn("Binance price error:", binancePriceError);
    }
  }, [binancePriceError]);
}