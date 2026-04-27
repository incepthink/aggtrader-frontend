import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAccount, useWalletClient } from "wagmi";
import { OrderType, OrderSide } from "@katanaperps/katana-perps-sdk";
import { CreateLimitOrderParams, OrderState } from "./types";
import { OrderTypeToNumber, OrderSideToNumber } from "./constants";
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

export const useLimitOrder = () => {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const queryClient = useQueryClient();
  const notify = useNotify();

  const [state, setState] = useState<OrderState>({
    isSubmitting: false,
    error: null,
    orderResult: null,
  });

  const createLimitOrder = async (params: CreateLimitOrderParams) => {
    setState({ isSubmitting: true, error: null, orderResult: null });

    try {
      console.log("Creating limit order:", params);

      validateWalletConnection(address, walletClient);
      validatePrice(params.price, "limit price");

      const sideEnum = params.side === "buy" ? OrderSide.buy : OrderSide.sell;
      const typeNumber = OrderTypeToNumber[OrderType.limit];
      const sideNumber = OrderSideToNumber[sideEnum];

      console.log("Limit order parameters:", {
        typeForSignature: typeNumber,
        typeForAPI: OrderType.limit,
        sideForSignature: sideNumber,
        sideForAPI: params.side,
        quantity: formatQuantity(params.quantity),
        price: params.price,
        postOnly: params.postOnly,
      });

      // Step 1: Get typed data
      const { nonce, typedData, formattedQuantity } = await fetchTypedData({
        wallet: address!,
        market: params.market,
        type: typeNumber,
        side: sideNumber,
        quantity: formatQuantity(params.quantity),
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
      });

      console.log(
        "Signature received, submitting limit order to Katana Perps API...",
      );

      // Step 3: Submit order
      const result = await submitOrder({
        nonce,
        wallet: address!,
        market: params.market,
        type: OrderType.limit,
        side: params.side,
        quantity: formattedQuantity,
        price: params.price,
        signature,
        reduceOnly: params.reduceOnly,
        postOnly: params.postOnly,
      });

      console.log("Limit order created successfully:", result);

      try {
        await fetch(`${BACKEND_URL}/tracking/perp-position`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            walletAddress: address!,
            market: params.market,
            side: params.side === "buy" ? "LONG" : "SHORT",
            orderType: "LIMIT",
            leverage: params.leverage,
            quantity: formattedQuantity,
            openOrderId: result?.id ?? result?.orderId ?? "",
            openFillId: result?.fillId ?? "",
            openTxHash: result?.txHash ?? result?.hash ?? "",
            status: "OPEN",
            entryPrice: result?.price ?? result?.entryPrice ?? null,
            reduceOnly: params.reduceOnly ?? false,
            triggerPrice: null,
            limitPrice: params.price,
            openedAt: new Date().toISOString(),
          }),
        });
      } catch (trackingErr) {
        console.error("Failed to track perp position:", trackingErr);
      }

      setState({ isSubmitting: false, error: null, orderResult: result });
      notify.show({
        id: `order-success-${Date.now()}`,
        type: "success",
        message: "Limit order placed successfully",
        duration: 3000,
      });
      queryClient.invalidateQueries({ queryKey: ["katana-perps-fills"] });

      return result;
    } catch (err: any) {
      console.error("Error creating limit order:", err);
      const errorMessage = parseOrderError(err, "Failed to create limit order");
      setState({ isSubmitting: false, error: errorMessage, orderResult: null });
      throw err;
    }
  };

  return {
    createLimitOrder,
    ...state,
  };
};
