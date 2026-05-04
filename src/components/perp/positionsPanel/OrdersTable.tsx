'use client';

import { useState } from 'react';
import { Box, Typography, Tooltip, IconButton, CircularProgress } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useAccount, useWalletClient } from 'wagmi';
import {
  KatanaPerpsOrder,
  calculateFillPercentage,
  formatOrderType,
} from '@/hooks/perp/useKatanaPerpsOrders';
import { tableStyles } from './tableStyles';

interface OrdersTableProps {
  orders: KatanaPerpsOrder[];
  isLoading: boolean;
  isFetching?: boolean;
  error: Error | null;
  onRefresh: () => void;
}

export const OrdersTable = ({
  orders,
  isLoading,
  isFetching,
  error,
  onRefresh,
}: OrdersTableProps) => {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [cancelingOrderId, setCancelingOrderId] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const handleCancelOrder = async (orderId: string) => {
    if (!address || !walletClient) {
      setCancelError('Wallet not connected');
      return;
    }

    setCancelingOrderId(orderId);
    setCancelError(null);

    try {
      // Step 1: Get typed data for signing
      const typedDataResponse = await fetch('/api/kuma/get-cancel-order-typed-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: address,
          orderIds: [orderId],
        }),
      });

      if (!typedDataResponse.ok) {
        const errorData = await typedDataResponse.json();
        throw new Error(errorData.error || 'Failed to get typed data');
      }

      const { nonce, typedData } = await typedDataResponse.json();

      // Step 2: Request signature from user's wallet
      const signature = await walletClient.signTypedData({
        domain: typedData.domain,
        types: typedData.types,
        primaryType: typedData.primaryType,
        message: typedData.message,
      });

      // Step 3: Submit cancel request to API
      const cancelResponse = await fetch('/api/kuma/cancel-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nonce,
          wallet: address,
          orderIds: [orderId],
          signature,
        }),
      });

      const result = await cancelResponse.json();

      if (!cancelResponse.ok) {
        throw new Error(result.error || 'Failed to cancel order');
      }

      console.log('Order canceled successfully:', result);

      // Refresh orders list
      onRefresh();
    } catch (err: unknown) {
      console.error('Failed to cancel order:', err);

      let errorMessage = 'Failed to cancel order';
      if (err instanceof Error) {
        if (err.message.includes('User rejected') || err.message.includes('User denied')) {
          errorMessage = 'Signature rejected';
        } else {
          errorMessage = err.message;
        }
      }

      setCancelError(errorMessage);

      // Clear error after 5 seconds
      setTimeout(() => setCancelError(null), 5000);
    } finally {
      setCancelingOrderId(null);
    }
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          py: 4,
          gap: 2,
        }}
      >
        <CircularProgress size={24} sx={{ color: '#00F5E0' }} />
        <Typography sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.875rem' }}>
          Loading orders...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          py: 4,
          gap: 1,
        }}
      >
        <Typography sx={{ color: '#FF4444', fontSize: '0.875rem' }}>
          Failed to load orders
        </Typography>
        {isFetching ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={14} sx={{ color: '#00F5E0' }} />
            <Typography sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.75rem' }}>
              Retrying...
            </Typography>
          </Box>
        ) : (
          <Typography
            sx={{
              color: '#00F5E0',
              fontSize: '0.75rem',
              cursor: 'pointer',
              '&:hover': { textDecoration: 'underline' },
            }}
            onClick={() => onRefresh()}
          >
            Click to retry
          </Typography>
        )}
      </Box>
    );
  }

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      {/* Cancel Error Banner */}
      {cancelError && (
        <Box
          sx={{
            px: 2,
            py: 1,
            bgcolor: 'rgba(255, 68, 68, 0.1)',
            borderBottom: '1px solid rgba(255, 68, 68, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography sx={{ color: '#FF4444', fontSize: '0.75rem' }}>
            {cancelError}
          </Typography>
          <IconButton
            size="small"
            onClick={() => setCancelError(null)}
            sx={{ color: '#FF4444', p: 0.5 }}
          >
            <CloseIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </Box>
      )}
      <table style={tableStyles.table}>
        <thead>
          <tr style={{ background: 'rgba(5, 12, 25, 0.95)' }}>
            <th style={tableStyles.th}>MARKET</th>
            <th style={tableStyles.th}>TYPE</th>
            <th style={tableStyles.th}>SIDE</th>
            <th style={tableStyles.th}>QUANTITY</th>
            <th style={tableStyles.th}>PRICE</th>
            <th style={tableStyles.th}>FILLED</th>
            <th style={tableStyles.th}>VALUE</th>
            <th style={tableStyles.th}>TRIGGER PRICE</th>
            <th style={tableStyles.th}>STATUS</th>
            <th style={{ ...tableStyles.th, textAlign: 'center', width: '60px' }}></th>
          </tr>
        </thead>
        <tbody>
          {orders.length === 0 ? (
            <tr>
              <td colSpan={10} style={{ ...tableStyles.td, textAlign: 'center', padding: '48px 16px' }}>
                <Typography sx={{ color: '#00F5E0', fontSize: '0.875rem' }}>
                  No open orders
                </Typography>
              </td>
            </tr>
          ) : (
            orders.map((order) => {
              const isBuy = order.side === 'buy';
              const fillPercentage = calculateFillPercentage(order);
              const price = order.price ? parseFloat(order.price) : 0;
              const quantity = parseFloat(order.originalQuantity);
              const value = price * quantity;

              return (
                <tr
                  key={order.orderId}
                  style={tableStyles.tr}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  {/* Market */}
                  <td style={{ ...tableStyles.td, fontWeight: 500 }}>{order.market}</td>

                  {/* Type */}
                  <td style={tableStyles.td}>{formatOrderType(order.type)}</td>

                  {/* Side */}
                  <td style={{ ...tableStyles.td, color: isBuy ? '#00FF88' : '#FF4444' }}>
                    {isBuy ? 'Long' : 'Short'}
                  </td>

                  {/* Quantity */}
                  <td style={tableStyles.td}>{quantity.toFixed(6)}</td>

                  {/* Price */}
                  <td style={tableStyles.td}>
                    {order.price
                      ? `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : 'Market'}
                  </td>

                  {/* Filled */}
                  <td style={tableStyles.td}>
                    <span style={{ color: fillPercentage > 0 ? '#FFA500' : 'inherit' }}>
                      {fillPercentage.toFixed(1)}%
                    </span>
                  </td>

                  {/* Value */}
                  <td style={tableStyles.td}>
                    ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>

                  {/* Trigger Price */}
                  <td style={tableStyles.td}>
                    {order.triggerPrice
                      ? `$${parseFloat(order.triggerPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : '-'}
                  </td>

                  {/* Status */}
                  <td style={tableStyles.td}>
                    <span
                      style={{
                        color:
                          order.status === 'open' || order.status === 'active'
                            ? '#00F5E0'
                            : order.status === 'partiallyFilled'
                              ? '#FFA500'
                              : 'rgba(255, 255, 255, 0.5)',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        textTransform: 'uppercase',
                      }}
                    >
                      {order.status === 'partiallyFilled' ? 'Partial' : order.status}
                    </span>
                  </td>

                  {/* Cancel Button */}
                  <td style={{ ...tableStyles.td, textAlign: 'center' }}>
                    <Tooltip title={cancelingOrderId === order.orderId ? 'Canceling...' : 'Cancel Order'}>
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => handleCancelOrder(order.orderId)}
                          disabled={cancelingOrderId !== null}
                          sx={{
                            color: cancelingOrderId === order.orderId ? '#00F5E0' : 'rgba(255, 255, 255, 0.5)',
                            '&:hover': {
                              color: '#FF4444',
                              bgcolor: 'rgba(255, 68, 68, 0.1)',
                            },
                            '&.Mui-disabled': {
                              color: 'rgba(255, 255, 255, 0.2)',
                            },
                          }}
                        >
                          {cancelingOrderId === order.orderId ? (
                            <CircularProgress size={14} sx={{ color: '#00F5E0' }} />
                          ) : (
                            <CloseIcon sx={{ fontSize: 16 }} />
                          )}
                        </IconButton>
                      </span>
                    </Tooltip>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};
