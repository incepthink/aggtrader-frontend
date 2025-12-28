'use client';

import { Box, Typography } from '@mui/material';
import { RestResponseGetOrderBookLevel2 } from '@kumabid/kuma-sdk';
import { useMemo, memo } from 'react';

interface OrderbookDisplayProps {
  orderbookData: RestResponseGetOrderBookLevel2 | null;
}

interface OrderRowData {
  price: string;
  size: string;
  total: number;
  priceFormatted: string;
  sizeFormatted: string;
  totalFormatted: string;
}

// Move OrderRow outside component and memoize to prevent recreation
const OrderRow = memo(({
  data,
  percentage,
  isBid,
}: {
  data: OrderRowData;
  percentage: number;
  isBid: boolean;
}) => (
  <Box
    sx={{
      position: 'relative',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gap: 1,
      px: 1,
      py: 0.3,
      fontSize: '0.75rem',
      fontFamily: 'monospace',
      cursor: 'pointer',
      '&:hover': {
        bgcolor: 'rgba(255, 255, 255, 0.05)',
      },
    }}
  >
    {/* Background bar */}
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        width: `${percentage}%`,
        bgcolor: isBid
          ? 'rgba(0, 245, 224, 0.1)'
          : 'rgba(255, 68, 68, 0.1)',
        zIndex: 0,
      }}
    />

    {/* Content */}
    <Typography
      sx={{
        color: isBid ? '#00F5E0' : '#FF4444',
        fontSize: 'inherit',
        fontFamily: 'inherit',
        position: 'relative',
        zIndex: 1,
      }}
    >
      {data.priceFormatted}
    </Typography>
    <Typography
      sx={{
        color: '#999',
        fontSize: 'inherit',
        fontFamily: 'inherit',
        textAlign: 'right',
        position: 'relative',
        zIndex: 1,
      }}
    >
      {data.sizeFormatted}
    </Typography>
    <Typography
      sx={{
        color: '#666',
        fontSize: 'inherit',
        fontFamily: 'inherit',
        textAlign: 'right',
        position: 'relative',
        zIndex: 1,
      }}
    >
      {data.totalFormatted}
    </Typography>
  </Box>
));

OrderRow.displayName = 'OrderRow';

const ROWS_PER_SIDE = 10; // Show 10 asks + 10 bids (adjust based on UI height)

const OrderbookDisplay = ({ orderbookData }: OrderbookDisplayProps) => {
  // Calculate running totals and pre-format values for efficiency
  const { asksWithTotals, bidsWithTotals, maxTotal, spreadInfo } = useMemo(() => {
    if (!orderbookData) {
      return { asksWithTotals: [], bidsWithTotals: [], maxTotal: 0, spreadInfo: null };
    }

    const asks = orderbookData.asks;
    const bids = orderbookData.bids;
    const limitedAsks = asks.slice(0, ROWS_PER_SIDE);
    const limitedBids = bids.slice(0, ROWS_PER_SIDE);

    // Calculate totals for asks (process in reverse order for display)
    let askTotal = 0;
    const asksWithTotals: OrderRowData[] = [];
    for (let i = limitedAsks.length - 1; i >= 0; i--) {
      const [price, size] = limitedAsks[i];
      const sizeNum = parseFloat(size);
      askTotal += sizeNum;
      asksWithTotals.push({
        price,
        size,
        total: askTotal,
        priceFormatted: parseFloat(price).toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
        sizeFormatted: sizeNum.toFixed(4),
        totalFormatted: askTotal.toFixed(2),
      });
    }

    // Calculate totals for bids
    let bidTotal = 0;
    const bidsWithTotals: OrderRowData[] = limitedBids.map(([price, size]) => {
      const sizeNum = parseFloat(size);
      bidTotal += sizeNum;
      return {
        price,
        size,
        total: bidTotal,
        priceFormatted: parseFloat(price).toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
        sizeFormatted: sizeNum.toFixed(4),
        totalFormatted: bidTotal.toFixed(2),
      };
    });

    const maxTotal = Math.max(askTotal, bidTotal);

    // Pre-calculate spread info
    const spreadInfo = {
      lastPrice: orderbookData.lastPrice
        ? parseFloat(orderbookData.lastPrice).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
        : '---',
      spread:
        asks[0] && bids[0]
          ? (parseFloat(asks[0][0]) - parseFloat(bids[0][0])).toFixed(2)
          : '---',
    };

    return { asksWithTotals, bidsWithTotals, maxTotal, spreadInfo };
  }, [orderbookData]);

  if (!orderbookData) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
        }}
      >
        <Typography sx={{ color: '#666', fontSize: '0.875rem' }}>
          Loading orderbook...
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 1,
          px: 1,
          py: 1,
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          flexShrink: 0,
        }}
      >
        <Typography
          sx={{ color: '#666', fontSize: '0.7rem', fontWeight: 600 }}
        >
          PRICE
        </Typography>
        <Typography
          sx={{
            color: '#666',
            fontSize: '0.7rem',
            fontWeight: 600,
            textAlign: 'right',
          }}
        >
          QUANTITY
        </Typography>
        <Typography
          sx={{
            color: '#666',
            fontSize: '0.7rem',
            fontWeight: 600,
            textAlign: 'right',
          }}
        >
          TOTAL
        </Typography>
      </Box>

      {/* Orderbook - Fixed layout with 3 sections */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Asks (Sells) - Red - Top half */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column-reverse', // Stack from bottom to top
            overflow: 'hidden',
          }}
        >
          {asksWithTotals.map((ask) => (
            <OrderRow
              key={`ask-${ask.price}`}
              data={ask}
              percentage={(ask.total / maxTotal) * 100}
              isBid={false}
            />
          ))}
        </Box>

        {/* Spread - Always centered */}
        <Box
          sx={{
            py: 1,
            px: 1,
            textAlign: 'center',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            bgcolor: 'rgba(255, 255, 255, 0.02)',
            flexShrink: 0,
          }}
        >
          <Typography
            sx={{
              color: '#00F5E0',
              fontSize: '0.8rem',
              fontWeight: 600,
              fontFamily: 'monospace',
            }}
          >
            {spreadInfo?.lastPrice}
          </Typography>
          <Typography sx={{ color: '#666', fontSize: '0.65rem', mt: 0.3 }}>
            Spread: {spreadInfo?.spread}
          </Typography>
        </Box>

        {/* Bids (Buys) - Green - Bottom half */}
        <Box
          sx={{
            flex: 1,
            overflow: 'hidden',
          }}
        >
          {bidsWithTotals.map((bid) => (
            <OrderRow
              key={`bid-${bid.price}`}
              data={bid}
              percentage={(bid.total / maxTotal) * 100}
              isBid={true}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default OrderbookDisplay;
