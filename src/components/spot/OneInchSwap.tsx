"use client";

import { DownOutlined, SettingOutlined } from "@ant-design/icons";
import SwapVertIcon from "@mui/icons-material/SwapVert";
import { Input, Modal, Popover, Radio } from "antd";
import { Alert, Snackbar } from "@mui/material";
import axios from "axios";
import React, { useEffect, useState, useCallback } from "react";
import { formatUnits, type Address } from "viem";
import {
  useAccount,
  useSendTransaction,
  useWaitForTransactionReceipt,
} from "wagmi";
import { TOKENS } from "@/utils/spot/TokenList";
import MaxButton from "./MaxButton";
import "./index.css";
import { BACKEND_URL } from "@/utils/constants";
import { useSpotStore } from "@/store/spotStore";
import { GradientConnectButton } from "../common/navbar/Navbar";

/* ---------- local helpers ---------- */
interface Token {
  address: Address;
  name: string;
  ticker: string;
  img: string;
  decimals: number;
}

interface PriceData {
  ratio: number;
  tokenOne?: number;
  tokenTwo?: number;
  [k: string]: any;
}

interface TxDetails {
  to: Address | null;
  data: `0x${string}` | null;
  value: bigint | null;
}

interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI: string;
  domainVersion?: string;
  eip2612?: boolean;
  isFoT?: boolean;
  tags?: string[];
}

interface SelectedLiquiditySource {
  name: string;
  part: number;
}

interface TokenHop {
  part: number;
  dst: string;
  fromTokenId: number;
  toTokenId: number;
  protocols: SelectedLiquiditySource[];
}

interface TokenSwaps {
  token: string;
  hops: TokenHop[];
}

interface QuoteResponse {
  toAmount: string;
  estimatedGas?: number;
  gas?: number;
  protocols?: any[];
  // The 1inch quote API returns a simpler response than swap
}

function OneInchSwap() {
  const { address, isConnected } = useAccount();

  /* --------- global token selection from store --------- */
  const tokenOne = useSpotStore((s) => s.tokenOne);
  const tokenTwo = useSpotStore((s) => s.tokenTwo);
  const setTokenOne = useSpotStore((s) => s.setTokenOne);
  const setTokenTwo = useSpotStore((s) => s.setTokenTwo);
  const openModal = useSpotStore((s) => s.openModal);

  /* --------- local component state --------- */
  const [tokenOneAmount, setT1Amount] = useState("");
  const [tokenTwoAmount, setT2Amount] = useState("");
  const [prices, setPrices] = useState<PriceData | null>(null);
  const [slippage, setSlippage] = useState<number>(2.5);
  const [txDetails, setTxDetails] = useState<TxDetails>({
    to: null,
    data: null,
    value: null,
  });
  const [isOpenTwo, setIsOpenTwo] = useState(false);
  const [isInitiatingSwap, setIsInitiatingSwap] = useState(false);
  const [isLoadingPrices, setIsLoadingPrices] = useState(false);

  // Quote state
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);

  // MUI Snackbar states
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    "success" | "error" | "warning" | "info"
  >("info");

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
  const showSnackbar = (
    message: string,
    severity: "success" | "error" | "warning" | "info"
  ) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleSlippageChange = (e: any) => setSlippage(e.target.value);

  /* --------- Quote fetch --------- */
  const API = `${BACKEND_URL}/proxy/1inch`;

  const fetchQuote = useCallback(
    async (amount: string) => {
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
    [tokenOne, tokenTwo, API]
  );

  /* --------- amount change --------- */
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
        fetchQuote(tokenOneAmount);
      }, 500);

      return () => clearTimeout(timeoutId);
    } else {
      setQuote(null);
      if (!tokenOneAmount) {
        setT2Amount("");
      }
    }
  }, [tokenOneAmount, fetchQuote]);

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
    setPrices(null);
    setT1Amount("");
    setT2Amount("");
    setQuote(null);

    // Switch both tokens using global store
    const tempTokenOne = tokenOne;
    const tempTokenTwo = tokenTwo;
    setTokenOne(tempTokenTwo);
    setTokenTwo(tempTokenOne);

    fetchPrices(tempTokenTwo.address, tempTokenOne.address);
  };

  /* --------- price fetch with retry logic --------- */
  const fetchPrices = async (one: Address, two: Address, retryCount = 0) => {
    if (retryCount === 0) setIsLoadingPrices(true);

    try {
      const { data } = await axios.get<PriceData>(
        `${BACKEND_URL}/api/tokenPrice`,
        {
          params: { addressOne: one, addressTwo: two },
          timeout: 10000, // 10 second timeout
        }
      );
      setPrices(data.data);
      setIsLoadingPrices(false);
    } catch (err) {
      console.error("Price fetch error:", err);

      // Retry logic for mobile/network issues
      if (retryCount < 2) {
        console.log(`Retrying price fetch (attempt ${retryCount + 1})`);
        setTimeout(() => {
          fetchPrices(one, two, retryCount + 1);
        }, 1000 * (retryCount + 1)); // Exponential backoff: 1s, 2s
        return;
      }

      // Just stop loading, don't show error
      setIsLoadingPrices(false);
    }
  };

  /* --------- swap flow --------- */
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
          to: approveTx.to as Address,
          data: approveTx.data as `0x${string}`,
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
        to: swap.tx.to as Address,
        data: swap.tx.data as `0x${string}`,
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
      setQuote(null);
    } else if (sendErr || confirmErr) {
      showSnackbar("Transaction failed", "error");
      setTxDetails({ to: null, data: null, value: null });
      setIsInitiatingSwap(false);
    }
  }, [isDone, sendErr, confirmErr]);

  /* --------- initial price load --------- */
  useEffect(() => {
    fetchPrices(tokenOne.address, tokenTwo.address);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenOne.address, tokenTwo.address]);

  /* --------- settings popover --------- */
  const settings = (
    <>
      <div>Slippage Tolerance</div>
      <Radio.Group value={slippage} onChange={handleSlippageChange}>
        <Radio.Button value={0.5}>0.5%</Radio.Button>
        <Radio.Button value={2.5}>2.5%</Radio.Button>
        <Radio.Button value={5}>5.0%</Radio.Button>
      </Radio.Group>
    </>
  );

  const isSwapDisabled =
    !tokenOneAmount ||
    !isConnected ||
    !prices ||
    isLoadingPrices ||
    isSending ||
    isConfirming ||
    isInitiatingSwap;

  /* --------- Quote display component --------- */
  const renderQuoteDisplay = () => {
    if (!tokenOneAmount || isLoadingQuote) {
      return (
        <div className="bg-gray-800/50 rounded-lg p-4 mt-4 mb-4">
          <div className="text-center text-gray-400 text-sm">
            {isLoadingQuote
              ? "Loading quote..."
              : "Enter an amount to see quote details"}
          </div>
        </div>
      );
    }

    if (!quote || !quote.toAmount) {
      return null;
    }

    // Add validation for toAmount
    let expectedOutput = "0";
    try {
      expectedOutput = formatUnits(BigInt(quote.toAmount), tokenTwo.decimals);
    } catch (error) {
      console.error("Error parsing quote amount:", error);
      return (
        <div className="bg-gray-800/50 rounded-lg p-4 mt-4 mb-4">
          <div className="text-center text-gray-400 text-sm">
            Invalid quote data
          </div>
        </div>
      );
    }

    const priceImpact = "< 0.01%"; // You can calculate this based on your price data
    const minimumReceived = (
      parseFloat(expectedOutput) *
      (1 - slippage / 100)
    ).toFixed(6);

    return (
      <div className="bg-gray-800/50 rounded-lg p-4 mt-4 mb-4 space-y-3">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-400">Expected Output</span>
          <span className="text-white font-medium">
            {parseFloat(expectedOutput).toFixed(6)} {tokenTwo.ticker}
          </span>
        </div>

        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-400">Price Impact</span>
          <span className="text-green-400">{priceImpact}</span>
        </div>

        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-400">Minimum Received</span>
          <span className="text-gray-300">
            {minimumReceived} {tokenTwo.ticker}
          </span>
        </div>

        {quote.estimatedGas && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-400">Estimated Gas</span>
            <span className="text-gray-300">
              {quote.estimatedGas.toLocaleString()}
            </span>
          </div>
        )}

        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-400">Route</span>
          <span className="text-gray-300">
            {quote.protocols && quote.protocols.length > 1
              ? "Multi-hop"
              : "Direct"}
          </span>
        </div>
      </div>
    );
  };

  /* ---------- render ---------- */
  return (
    <>
      <div className="tradeBox p-4">
        <div className="flex justify-between items-center mb-8">
          <h4 className="text-xl">Swap</h4>
          <Popover
            content={settings}
            title="Settings"
            trigger="click"
            placement="bottomRight"
          >
            <SettingOutlined className="text-white text-xl hover:rotate-90 transition duration-300 hover:text-[#00F5E0]" />
          </Popover>
        </div>

        {/* amounts */}
        <div className="inputs">
          {/* sell */}
          <div className="input-container">
            <Input
              placeholder="0"
              value={tokenOneAmount}
              onChange={changeSellAmount}
              disabled={!prices || isLoadingPrices}
              type="number"
              style={{ maxWidth: "350px" }}
              className="outline-none focus:outline-none! focus:ring-0! focus:border-transparent focus:shadow-none [&.ant-input:focus]:outline-none [&.ant-input:focus]:shadow-none [&.ant-input:focus]:border-transparent [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-inner-spin-button]:m-0"
            />
            <span className="input-tag">Sell</span>
            {tokenOneAmount && prices && (
              <div className="text-sm text-gray-300 font-medium -mt-5 mb-2 px-3">
                ≈ $
                {(parseFloat(tokenOneAmount) * (prices.tokenOne || 0)).toFixed(
                  2
                )}
              </div>
            )}
          </div>

          {/* switch */}
          <div className="switch-container">
            <div className="line" />
            <div className="switchButton" onClick={switchTokens}>
              <SwapVertIcon sx={{ fontSize: 28 }} />
            </div>
            <div className="line" />
          </div>

          {/* buy */}
          <div className="input-container">
            <Input
              placeholder="0"
              value={isLoadingQuote ? "" : tokenTwoAmount}
              onChange={changeBuyAmount}
              disabled={!prices || isLoadingPrices || isLoadingQuote}
              className="outline-none focus:outline-none! focus:ring-0! focus:border-transparent focus:shadow-none [&.ant-input:focus]:outline-none [&.ant-input:focus]:shadow-none [&.ant-input:focus]:border-transparent [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-inner-spin-button]:m-0"
              type="number"
              style={{ maxWidth: "350px" }}
            />
            <span className="input-tag">Buy</span>

            {/* Loading animation overlay */}
            {/* {isLoadingQuote && tokenOneAmount && (
              <div className="absolute inset-0 flex items-center justify-center bg-transparent pointer-events-none">
                <div className="text-2xl text-gray-400">
                  <div className="animate-pulse">Loading...</div>
                </div>
              </div>
            )} */}

            {/* Price display with loading animation */}
            {tokenTwoAmount && prices && !isLoadingQuote && (
              <div className="text-sm text-gray-300 font-medium -mt-5 mb-2 px-3">
                ≈ $
                {(parseFloat(tokenTwoAmount) * (prices.tokenTwo || 0)).toFixed(
                  2
                )}
              </div>
            )}

            {/* Loading animation for price */}
            {isLoadingQuote && tokenOneAmount && (
              <div className="text-sm text-gray-300 font-medium -mt-5 mb-2 px-3">
                <div className="animate-pulse bg-gray-600 h-4 w-16 rounded"></div>
              </div>
            )}
          </div>

          {/* token selectors */}
          <div className="assetOneContainer">
            <div className="assetOne" onClick={openModal}>
              <img
                src={tokenOne.img}
                alt="assetOneLogo"
                className="assetLogo"
              />
              <p className="text-white">{tokenOne.ticker}</p> <DownOutlined />
            </div>
            <div className="max-btn-container">
              <MaxButton
                token={tokenOne.address}
                setToken={setMaxBal}
                showBtn={true}
              />
            </div>
          </div>

          <div className="assetTowContainer">
            <div className="assetTwo" onClick={() => setIsOpenTwo(true)}>
              <img
                src={tokenTwo.img}
                alt="assetTwoLogo"
                className="assetLogo"
              />
              <p className="text-white">{tokenTwo.ticker}</p> <DownOutlined />
            </div>
            <div className="absolute right-5 bottom-6">
              <MaxButton token={tokenTwo.address} setToken={setMaxBal} />
            </div>
          </div>
        </div>

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
      <Modal
        open={isOpenTwo}
        footer={null}
        onCancel={() => setIsOpenTwo(false)}
        title="Select a token"
      >
        <div className="modalContent">
          {(TOKENS as Token[]).map((token, i) => (
            <div
              key={i}
              className="tokenChoice"
              onClick={() => {
                // If the selected token is the same as tokenOne, switch them
                if (token === tokenOne) {
                  setTokenOne(tokenTwo);
                  setTokenTwo(token);
                } else {
                  // Otherwise, just set tokenTwo normally
                  setTokenTwo(token);
                }
                setIsOpenTwo(false);
                // Fetch new prices after token selection
                fetchPrices(tokenOne.address, token.address);
                setQuote(null);
              }}
            >
              <img src={token.img} alt={token.ticker} className="tokenLogo" />
              <div className="tokenChoiceNames">
                <div className="tokenName">{token.name}</div>
                <div className="tokenTicker">{token.ticker}</div>
              </div>
            </div>
          ))}
        </div>
      </Modal>

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
