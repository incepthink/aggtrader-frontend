import React, { memo } from "react";
import SwapVertIcon from "@mui/icons-material/SwapVert";
import { SwapInput, type InputMode } from "./SwapInput";
import { TokenSelector } from "./TokenSelector";
import type { Token } from "../types";

interface SwapInputSectionProps {
  tokenOne: Token;
  tokenTwo: Token;
  tokenOneAmount: string;
  tokenTwoAmount: string;
  tokenOnePrice: number | null | undefined;
  tokenTwoPrice: number | null | undefined;
  isLoadingPrices: boolean;
  isLoadingQuote: boolean;
  onSellAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBuyAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onMaxBalance: (balance: string) => void;
  onSwitchTokens: () => void;
  onOpenTokenOneModal: () => void;
  onOpenTokenTwoModal: () => void;
  sellInputMode?: InputMode;
  buyInputMode?: InputMode;
  onToggleSellMode?: () => void;
  onToggleBuyMode?: () => void;
  hasInsufficientBalance: boolean;
}

export const SwapInputSection = memo(
  ({
    tokenOne,
    tokenTwo,
    tokenOneAmount,
    tokenTwoAmount,
    tokenOnePrice,
    tokenTwoPrice,
    isLoadingPrices,
    isLoadingQuote,
    onSellAmountChange,
    onBuyAmountChange,
    onMaxBalance,
    onSwitchTokens,
    onOpenTokenOneModal,
    onOpenTokenTwoModal,
    sellInputMode = "token",
    buyInputMode = "token",
    onToggleSellMode,
    onToggleBuyMode,
    hasInsufficientBalance,
  }: SwapInputSectionProps) => {
    return (
      <div className="inputs">
        {/* Sell Input */}
        <SwapInput
          value={tokenOneAmount}
          onChange={onSellAmountChange}
          disabled={false}
          label="Sell"
          token={tokenOne}
          showPrice={true}
          price={tokenOnePrice}
          isLoadingPrice={isLoadingPrices}
          inputMode={sellInputMode}
          onToggleMode={onToggleSellMode}
          hasInsufficientBalance={hasInsufficientBalance}
        />

        {/* Switch Button */}
        <div className="switch-container py-0 lg:py-2">
          <div className="line" />
          <div className="switchButton" onClick={onSwitchTokens}>
            <SwapVertIcon sx={{ fontSize: 20 }} />
          </div>
          <div className="line" />
        </div>

        {/* Buy Input */}
        <SwapInput
          value={isLoadingQuote ? "" : tokenTwoAmount}
          onChange={onBuyAmountChange}
          token={tokenTwo}
          disabled={isLoadingQuote}
          label="Buy"
          showPrice={true}
          price={tokenTwoPrice}
          isLoadingPrice={isLoadingPrices || isLoadingQuote}
          inputMode={buyInputMode}
          onToggleMode={onToggleBuyMode}
        />

        {/* Token Selectors */}
        <TokenSelector
          token={tokenOne}
          onClick={onOpenTokenOneModal}
          showMaxButton={true}
          onMaxClick={onMaxBalance}
          position="top"
        />

        <TokenSelector
          token={tokenTwo}
          onClick={onOpenTokenTwoModal}
          showMaxButton={false}
          onMaxClick={onMaxBalance}
          position="bottom"
        />
      </div>
    );
  }
);

SwapInputSection.displayName = "SwapInputSection";
