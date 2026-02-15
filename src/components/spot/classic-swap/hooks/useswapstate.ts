import { useState } from "react";

export function useSwapState() {
  const [tokenOneAmount, setTokenOneAmount] = useState("");
  const [tokenTwoAmount, setTokenTwoAmount] = useState("");
  const [slippage, setSlippage] = useState<number>(2.5);
  const [isInitiatingSwap, setIsInitiatingSwap] = useState(false);

  return {
    tokenOneAmount,
    tokenTwoAmount,
    slippage,
    isInitiatingSwap,
    setTokenOneAmount,
    setTokenTwoAmount,
    setSlippage,
    setIsInitiatingSwap,
  };
}