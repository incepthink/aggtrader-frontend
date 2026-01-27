"use client";

import { useEffect } from "react";
import { PositionSide, TriggerType } from "../types";

interface UseTpSlCalculationsParams {
  takeProfitPercentage: string;
  takeProfitTriggerType: TriggerType;
  stopLossPercentage: string;
  stopLossTriggerType: TriggerType;
  indexPrice: number;
  lastPrice: number;
  positionSide: PositionSide;
  setTakeProfitPrice: (price: string) => void;
  setStopLossPrice: (price: string) => void;
}

export const useTpSlCalculations = ({
  takeProfitPercentage,
  takeProfitTriggerType,
  stopLossPercentage,
  stopLossTriggerType,
  indexPrice,
  lastPrice,
  positionSide,
  setTakeProfitPrice,
  setStopLossPrice,
}: UseTpSlCalculationsParams) => {
  // Calculate price based on percentage for Take Profit
  useEffect(() => {
    if (!takeProfitPercentage || takeProfitPercentage === "") {
      return;
    }

    const basePrice = takeProfitTriggerType === "index" ? indexPrice : lastPrice;
    const percentage = parseFloat(takeProfitPercentage);

    if (!isNaN(percentage) && basePrice > 0) {
      // Long: TP above current price (price increase = profit)
      // Short: TP below current price (price decrease = profit)
      const multiplier = positionSide === 0 ? (1 + percentage / 100) : (1 - percentage / 100);
      const calculatedPrice = basePrice * multiplier;
      setTakeProfitPrice(calculatedPrice.toFixed(2));
    }
  }, [takeProfitPercentage, takeProfitTriggerType, indexPrice, lastPrice, positionSide, setTakeProfitPrice]);

  // Calculate price based on percentage for Stop Loss
  useEffect(() => {
    if (!stopLossPercentage || stopLossPercentage === "") {
      return;
    }

    const basePrice = stopLossTriggerType === "index" ? indexPrice : lastPrice;
    const percentage = parseFloat(stopLossPercentage);

    if (!isNaN(percentage) && basePrice > 0) {
      // Long: SL below current price (price decrease = loss)
      // Short: SL above current price (price increase = loss)
      const multiplier = positionSide === 0 ? (1 - percentage / 100) : (1 + percentage / 100);
      const calculatedPrice = basePrice * multiplier;
      setStopLossPrice(calculatedPrice.toFixed(2));
    }
  }, [stopLossPercentage, stopLossTriggerType, indexPrice, lastPrice, positionSide, setStopLossPrice]);
};
