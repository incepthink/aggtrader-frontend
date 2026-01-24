import { useState } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { OrderType, OrderSide, TriggerType } from '@katanaperps/katana-perps-sdk';

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

// Map trigger type string to numeric values for EIP-712 signature
const TriggerTypeToNumber: Record<string, number> = {
  'none': 0,
  [TriggerType.last]: 1,
  [TriggerType.index]: 2,
};

interface CreateOrderParams {
  market: string;
  side: 'buy' | 'sell';
  quantity: string;
  leverage: number;
  reduceOnly?: boolean;
}

interface CreateLimitOrderParams extends CreateOrderParams {
  price: string;
  postOnly?: boolean;
}

interface CreateStopMarketOrderParams extends CreateOrderParams {
  triggerPrice: string;
  triggerType: 'index' | 'last';
}

interface CreateStopLimitOrderParams extends CreateOrderParams {
  triggerPrice: string;
  triggerType: 'index' | 'last';
  price: string; // Limit price at which order executes once triggered
  postOnly?: boolean;
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

      // Convert side to SDK enum (string: "buy" or "sell")
      const sideEnum = params.side === 'buy' ? OrderSide.buy : OrderSide.sell;

      // Convert enums to numeric values for API
      const typeNumber = OrderTypeToNumber[OrderType.market];
      const sideNumber = OrderSideToNumber[sideEnum];

      console.log('Order parameters:', {
        typeForSignature: typeNumber, // Numeric for EIP-712 signature
        typeForAPI: OrderType.market, // String for Katana Perps API: "market"
        sideForSignature: sideNumber, // Numeric for EIP-712 signature
        sideForAPI: params.side, // String for Katana Perps API: "buy" or "sell"
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

      console.log('Signature received, submitting order to Katana Perps API...');

      // Step 3: Submit order to Katana Perps API via our Next.js API route (CORS proxy)
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
   * Create a limit order via Next.js API proxy (to avoid CORS)
   * @param params Order parameters including price
   */
  const createLimitOrder = async (params: CreateLimitOrderParams) => {
    setIsSubmitting(true);
    setError(null);

    try {
      console.log('Creating limit order:', params);

      // Validate wallet connection
      if (!address || !walletClient) {
        throw new Error('Wallet not connected');
      }

      // Validate price
      if (!params.price || parseFloat(params.price) <= 0) {
        throw new Error('Invalid limit price');
      }

      // Convert side to SDK enum (string: "buy" or "sell")
      const sideEnum = params.side === 'buy' ? OrderSide.buy : OrderSide.sell;

      // Convert enums to numeric values for API
      const typeNumber = OrderTypeToNumber[OrderType.limit];
      const sideNumber = OrderSideToNumber[sideEnum];

      console.log('Limit order parameters:', {
        typeForSignature: typeNumber, // Numeric for EIP-712 signature
        typeForAPI: OrderType.limit, // String for Katana Perps API: "limit"
        sideForSignature: sideNumber, // Numeric for EIP-712 signature
        sideForAPI: params.side, // String for Katana Perps API: "buy" or "sell"
        quantity: parseFloat(params.quantity).toFixed(8),
        price: params.price,
        postOnly: params.postOnly,
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
          price: params.price, // Include price for limit orders
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

      console.log('Signature received, submitting limit order to Katana Perps API...');

      // Step 3: Submit order to Katana Perps API via our Next.js API route (CORS proxy)
      const response = await fetch('/api/kuma/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nonce,
          wallet: address,
          market: params.market,
          type: OrderType.limit, // String value: "limit"
          side: params.side, // String value: "buy" or "sell"
          quantity: formattedQuantity, // Use formatted quantity from typed data
          price: params.price, // Limit price
          signature,
          reduceOnly: params.reduceOnly,
          postOnly: params.postOnly, // Post-only flag for limit orders
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create limit order');
      }

      console.log('Limit order created successfully:', result);
      setOrderResult(result);

      return result;
    } catch (err: any) {
      console.error('Error creating limit order:', err);

      let errorMessage = 'Failed to create limit order';

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
   * Create a stop market order via Next.js API proxy (to avoid CORS)
   * Stop market orders are conditional orders that trigger when price reaches the stop price
   * @param params Order parameters including trigger price and trigger type
   */
  const createStopMarketOrder = async (params: CreateStopMarketOrderParams) => {
    setIsSubmitting(true);
    setError(null);

    try {
      console.log('Creating stop market order:', params);

      // Validate wallet connection
      if (!address || !walletClient) {
        throw new Error('Wallet not connected');
      }

      // Validate trigger price
      if (!params.triggerPrice || parseFloat(params.triggerPrice) <= 0) {
        throw new Error('Invalid trigger price');
      }

      // Convert side to SDK enum (string: "buy" or "sell")
      const sideEnum = params.side === 'buy' ? OrderSide.buy : OrderSide.sell;

      // Convert enums to numeric values for EIP-712 signature
      const typeNumber = OrderTypeToNumber[OrderType.stopLossMarket];
      const sideNumber = OrderSideToNumber[sideEnum];
      const triggerTypeNumber = TriggerTypeToNumber[params.triggerType];

      console.log('Stop market order parameters:', {
        typeForSignature: typeNumber, // Numeric for EIP-712 signature: 2
        typeForAPI: OrderType.stopLossMarket, // String for Katana Perps API: "stopLossMarket"
        sideForSignature: sideNumber, // Numeric for EIP-712 signature
        sideForAPI: params.side, // String for Katana Perps API: "buy" or "sell"
        triggerTypeForSignature: triggerTypeNumber, // Numeric for EIP-712 signature: 1 or 2
        triggerTypeForAPI: params.triggerType, // String for Katana Perps API: "index" or "last"
        quantity: parseFloat(params.quantity).toFixed(8),
        triggerPrice: params.triggerPrice,
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
          triggerPrice: params.triggerPrice, // Include trigger price for stop orders
          triggerType: triggerTypeNumber, // Include trigger type for stop orders (numeric)
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

      console.log('Signature received, submitting stop market order to Katana Perps API...');

      // Step 3: Submit order to Katana Perps API via our Next.js API route (CORS proxy)
      const response = await fetch('/api/kuma/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nonce,
          wallet: address,
          market: params.market,
          type: OrderType.stopLossMarket, // String value: "stopLossMarket"
          side: params.side, // String value: "buy" or "sell"
          quantity: formattedQuantity, // Use formatted quantity from typed data
          triggerPrice: params.triggerPrice, // Trigger price for stop orders
          triggerType: params.triggerType, // Trigger type for stop orders: "index" or "last"
          signature,
          reduceOnly: params.reduceOnly,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create stop market order');
      }

      console.log('Stop market order created successfully:', result);
      setOrderResult(result);

      return result;
    } catch (err: any) {
      console.error('Error creating stop market order:', err);

      let errorMessage = 'Failed to create stop market order';

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
   * Create a stop limit order via Next.js API proxy (to avoid CORS)
   * Stop limit orders are conditional orders that trigger when price reaches the stop price,
   * then execute as a limit order at the specified limit price
   * @param params Order parameters including trigger price, trigger type, and limit price
   */
  const createStopLimitOrder = async (params: CreateStopLimitOrderParams) => {
    setIsSubmitting(true);
    setError(null);

    try {
      console.log('Creating stop limit order:', params);

      // Validate wallet connection
      if (!address || !walletClient) {
        throw new Error('Wallet not connected');
      }

      // Validate trigger price
      if (!params.triggerPrice || parseFloat(params.triggerPrice) <= 0) {
        throw new Error('Invalid trigger price');
      }

      // Validate limit price
      if (!params.price || parseFloat(params.price) <= 0) {
        throw new Error('Invalid limit price');
      }

      // Convert side to SDK enum (string: "buy" or "sell")
      const sideEnum = params.side === 'buy' ? OrderSide.buy : OrderSide.sell;

      // Convert enums to numeric values for EIP-712 signature
      const typeNumber = OrderTypeToNumber[OrderType.stopLossLimit];
      const sideNumber = OrderSideToNumber[sideEnum];
      const triggerTypeNumber = TriggerTypeToNumber[params.triggerType];

      console.log('Stop limit order parameters:', {
        typeForSignature: typeNumber, // Numeric for EIP-712 signature: 3
        typeForAPI: OrderType.stopLossLimit, // String for Katana Perps API: "stopLossLimit"
        sideForSignature: sideNumber, // Numeric for EIP-712 signature
        sideForAPI: params.side, // String for Katana Perps API: "buy" or "sell"
        triggerTypeForSignature: triggerTypeNumber, // Numeric for EIP-712 signature: 1 or 2
        triggerTypeForAPI: params.triggerType, // String for Katana Perps API: "index" or "last"
        quantity: parseFloat(params.quantity).toFixed(8),
        triggerPrice: params.triggerPrice,
        price: params.price,
        postOnly: params.postOnly,
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
          triggerPrice: params.triggerPrice, // Include trigger price for stop orders
          triggerType: triggerTypeNumber, // Include trigger type for stop orders (numeric)
          price: params.price, // Include limit price for stop limit orders
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

      console.log('Signature received, submitting stop limit order to Katana Perps API...');

      // Step 3: Submit order to Katana Perps API via our Next.js API route (CORS proxy)
      const response = await fetch('/api/kuma/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nonce,
          wallet: address,
          market: params.market,
          type: OrderType.stopLossLimit, // String value: "stopLossLimit"
          side: params.side, // String value: "buy" or "sell"
          quantity: formattedQuantity, // Use formatted quantity from typed data
          triggerPrice: params.triggerPrice, // Trigger price for stop orders
          triggerType: params.triggerType, // Trigger type for stop orders: "index" or "last"
          price: params.price, // Limit price for stop limit orders
          signature,
          reduceOnly: params.reduceOnly,
          postOnly: params.postOnly, // Post-only flag for limit orders
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create stop limit order');
      }

      console.log('Stop limit order created successfully:', result);
      setOrderResult(result);

      return result;
    } catch (err: any) {
      console.error('Error creating stop limit order:', err);

      let errorMessage = 'Failed to create stop limit order';

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

  return {
    createMarketOrder,
    createLimitOrder,
    createStopMarketOrder,
    createStopLimitOrder,
    isSubmitting,
    error,
    orderResult,
  };
};
