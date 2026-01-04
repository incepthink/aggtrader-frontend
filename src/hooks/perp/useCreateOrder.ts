import { useState } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { OrderType, OrderSide } from '@kumabid/kuma-sdk';

// Map SDK string enums to API numeric values
const OrderTypeToNumber: Record<string, number> = {
  [OrderType.market]: 0,
  [OrderType.limit]: 1,
  [OrderType.stopLossMarket]: 2,
  [OrderType.stopLossLimit]: 3,
  [OrderType.takeProfitMarket]: 4,
  [OrderType.takeProfitLimit]: 5,
  [OrderType.trailingStopMarket]: 6,
};

const OrderSideToNumber: Record<string, number> = {
  [OrderSide.buy]: 0,
  [OrderSide.sell]: 1,
};

interface CreateOrderParams {
  market: string;
  side: 'buy' | 'sell';
  quantity: string;
  leverage: number;
  reduceOnly?: boolean;
}

export const useCreateOrder = () => {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderResult, setOrderResult] = useState<any>(null);

  /**
   * Create a market order via Next.js API proxy (to avoid CORS)
   * @param params Order parameters
   */
  const createMarketOrder = async (params: CreateOrderParams) => {
    setIsSubmitting(true);
    setError(null);

    try {
      console.log('Creating market order:', params);

      // Validate wallet connection
      if (!address || !walletClient) {
        throw new Error('Wallet not connected');
      }

      // Convert side to Kuma SDK enum (string: "buy" or "sell")
      const sideEnum = params.side === 'buy' ? OrderSide.buy : OrderSide.sell;

      // Convert enums to numeric values for API
      const typeNumber = OrderTypeToNumber[OrderType.market];
      const sideNumber = OrderSideToNumber[sideEnum];

      console.log('Order parameters:', {
        typeForSignature: typeNumber, // Numeric for EIP-712 signature
        typeForAPI: OrderType.market, // String for Kuma API: "market"
        sideForSignature: sideNumber, // Numeric for EIP-712 signature
        sideForAPI: params.side, // String for Kuma API: "buy" or "sell"
        quantity: parseFloat(params.quantity).toFixed(8),
      });

      // Step 1: Get the typed data structure from our API
      const typedDataResponse = await fetch('/api/kuma/get-order-typed-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallet: address,
          market: params.market,
          type: typeNumber,
          side: sideNumber,
          quantity: parseFloat(params.quantity).toFixed(8), // Format to 8 decimals
        }),
      });

      if (!typedDataResponse.ok) {
        const error = await typedDataResponse.json();
        throw new Error(error.error || 'Failed to get order typed data');
      }

      const { nonce, typedData, formattedQuantity } = await typedDataResponse.json();

      console.log('Quantity adjusted for market rules:', {
        requested: params.quantity,
        willUse: formattedQuantity,
      });

      // Step 2: Request signature from user's wallet
      console.log('Requesting order signature from wallet...');
      const signature = await walletClient.signTypedData({
        domain: typedData.domain,
        types: typedData.types,
        primaryType: typedData.primaryType,
        message: typedData.message,
      });

      console.log('Signature received, submitting order to Kuma API...');

      // Step 3: Submit order to Kuma API via our Next.js API route (CORS proxy)
      // Use the formatted quantity from typed data response
      const response = await fetch('/api/kuma/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nonce,
          wallet: address,
          market: params.market,
          type: OrderType.market, // String value: "market"
          side: params.side, // String value: "buy" or "sell"
          quantity: formattedQuantity, // Use formatted quantity from typed data
          signature,
          reduceOnly: params.reduceOnly,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create order');
      }

      console.log('Order created successfully:', result);
      setOrderResult(result);

      return result;
    } catch (err: any) {
      console.error('Error creating order:', err);

      let errorMessage = 'Failed to create order';

      if (err.message) {
        errorMessage = err.message;
      }

      // Check for specific error cases
      if (errorMessage.includes('User rejected') || errorMessage.includes('User denied')) {
        errorMessage = 'Order signature was rejected. Please try again.';
      } else if (errorMessage.includes('insufficient') || errorMessage.includes('INSUFFICIENT_FUNDS')) {
        errorMessage = 'Insufficient balance or margin to place order.';
      }

      setError(errorMessage);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Create a limit order (placeholder for future implementation)
   */
  const createLimitOrder = async (params: CreateOrderParams & { price: string }) => {
    console.log('createLimitOrder called (not implemented yet):', params);
    setError('Limit orders are not implemented yet');
    throw new Error('Limit orders are not implemented yet');
  };

  /**
   * Create a stop market order (placeholder for future implementation)
   */
  const createStopMarketOrder = async (
    params: CreateOrderParams & { triggerPrice: string; triggerType: string }
  ) => {
    console.log('createStopMarketOrder called (not implemented yet):', params);
    setError('Stop market orders are not implemented yet');
    throw new Error('Stop market orders are not implemented yet');
  };

  return {
    createMarketOrder,
    createLimitOrder,
    createStopMarketOrder,
    isSubmitting,
    error,
    orderResult,
  };
};
