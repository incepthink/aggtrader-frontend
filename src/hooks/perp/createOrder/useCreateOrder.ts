import { useState } from 'react';
import { useMarketOrder } from './useMarketOrder';
import { useLimitOrder } from './useLimitOrder';
import { useStopMarketOrder } from './useStopMarketOrder';
import { useStopLimitOrder } from './useStopLimitOrder';
import { useTakeProfitOrder } from './useTakeProfitOrder';
import { useStopLossOrder } from './useStopLossOrder';

/**
 * Combined hook for all order types
 * Provides a unified interface for creating different types of orders
 */
export const useCreateOrder = () => {
  const { createMarketOrder, ...marketOrderState } = useMarketOrder();
  const { createLimitOrder, ...limitOrderState } = useLimitOrder();
  const { createStopMarketOrder, ...stopMarketOrderState } = useStopMarketOrder();
  const { createStopLimitOrder, ...stopLimitOrderState } = useStopLimitOrder();
  const { createTakeProfitOrder, ...takeProfitOrderState } = useTakeProfitOrder();
  const { createStopLossOrder, ...stopLossOrderState } = useStopLossOrder();

  // Combine all states - any hook submitting means we're submitting
  const isSubmitting =
    marketOrderState.isSubmitting ||
    limitOrderState.isSubmitting ||
    stopMarketOrderState.isSubmitting ||
    stopLimitOrderState.isSubmitting ||
    takeProfitOrderState.isSubmitting ||
    stopLossOrderState.isSubmitting;

  // Get the most recent error
  const error =
    marketOrderState.error ||
    limitOrderState.error ||
    stopMarketOrderState.error ||
    stopLimitOrderState.error ||
    takeProfitOrderState.error ||
    stopLossOrderState.error;

  // Get the most recent result
  const orderResult =
    marketOrderState.orderResult ||
    limitOrderState.orderResult ||
    stopMarketOrderState.orderResult ||
    stopLimitOrderState.orderResult ||
    takeProfitOrderState.orderResult ||
    stopLossOrderState.orderResult;

  return {
    createMarketOrder,
    createLimitOrder,
    createStopMarketOrder,
    createStopLimitOrder,
    createTakeProfitOrder,
    createStopLossOrder,
    isSubmitting,
    error,
    orderResult,
  };
};
