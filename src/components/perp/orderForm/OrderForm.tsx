"use client";

import { Box, Snackbar, Alert, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useAccount } from "wagmi";
import React, { useMemo, useState, useEffect } from "react";
import { usePerpStore } from "@/store/perpStore";
import { useKumaAuth } from "@/hooks/perp/useKumaAuth";
import { useKumaBalance } from "@/hooks/perp/useKumaBalance";
import { useCreateOrder } from "@/hooks/perp/createOrder/useCreateOrder";
import { useOrderbookSnapshot } from "@/hooks/perp/useOrderbookTrades";
import { usePerpTickerStore } from "@/store/perpTickerStore";
import {
  calculateMarketMetrics,
  formatDualDisplay,
  formatBtcQuantity,
} from "@/utils/perp/marketCalc";
import OrderTypeTabs from "../OrderTypeTabs";
import LeverageSelector from "../LeverageSelector";
import LeverageModal from "../LeverageModal";
import QuantityInput from "../QuantityInput";
import OrderSideButtons from "../OrderSideButtons";
import OrderSummary from "../OrderSummary";
import TpSlModal from "../TpslModal/TpSlModal";
import PriceInputs from "./PriceInputs";
import OrderOptions from "./OrderOptions";
import QuantityDisplay from "./QuantityDisplay";

interface OrderFormProps {
  market: string;
}

const OrderForm = ({ market }: OrderFormProps) => {
  const closeStr = usePerpTickerStore((s) => s.tickers[market]?.close ?? null);
  const currentPrice = closeStr ? parseFloat(closeStr) : undefined;
  const { isConnected } = useAccount();
  const { isAssociated } = useKumaAuth();
  const { balance: accountBalance } = useKumaBalance();
  const {
    createMarketOrder,
    createLimitOrder,
    createStopMarketOrder,
    createStopLimitOrder,
    createTakeProfitOrder,
    createStopLossOrder,
    isSubmitting,
    error: orderError,
  } = useCreateOrder();

  const quantity = usePerpStore((s) => s.quantity);
  const quantityUnit = usePerpStore((s) => s.quantityUnit);
  const leverage = usePerpStore((s) => s.leverage);
  const reduceOnly = usePerpStore((s) => s.reduceOnly);
  const postOnly = usePerpStore((s) => s.postOnly);
  const freeCollateral = usePerpStore((s) => s.freeCollateral);
  const activeOrderType = usePerpStore((s) => s.activeOrderType);
  const limitPrice = usePerpStore((s) => s.limitPrice);
  const stopPrice = usePerpStore((s) => s.stopPrice);
  const stopPriceTriggerType = usePerpStore((s) => s.stopPriceTriggerType);
  const orderPrice = usePerpStore((s) => s.orderPrice);
  const tpSlEnabled = usePerpStore((s) => s.tpSlEnabled);

  // Long TP/SL configuration
  const longTakeProfitPrice = usePerpStore((s) => s.longTakeProfitPrice);
  const longTakeProfitTriggerType = usePerpStore(
    (s) => s.longTakeProfitTriggerType,
  );
  const longStopLossPrice = usePerpStore((s) => s.longStopLossPrice);
  const longStopLossTriggerType = usePerpStore(
    (s) => s.longStopLossTriggerType,
  );

  // Short TP/SL configuration
  const shortTakeProfitPrice = usePerpStore((s) => s.shortTakeProfitPrice);
  const shortTakeProfitTriggerType = usePerpStore(
    (s) => s.shortTakeProfitTriggerType,
  );
  const shortStopLossPrice = usePerpStore((s) => s.shortStopLossPrice);
  const shortStopLossTriggerType = usePerpStore(
    (s) => s.shortStopLossTriggerType,
  );

  const clearLongTpSl = usePerpStore((s) => s.clearLongTpSl);
  const clearShortTpSl = usePerpStore((s) => s.clearShortTpSl);

  const orderbookData = useOrderbookSnapshot(market);

  // Snackbar state for error notifications
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  useEffect(() => {
    if (orderError) {
      setSnackbarMessage(orderError);
      setSnackbarOpen(true);
    }
  }, [orderError]);

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const isWalletUnlocked = isConnected && isAssociated;
  // console.log(isConnected, isAssociated);

  const handleBuy = async () => {
    if (!isWalletUnlocked) {
      console.warn("Wallet not unlocked for trading");
      return;
    }

    try {
      const submitQuantity = marketMetrics.buyQtyBtc.toFixed(8);

      if (activeOrderType === "limit") {
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
        const result = await createStopLimitOrder({
          market,
          side: "buy",
          quantity: submitQuantity,
          leverage,
          reduceOnly,
          triggerPrice: stopPrice || "0",
          triggerType: stopPriceTriggerType,
          price: orderPrice || "0",
          postOnly,
        });
        console.log("Buy stop limit order placed:", result);
      } else {
        const result = await createMarketOrder({
          market,
          side: "buy",
          quantity: submitQuantity,
          leverage,
          reduceOnly,
        });
        console.log("Buy order filled:", result);
      }

      // Submit Long TP/SL orders if configured
      // For a long position: TP sells when price rises, SL sells when price falls
      if (tpSlEnabled && (longTakeProfitPrice || longStopLossPrice)) {
        console.log("Submitting Long TP/SL orders...");

        if (longTakeProfitPrice) {
          try {
            const tpResult = await createTakeProfitOrder({
              market,
              side: "sell", // Long TP = sell to close
              quantity: submitQuantity,
              leverage,
              reduceOnly: true,
              triggerPrice: longTakeProfitPrice,
              triggerType: longTakeProfitTriggerType,
            });
            console.log("Long Take Profit order placed:", tpResult);
          } catch (tpErr) {
            console.error("Failed to place Long Take Profit order:", tpErr);
          }
        }

        if (longStopLossPrice) {
          try {
            const slResult = await createStopLossOrder({
              market,
              side: "sell", // Long SL = sell to close
              quantity: submitQuantity,
              leverage,
              reduceOnly: true,
              triggerPrice: longStopLossPrice,
              triggerType: longStopLossTriggerType,
            });
            console.log("Long Stop Loss order placed:", slResult);
          } catch (slErr) {
            console.error("Failed to place Long Stop Loss order:", slErr);
          }
        }

        // Clear Long TP/SL after submission
        clearLongTpSl();
      }
    } catch (err) {
      console.error("Buy order failed:", err);
    }
  };

  const handleSell = async () => {
    if (!isWalletUnlocked) {
      console.warn("Wallet not unlocked for trading");
      return;
    }

    try {
      const submitQuantity = marketMetrics.sellQtyBtc.toFixed(8);

      if (activeOrderType === "limit") {
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
        const result = await createStopLimitOrder({
          market,
          side: "sell",
          quantity: submitQuantity,
          leverage,
          reduceOnly,
          triggerPrice: stopPrice || "0",
          triggerType: stopPriceTriggerType,
          price: orderPrice || "0",
          postOnly,
        });
        console.log("Sell stop limit order placed:", result);
      } else {
        const result = await createMarketOrder({
          market,
          side: "sell",
          quantity: submitQuantity,
          leverage,
          reduceOnly,
        });
        console.log("Sell order filled:", result);
      }

      // Submit Short TP/SL orders if configured
      // For a short position: TP buys when price falls, SL buys when price rises
      if (tpSlEnabled && (shortTakeProfitPrice || shortStopLossPrice)) {
        console.log("Submitting Short TP/SL orders...");

        if (shortTakeProfitPrice) {
          try {
            const tpResult = await createTakeProfitOrder({
              market,
              side: "buy", // Short TP = buy to close
              quantity: submitQuantity,
              leverage,
              reduceOnly: true,
              triggerPrice: shortTakeProfitPrice,
              triggerType: shortTakeProfitTriggerType,
            });
            console.log("Short Take Profit order placed:", tpResult);
          } catch (tpErr) {
            console.error("Failed to place Short Take Profit order:", tpErr);
          }
        }

        if (shortStopLossPrice) {
          try {
            const slResult = await createStopLossOrder({
              market,
              side: "buy", // Short SL = buy to close
              quantity: submitQuantity,
              leverage,
              reduceOnly: true,
              triggerPrice: shortStopLossPrice,
              triggerType: shortStopLossTriggerType,
            });
            console.log("Short Stop Loss order placed:", slResult);
          } catch (slErr) {
            console.error("Failed to place Short Stop Loss order:", slErr);
          }
        }

        // Clear Short TP/SL after submission
        clearShortTpSl();
      }
    } catch (err) {
      console.error("Sell order failed:", err);
    }
  };

  const isLimitOrderMissingPrice =
    activeOrderType === "limit" &&
    (!limitPrice || parseFloat(limitPrice) === 0);
  const isStopMarketMissingPrice =
    activeOrderType === "stopMarket" &&
    (!stopPrice || parseFloat(stopPrice) === 0);
  const isStopLimitMissingPrices =
    activeOrderType === "stopLimit" &&
    (!stopPrice ||
      parseFloat(stopPrice) === 0 ||
      !orderPrice ||
      parseFloat(orderPrice) === 0);
  const isOrderDisabled =
    !quantity ||
    parseFloat(quantity) === 0 ||
    isSubmitting ||
    isLimitOrderMissingPrice ||
    isStopMarketMissingPrice ||
    isStopLimitMissingPrices;

  const marketMetrics = useMemo(() => {
    const asks =
      orderbookData?.asks?.map(([price, size]) => ({
        price: parseFloat(price),
        qty: parseFloat(size),
      })) || [];

    const bids =
      orderbookData?.bids?.map(([price, size]) => ({
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
      orderType: activeOrderType,
      limitPrice: limitPrice || undefined,
      stopPrice: stopPrice || undefined,
      orderPrice: orderPrice || undefined,
    });
  }, [
    quantity,
    quantityUnit,
    leverage,
    orderbookData,
    currentPrice,
    freeCollateral,
    activeOrderType,
    limitPrice,
    stopPrice,
    orderPrice,
  ]);

  const displayQuantity = (): string => {
    return formatDualDisplay(
      marketMetrics.buyQtyBtc,
      marketMetrics.sellQtyBtc,
      (qty) => `${formatBtcQuantity(qty)} BTC`,
    );
  };

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        p: 1,
        justifyContent: "space-between",
      }}
    >
      <div>
        <LeverageSelector />
        <OrderTypeTabs />
        <PriceInputs />
        <QuantityInput
          market={market}
          freeCollateral={freeCollateral}
          currentPrice={currentPrice}
          leverage={leverage}
          hidePercentageControls={activeOrderType === "stopMarket"}
          disableUsdUnit={
            activeOrderType === "stopMarket" || activeOrderType === "stopLimit"
          }
        />
        <QuantityDisplay displayValue={displayQuantity()} />
        <OrderOptions />
      </div>

      <div>
        <OrderSideButtons
          onBuy={handleBuy}
          onSell={handleSell}
          disabled={isOrderDisabled}
          loading={isSubmitting}
        />

        <OrderSummary
          marketMetrics={marketMetrics}
          takerFeeRate={accountBalance?.takerFeeRate}
          makerFeeRate={accountBalance?.makerFeeRate}
        />

        <LeverageModal />
        <TpSlModal market={market} />
      </div>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity="error"
          variant="filled"
          onClose={handleSnackbarClose}
          action={
            <IconButton
              size="small"
              aria-label="close"
              color="inherit"
              onClick={handleSnackbarClose}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          }
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default React.memo(OrderForm);
