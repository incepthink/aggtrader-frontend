import { useState } from 'react';
import { useAccount, useWalletClient } from 'wagmi';

// Kuma SDK order type enums
enum OrderType {
  market = 0,
  limit = 1,
  stopMarket = 2,
  stopLimit = 3,
  takeProfitMarket = 4,
  takeProfitLimit = 5,
}

enum OrderSide {
  buy = 0,
  sell = 1,
}

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
   * Create a market order
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

      // Convert side to Kuma enum
      const sideEnum = params.side === 'buy' ? OrderSide.buy : OrderSide.sell;

      // Step 1: Get the typed data structure from our API
      const typedDataResponse = await fetch('/api/kuma/get-order-typed-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallet: address,
          market: params.market,
          type: OrderType.market,
          side: sideEnum,
          quantity: params.quantity,
        }),
      });

      if (!typedDataResponse.ok) {
        const error = await typedDataResponse.json();
        throw new Error(error.error || 'Failed to get order typed data');
      }

      const { nonce, typedData } = await typedDataResponse.json();

      // Step 2: Request signature from user's wallet
      console.log('Requesting order signature from wallet...');
      const signature = await walletClient.signTypedData({
        domain: typedData.domain,
        types: typedData.types,
        primaryType: typedData.primaryType,
        message: typedData.message,
      });

      console.log('Signature received, submitting order to Kuma API...');

      // Step 3: Submit order to Kuma API via our Next.js API route
      const response = await fetch('/api/kuma/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nonce,
          wallet: address,
          market: params.market,
          type: OrderType.market,
          side: sideEnum,
          quantity: params.quantity,
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
      } else if (errorMessage.includes('insufficient')) {
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
