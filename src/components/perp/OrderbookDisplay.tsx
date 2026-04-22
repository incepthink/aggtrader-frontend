'use client';

import { Box, Typography } from '@mui/material';
import { useMemo, memo } from 'react';
import type { OrderbookSlice } from '@/store/perpOrderbookStore';

interface OrderbookDisplayProps {
  orderbookData: OrderbookSlice | null;
}

interface OrderRowProps {
  priceFormatted: string;
  sizeFormatted: string;
  totalFormatted: string;
  percentage: number;
  isBid: boolean;
}

const OrderRow = memo(
  ({
    priceFormatted,
    sizeFormatted,
    totalFormatted,
    percentage,
    isBid,
  }: OrderRowProps) => (
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
        {priceFormatted}
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
        {sizeFormatted}
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
        {totalFormatted}
      </Typography>
    </Box>
  ),
);

OrderRow.displayName = 'OrderRow';

const ROWS_PER_SIDE = 10; // Show 10 asks + 10 bids (adjust based on UI height)

interface OrderRowData {
  price: string;
  priceFormatted: string;
  sizeFormatted: string;
  totalFormatted: string;
  percentage: number;
}

const OrderbookDisplay = ({ orderbookData }: OrderbookDisplayProps) => {
  const { asksRows, bidsRows, spreadInfo } = useMemo(() => {
    if (!orderbookData) {
      return {
        asksRows: [] as OrderRowData[],
        bidsRows: [] as OrderRowData[],
        spreadInfo: null as { lastPrice: string; spread: string } | null,
      };
    }

    const asks = orderbookData.asks;
    const bids = orderbookData.bids;
    const limitedAsks = asks.slice(0, ROWS_PER_SIDE);
    const limitedBids = bids.slice(0, ROWS_PER_SIDE);

    // Compute running totals for asks in reverse (display is column-reverse)
    let askTotal = 0;
    const asksAcc: { price: string; size: string; total: number }[] = [];
    for (let i = limitedAsks.length - 1; i >= 0; i--) {
      const [price, size] = limitedAsks[i];
      askTotal += parseFloat(size);
      asksAcc.push({ price, size, total: askTotal });
    }

    let bidTotal = 0;
    const bidsAcc: { price: string; size: string; total: number }[] = [];
    for (const [price, size] of limitedBids) {
      bidTotal += parseFloat(size);
      bidsAcc.push({ price, size, total: bidTotal });
    }

    const maxTotal = Math.max(askTotal, bidTotal) || 1;

    const toRow = (r: {
      price: string;
      size: string;
      total: number;
    }): OrderRowData => ({
      price: r.price,
      priceFormatted: parseFloat(r.price).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      sizeFormatted: parseFloat(r.size).toFixed(4),
      totalFormatted: r.total.toFixed(2),
      percentage: (r.total / maxTotal) * 100,
    });

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

    return {
      asksRows: asksAcc.map(toRow),
      bidsRows: bidsAcc.map(toRow),
      spreadInfo,
    };
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
            flexDirection: 'column-reverse',
            overflow: 'hidden',
          }}
        >
          {asksRows.map((ask) => (
            <OrderRow
              key={`ask-${ask.price}`}
              priceFormatted={ask.priceFormatted}
              sizeFormatted={ask.sizeFormatted}
              totalFormatted={ask.totalFormatted}
              percentage={ask.percentage}
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
          {bidsRows.map((bid) => (
            <OrderRow
              key={`bid-${bid.price}`}
              priceFormatted={bid.priceFormatted}
              sizeFormatted={bid.sizeFormatted}
              totalFormatted={bid.totalFormatted}
              percentage={bid.percentage}
              isBid={true}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default memo(OrderbookDisplay);
