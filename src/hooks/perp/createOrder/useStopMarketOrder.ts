import { useState } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { OrderType, OrderSide } from '@katanaperps/katana-perps-sdk';
import { CreateStopMarketOrderParams, OrderState } from './types';
import { OrderTypeToNumber, OrderSideToNumber, TriggerTypeToNumber } from './constants';
import {
  parseOrderError,
  fetchTypedData,
  submitOrder,
  formatQuantity,
  validateWalletConnection,
  validatePrice,
} from './utils';

export const useStopMarketOrder = () => {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [state, setState] = useState<OrderState>({
    isSubmitting: false,
    error: null,
    orderResult: null,
  });

  const createStopMarketOrder = async (params: CreateStopMarketOrderParams) => {
    setState({ isSubmitting: true, error: null, orderResult: null });

    try {
      console.log('Creating stop market order:', params);

      validateWalletConnection(address, walletClient);
      validatePrice(params.triggerPrice, 'trigger price');

      const sideEnum = params.side === 'buy' ? OrderSide.buy : OrderSide.sell;
      const typeNumber = OrderTypeToNumber[OrderType.stopLossMarket];
      const sideNumber = OrderSideToNumber[sideEnum];
      const triggerTypeNumber = TriggerTypeToNumber[params.triggerType];

      console.log('Stop market order parameters:', {
        typeForSignature: typeNumber,
        typeForAPI: OrderType.stopLossMarket,
        sideForSignature: sideNumber,
        sideForAPI: params.side,
        triggerTypeForSignature: triggerTypeNumber,
        triggerTypeForAPI: params.triggerType,
        quantity: formatQuantity(params.quantity),
        triggerPrice: params.triggerPrice,
      });

      // Step 1: Get typed data
      const { nonce, typedData, formattedQuantity } = await fetchTypedData({
        wallet: address!,
        market: params.market,
        type: typeNumber,
        side: sideNumber,
        quantity: formatQuantity(params.quantity),
        triggerPrice: params.triggerPrice,
        triggerType: triggerTypeNumber,
      });

      console.log('Quantity adjusted for market rules:', {
        requested: params.quantity,
        willUse: formattedQuantity,
      });

      // Step 2: Sign typed data
      console.log('Requesting order signature from wallet...');
      const signature = await walletClient!.signTypedData({
        domain: typedData.domain,
        types: typedData.types,
        primaryType: typedData.primaryType,
        message: typedData.message,
      });

      console.log('Signature received, submitting stop market order to Katana Perps API...');

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
        reduceOnly: params.reduceOnly,
      });

      console.log('Stop market order created successfully:', result);
      setState({ isSubmitting: false, error: null, orderResult: result });

      return result;
    } catch (err: any) {
      console.error('Error creating stop market order:', err);
      const errorMessage = parseOrderError(err, 'Failed to create stop market order');
      setState({ isSubmitting: false, error: errorMessage, orderResult: null });
      throw err;
    }
  };

  return {
    createStopMarketOrder,
    ...state,
  };
};
