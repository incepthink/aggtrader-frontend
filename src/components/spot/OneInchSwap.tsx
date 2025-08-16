"use client";

import SwapVertIcon from "@mui/icons-material/SwapVert";
import { Alert, Snackbar } from "@mui/material";
import axios from "axios";
import React, { useEffect, useState, useCallback } from "react";
import { formatUnits } from "viem";
import {
  useAccount,
  useSendTransaction,
  useWaitForTransactionReceipt,
} from "wagmi";
import "./index.css";
import { BACKEND_URL } from "@/utils/constants";
import { useSpotStore } from "@/store/spotStore";
import { GradientConnectButton } from "../common/navbar/Navbar";

// Import refactored components
import { SwapSettings } from "./SwapSettings";
import { SwapInput } from "./SwapInput";
import { TokenSelector } from "./TokenSelector";
import { QuoteDisplay } from "./QuoteDisplay";
import { TokenSelectionModal } from "./TokenSelectionModal";

// Import hooks
import { useSwapQuote } from "@/hooks/useSwapQuote";
import { useSwapPrices } from "@/hooks/useSwapPrices";

// Import types
import type { TxDetails, SnackbarSeverity } from "@/types/swap.types";

function OneInchSwap() {
  const { address, isConnected } = useAccount();

  /* --------- global token selection from store --------- */
  const tokenOne = useSpotStore((s) => s.tokenOne);
  const tokenTwo = useSpotStore((s) => s.tokenTwo);
  const setTokenOne = useSpotStore((s) => s.setTokenOne);
  const setTokenTwo = useSpotStore((s) => s.setTokenTwo);
  const openModalOne = useSpotStore((s) => s.openModalOne);
  const openModalTwo = useSpotStore((s) => s.openModalTwo);

  /* --------- local component state --------- */
  const [tokenOneAmount, setT1Amount] = useState("");
  const [tokenTwoAmount, setT2Amount] = useState("");
  const [slippage, setSlippage] = useState<number>(2.5);
  const [txDetails, setTxDetails] = useState<TxDetails>({
    to: null,
    data: null,
    value: null,
  });
  const [isOpenTwo, setIsOpenTwo] = useState(false);
  const [isInitiatingSwap, setIsInitiatingSwap] = useState(false);

  // MUI Snackbar states
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] =
    useState<SnackbarSeverity>("info");

  /* --------- Custom hooks --------- */
  const { quote, isLoadingQuote, fetchQuote, clearQuote } = useSwapQuote();
  const {
    prices,
    isLoadingPrices,
    tokenOnePrice,
    tokenTwoPrice,
    binancePriceError,
    fetchPrices,
  } = useSwapPrices(tokenOne, tokenTwo);

  /* --------- wagmi tx hooks --------- */
  const {
    data: txHash,
    sendTransaction,
    isPending: isSending,
    error: sendErr,
  } = useSendTransaction();
  const {
    isLoading: isConfirming,
    isSuccess: isDone,
    error: confirmErr,
  } = useWaitForTransactionReceipt({ hash: txHash });

  // Helper function to show snackbar
  const showSnackbar = (message: string, severity: SnackbarSeverity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleSlippageChange = (e: any) => setSlippage(e.target.value);

  /* --------- amount change handlers --------- */
  const changeBuyAmount = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setT2Amount(v);

    // Use price ratio for reverse calculation since quote is one-directional
    if (v && prices) {
      setT1Amount((parseFloat(v) / prices.ratio).toFixed(6));
    } else {
      setT1Amount("");
    }
  };

  const changeSellAmount = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setT1Amount(v);

    // Don't update tokenTwoAmount here - let the quote fetch handle it
    if (!v) {
      setT2Amount("");
    }
  };

  // Fetch quote when amount changes with debounce
  useEffect(() => {
    if (tokenOneAmount && parseFloat(tokenOneAmount) > 0) {
      const timeoutId = setTimeout(() => {
        fetchQuote(tokenOneAmount, tokenOne, tokenTwo);
      }, 500);

      return () => clearTimeout(timeoutId);
    } else {
      clearQuote();
      if (!tokenOneAmount) {
        setT2Amount("");
      }
    }
  }, [tokenOneAmount, fetchQuote, clearQuote, tokenOne, tokenTwo]);

  // Update tokenTwoAmount when quote is received
  useEffect(() => {
    if (quote && quote.toAmount && tokenOneAmount) {
      try {
        const expectedOutput = formatUnits(
          BigInt(quote.toAmount),
          tokenTwo.decimals
        );
        setT2Amount(parseFloat(expectedOutput).toFixed(6));
      } catch (error) {
        console.error("Error parsing quote toAmount:", error);
      }
    }
  }, [quote, tokenTwo.decimals, tokenOneAmount]);

  const setMaxBal = (bal: string) => {
    setT1Amount(bal);
    // Don't set T2Amount here - let the quote fetch handle it
    // The quote will be fetched automatically via the useEffect
  };

  /* --------- switch tokens --------- */
  const switchTokens = () => {
    setT1Amount("");
    setT2Amount("");
    clearQuote();

    // Switch both tokens using global store
    const tempTokenOne = tokenOne;
    const tempTokenTwo = tokenTwo;
    setTokenOne(tempTokenTwo);
    setTokenTwo(tempTokenOne);

    fetchPrices(tempTokenTwo.address, tempTokenOne.address);
  };

  /* --------- token selection handlers --------- */
  const handleTokenTwoSelect = (token: typeof tokenTwo) => {
    // If the selected token is the same as tokenOne, switch them
    if (token === tokenOne) {
      setTokenOne(tokenTwo);
      setTokenTwo(token);
    } else {
      // Otherwise, just set tokenTwo normally
      setTokenTwo(token);
    }
    // Fetch new prices after token selection
    fetchPrices(tokenOne.address, token.address);
    clearQuote();
  };

  /* --------- swap flow --------- */
  const API = `${BACKEND_URL}/proxy/1inch`;

  const fetchDexSwap = async () => {
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
      /* 1 — allowance */
      const {
        data: { allowance },
      } = await axios.get(
        `${API}/approve/allowance?tokenAddress=${tokenOne.address}&walletAddress=${address}`
      );

      const amountWei = BigInt(
        (parseFloat(tokenOneAmount) * 10 ** tokenOne.decimals).toFixed(0)
      );

      console.log("ALLOWANCE", BigInt(allowance), amountWei);

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

      // Update the buy amount with actual swap data
      setT2Amount(formatUnits(BigInt(swap.toAmount), tokenTwo.decimals));

      setTxDetails({
        to: swap.tx.to,
        data: swap.tx.data,
        value: BigInt(swap.tx.value ?? "0"),
      });
    } catch (error: any) {
      console.error("Swap error:", error);

      // Handle structured error responses from backend
      if (error.response?.data) {
        const errorData = error.response.data;

        // Show user-friendly error message
        showSnackbar(errorData.error || "Failed to fetch swap data", "error");

        // Log additional details for debugging
        if (errorData.details) {
          console.error("Error details:", errorData.details);
        }
      } else {
        showSnackbar("Failed to fetch swap data", "error");
      }

      // Reset loading state on error
      setIsInitiatingSwap(false);
    }
  };

  /* --------- auto-send when txDetails populated --------- */
  useEffect(() => {
    if (txDetails.to && txDetails.data && isConnected) {
      // Reset isInitiatingSwap since we're now sending the transaction
      setIsInitiatingSwap(false);
      sendTransaction({
        to: txDetails.to,
        data: txDetails.data,
        value: txDetails.value || BigInt(0),
      });
    }
  }, [txDetails, isConnected, sendTransaction]);

  /* --------- toast messages --------- */
  useEffect(() => {
    if (isSending) {
      showSnackbar("Sending tx…", "info");
    } else if (isConfirming) {
      showSnackbar("Confirming…", "info");
    }
  }, [isSending, isConfirming]);

  useEffect(() => {
    if (isDone) {
      showSnackbar("Transaction successful!", "success");
      setT1Amount("");
      setT2Amount("");
      setTxDetails({ to: null, data: null, value: null });
      setIsInitiatingSwap(false);
      clearQuote();
    } else if (sendErr || confirmErr) {
      showSnackbar("Transaction failed", "error");
      setTxDetails({ to: null, data: null, value: null });
      setIsInitiatingSwap(false);
    }
  }, [isDone, sendErr, confirmErr, clearQuote]);

  /* --------- initial price load --------- */
  useEffect(() => {
    fetchPrices(tokenOne.address, tokenTwo.address);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenOne.address, tokenTwo.address]);

  // Show Binance price error if needed
  useEffect(() => {
    if (binancePriceError) {
      console.warn("Binance price error:", binancePriceError);
      // Don't show error to user, just use fallback prices
    }
  }, [binancePriceError]);

  const isSwapDisabled =
    !tokenOneAmount ||
    !isConnected ||
    !prices ||
    isLoadingPrices ||
    isSending ||
    isConfirming ||
    isInitiatingSwap;

  /* ---------- render ---------- */
  return (
    <>
      <div className="tradeBox p-4">
        <div className="flex justify-between items-center mb-8">
          <h4 className="text-xl">Swap</h4>
          <SwapSettings
            slippage={slippage}
            onSlippageChange={handleSlippageChange}
          />
        </div>

        {/* amounts */}
        <div className="inputs">
          {/* sell */}
          <SwapInput
            value={tokenOneAmount}
            onChange={changeSellAmount}
            disabled={!prices || isLoadingPrices}
            label="Sell"
            showPrice={true}
            price={tokenOnePrice}
            isLoadingPrice={isLoadingPrices}
          />

          {/* switch */}
          <div className="switch-container">
            <div className="line" />
            <div className="switchButton" onClick={switchTokens}>
              <SwapVertIcon sx={{ fontSize: 28 }} />
            </div>
            <div className="line" />
          </div>

          {/* buy */}
          <SwapInput
            value={isLoadingQuote ? "" : tokenTwoAmount}
            onChange={changeBuyAmount}
            disabled={!prices || isLoadingPrices || isLoadingQuote}
            label="Buy"
            showPrice={true}
            price={tokenTwoPrice}
            isLoadingPrice={isLoadingPrices || isLoadingQuote}
          />

          {/* token selectors */}
          <TokenSelector
            token={tokenOne}
            onClick={openModalOne}
            showMaxButton={true}
            onMaxClick={setMaxBal}
            position="top"
          />

          <TokenSelector
            token={tokenTwo}
            onClick={openModalTwo}
            showMaxButton={true}
            onMaxClick={setMaxBal}
            position="bottom"
          />
        </div>

        {/* Quote Display */}
        <QuoteDisplay
          quote={quote}
          isLoadingQuote={isLoadingQuote}
          tokenOneAmount={tokenOneAmount}
          tokenTwo={tokenTwo}
          slippage={slippage}
        />

        {/* swap button */}
        {isConnected ? (
          <div
            className={`swapButton ${isSwapDisabled ? "disabled" : ""}`}
            onClick={isSwapDisabled ? undefined : fetchDexSwap}
            style={{
              opacity: isSwapDisabled ? 0.6 : 1,
              cursor: isSwapDisabled ? "not-allowed" : "pointer",
            }}
          >
            {isConnected
              ? isLoadingPrices
                ? "Loading prices…"
                : isSending
                ? "Sending…"
                : isConfirming
                ? "Confirming…"
                : isInitiatingSwap
                ? "Preparing…"
                : "Swap"
              : "Connect Wallet"}
          </div>
        ) : (
          <GradientConnectButton />
        )}
      </div>

      {/* Token Two Selection Modal */}
      <TokenSelectionModal />

      {/* MUI Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        sx={{ mt: 8 }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
}

export default OneInchSwap;
