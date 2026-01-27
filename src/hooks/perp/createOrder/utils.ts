import { TypedDataResponse } from './types';

/**
 * Parse error message and return user-friendly message
 */
export const parseOrderError = (err: any, defaultMessage: string): string => {
  let errorMessage = defaultMessage;

  if (err.message) {
    errorMessage = err.message;
  }

  // Check for specific error cases
  if (errorMessage.includes('User rejected') || errorMessage.includes('User denied')) {
    return 'Order signature was rejected. Please try again.';
  }

  if (errorMessage.includes('insufficient') || errorMessage.includes('INSUFFICIENT_FUNDS')) {
    return 'Insufficient balance or margin to place order.';
  }

  return errorMessage;
};

/**
 * Fetch typed data for order signing
 */
export const fetchTypedData = async (params: {
  wallet: string;
  market: string;
  type: number;
  side: number;
  quantity: string;
  price?: string;
  triggerPrice?: string;
  triggerType?: number;
}): Promise<TypedDataResponse> => {
  const response = await fetch('/api/kuma/get-order-typed-data', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get order typed data');
  }

  return response.json();
};

/**
 * Submit order to API
 */
export const submitOrder = async (params: {
  nonce: string;
  wallet: string;
  market: string;
  type: string;
  side: string;
  quantity: string;
  signature: string;
  price?: string;
  triggerPrice?: string;
  triggerType?: string;
  reduceOnly?: boolean;
  postOnly?: boolean;
}): Promise<any> => {
  const response = await fetch('/api/kuma/create-order', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Failed to create order');
  }

  return result;
};

/**
 * Format quantity to 8 decimal places
 */
export const formatQuantity = (quantity: string): string => {
  return parseFloat(quantity).toFixed(8);
};

/**
 * Validate wallet connection
 */
export const validateWalletConnection = (address: string | undefined, walletClient: any): void => {
  if (!address || !walletClient) {
    throw new Error('Wallet not connected');
  }
};

/**
 * Validate price value
 */
export const validatePrice = (price: string | undefined, fieldName: string = 'price'): void => {
  if (!price || parseFloat(price) <= 0) {
    throw new Error(`Invalid ${fieldName}`);
  }
};
