import { create } from "zustand";

// Order type for extensibility (market orders only initially)
type OrderType = "market" | "limit" | "stopMarket";

// Order side matching Kuma SDK
type OrderSide = "buy" | "sell";

interface PerpStore {
  // ========== Market Selection ==========
  selectedMarket: string;
  setSelectedMarket: (market: string) => void;

  // ========== Order Type Selection ==========
  activeOrderType: OrderType;
  setActiveOrderType: (type: OrderType) => void;

  // ========== Leverage Configuration ==========
  leverage: number; // 1-50
  setLeverage: (leverage: number) => void;
  leverageModalOpen: boolean;
  openLeverageModal: () => void;
  closeLeverageModal: () => void;

  // ========== Order Parameters (Market Orders) ==========
  quantity: string; // User input as string for precision
  setQuantity: (quantity: string) => void;
  quantityPercentage: number; // 0-100 for slider
  setQuantityPercentage: (percentage: number) => void;
  orderSide: OrderSide;
  setOrderSide: (side: OrderSide) => void;

  // ========== Advanced Options ==========
  reduceOnly: boolean;
  setReduceOnly: (reduceOnly: boolean) => void;
  tpSlEnabled: boolean; // For future TP/SL implementation
  setTpSlEnabled: (enabled: boolean) => void;

  // ========== Future Expansion Fields (Initially Unused) ==========
  limitPrice?: string; // For limit orders
  setLimitPrice: (price: string) => void;
  triggerPrice?: string; // For stop orders
  setTriggerPrice: (price: string) => void;
  timeInForce?: string; // For limit orders
  setTimeInForce: (tif: string) => void;

  // ========== Balance/Account Data ==========
  freeCollateral: number;
  setFreeCollateral: (amount: number) => void;

  // ========== Reset Function ==========
  resetOrderForm: () => void;
}

// Default values
const DEFAULT_MARKET = "BTC-USD";
const DEFAULT_LEVERAGE = 1;
const DEFAULT_ORDER_TYPE: OrderType = "market";
const DEFAULT_ORDER_SIDE: OrderSide = "buy";

const initialState = {
  selectedMarket: DEFAULT_MARKET,
  activeOrderType: DEFAULT_ORDER_TYPE,
  leverage: DEFAULT_LEVERAGE,
  leverageModalOpen: false,
  quantity: "",
  quantityPercentage: 0,
  orderSide: DEFAULT_ORDER_SIDE,
  reduceOnly: false,
  tpSlEnabled: false,
  limitPrice: undefined,
  triggerPrice: undefined,
  timeInForce: undefined,
  freeCollateral: 0,
};

export const usePerpStore = create<PerpStore>((set) => ({
  ...initialState,

  // ========== Market Selection Actions ==========
  setSelectedMarket: (market: string) => set({ selectedMarket: market }),

  // ========== Order Type Actions ==========
  setActiveOrderType: (type: OrderType) => set({ activeOrderType: type }),

  // ========== Leverage Actions ==========
  setLeverage: (leverage: number) =>
    set({ leverage: Math.max(1, Math.min(50, leverage)) }), // Clamp 1-50
  openLeverageModal: () => set({ leverageModalOpen: true }),
  closeLeverageModal: () => set({ leverageModalOpen: false }),

  // ========== Order Parameter Actions ==========
  setQuantity: (quantity: string) => set({ quantity }),
  setQuantityPercentage: (percentage: number) =>
    set({ quantityPercentage: Math.max(0, Math.min(100, percentage)) }), // Clamp 0-100
  setOrderSide: (side: OrderSide) => set({ orderSide: side }),

  // ========== Advanced Options Actions ==========
  setReduceOnly: (reduceOnly: boolean) => set({ reduceOnly }),
  setTpSlEnabled: (enabled: boolean) => set({ tpSlEnabled: enabled }),

  // ========== Future Expansion Actions ==========
  setLimitPrice: (price: string) => set({ limitPrice: price }),
  setTriggerPrice: (price: string) => set({ triggerPrice: price }),
  setTimeInForce: (tif: string) => set({ timeInForce: tif }),

  // ========== Balance/Account Actions ==========
  setFreeCollateral: (amount: number) => set({ freeCollateral: amount }),

  // ========== Reset Function ==========
  resetOrderForm: () => set(initialState),
}));
