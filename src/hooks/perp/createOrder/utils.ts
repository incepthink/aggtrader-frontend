import { getOrderSignatureTypedData } from '@katanaperps/katana-perps-sdk';
import { v1 as uuidv1 } from 'uuid';
import { TypedDataResponse } from './types';

export const parseOrderError = (err: any, defaultMessage: string): string => {
  let errorMessage = defaultMessage;

  if (err.message) {
    errorMessage = err.message;
  }

  if (errorMessage.includes('User rejected') || errorMessage.includes('User denied')) {
    return 'Order signature was rejected. Please try again.';
  }

  if (errorMessage.includes('insufficient') || errorMessage.includes('INSUFFICIENT_FUNDS')) {
    return 'Insufficient balance or margin to place order.';
  }

  return errorMessage;
};

export const fetchTypedData = async (params: {
  wallet: string;
  market: string;
  type: string;
  side: string;
  quantity: string;
  price?: string;
  triggerPrice?: string;
  triggerType?: string;
  reduceOnly?: boolean;
}): Promise<TypedDataResponse> => {
  const response = await fetch('/api/kuma/get-order-typed-data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      market: params.market,
      quantity: params.quantity,
      price: params.price,
      triggerPrice: params.triggerPrice,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get market info');
  }

  const { formattedQuantity, formattedPrice, formattedTriggerPrice } = await response.json();

  const nonce = uuidv1();

  const sandbox = process.env.NEXT_PUBLIC_KATANA_PERPS_SANDBOX === 'true';
  const chainId = sandbox ? 737373 : 747474;
  const verifyingContract = sandbox
    ? '0x92d3072dDe1aD3e9B7895500F504aA5e664E71d3'
    : '0x62230CeA619F734cc215bB8074bbF07bE4Eb633e';

  const [domain, types, message] = getOrderSignatureTypedData(
    {
      nonce,
      wallet: params.wallet.toLowerCase(),
      market: params.market,
      type: params.type as any,
      side: params.side as any,
      quantity: formattedQuantity,
      price: formattedPrice,
      triggerPrice: formattedTriggerPrice,
      triggerType: params.triggerType as any,
      reduceOnly: params.reduceOnly,
    },
    verifyingContract,
    chainId,
    sandbox,
  );

  return {
    nonce,
    typedData: {
      domain,
      types,
      primaryType: 'Order',
      message,
    },
    formattedQuantity,
  };
};

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
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Failed to create order');
  }

  return result;
};

export const formatQuantity = (quantity: string): string => {
  return parseFloat(quantity).toFixed(8);
};

export const validateWalletConnection = (address: string | undefined, walletClient: any): void => {
  if (!address || !walletClient) {
    throw new Error('Wallet not connected');
  }
};

export const validatePrice = (price: string | undefined, fieldName: string = 'price'): void => {
  if (!price || parseFloat(price) <= 0) {
    throw new Error(`Invalid ${fieldName}`);
  }
};
