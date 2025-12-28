'use client';

import { Box, Typography, Stack } from '@mui/material';
import { KumaTradeEventData } from '@kumabid/kuma-sdk';

interface TradesDisplayProps {
  trades: KumaTradeEventData[];
}

const TradesDisplay = ({ trades }: TradesDisplayProps) => {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  if (!trades || trades.length === 0) {
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
          Waiting for trades...
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
        }}
      >
        <Typography
          sx={{ color: '#666', fontSize: '0.7rem', fontWeight: 600 }}
        >
          TIME
        </Typography>
        <Typography
          sx={{
            color: '#666',
            fontSize: '0.7rem',
            fontWeight: 600,
            textAlign: 'right',
          }}
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
      </Box>

      {/* Trades List */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          '&::-webkit-scrollbar': {
            width: '4px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'rgba(255, 255, 255, 0.05)',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '2px',
          },
        }}
      >
        <Stack spacing={0}>
          {trades.map((trade, index) => {
            // Determine if it's a buy or sell based on makerSide
            // If makerSide is 'sell', then the taker bought (green)
            // If makerSide is 'buy', then the taker sold (red)
            const isBuy = trade.makerSide === 'sell';

            return (
              <Box
                key={`${trade.fillId}-${index}`}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: 1,
                  px: 1,
                  py: 0.5,
                  fontSize: '0.75rem',
                  fontFamily: 'monospace',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.05)',
                  },
                  // Fade effect for older trades
                  opacity: Math.max(0.3, 1 - index * 0.02),
                }}
              >
                <Typography
                  sx={{
                    color: '#999',
                    fontSize: 'inherit',
                    fontFamily: 'inherit',
                  }}
                >
                  {formatTime(trade.time)}
                </Typography>
                <Typography
                  sx={{
                    color: isBuy ? '#00F5E0' : '#FF4444',
                    fontSize: 'inherit',
                    fontFamily: 'inherit',
                    textAlign: 'right',
                    fontWeight: 500,
                  }}
                >
                  {parseFloat(trade.price).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Typography>
                <Typography
                  sx={{
                    color: '#999',
                    fontSize: 'inherit',
                    fontFamily: 'inherit',
                    textAlign: 'right',
                  }}
                >
                  {parseFloat(trade.quantity).toFixed(4)}
                </Typography>
              </Box>
            );
          })}
        </Stack>
      </Box>
    </Box>
  );
};

export default TradesDisplay;
