'use client';

import { useState } from 'react';
import { Box, Typography, Tabs, Tab, Switch } from '@mui/material';
import { useKatanaPerpsPositions } from '@/hooks/perp/useKatanaPerpsPositions';
import { useKatanaPerpsOrders } from '@/hooks/perp/useKatanaPerpsOrders';
import { usePerpStore } from '@/store/perpStore';
import { PositionsTable } from './PositionsTable';
import { OrdersTable } from './OrdersTable';
import { HistoryTable } from './HistoryTable';

const PositionsPanel = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [hideOtherMarkets, setHideOtherMarkets] = useState(false);
  const selectedMarket = usePerpStore((s) => s.selectedMarket);

  const { data: positions = [], isLoading, error, refetch } = useKatanaPerpsPositions();
  const {
    data: orders = [],
    isLoading: ordersLoading,
    error: ordersError,
    refetch: refetchOrders,
  } = useKatanaPerpsOrders();

  const filteredPositions = hideOtherMarkets
    ? positions.filter((p) => p.market === selectedMarket)
    : positions;

  const filteredOrders = hideOtherMarkets
    ? orders.filter((o) => o.market === selectedMarket)
    : orders;

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleClosePosition = (market: string) => {
    console.log('Close position:', market);
  };

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'transparent',
      }}
    >
      {/* Header with Tabs and Toggle */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          px: 2,
        }}
      >
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{
            minHeight: 40,
            '& .MuiTab-root': {
              minHeight: 40,
              minWidth: 'auto',
              px: 2,
              py: 1,
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: '0.875rem',
              fontWeight: 500,
              textTransform: 'none',
              '&.Mui-selected': {
                color: '#fff',
              },
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#00F5E0',
              height: 2,
            },
          }}
        >
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                Positions
                <Box
                  sx={{
                    px: 0.75,
                    py: 0.25,
                    borderRadius: 0.5,
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                    fontSize: '0.75rem',
                    minWidth: 18,
                    textAlign: 'center',
                  }}
                >
                  {filteredPositions.length}
                </Box>
              </Box>
            }
          />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                Open Orders
                <Box
                  sx={{
                    px: 0.75,
                    py: 0.25,
                    borderRadius: 0.5,
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                    fontSize: '0.75rem',
                    minWidth: 18,
                    textAlign: 'center',
                  }}
                >
                  {filteredOrders.length}
                </Box>
              </Box>
            }
          />
          <Tab label="Trade History" />
        </Tabs>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography
            variant="caption"
            sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.75rem' }}
          >
            Hide Other Markets
          </Typography>
          <Switch
            checked={hideOtherMarkets}
            onChange={(e) => setHideOtherMarkets(e.target.checked)}
            size="small"
            sx={{
              '& .MuiSwitch-switchBase.Mui-checked': {
                color: '#00F5E0',
              },
              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                backgroundColor: '#00F5E0',
              },
            }}
          />
        </Box>
      </Box>

      {/* Table Content */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {activeTab === 0 && (
          <PositionsTable
            positions={filteredPositions}
            isLoading={isLoading}
            error={error}
            onClosePosition={handleClosePosition}
            onRefresh={refetch}
          />
        )}
        {activeTab === 1 && (
          <OrdersTable
            orders={filteredOrders}
            isLoading={ordersLoading}
            error={ordersError}
            onRefresh={refetchOrders}
          />
        )}
        {activeTab === 2 && (
          <HistoryTable hideOtherMarkets={hideOtherMarkets} selectedMarket={selectedMarket} />
        )}
      </Box>
    </Box>
  );
};

export default PositionsPanel;
