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
import { BACKEND_URL } from '@/utils/constants';

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
        reduceOnly: params.reduceOnly,
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

      try {
        await fetch(`${BACKEND_URL}/api/tracking/perp-position`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress: address!,
            market: params.market,
            side: params.side === 'buy' ? 'LONG' : 'SHORT',
            orderType: 'STOP_MARKET',
            leverage: params.leverage,
            quantity: formattedQuantity,
            openOrderId: result?.id ?? result?.orderId ?? '',
            openFillId: result?.fillId ?? '',
            openTxHash: result?.txHash ?? result?.hash ?? '',
            status: 'OPEN',
            entryPrice: result?.price ?? result?.entryPrice ?? null,
            reduceOnly: params.reduceOnly ?? false,
            triggerPrice: params.triggerPrice,
            limitPrice: null,
            openedAt: new Date().toISOString(),
          }),
        });
      } catch (trackingErr) {
        console.error('Failed to track perp position:', trackingErr);
      }

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
