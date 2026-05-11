'use client';

import { useState } from 'react';
import { Box, Tabs, Tab, Typography } from '@mui/material';
import {
  useOrderbookSnapshot,
  useOrderbookTrades,
  useOrderbookConnection,
} from '@/hooks/perp/useOrderbookTrades';
import OrderbookDisplay from './OrderbookDisplay';
import TradesDisplay from './TradesDisplay';

interface OrderbookTradesProps {
  market?: string;
  hideTabBar?: boolean;
  controlledTab?: number;
}

const OrderbookTrades = ({ market = 'BTC-USD', hideTabBar, controlledTab }: OrderbookTradesProps) => {
  const [internalTab, setInternalTab] = useState(0);
  const activeTab = controlledTab !== undefined ? controlledTab : internalTab;
  const orderbookData = useOrderbookSnapshot(market);
  const trades = useOrderbookTrades(market);
  const { isConnected, error } = useOrderbookConnection(market);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setInternalTab(newValue);
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
      {!hideTabBar && (
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
      )}

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

      {/* Content — both tabs stay mounted to avoid remount flashes */}
      <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
            display: activeTab === 0 ? 'block' : 'none',
          }}
        >
          <OrderbookDisplay orderbookData={orderbookData} />
        </Box>
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
            display: activeTab === 1 ? 'block' : 'none',
          }}
        >
          <TradesDisplay trades={trades} />
        </Box>
      </Box>
    </Box>
  );
};

export default OrderbookTrades;
