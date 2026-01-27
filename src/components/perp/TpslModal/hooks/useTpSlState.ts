"use client";

import { usePerpStore } from "@/store/perpStore";

export const useTpSlState = () => {
  // Modal state
  const tpSlModalOpen = usePerpStore((s) => s.tpSlModalOpen);
  const closeTpSlModal = usePerpStore((s) => s.closeTpSlModal);

  // Take Profit state
  const takeProfitPrice = usePerpStore((s) => s.takeProfitPrice);
  const setTakeProfitPrice = usePerpStore((s) => s.setTakeProfitPrice);
  const takeProfitPercentage = usePerpStore((s) => s.takeProfitPercentage);
  const setTakeProfitPercentage = usePerpStore((s) => s.setTakeProfitPercentage);
  const takeProfitTriggerType = usePerpStore((s) => s.takeProfitTriggerType);
  const setTakeProfitTriggerType = usePerpStore((s) => s.setTakeProfitTriggerType);

  // Stop Loss state
  const stopLossPrice = usePerpStore((s) => s.stopLossPrice);
  const setStopLossPrice = usePerpStore((s) => s.setStopLossPrice);
  const stopLossPercentage = usePerpStore((s) => s.stopLossPercentage);
  const setStopLossPercentage = usePerpStore((s) => s.setStopLossPercentage);
  const stopLossTriggerType = usePerpStore((s) => s.stopLossTriggerType);
  const setStopLossTriggerType = usePerpStore((s) => s.setStopLossTriggerType);

  // Configured TP/SL for order submission
  const setLongTakeProfitPrice = usePerpStore((s) => s.setLongTakeProfitPrice);
  const setLongTakeProfitTriggerType = usePerpStore((s) => s.setLongTakeProfitTriggerType);
  const setLongStopLossPrice = usePerpStore((s) => s.setLongStopLossPrice);
  const setLongStopLossTriggerType = usePerpStore((s) => s.setLongStopLossTriggerType);
  const setShortTakeProfitPrice = usePerpStore((s) => s.setShortTakeProfitPrice);
  const setShortTakeProfitTriggerType = usePerpStore((s) => s.setShortTakeProfitTriggerType);
  const setShortStopLossPrice = usePerpStore((s) => s.setShortStopLossPrice);
  const setShortStopLossTriggerType = usePerpStore((s) => s.setShortStopLossTriggerType);

  const handleClearTakeProfit = () => {
    setTakeProfitPrice("");
    setTakeProfitPercentage("");
  };

  const handleClearStopLoss = () => {
    setStopLossPrice("");
    setStopLossPercentage("");
  };

  return {
    // Modal
    tpSlModalOpen,
    closeTpSlModal,

    // Take Profit
    takeProfitPrice,
    setTakeProfitPrice,
    takeProfitPercentage,
    setTakeProfitPercentage,
    takeProfitTriggerType,
    setTakeProfitTriggerType,
    handleClearTakeProfit,

    // Stop Loss
    stopLossPrice,
    setStopLossPrice,
    stopLossPercentage,
    setStopLossPercentage,
    stopLossTriggerType,
    setStopLossTriggerType,
    handleClearStopLoss,

    // Long position setters
    setLongTakeProfitPrice,
    setLongTakeProfitTriggerType,
    setLongStopLossPrice,
    setLongStopLossTriggerType,

    // Short position setters
    setShortTakeProfitPrice,
    setShortTakeProfitTriggerType,
    setShortStopLossPrice,
    setShortStopLossTriggerType,
  };
};
