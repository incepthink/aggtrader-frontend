"use client";

import { PositionSide, TriggerType } from "../types";

interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

interface UseTpSlValidationParams {
  takeProfitPrice: string;
  takeProfitTriggerType: TriggerType;
  stopLossPrice: string;
  stopLossTriggerType: TriggerType;
  indexPrice: number;
  lastPrice: number;
  positionSide: PositionSide;
}

export const useTpSlValidation = ({
  takeProfitPrice,
  takeProfitTriggerType,
  stopLossPrice,
  stopLossTriggerType,
  indexPrice,
  lastPrice,
  positionSide,
}: UseTpSlValidationParams) => {
  const validateTpSl = (): ValidationResult => {
    const tpBasePrice = takeProfitTriggerType === "index" ? indexPrice : lastPrice;
    const slBasePrice = stopLossTriggerType === "index" ? indexPrice : lastPrice;
    const tpPrice = parseFloat(takeProfitPrice);
    const slPrice = parseFloat(stopLossPrice);

    if (positionSide === 0) {
      // Long position: TP above current price, SL below
      if (takeProfitPrice && tpPrice <= tpBasePrice) {
        return {
          isValid: false,
          errorMessage: `Take Profit price must be higher than current ${takeProfitTriggerType} price (${tpBasePrice.toFixed(2)})`,
        };
      }
      if (stopLossPrice && slPrice >= slBasePrice) {
        return {
          isValid: false,
          errorMessage: `Stop Loss price must be lower than current ${stopLossTriggerType} price (${slBasePrice.toFixed(2)})`,
        };
      }
    } else {
      // Short position: TP below current price, SL above
      if (takeProfitPrice && tpPrice >= tpBasePrice) {
        return {
          isValid: false,
          errorMessage: `Take Profit price must be lower than current ${takeProfitTriggerType} price (${tpBasePrice.toFixed(2)}) for short positions`,
        };
      }
      if (stopLossPrice && slPrice <= slBasePrice) {
        return {
          isValid: false,
          errorMessage: `Stop Loss price must be higher than current ${stopLossTriggerType} price (${slBasePrice.toFixed(2)}) for short positions`,
        };
      }
    }

    return { isValid: true };
  };

  return { validateTpSl };
};
