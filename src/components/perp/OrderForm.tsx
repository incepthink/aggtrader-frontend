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
import { useCreateOrder } from "@/hooks/perp/useCreateOrder";
import { useOrderbookTrades } from "@/hooks/perp/useOrderbookTrades";
import { KumaTicker } from "@kumabid/kuma-sdk";
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
  tickerData: KumaTicker | null;
}

const OrderForm = ({ market, currentPrice, tickerData }: OrderFormProps) => {
  const { isConnected } = useAccount();
  const { isAssociated } = useKumaAuth();
  const {
    createMarketOrder,
    isSubmitting,
    error: orderError,
  } = useCreateOrder();

  const quantity = usePerpStore((s) => s.quantity);
  const quantityUnit = usePerpStore((s) => s.quantityUnit);
  const leverage = usePerpStore((s) => s.leverage);
  const reduceOnly = usePerpStore((s) => s.reduceOnly);
  const tpSlEnabled = usePerpStore((s) => s.tpSlEnabled);
  const freeCollateral = usePerpStore((s) => s.freeCollateral);
  const setReduceOnly = usePerpStore((s) => s.setReduceOnly);
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

      const result = await createMarketOrder({
        market,
        side: "buy",
        quantity: submitQuantity,
        leverage,
        reduceOnly,
      });

      console.log("Buy order filled:", result);
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

      const result = await createMarketOrder({
        market,
        side: "sell",
        quantity: submitQuantity,
        leverage,
        reduceOnly,
      });

      console.log("Sell order filled:", result);
      // TODO: Show success notification
      // TODO: Refresh balance and positions
    } catch (err) {
      // Error is already set in the hook's error state
      console.error("Sell order failed:", err);
    }
  };

  // Disable order buttons if quantity is empty or zero or if submitting
  const isOrderDisabled =
    !quantity || parseFloat(quantity) === 0 || isSubmitting;

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

  // Calculate market metrics using orderbook simulation
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
    });
  }, [quantity, quantityUnit, leverage, orderbookData, currentPrice, freeCollateral]);

  const displayQuantity = (): string => {
    // Both modes show buy / sell (orderbook-based)
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

        {/* Quantity Input Section */}
        <QuantityInput
          market={market}
          freeCollateral={freeCollateral}
          currentPrice={currentPrice}
          leverage={leverage}
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
        <OrderSummary marketMetrics={marketMetrics} />

        {/* Leverage Modal */}
        <LeverageModal />

        {/* TP/SL Modal */}
        <TpSlModal market={market} tickerData={tickerData} />
      </div>
    </Box>
  );
};

export default OrderForm;
