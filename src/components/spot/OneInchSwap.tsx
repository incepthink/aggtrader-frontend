"use client";

import { DownOutlined, SettingOutlined } from "@ant-design/icons";
import SwapVertIcon from "@mui/icons-material/SwapVert";
import { Input, Modal, Popover, Radio } from "antd";
import { Alert, Snackbar } from "@mui/material";
import axios from "axios";
import React, { useEffect, useState } from "react";
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
  [k: string]: any;
}
interface TxDetails {
  to: Address | null;
  data: `0x${string}` | null;
  value: bigint | null;
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
  // const [msgApi, contextHolder] = message.useMessage();
  const [isOpenTwo, setIsOpenTwo] = useState(false);
  const [isInitiatingSwap, setIsInitiatingSwap] = useState(false);

  // MUI Snackbar states
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    "success" | "error" | "warning" | "info"
  >("info"); // Add this state

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

  /* --------- amount change --------- */
  const changeBuyAmount = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setT2Amount(v);
    setT1Amount(v && prices ? (parseFloat(v) / prices.ratio).toFixed(6) : "");
  };

  const changeSellAmount = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setT1Amount(v);
    setT2Amount(v && prices ? (parseFloat(v) * prices.ratio).toFixed(6) : "");
  };

  const setMaxBal = (bal: string) => {
    setT1Amount(bal);
    setT2Amount(
      bal && prices ? (parseFloat(bal) * prices.ratio).toFixed(6) : ""
    );
  };

  /* --------- switch tokens --------- */
  const switchTokens = () => {
    setPrices(null);
    setT1Amount("");
    setT2Amount("");

    // Switch both tokens using global store
    const tempTokenOne = tokenOne;
    const tempTokenTwo = tokenTwo;
    setTokenOne(tempTokenTwo);
    setTokenTwo(tempTokenOne);

    fetchPrices(tempTokenTwo.address, tempTokenOne.address);
  };

  /* --------- price fetch --------- */
  const fetchPrices = async (one: Address, two: Address) => {
    try {
      const { data } = await axios.get<PriceData>(
        `${BACKEND_URL}/api/tokenPrice`,
        {
          params: { addressOne: one, addressTwo: two },
        }
      );
      setPrices(data.data);
    } catch (err) {
      console.error(err);
      showSnackbar("Failed to fetch token prices", "error");
    }
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
      setT2Amount(formatUnits(BigInt(swap.toAmount), tokenTwo.decimals));

      setTxDetails({
        to: swap.tx.to,
        data: swap.tx.data,
        value: BigInt(swap.tx.value ?? "0"),
      });
    } catch (error) {
      console.error("Swap error:", error);
      showSnackbar("Failed to fetch swap data", "error");
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
    isSending ||
    isConfirming ||
    isInitiatingSwap; // Add this condition

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
              disabled={!prices}
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
              value={tokenTwoAmount}
              onChange={changeBuyAmount}
              disabled={!prices}
            />
            <span className="input-tag">Buy</span>
            {tokenTwoAmount && prices && (
              <div className="text-sm text-gray-300 font-medium -mt-5 mb-2 px-3">
                ≈ $
                {(parseFloat(tokenTwoAmount) * (prices.tokenTwo || 0)).toFixed(
                  2
                )}
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
              ? isSending
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
