"use client";

import {
  Box,
  FormControlLabel,
  Checkbox,
  Divider,
  Alert,
  Typography,
} from "@mui/material";
import { useAccount } from "wagmi";
import { useMemo } from "react";
import { usePerpStore } from "@/store/perpStore";
import { useKumaAuth } from "@/hooks/perp/useKumaAuth";
import { useKumaBalance } from "@/hooks/perp/useKumaBalance";
import { useCreateOrder } from "@/hooks/perp/useCreateOrder";
import { useOrderbookTrades } from "@/hooks/perp/useOrderbookTrades";
import { KatanaPerpsTicker } from "@katanaperps/katana-perps-sdk";
import { calculateMarketMetrics, formatDualDisplay, formatBtcQuantity } from "@/utils/perp/marketCalc";
import OrderTypeTabs from "./OrderTypeTabs";
import LeverageSelector from "./LeverageSelector";
import LeverageModal from "./LeverageModal";
import QuantityInput from "./QuantityInput";
import OrderSideButtons from "./OrderSideButtons";
import OrderSummary from "./OrderSummary";
import TpSlModal from "./TpSlModal";

interface OrderFormProps {
  market: string;
  currentPrice?: number;
  tickerData: KatanaPerpsTicker | null;
}

const OrderForm = ({ market, currentPrice, tickerData }: OrderFormProps) => {
  const { isConnected } = useAccount();
  const { isAssociated } = useKumaAuth();
  const { balance: accountBalance } = useKumaBalance();
  const {
    createMarketOrder,
    createLimitOrder,
    createStopMarketOrder,
    createStopLimitOrder,
    isSubmitting,
    error: orderError,
  } = useCreateOrder();

  const quantity = usePerpStore((s) => s.quantity);
  const quantityUnit = usePerpStore((s) => s.quantityUnit);
  const leverage = usePerpStore((s) => s.leverage);
  const reduceOnly = usePerpStore((s) => s.reduceOnly);
  const postOnly = usePerpStore((s) => s.postOnly);
  const tpSlEnabled = usePerpStore((s) => s.tpSlEnabled);
  const freeCollateral = usePerpStore((s) => s.freeCollateral);
  const activeOrderType = usePerpStore((s) => s.activeOrderType);
  const limitPrice = usePerpStore((s) => s.limitPrice);
  const setLimitPrice = usePerpStore((s) => s.setLimitPrice);
  const stopPrice = usePerpStore((s) => s.stopPrice);
  const setStopPrice = usePerpStore((s) => s.setStopPrice);
  const stopPriceTriggerType = usePerpStore((s) => s.stopPriceTriggerType);
  const setStopPriceTriggerType = usePerpStore((s) => s.setStopPriceTriggerType);
  const orderPrice = usePerpStore((s) => s.orderPrice);
  const setOrderPrice = usePerpStore((s) => s.setOrderPrice);
  const setReduceOnly = usePerpStore((s) => s.setReduceOnly);
  const setPostOnly = usePerpStore((s) => s.setPostOnly);
  const setTpSlEnabled = usePerpStore((s) => s.setTpSlEnabled);
  const openTpSlModal = usePerpStore((s) => s.openTpSlModal);

  // Get orderbook data for market calculations
  const { orderbookData } = useOrderbookTrades(market);

  // Check if wallet is unlocked (connected and associated)
  const isWalletUnlocked = isConnected && isAssociated;

  // Buy order handler
  const handleBuy = async () => {
    if (!isWalletUnlocked) {
      // Wallet not unlocked - KumaAuthWrapper handles the unlock flow
      console.warn("Wallet not unlocked for trading");
      return;
    }

    try {
      // Always use marketMetrics because it handles conversion from USD to BTC
      // marketMetrics.buyQtyBtc is always in base terms (BTC) regardless of quantityUnit
      const submitQuantity = marketMetrics.buyQtyBtc.toFixed(8);

      if (activeOrderType === "limit") {
        // Limit order
        const result = await createLimitOrder({
          market,
          side: "buy",
          quantity: submitQuantity,
          leverage,
          reduceOnly,
          price: limitPrice || "0",
          postOnly,
        });
        console.log("Buy limit order placed:", result);
      } else if (activeOrderType === "stopMarket") {
        // Stop market order
        const result = await createStopMarketOrder({
          market,
          side: "buy",
          quantity: submitQuantity,
          leverage,
          reduceOnly,
          triggerPrice: stopPrice || "0",
          triggerType: stopPriceTriggerType,
        });
        console.log("Buy stop market order placed:", result);
      } else if (activeOrderType === "stopLimit") {
        // Stop limit order
        const result = await createStopLimitOrder({
          market,
          side: "buy",
          quantity: submitQuantity,
          leverage,
          reduceOnly,
          triggerPrice: stopPrice || "0",
          triggerType: stopPriceTriggerType,
          price: orderPrice || "0", // Limit price for stop limit orders
          postOnly,
        });
        console.log("Buy stop limit order placed:", result);
      } else {
        // Market order
        const result = await createMarketOrder({
          market,
          side: "buy",
          quantity: submitQuantity,
          leverage,
          reduceOnly,
        });
        console.log("Buy order filled:", result);
      }
      // TODO: Show success notification
      // TODO: Refresh balance and positions
    } catch (err) {
      // Error is already set in the hook's error state
      console.error("Buy order failed:", err);
    }
  };

  // Sell order handler
  const handleSell = async () => {
    if (!isWalletUnlocked) {
      // Wallet not unlocked - KumaAuthWrapper handles the unlock flow
      console.warn("Wallet not unlocked for trading");
      return;
    }

    try {
      // Always use marketMetrics because it handles conversion from USD to BTC
      // marketMetrics.sellQtyBtc is always in base terms (BTC) regardless of quantityUnit
      const submitQuantity = marketMetrics.sellQtyBtc.toFixed(8);

      if (activeOrderType === "limit") {
        // Limit order
        const result = await createLimitOrder({
          market,
          side: "sell",
          quantity: submitQuantity,
          leverage,
          reduceOnly,
          price: limitPrice || "0",
          postOnly,
        });
        console.log("Sell limit order placed:", result);
      } else if (activeOrderType === "stopMarket") {
        // Stop market order
        const result = await createStopMarketOrder({
          market,
          side: "sell",
          quantity: submitQuantity,
          leverage,
          reduceOnly,
          triggerPrice: stopPrice || "0",
          triggerType: stopPriceTriggerType,
        });
        console.log("Sell stop market order placed:", result);
      } else if (activeOrderType === "stopLimit") {
        // Stop limit order
        const result = await createStopLimitOrder({
          market,
          side: "sell",
          quantity: submitQuantity,
          leverage,
          reduceOnly,
          triggerPrice: stopPrice || "0",
          triggerType: stopPriceTriggerType,
          price: orderPrice || "0", // Limit price for stop limit orders
          postOnly,
        });
        console.log("Sell stop limit order placed:", result);
      } else {
        // Market order
        const result = await createMarketOrder({
          market,
          side: "sell",
          quantity: submitQuantity,
          leverage,
          reduceOnly,
        });
        console.log("Sell order filled:", result);
      }
      // TODO: Show success notification
      // TODO: Refresh balance and positions
    } catch (err) {
      // Error is already set in the hook's error state
      console.error("Sell order failed:", err);
    }
  };

  // Disable order buttons if quantity is empty or zero or if submitting
  // For limit orders, also require a valid limit price
  // For stop market orders, require a valid stop price
  // For stop limit orders, require both stop price and order price
  const isLimitOrderMissingPrice =
    activeOrderType === "limit" && (!limitPrice || parseFloat(limitPrice) === 0);
  const isStopMarketMissingPrice =
    activeOrderType === "stopMarket" && (!stopPrice || parseFloat(stopPrice) === 0);
  const isStopLimitMissingPrices =
    activeOrderType === "stopLimit" && (
      !stopPrice || parseFloat(stopPrice) === 0 ||
      !orderPrice || parseFloat(orderPrice) === 0
    );
  const isOrderDisabled =
    !quantity || parseFloat(quantity) === 0 || isSubmitting || isLimitOrderMissingPrice || isStopMarketMissingPrice || isStopLimitMissingPrices;

  // Handle TP/SL checkbox change
  const handleTpSlChange = (checked: boolean) => {
    if (checked) {
      // Validate that quantity is entered before opening TP/SL modal
      if (!quantity || parseFloat(quantity) === 0) {
        alert("Please enter quantity first");
        return;
      }
      // Open the TP/SL modal
      openTpSlModal();
      setTpSlEnabled(true);
    } else {
      setTpSlEnabled(false);
    }
  };

  // Calculate market metrics using orderbook simulation (market orders) or fixed price (limit orders)
  const marketMetrics = useMemo(() => {
    // Convert orderbook data to the format expected by marketCalc
    const asks = orderbookData?.asks?.map(([price, size]) => ({
      price: parseFloat(price),
      qty: parseFloat(size),
    })) || [];

    const bids = orderbookData?.bids?.map(([price, size]) => ({
      price: parseFloat(price),
      qty: parseFloat(size),
    })) || [];

    return calculateMarketMetrics({
      quantity,
      quantityUnit,
      leverage,
      asks,
      bids,
      fallbackPrice: currentPrice,
      freeCollateral,
      // Pass order type and limit price for limit order calculations
      orderType: activeOrderType,
      limitPrice: limitPrice || undefined,
      // Pass stop prices for stop market/limit order calculations
      stopPrice: stopPrice || undefined,
      orderPrice: orderPrice || undefined,
    });
  }, [quantity, quantityUnit, leverage, orderbookData, currentPrice, freeCollateral, activeOrderType, limitPrice, stopPrice, orderPrice]);

  const displayQuantity = (): string => {
    // For market orders: shows orderbook-simulated buy / sell quantities
    // For limit orders: shows fixed quantity (same on both sides)
    return formatDualDisplay(
      marketMetrics.buyQtyBtc,
      marketMetrics.sellQtyBtc,
      (qty) => `${formatBtcQuantity(qty)} BTC`
    );
  };

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        p: 2,
        justifyContent: "space-between",
      }}
    >
      <div>
        <LeverageSelector />
        {/* Order Type Tabs */}
        <OrderTypeTabs />

        {/* <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} /> */}

        {/* Leverage Selector */}

        {/* <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} /> */}

        {/* Price Input - Only for Limit Orders */}
        {activeOrderType === "limit" && (
          <div className="flex w-full items-center bg-[rgba(255,255,255,0.02)] border-2 border-[rgba(255,255,255,0.1)] mb-3">
            <p className="p-3 text-sm text-white/80 shrink-0">Price</p>
            <input
              type="text"
              value={limitPrice || ""}
              onChange={(e) => setLimitPrice(e.target.value)}
              className="flex-1 min-w-0 bg-transparent px-3 py-3 text-sm text-white outline-none focus:ring-0 text-right"
              placeholder="0.00"
            />
            <span className="px-3 py-3 text-sm text-white/60 shrink-0 border-l border-[rgba(255,255,255,0.1)]">USD</span>
          </div>
        )}

        {/* Stop Price Input - For Stop Market and Stop Limit Orders */}
        {(activeOrderType === "stopMarket" || activeOrderType === "stopLimit") && (
          <div className="flex w-full items-center bg-[rgba(255,255,255,0.02)] border-2 border-[rgba(255,255,255,0.1)] mb-3">
            <p className="p-3 text-sm text-white/80 shrink-0">Stop Price</p>
            <input
              type="text"
              value={stopPrice || ""}
              onChange={(e) => setStopPrice(e.target.value)}
              className="flex-1 min-w-0 bg-transparent px-3 py-3 text-sm text-white outline-none focus:ring-0 text-right"
              placeholder="0.00"
            />
            <select
              value={stopPriceTriggerType}
              onChange={(e) => setStopPriceTriggerType(e.target.value as "index" | "last")}
              className="shrink-0 text-white text-sm px-3 py-3 outline-none cursor-pointer border-l border-[rgba(255,255,255,0.1)] appearance-none bg-transparent [&>option:checked]:bg-[#00F5E0] [&>option:checked]:text-black [&>option]:bg-black [&>option]:text-white"
            >
              <option value="index">Index</option>
              <option value="last">Last</option>
            </select>
          </div>
        )}

        {/* Order Price Input - Only for Stop Limit Orders */}
        {activeOrderType === "stopLimit" && (
          <div className="flex w-full items-center bg-[rgba(255,255,255,0.02)] border-2 border-[rgba(255,255,255,0.1)] mb-3">
            <p className="p-3 text-sm text-white/80 shrink-0">Order Price</p>
            <input
              type="text"
              value={orderPrice || ""}
              onChange={(e) => setOrderPrice(e.target.value)}
              className="flex-1 min-w-0 bg-transparent px-3 py-3 text-sm text-white outline-none focus:ring-0 text-right"
              placeholder="0.00"
            />
            <span className="px-3 py-3 text-sm text-white/60 shrink-0 border-l border-[rgba(255,255,255,0.1)]">USD</span>
          </div>
        )}

        {/* Quantity Input Section */}
        <QuantityInput
          market={market}
          freeCollateral={freeCollateral}
          currentPrice={currentPrice}
          leverage={leverage}
          hidePercentageControls={activeOrderType === "stopMarket"}
          disableUsdUnit={activeOrderType === "stopMarket" || activeOrderType === "stopLimit"}
        />

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            py: 1,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: "rgba(255, 255, 255, 0.6)",
              fontSize: "0.75rem",
            }}
          >
            Quantity
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: "#fff",
              fontSize: "0.75rem",
              fontWeight: 500,
            }}
          >
            {displayQuantity()}
          </Typography>
        </Box>

        {/* Advanced Options */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={reduceOnly}
                onChange={(e) => setReduceOnly(e.target.checked)}
                sx={{
                  color: "rgba(255, 255, 255, 0.3)",
                  "&.Mui-checked": {
                    color: "#00F5E0",
                  },
                  "& .MuiSvgIcon-root": {
                    fontSize: 18,
                  },
                }}
              />
            }
            label="Reduce-Only"
            sx={{
              "& .MuiFormControlLabel-label": {
                fontSize: "0.8rem",
                color: "rgba(255, 255, 255, 0.7)",
              },
            }}
          />
          {/* Post-Only - Only for Limit and Stop Limit Orders */}
          {(activeOrderType === "limit" || activeOrderType === "stopLimit") && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={postOnly}
                  onChange={(e) => setPostOnly(e.target.checked)}
                  sx={{
                    color: "rgba(255, 255, 255, 0.3)",
                    "&.Mui-checked": {
                      color: "#00F5E0",
                    },
                    "& .MuiSvgIcon-root": {
                      fontSize: 18,
                    },
                  }}
                />
              }
              label="Post-Only"
              sx={{
                "& .MuiFormControlLabel-label": {
                  fontSize: "0.8rem",
                  color: "rgba(255, 255, 255, 0.7)",
                },
              }}
            />
          )}
          <FormControlLabel
            control={
              <Checkbox
                checked={tpSlEnabled}
                onChange={(e) => handleTpSlChange(e.target.checked)}
                sx={{
                  color: "rgba(255, 255, 255, 0.3)",
                  "&.Mui-checked": {
                    color: "#00F5E0",
                  },
                  "& .MuiSvgIcon-root": {
                    fontSize: 18,
                  },
                }}
              />
            }
            label="TP/SL"
            sx={{
              "& .MuiFormControlLabel-label": {
                fontSize: "0.8rem",
                color: "rgba(255, 255, 255, 0.7)",
              },
            }}
          />
        </Box>
      </div>

      <div>
        {/* Error Display */}
        {orderError && (
          <Alert severity="error" sx={{ fontSize: "0.875rem" }}>
            {orderError}
          </Alert>
        )}

        {/* Order Side Buttons */}
        <OrderSideButtons
          onBuy={handleBuy}
          onSell={handleSell}
          disabled={isOrderDisabled}
          loading={isSubmitting}
        />

        {/* <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.1)" }} /> */}

        {/* Order Summary */}
        <OrderSummary
          marketMetrics={marketMetrics}
          takerFeeRate={accountBalance?.takerFeeRate}
          makerFeeRate={accountBalance?.makerFeeRate}
        />

        {/* Leverage Modal */}
        <LeverageModal />

        {/* TP/SL Modal */}
        <TpSlModal market={market} tickerData={tickerData} />
      </div>
    </Box>
  );
};

export default OrderForm;
