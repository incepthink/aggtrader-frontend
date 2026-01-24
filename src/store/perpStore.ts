import { create } from "zustand";

// Order type for extensibility (market orders only initially)
type OrderType = "market" | "limit" | "stopMarket" | "stopLimit";

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
  quantityUnit: "BTC" | "USD"; // Unit for quantity input
  setQuantityUnit: (unit: "BTC" | "USD") => void;
  orderSide: OrderSide;
  setOrderSide: (side: OrderSide) => void;

  // ========== Advanced Options ==========
  reduceOnly: boolean;
  setReduceOnly: (reduceOnly: boolean) => void;
  postOnly: boolean;
  setPostOnly: (postOnly: boolean) => void;
  tpSlEnabled: boolean;
  setTpSlEnabled: (enabled: boolean) => void;

  // ========== TP/SL Modal & Configuration ==========
  tpSlModalOpen: boolean;
  openTpSlModal: () => void;
  closeTpSlModal: () => void;

  // Take Profit settings
  takeProfitEnabled: boolean;
  setTakeProfitEnabled: (enabled: boolean) => void;
  takeProfitTriggerType: 'index' | 'last'; // Price type for trigger (Index or Last)
  setTakeProfitTriggerType: (type: 'index' | 'last') => void;
  takeProfitPrice: string; // Trigger price value
  setTakeProfitPrice: (value: string) => void;
  takeProfitPercentage: string; // Percentage change
  setTakeProfitPercentage: (value: string) => void;
  // Legacy fields (keeping for compatibility)
  takeProfitValue: string; // Percentage or absolute price
  setTakeProfitValue: (value: string) => void;
  takeProfitMode: 'percentage' | 'price'; // Change % or absolute price
  setTakeProfitMode: (mode: 'percentage' | 'price') => void;

  // Stop Loss settings
  stopLossEnabled: boolean;
  setStopLossEnabled: (enabled: boolean) => void;
  stopLossTriggerType: 'index' | 'last'; // Price type for trigger (Index or Last)
  setStopLossTriggerType: (type: 'index' | 'last') => void;
  stopLossPrice: string; // Trigger price value
  setStopLossPrice: (value: string) => void;
  stopLossPercentage: string; // Percentage change
  setStopLossPercentage: (value: string) => void;
  // Legacy fields (keeping for compatibility)
  stopLossValue: string;
  setStopLossValue: (value: string) => void;
  stopLossMode: 'percentage' | 'price';
  setStopLossMode: (mode: 'percentage' | 'price') => void;

  // ========== Future Expansion Fields (Initially Unused) ==========
  limitPrice?: string; // For limit orders
  setLimitPrice: (price: string) => void;
  triggerPrice?: string; // For stop orders
  setTriggerPrice: (price: string) => void;
  timeInForce?: string; // For limit orders
  setTimeInForce: (tif: string) => void;

  // ========== Stop Market Order Fields ==========
  stopPrice: string; // Stop trigger price
  setStopPrice: (price: string) => void;
  stopPriceTriggerType: 'index' | 'last'; // Index or Last price trigger
  setStopPriceTriggerType: (type: 'index' | 'last') => void;

  // ========== Stop Limit Order Fields ==========
  orderPrice: string; // Limit price for stop limit orders
  setOrderPrice: (price: string) => void;

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
  quantityUnit: "BTC" as const,
  orderSide: DEFAULT_ORDER_SIDE,
  reduceOnly: false,
  postOnly: false,
  tpSlEnabled: false,
  limitPrice: undefined,
  triggerPrice: undefined,
  timeInForce: undefined,
  stopPrice: "",
  stopPriceTriggerType: "index" as const,
  orderPrice: "",
  freeCollateral: 0,
  // TP/SL Modal & Settings
  tpSlModalOpen: false,
  takeProfitEnabled: false,
  takeProfitTriggerType: "index" as const,
  takeProfitPrice: "",
  takeProfitPercentage: "",
  takeProfitValue: "",
  takeProfitMode: "percentage" as const,
  stopLossEnabled: false,
  stopLossTriggerType: "index" as const,
  stopLossPrice: "",
  stopLossPercentage: "",
  stopLossValue: "",
  stopLossMode: "percentage" as const,
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
  setQuantityUnit: (unit: "BTC" | "USD") => set({ quantityUnit: unit }),
  setOrderSide: (side: OrderSide) => set({ orderSide: side }),

  // ========== Advanced Options Actions ==========
  setReduceOnly: (reduceOnly: boolean) => set({ reduceOnly }),
  setPostOnly: (postOnly: boolean) => set({ postOnly }),
  setTpSlEnabled: (enabled: boolean) => set({ tpSlEnabled: enabled }),

  // ========== TP/SL Modal Actions ==========
  openTpSlModal: () => set({ tpSlModalOpen: true }),
  closeTpSlModal: () => set({ tpSlModalOpen: false }),

  // Take Profit Actions
  setTakeProfitEnabled: (enabled: boolean) => set({ takeProfitEnabled: enabled }),
  setTakeProfitTriggerType: (type: 'index' | 'last') => set({ takeProfitTriggerType: type }),
  setTakeProfitPrice: (value: string) => set({ takeProfitPrice: value }),
  setTakeProfitPercentage: (value: string) => set({ takeProfitPercentage: value }),
  setTakeProfitValue: (value: string) => set({ takeProfitValue: value }),
  setTakeProfitMode: (mode: 'percentage' | 'price') => set({ takeProfitMode: mode }),

  // Stop Loss Actions
  setStopLossEnabled: (enabled: boolean) => set({ stopLossEnabled: enabled }),
  setStopLossTriggerType: (type: 'index' | 'last') => set({ stopLossTriggerType: type }),
  setStopLossPrice: (value: string) => set({ stopLossPrice: value }),
  setStopLossPercentage: (value: string) => set({ stopLossPercentage: value }),
  setStopLossValue: (value: string) => set({ stopLossValue: value }),
  setStopLossMode: (mode: 'percentage' | 'price') => set({ stopLossMode: mode }),

  // ========== Future Expansion Actions ==========
  setLimitPrice: (price: string) => set({ limitPrice: price }),
  setTriggerPrice: (price: string) => set({ triggerPrice: price }),
  setTimeInForce: (tif: string) => set({ timeInForce: tif }),

  // ========== Stop Market Order Actions ==========
  setStopPrice: (price: string) => set({ stopPrice: price }),
  setStopPriceTriggerType: (type: 'index' | 'last') => set({ stopPriceTriggerType: type }),

  // ========== Stop Limit Order Actions ==========
  setOrderPrice: (price: string) => set({ orderPrice: price }),

  // ========== Balance/Account Actions ==========
  setFreeCollateral: (amount: number) => set({ freeCollateral: amount }),

  // ========== Reset Function ==========
  resetOrderForm: () => set(initialState),
}));
