"use client";

import {
  ArrowDownOutlined,
  DownOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { Input, Modal, Popover, Radio, message } from "antd";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { formatUnits, type Address } from "viem";
import {
  useAccount,
  useSendTransaction,
  useWaitForTransactionReceipt,
} from "wagmi";
import tokenList from "@/utils/spot/tokenList.json";
import MaxButton from "./MaxButton";
import "./index.css";
import { BACKEND_URL } from "@/utils/constants";

// Type definitions
interface Token {
  address: Address;
  name: string;
  ticker: string;
  img: string;
  decimals: number;
}

interface PriceData {
  ratio: number;
  [key: string]: any;
}

interface TxDetails {
  to: Address | null;
  data: `0x${string}` | null;
  value: bigint | null;
}

interface SwapProps {
  address: Address;
  isConnected: boolean;
}

// interface DexSwapResponse {
//   tx: {
//     to: Address;
//     data: `0x${string}`;
//     value: string;
//   };
//   toTokenAmount: string;
// }

// interface ApprovalResponse {
//   data: {
//     to: Address;
//     data: `0x${string}`;
//     value: string;
//   };
// }

// interface AllowanceResponse {
//   data: {
//     allowance: string;
//   };
// }

function OneInchSwap() {
  const { address, isConnected } = useAccount();

  const [messageApi, contextHolder] = message.useMessage();
  const [slippage, setSlippage] = useState<number>(2.5);
  const [tokenOneAmount, setTokenOneAmount] = useState<string>("");
  const [tokenTwoAmount, setTokenTwoAmount] = useState<string>("");
  const [tokenOne, setTokenOne] = useState<Token>(tokenList[0] as Token);
  const [tokenTwo, setTokenTwo] = useState<Token>(tokenList[1] as Token);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [changeToken, setChangeToken] = useState<1 | 2>(1);
  const [prices, setPrices] = useState<PriceData | null>(null);
  const [txDetails, setTxDetails] = useState<TxDetails>({
    to: null,
    data: null,
    value: null,
  });

  const {
    data: txHash,
    sendTransaction,
    isPending: isSending,
    error: sendError,
  } = useSendTransaction();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: confirmError,
  } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  function handleSlippageChange(e: any) {
    setSlippage(e.target.value);
  }

  function changeAmount(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setTokenOneAmount(value);
    if (value && prices) {
      setTokenTwoAmount((parseFloat(value) * prices.ratio).toFixed(6));
    } else {
      setTokenTwoAmount("");
    }
  }

  function setMaxBal(bal: string) {
    setTokenOneAmount(bal);
    if (bal && prices) {
      setTokenTwoAmount((parseFloat(bal) * prices.ratio).toFixed(6));
    } else {
      setTokenTwoAmount("");
    }
  }

  function switchTokens() {
    setPrices(null);
    setTokenOneAmount("");
    setTokenTwoAmount("");
    const one = tokenOne;
    const two = tokenTwo;
    setTokenOne(two);
    setTokenTwo(one);
    fetchPrices(two.address, one.address);
  }

  function openModal(asset: 1 | 2) {
    setChangeToken(asset);
    setIsOpen(true);
  }

  function modifyToken(i: number) {
    setPrices(null);
    setTokenOneAmount("");
    setTokenTwoAmount("");
    const selectedToken = tokenList[i] as Token;

    if (changeToken === 1) {
      setTokenOne(selectedToken);
      fetchPrices(selectedToken.address, tokenTwo.address);
    } else {
      setTokenTwo(selectedToken);
      fetchPrices(tokenOne.address, selectedToken.address);
    }
    setIsOpen(false);
  }

  async function fetchPrices(one: Address, two: Address) {
    try {
      const res = await axios.get<PriceData>(`${BACKEND_URL}/api/tokenPrice`, {
        params: { addressOne: one, addressTwo: two },
      });
      setPrices(res.data.data);
    } catch (error) {
      console.error("Error fetching prices:", error);
      messageApi.error("Failed to fetch token prices");
    }
  }

  const API = `${BACKEND_URL}/proxy/1inch`;

  async function fetchDexSwap() {
    if (!tokenOneAmount || !address || !isConnected) {
      messageApi.warning("Connect wallet and enter an amount");
      return;
    }

    /* 1 ─ allowance */
    const {
      data: { allowance },
    } = await axios.get(
      `${API}/approve/allowance?tokenAddress=${tokenOne.address}&walletAddress=${address}`
    );
    console.log("ALLOWANCE::", allowance);

    const amountWei = BigInt(
      (parseFloat(tokenOneAmount) * 10 ** tokenOne.decimals).toFixed(0)
    );
    console.log("AMOUNT::", amountWei);

    if (BigInt(allowance) < amountWei) {
      /* 2 ─ approval tx */
      const { data: approveTx } = await axios.get(
        `${API}/approve/transaction?tokenAddress=${tokenOne.address}`
      );

      setTxDetails({
        to: approveTx.to,
        data: approveTx.data,
        value: BigInt(approveTx.value ?? "0"),
      });
      console.log("Token approval required");
      return;
    }

    /* 3 ─ swap tx */
    const swapUrl =
      `${API}/swap?src=${tokenOne.address}` +
      `&dst=${tokenTwo.address}` +
      `&amount=${amountWei}` +
      `&from=${address}` +
      `&slippage=${slippage}`;

    const { data: swap } = await axios.get(swapUrl);
    console.log("SWAP::", swap);

    const outHuman = formatUnits(BigInt(swap.toAmount), tokenTwo.decimals);
    setTokenTwoAmount(parseFloat(outHuman).toFixed(6));

    setTxDetails({
      to: swap.tx.to,
      data: swap.tx.data,
      value: BigInt(swap.tx.value ?? "0"),
    });
  }

  // Execute transaction when txDetails are set
  useEffect(() => {
    if (txDetails.to && txDetails.data && isConnected && sendTransaction) {
      sendTransaction({
        to: txDetails.to,
        data: txDetails.data,
        value: txDetails.value || BigInt(0),
      });
    }
  }, [txDetails, isConnected, sendTransaction]);

  // Handle transaction states
  useEffect(() => {
    messageApi.destroy();

    if (isSending || isConfirming) {
      messageApi.open({
        type: "loading",
        content: isSending
          ? "Sending transaction..."
          : "Confirming transaction...",
        duration: 0,
      });
    }
  }, [isSending, isConfirming, messageApi]);

  useEffect(() => {
    messageApi.destroy();

    if (isConfirmed) {
      messageApi.open({
        type: "success",
        content: "Transaction successful!",
        duration: 3,
      });
      // Reset form
      setTokenOneAmount("");
      setTokenTwoAmount("");
      setTxDetails({ to: null, data: null, value: null });
    } else if (sendError || confirmError) {
      messageApi.open({
        type: "error",
        content: `Transaction failed: ${
          sendError?.message || confirmError?.message
        }`,
        duration: 5,
      });
      setTxDetails({ to: null, data: null, value: null });
    }
  }, [isConfirmed, sendError, confirmError, messageApi]);

  // Fetch initial prices
  useEffect(() => {
    if (tokenList.length >= 2) {
      fetchPrices(
        (tokenList[0] as Token).address,
        (tokenList[1] as Token).address
      );
    }
  }, []);

  const settings = (
    <>
      <div>Slippage Tolerance</div>
      <div>
        <Radio.Group value={slippage} onChange={handleSlippageChange}>
          <Radio.Button value={0.5}>0.5%</Radio.Button>
          <Radio.Button value={2.5}>2.5%</Radio.Button>
          <Radio.Button value={5}>5.0%</Radio.Button>
        </Radio.Group>
      </div>
    </>
  );

  const isSwapDisabled =
    !tokenOneAmount || !isConnected || !prices || isSending || isConfirming;

  return (
    <>
      {contextHolder}
      <Modal
        open={isOpen}
        footer={null}
        onCancel={() => setIsOpen(false)}
        title="Select a token"
      >
        <div className="modalContent">
          {(tokenList as Token[])?.map((token, i) => {
            return (
              <div
                className="tokenChoice"
                key={i}
                onClick={() => modifyToken(i)}
              >
                <img src={token.img} alt={token.ticker} className="tokenLogo" />
                <div className="tokenChoiceNames">
                  <div className="tokenName">{token.name}</div>
                  <div className="tokenTicker">{token.ticker}</div>
                </div>
              </div>
            );
          })}
        </div>
      </Modal>
      <div className="tradeBox p-4">
        <div className="flex justify-between items-center mb-8 ">
          <h4 className="text-xl">Swap</h4>
          <Popover
            content={settings}
            title="Settings"
            trigger="click"
            placement="bottomRight"
          >
            <SettingOutlined className="text-white text-xl" />
          </Popover>
        </div>
        <div className="inputs">
          <div className="input-container">
            <Input
              placeholder="0"
              value={tokenOneAmount}
              onChange={changeAmount}
              disabled={!prices}
            />
            <span className="input-tag">Sell</span>
          </div>

          <div className="switch-container">
            <div className="line"></div>
            <div className="switchButton" onClick={switchTokens}>
              <ArrowDownOutlined className="switchArrow" />
            </div>
            <div className="line"></div>
          </div>

          <div className="input-container">
            <Input placeholder="0" value={tokenTwoAmount} disabled={true} />
            <span className="input-tag">Buy</span>
          </div>

          <div className="assetOneContainer">
            <div className="assetOne" onClick={() => openModal(1)}>
              <img
                src={tokenOne.img}
                alt="assetOneLogo"
                className="assetLogo"
              />
              {tokenOne.ticker}
              <DownOutlined />
            </div>
            <div className="max-btn-container">
              <MaxButton token={tokenOne.address} setToken={setMaxBal} />
            </div>
          </div>

          <div className="assetTowContainer">
            <div className="assetTwo" onClick={() => openModal(2)}>
              <img
                src={tokenTwo.img}
                alt="assetOneLogo"
                className="assetLogo"
              />
              {tokenTwo.ticker}
              <DownOutlined />
            </div>
            {/* <div className="max-btn-container">
              <MaxButton token={tokenTwo.address} setToken={setMaxBal} />
            </div> */}
          </div>
        </div>
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
              ? "Sending..."
              : isConfirming
              ? "Confirming..."
              : "Swap"
            : "Connect Wallet"}
        </div>
      </div>
    </>
  );
}

export default OneInchSwap;
