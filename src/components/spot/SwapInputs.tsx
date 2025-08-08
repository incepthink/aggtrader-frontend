"use client";

import React, { useEffect } from "react";
import { Input } from "antd";
import SwapVertIcon from "@mui/icons-material/SwapVert";
import type { Token, PriceData } from "../../types/swap.types";

interface SwapInputsProps {
  tokenOneAmount: string;
  tokenTwoAmount: string;
  setTokenOneAmount: (amount: string) => void;
  setTokenTwoAmount: (amount: string) => void;
  prices: PriceData | null;
  isLoadingPrices: boolean;
  onSwitchTokens: () => void;
  onFetchQuote: (amount: string) => void;
  quote: any;
}

const SwapInputs: React.FC<SwapInputsProps> = ({
  tokenOneAmount,
  tokenTwoAmount,
  setTokenOneAmount,
  setTokenTwoAmount,
  prices,
  isLoadingPrices,
  onSwitchTokens,
  onFetchQuote,
  quote,
}) => {
  const changeSellAmount = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setTokenOneAmount(v);

    if (v && quote) {
      // Use quote data instead of price ratio
      const expectedOutput =
        parseFloat(quote.dstAmount) / 10 ** quote.dstToken.decimals;
      setTokenTwoAmount(expectedOutput.toFixed(6));
    } else if (v && prices) {
      setTokenTwoAmount((parseFloat(v) * prices.ratio).toFixed(6));
    } else {
      setTokenTwoAmount("");
    }
  };

  const changeBuyAmount = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setTokenTwoAmount(v);

    if (v && quote) {
      // Calculate reverse from quote
      const expectedInput =
        (parseFloat(v) * 10 ** quote.dstToken.decimals) /
        parseFloat(quote.dstAmount);
      setTokenOneAmount(
        (expectedInput * 10 ** quote.srcToken.decimals).toFixed(6)
      );
    } else if (v && prices) {
      setTokenOneAmount((parseFloat(v) / prices.ratio).toFixed(6));
    } else {
      setTokenOneAmount("");
    }
  };

  // Fetch quote when amount changes
  useEffect(() => {
    if (tokenOneAmount && parseFloat(tokenOneAmount) > 0) {
      const timeoutId = setTimeout(() => {
        onFetchQuote(tokenOneAmount);
      }, 500); // Debounce for 500ms

      return () => clearTimeout(timeoutId);
    }
  }, [tokenOneAmount, onFetchQuote]);

  return (
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
            {(parseFloat(tokenOneAmount) * (prices.tokenOne || 0)).toFixed(2)}
          </div>
        )}
      </div>

      {/* switch */}
      <div className="switch-container">
        <div className="line" />
        <div className="switchButton" onClick={onSwitchTokens}>
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
          disabled={!prices || isLoadingPrices}
          className="outline-none focus:outline-none! focus:ring-0! focus:border-transparent focus:shadow-none [&.ant-input:focus]:outline-none [&.ant-input:focus]:shadow-none [&.ant-input:focus]:border-transparent [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-inner-spin-button]:m-0"
          type="number"
          style={{ maxWidth: "350px" }}
        />
        <span className="input-tag">Buy</span>
        {tokenTwoAmount && prices && (
          <div className="text-sm text-gray-300 font-medium -mt-5 mb-2 px-3">
            ≈ $
            {(parseFloat(tokenTwoAmount) * (prices.tokenTwo || 0)).toFixed(2)}
          </div>
        )}
      </div>
    </div>
  );
};

export default SwapInputs;
