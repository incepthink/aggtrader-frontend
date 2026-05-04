import { useState } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { OrderType, OrderSide } from '@katanaperps/katana-perps-sdk';
import { CreateTakeProfitOrderParams, OrderState } from './types';
import {
  parseOrderError,
  fetchTypedData,
  submitOrder,
  formatQuantity,
  validateWalletConnection,
  validatePrice,
} from './utils';

export const useTakeProfitOrder = () => {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [state, setState] = useState<OrderState>({
    isSubmitting: false,
    error: null,
    orderResult: null,
  });

  const createTakeProfitOrder = async (params: CreateTakeProfitOrderParams) => {
    setState({ isSubmitting: true, error: null, orderResult: null });

    try {
      console.log('Creating take profit order:', params);

      validateWalletConnection(address, walletClient);
      validatePrice(params.triggerPrice, 'trigger price');

      const sideEnum = params.side === 'buy' ? OrderSide.buy : OrderSide.sell;
      const reduceOnly = params.reduceOnly ?? true;

      // Step 1: Get typed data (signed client-side via SDK)
      const { nonce, typedData, formattedQuantity } = await fetchTypedData({
        wallet: address!,
        market: params.market,
        type: OrderType.takeProfitMarket,
        side: sideEnum,
        quantity: formatQuantity(params.quantity),
        triggerPrice: params.triggerPrice,
        triggerType: params.triggerType,
        reduceOnly,
      });

      // Step 2: Sign typed data
      console.log('Requesting take profit order signature from wallet...');
      const signature = await walletClient!.signTypedData({
        domain: typedData.domain,
        types: typedData.types,
        primaryType: typedData.primaryType,
        message: typedData.message,
      } as any);

      console.log('Signature received, submitting take profit order...');

      // Step 3: Submit order
      const result = await submitOrder({
        nonce,
        wallet: address!,
        market: params.market,
        type: OrderType.takeProfitMarket,
        side: params.side,
        quantity: formattedQuantity,
        triggerPrice: params.triggerPrice,
        triggerType: params.triggerType,
        signature,
        reduceOnly,
      });

      console.log('Take profit order created successfully:', result);
      setState({ isSubmitting: false, error: null, orderResult: result });

      return result;
    } catch (err: any) {
      console.error('Error creating take profit order:', err);
      const errorMessage = parseOrderError(err, 'Failed to create take profit order');
      setState({ isSubmitting: false, error: errorMessage, orderResult: null });
      throw err;
    }
  };

  return {
    createTakeProfitOrder,
    ...state,
  };
};
