"use client";

import { useState, useCallback } from "react";
import axios from "axios";
import { formatUnits } from "viem";
import type { QuoteResponse, TxDetails, Token } from "../types/swap.types";
import { BACKEND_URL } from "@/utils/constants";

export const useSwapLogic = (
  tokenOne: Token,
  tokenTwo: Token,
  address: string | undefined,
  isConnected: boolean,
  slippage: number,
  showSnackbar: (
    message: string,
    severity: "success" | "error" | "warning" | "info"
  ) => void
) => {
  const [isInitiatingSwap, setIsInitiatingSwap] = useState(false);
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [txDetails, setTxDetails] = useState<TxDetails>({
    to: null,
    data: null,
    value: null,
  });

  const API = `${BACKEND_URL}/proxy/1inch`;

  const fetchQuote = useCallback(
    async (amount: string) => {
      if (!amount || !tokenOne || !tokenTwo) return;

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
    [tokenOne, tokenTwo, API]
  );

  const fetchDexSwap = async (tokenOneAmount: string) => {
    if (isInitiatingSwap) return;

    if (!tokenOneAmount || !address || !isConnected) {
      showSnackbar("Connect wallet and enter an amount", "warning");
      return;
    }

    setIsInitiatingSwap(true);

    try {
      /* 1 — allowance */
      const {
        data: { allowance },
      } = await axios.get(
        `${API}/approve/allowance?tokenAddress=${tokenOne.address}&walletAddress=${address}`
      );

      const amountWei = BigInt(
        (parseFloat(tokenOneAmount) * 10 ** tokenOne.decimals).toFixed(0)
      );

      if (BigInt(allowance) < amountWei) {
        /* 2 — approval tx */
        const { data: approveTx } = await axios.get(
          `${API}/approve/transaction?tokenAddress=${tokenOne.address}`
        );
        setTxDetails({
          to: approveTx.to,
          data: approveTx.data,
          value: BigInt(approveTx.value ?? "0"),
        });
        return;
      }

      /* 3 — swap tx */
      const swapUrl =
        `${API}/swap?src=${tokenOne.address}&dst=${tokenTwo.address}` +
        `&amount=${amountWei}&from=${address}&slippage=${slippage}`;

      const { data: swap } = await axios.get(swapUrl);

      setTxDetails({
        to: swap.tx.to,
        data: swap.tx.data,
        value: BigInt(swap.tx.value ?? "0"),
      });
    } catch (error: any) {
      console.error("Swap error:", error);

      if (error.response?.data) {
        const errorData = error.response.data;
        showSnackbar(errorData.error || "Failed to fetch swap data", "error");
        if (errorData.details) {
          console.error("Error details:", errorData.details);
        }
      } else {
        showSnackbar("Failed to fetch swap data", "error");
      }

      setIsInitiatingSwap(false);
    }
  };

  return {
    isInitiatingSwap,
    setIsInitiatingSwap,
    quote,
    setQuote,
    isLoadingQuote,
    txDetails,
    setTxDetails,
    fetchQuote,
    fetchDexSwap,
  };
};
