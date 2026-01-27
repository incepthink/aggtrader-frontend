'use client';

import { useState } from 'react';
import { Box, Tabs, Tab, Typography } from '@mui/material';
import { useOrderbookTrades } from '@/hooks/perp/useOrderbookTrades';
import OrderbookDisplay from './OrderbookDisplay';
import TradesDisplay from './TradesDisplay';

interface OrderbookTradesProps {
  market?: string;
}

const OrderbookTrades = ({ market = 'BTC-USD' }: OrderbookTradesProps) => {
  const [activeTab, setActiveTab] = useState(0);
  const { isConnected, orderbookData, trades, error } =
    useOrderbookTrades(market);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Connection Error */}
      {error && (
        <Box
          sx={{
            px: 2,
            py: 1,
            bgcolor: 'rgba(255, 68, 68, 0.1)',
            borderBottom: '1px solid #FF4444',
            flexShrink: 0,
          }}
        >
          <Typography sx={{ color: '#FF4444', fontSize: '0.75rem' }}>
            {error}
          </Typography>
        </Box>
      )}

      {/* Tabs */}
      <Box
        sx={{
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          bgcolor: 'rgba(0, 0, 0, 0.3)',
          flexShrink: 0,
        }}
      >
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{
            minHeight: 36,
            '& .MuiTab-root': {
              minHeight: 36,
              py: 1,
              px: 2,
              fontSize: '0.8rem',
              fontWeight: 600,
              color: '#666',
              textTransform: 'none',
              '&.Mui-selected': {
                color: '#00F5E0',
              },
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#00F5E0',
              height: 2,
            },
          }}
        >
          <Tab label="Orderbook" />
          <Tab label="Trades" />
        </Tabs>
      </Box>

      {/* Connection Status Indicator */}
      {!isConnected && !error && (
        <Box
          sx={{
            px: 2,
            py: 1,
            bgcolor: 'rgba(255, 165, 0, 0.1)',
            borderBottom: '1px solid rgba(255, 165, 0, 0.3)',
            flexShrink: 0,
          }}
        >
          <Typography sx={{ color: '#FFA500', fontSize: '0.75rem' }}>
            Connecting...
          </Typography>
        </Box>
      )}

      {/* Content */}
      <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
          {activeTab === 0 && <OrderbookDisplay orderbookData={orderbookData} />}
          {activeTab === 1 && <TradesDisplay trades={trades} />}
        </Box>
      </Box>
    </Box>
  );
};

export default OrderbookTrades;
