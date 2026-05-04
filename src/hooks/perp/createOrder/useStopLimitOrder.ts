import { useState } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { OrderType, OrderSide } from "@katanaperps/katana-perps-sdk";
import { CreateStopLimitOrderParams, OrderState } from "./types";
import {
  parseOrderError,
  fetchTypedData,
  submitOrder,
  formatQuantity,
  validateWalletConnection,
  validatePrice,
} from "./utils";
import { BACKEND_URL } from "@/utils/constants";
import { useNotify } from "@/components/common/NotificationProvider";

export const useStopLimitOrder = () => {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const notify = useNotify();

  const [state, setState] = useState<OrderState>({
    isSubmitting: false,
    error: null,
    orderResult: null,
  });

  const createStopLimitOrder = async (params: CreateStopLimitOrderParams) => {
    setState({ isSubmitting: true, error: null, orderResult: null });

    try {
      console.log("Creating stop limit order:", params);

      validateWalletConnection(address, walletClient);
      validatePrice(params.triggerPrice, "trigger price");
      validatePrice(params.price, "limit price");

      const sideEnum = params.side === "buy" ? OrderSide.buy : OrderSide.sell;

      // Step 1: Get typed data (signed client-side via SDK)
      const { nonce, typedData, formattedQuantity } = await fetchTypedData({
        wallet: address!,
        market: params.market,
        type: OrderType.stopLossLimit,
        side: sideEnum,
        quantity: formatQuantity(params.quantity),
        triggerPrice: params.triggerPrice,
        triggerType: params.triggerType,
        price: params.price,
        reduceOnly: params.reduceOnly,
      });

      console.log("Quantity adjusted for market rules:", {
        requested: params.quantity,
        willUse: formattedQuantity,
      });

      // Step 2: Sign typed data
      console.log("Requesting order signature from wallet...");
      const signature = await walletClient!.signTypedData({
        domain: typedData.domain,
        types: typedData.types,
        primaryType: typedData.primaryType,
        message: typedData.message,
      } as any);

      console.log("Signature received, submitting stop limit order to Katana Perps API...");

      // Step 3: Submit order
      const result = await submitOrder({
        nonce,
        wallet: address!,
        market: params.market,
        type: OrderType.stopLossLimit,
        side: params.side,
        quantity: formattedQuantity,
        triggerPrice: params.triggerPrice,
        triggerType: params.triggerType,
        price: params.price,
        signature,
        reduceOnly: params.reduceOnly,
        postOnly: params.postOnly,
      });

      console.log("Stop limit order created successfully:", result);

      fetch(`${BACKEND_URL}/tracking/perp-position`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
        body: JSON.stringify({
          walletAddress: address!,
          market: params.market,
          side: params.side === "buy" ? "LONG" : "SHORT",
          orderType: "STOP_LIMIT",
          leverage: params.leverage,
          quantity: formattedQuantity,
          openOrderId: result?.id ?? result?.orderId ?? "",
          openFillId: result?.fillId ?? "",
          openTxHash: result?.txHash ?? result?.hash ?? "",
          status: "OPEN",
          entryPrice: result?.price ?? result?.entryPrice ?? null,
          reduceOnly: params.reduceOnly ?? false,
          triggerPrice: params.triggerPrice,
          limitPrice: params.price,
          openedAt: new Date().toISOString(),
        }),
      }).catch((trackingErr) => {
        console.error("Failed to track perp position:", trackingErr);
      });

      setState({ isSubmitting: false, error: null, orderResult: result });
      notify.show({
        id: `order-success-${Date.now()}`,
        type: "success",
        message: "Stop limit order placed successfully",
        duration: 3000,
      });

      return result;
    } catch (err: any) {
      console.error("Error creating stop limit order:", err);
      const errorMessage = parseOrderError(err, "Failed to create stop limit order");
      setState({ isSubmitting: false, error: errorMessage, orderResult: null });
      throw err;
    }
  };

  return {
    createStopLimitOrder,
    ...state,
  };
};
