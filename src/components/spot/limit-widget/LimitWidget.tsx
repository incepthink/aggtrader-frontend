"use client";

import React from "react";
import { SwapModeButtons } from "./SwapModeButtons";
import { LimitPriceInput } from "./LimitPriceInput";
import { LimitExpiryInput } from "./LimitExpiryInput";
import { LimitToken0Input } from "./LimitToken0Input";
import { LimitToken1Input } from "./LimitToken1Input";
import { LimitSwitchTokensButton } from "./LimitSwitchTokensButton";
import { LimitTradeButton } from "./LimitTradeButton";
import { LimitTradeReviewDialog } from "./LimitTradeReviewDialog";
import { TwapOrdersButton } from "./orders/TwapOrdersButton";

export const LimitWidget = () => {
  return (
    <div className="flex flex-col gap-4 p-2">
      {/* Limit price input */}
      <LimitPriceInput />

      {/* Token inputs with switch button */}
      <div className="flex flex-col gap-8">
        <LimitToken0Input />
        <LimitSwitchTokensButton />
        <LimitToken1Input />
      </div>

      {/* Expiry selector */}
      <LimitExpiryInput />

      {/* Trade button */}
      <LimitTradeButton />

      {/* Orders management button */}
      <TwapOrdersButton />
    </div>
  );
};
