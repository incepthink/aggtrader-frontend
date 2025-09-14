"use client";

import SwapVertIcon from "@mui/icons-material/SwapVert";
import { Alert, Snackbar } from "@mui/material";
import React, { useEffect, useState, useCallback } from "react";
import { formatUnits } from "viem";
import {
  useAccount,
  useSendTransaction,
  useWaitForTransactionReceipt,
} from "wagmi";
import "./index.css";
import { useSpotStore } from "@/store/spotStore";
import { GradientConnectButton } from "../common/navbar/Navbar";

// Import refactored components
import { SwapSettings } from "./SwapSettings";
import { SwapInput } from "./SwapInput";
import { TokenSelector } from "./TokenSelector";
import { SwapDetails } from "./SwapDetails";
import { TokenSelectionModal } from "./TokenSelectionModal";

// Import hooks
import { useSushiClassic } from "../../hooks/sushiswap/useSushiClassic";
import { useSwapPrices } from "../../hooks/sushiswap/useSwapPrices";

export type SnackbarSeverity = "success" | "error" | "warning" | "info";

function SushiClassicSwap() {
  const { address, isConnected } = useAccount();

  /* --------- global token selection from store --------- */
  const tokenOne = useSpotStore((s) => s.tokenOne);
  const tokenTwo = useSpotStore((s) => s.tokenTwo);
  const setTokenOne = useSpotStore((s) => s.setTokenOne);
  const setTokenTwo = useSpotStore((s) => s.setTokenTwo);
  const openModal = useSpotStore((s) => s.openModal);
  const chainId = useSpotStore((s) => s.chainId);

  /* --------- local component state --------- */
  const [tokenOneAmount, setT1Amount] = useState("");
  const [tokenTwoAmount, setT2Amount] = useState("");
  const [slippage, setSlippage] = useState<number>(2.5);
  const [isInitiatingSwap, setIsInitiatingSwap] = useState(false);

  // MUI Snackbar states
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] =
    useState<SnackbarSeverity>("info");

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

  const {
    prices,
    isLoadingPrices,
    tokenOnePrice,
    tokenTwoPrice,
    binancePriceError,
    fetchPrices,
  } = useSwapPrices(tokenOne, tokenTwo);

  console.log("PRICES", tokenOnePrice, tokenTwoPrice);

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

  const changeSellAmount = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setT1Amount(v);

    if (!v) {
      setT2Amount("");
    }
  };

  // Fetch quote when amount changes with debounce
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
          setT2Amount(parseFloat(amountOut).toFixed(6));
        }
      }, 500);

      return () => clearTimeout(timeoutId);
    } else {
      if (!tokenOneAmount) {
        setT2Amount("");
      }
    }
  }, [tokenOneAmount, tokenOne, tokenTwo, slippage, fetchQuote]);

  const setMaxBal = async (bal: string) => {
    setT1Amount(bal);

    if (bal && parseFloat(bal) > 0) {
      const quoteResult = await fetchQuote({
        tokenIn: tokenOne,
        tokenOut: tokenTwo,
        amount: bal,
        slippage,
      });

      if (quoteResult) {
        const amountOut = formatUnits(
          BigInt(quoteResult.amountOut),
          tokenTwo.decimals
        );
        setT2Amount(parseFloat(amountOut).toFixed(6));
      }
    } else {
      setT2Amount("");
    }
  };

  /* --------- switch tokens --------- */
  const switchTokens = () => {
    setT1Amount("");
    setT2Amount("");

    // Switch both tokens using global store
    const tempTokenOne = tokenOne;
    const tempTokenTwo = tokenTwo;
    setTokenOne(tempTokenTwo);
    setTokenTwo(tempTokenOne);

    fetchPrices(tempTokenTwo.address, tempTokenOne.address);
  };

  /* --------- swap execution --------- */
  const handleSwap = async () => {
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
  };

  /* --------- toast messages --------- */
  useEffect(() => {
    if (quoteError) {
      showSnackbar(`Quote error: ${quoteError}`, "error");
    }
  }, [quoteError]);

  useEffect(() => {
    if (isSending) {
      setIsInitiatingSwap(false); // Reset since transaction is now being sent
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
      setIsInitiatingSwap(false);
    } else if (sendError || confirmError) {
      showSnackbar("Transaction failed", "error");
      setIsInitiatingSwap(false);
    }
  }, [isDone, sendError, confirmError]);

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
    isLoadingPrices ||
    isSending ||
    isConfirming ||
    isInitiatingSwap ||
    isLoadingQuote ||
    !quote;

  /* ---------- render ---------- */
  return (
    <>
      <div className="tradeBox p-2">
        <div className="flex justify-between items-center mb-6 lg:mb-8">
          <h4 className="text-xl">Classic Swap</h4>
          <SwapSettings
            slippage={slippage}
            onSlippageChange={handleSlippageChange}
          />
        </div>

        {/* Chain ID indicator */}
        {/* <div className="mb-4 text-sm text-gray-400">
          Chain: {chainId === 1 ? "Ethereum" : `Chain ${chainId}`}
        </div> */}

        {/* amounts */}
        <div className="inputs">
          {/* sell */}
          <SwapInput
            value={tokenOneAmount}
            onChange={changeSellAmount}
            disabled={isLoadingPrices}
            label="Sell"
            showPrice={true}
            price={tokenOnePrice}
            isLoadingPrice={isLoadingPrices}
          />

          {/* switch */}
          <div className="switch-container py-0 lg:py-2">
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
            disabled={isLoadingPrices || isLoadingQuote}
            label="Buy"
            showPrice={true}
            price={tokenTwoPrice}
            isLoadingPrice={isLoadingPrices || isLoadingQuote}
            // isLoadingValue={true}
          />

          {/* token selectors */}
          <TokenSelector
            token={tokenOne}
            onClick={() => openModal("tokenOne")}
            showMaxButton={true}
            onMaxClick={setMaxBal}
            position="top"
          />

          <TokenSelector
            token={tokenTwo}
            onClick={() => openModal("tokenTwo")}
            showMaxButton={false}
            onMaxClick={setMaxBal}
            position="bottom"
          />
        </div>

        {/* Swap Details */}
        {quote && tokenOneAmount && (
          <SwapDetails
            quote={quote}
            slippage={slippage}
            tokenInAmount={tokenOneAmount}
            isLoadingQuote={isLoadingQuote}
          />
        )}

        {/* swap button */}
        {isConnected ? (
          <div
            className={`swapButton ${isSwapDisabled ? "disabled" : ""}`}
            onClick={isSwapDisabled ? undefined : handleSwap}
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
                : isLoadingQuote
                ? "Getting Quote..."
                : "Swap"
              : "Connect Wallet"}
          </div>
        ) : (
          <GradientConnectButton />
        )}
      </div>

      {/* Unified Token Selection Modal */}
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

export default SushiClassicSwap;
