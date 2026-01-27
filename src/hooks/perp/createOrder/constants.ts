import { OrderType, OrderSide, TriggerType } from '@katanaperps/katana-perps-sdk';

// Map SDK string enums to API numeric values
export const OrderTypeToNumber: Record<string, number> = {
  [OrderType.market]: 0,
  [OrderType.limit]: 1,
  [OrderType.stopLossMarket]: 2,
  [OrderType.stopLossLimit]: 3,
  [OrderType.takeProfitMarket]: 4,
  [OrderType.takeProfitLimit]: 5,
  [OrderType.trailingStopMarket]: 6,
};

export const OrderSideToNumber: Record<string, number> = {
  [OrderSide.buy]: 0,
  [OrderSide.sell]: 1,
};

// Map trigger type string to numeric values for EIP-712 signature
export const TriggerTypeToNumber: Record<string, number> = {
  'none': 0,
  [TriggerType.last]: 1,
  [TriggerType.index]: 2,
};
