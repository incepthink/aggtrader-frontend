import { useEffect } from "react";
import { formatUnits } from "viem";
import type { Token } from "../types";

interface UseQuoteDebounceProps {
  tokenOneAmount: string;
  tokenOne: Token;
  tokenTwo: Token;
  slippage: number;
  fetchQuote: (params: {
    tokenIn: Token;
    tokenOut: Token;
    amount: string;
    slippage: number;
  }) => Promise<any>;
  setTokenTwoAmount: (amount: string) => void;
}

export function useQuoteDebounce({
  tokenOneAmount,
  tokenOne,
  tokenTwo,
  slippage,
  fetchQuote,
  setTokenTwoAmount,
}: UseQuoteDebounceProps) {
  useEffect(() => {
    if (tokenOneAmount && parseFloat(tokenOneAmount) > 0) {
      const timeoutId = setTimeout(async () => {
        const quoteResult = await fetchQuote({
          tokenIn: tokenOne,
          tokenOut: tokenTwo,
          amount: tokenOneAmount,
          slippage,
        });

        if (quoteResult) {
          const amountOut = formatUnits(
            BigInt(quoteResult.amountOut),
            tokenTwo.decimals
          );
          setTokenTwoAmount(parseFloat(amountOut).toFixed(6));
        }
      }, 500);

      return () => clearTimeout(timeoutId);
    } else {
      if (!tokenOneAmount) {
        setTokenTwoAmount("");
      }
    }
  }, [tokenOneAmount, tokenOne, tokenTwo, slippage, fetchQuote, setTokenTwoAmount]);
}