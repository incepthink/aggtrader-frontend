import { useState } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { OrderType, OrderSide } from '@katanaperps/katana-perps-sdk';
import { CreateStopLossOrderParams, OrderState } from './types';
import {
  parseOrderError,
  fetchTypedData,
  submitOrder,
  formatQuantity,
  validateWalletConnection,
  validatePrice,
} from './utils';

export const useStopLossOrder = () => {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [state, setState] = useState<OrderState>({
    isSubmitting: false,
    error: null,
    orderResult: null,
  });

  const createStopLossOrder = async (params: CreateStopLossOrderParams) => {
    setState({ isSubmitting: true, error: null, orderResult: null });

    try {
      console.log('Creating stop loss order:', params);

      validateWalletConnection(address, walletClient);
      validatePrice(params.triggerPrice, 'trigger price');

      const sideEnum = params.side === 'buy' ? OrderSide.buy : OrderSide.sell;
      const reduceOnly = params.reduceOnly ?? true;

      // Step 1: Get typed data (signed client-side via SDK)
      const { nonce, typedData, formattedQuantity } = await fetchTypedData({
        wallet: address!,
        market: params.market,
        type: OrderType.stopLossMarket,
        side: sideEnum,
        quantity: formatQuantity(params.quantity),
        triggerPrice: params.triggerPrice,
        triggerType: params.triggerType,
        reduceOnly,
      });

      // Step 2: Sign typed data
      console.log('Requesting stop loss order signature from wallet...');
      const signature = await walletClient!.signTypedData({
        domain: typedData.domain,
        types: typedData.types,
        primaryType: typedData.primaryType,
        message: typedData.message,
      } as any);

      console.log('Signature received, submitting stop loss order...');

      // Step 3: Submit order
      const result = await submitOrder({
        nonce,
        wallet: address!,
        market: params.market,
        type: OrderType.stopLossMarket,
        side: params.side,
        quantity: formattedQuantity,
        triggerPrice: params.triggerPrice,
        triggerType: params.triggerType,
        signature,
        reduceOnly,
      });

      console.log('Stop loss order created successfully:', result);
      setState({ isSubmitting: false, error: null, orderResult: result });

      return result;
    } catch (err: any) {
      console.error('Error creating stop loss order:', err);
      const errorMessage = parseOrderError(err, 'Failed to create stop loss order');
      setState({ isSubmitting: false, error: errorMessage, orderResult: null });
      throw err;
    }
  };

  return {
    createStopLossOrder,
    ...state,
  };
};
