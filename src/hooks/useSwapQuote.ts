// hooks/useSwapQuote.ts
import { useState, useCallback } from "react";
import axios from "axios";
import type { Token, QuoteResponse } from "@/types/swap.types";
import { BACKEND_URL } from "@/utils/constants";

export const useSwapQuote = () => {
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);

  const API = `${BACKEND_URL}/proxy/1inch`;

  const fetchQuote = useCallback(
    async (amount: string, tokenOne: Token, tokenTwo: Token) => {
      if (!amount || !tokenOne || !tokenTwo || parseFloat(amount) <= 0) {
        setQuote(null);
        return;
      }

      setIsLoadingQuote(true);
      try {
        const amountWei = BigInt(
          (parseFloat(amount) * 10 ** tokenOne.decimals).toFixed(0)
        );

        const { data } = await axios.get(
          `${API}/quote?src=${tokenOne.address}&dst=${tokenTwo.address}&amount=${amountWei}`
        );

        setQuote(data);
      } catch (error: any) {
        console.error("Quote error:", error);
        setQuote(null);
      } finally {
        setIsLoadingQuote(false);
      }
    },
    [API]
  );

  const clearQuote = useCallback(() => {
    setQuote(null);
  }, []);

  return {
    quote,
    isLoadingQuote,
    fetchQuote,
    clearQuote,
  };
};
