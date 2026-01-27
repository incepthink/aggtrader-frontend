'use client';

import { useState, useMemo } from 'react';
import { Box, Typography, Tabs, Tab, Switch, Tooltip } from '@mui/material';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { useKatanaPerpsPositions } from '@/hooks/perp/useKatanaPerpsPositions';
import { useKatanaPerpsOrders } from '@/hooks/perp/useKatanaPerpsOrders';
import { usePositionsWebSocket, mergePositions } from '@/hooks/perp/usePositionsWebSocket';
import { useOrdersWebSocket, mergeOrders } from '@/hooks/perp/useOrdersWebSocket';
import { usePerpStore } from '@/store/perpStore';
import { PositionsTable } from './PositionsTable';
import { OrdersTable } from './OrdersTable';
import { HistoryTable } from './HistoryTable';

const PositionsPanel = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [hideOtherMarkets, setHideOtherMarkets] = useState(false);
  const selectedMarket = usePerpStore((s) => s.selectedMarket);

  // REST API hooks for initial data and computed fields
  const {
    data: restPositions = [],
    isLoading: positionsLoading,
    error: positionsError,
    refetch: refetchPositions,
  } = useKatanaPerpsPositions();

  const {
    data: restOrders = [],
    isLoading: ordersLoading,
    error: ordersError,
    refetch: refetchOrders,
  } = useKatanaPerpsOrders();

  // WebSocket hooks for real-time updates
  const {
    isConnected: positionsWsConnected,
    positionsMap: wsPositionsMap,
    error: positionsWsError,
  } = usePositionsWebSocket({ enabled: true });

  const {
    isConnected: ordersWsConnected,
    ordersMap: wsOrdersMap,
    error: ordersWsError,
  } = useOrdersWebSocket({ enabled: true });

  // Merge REST data with WebSocket updates
  const positions = useMemo(
    () => mergePositions(restPositions, wsPositionsMap),
    [restPositions, wsPositionsMap]
  );

  const orders = useMemo(
    () => mergeOrders(restOrders, wsOrdersMap),
    [restOrders, wsOrdersMap]
  );

  // Combined loading state (only show loading on initial load)
  const isLoading = positionsLoading && restPositions.length === 0;

  // Combined error state (prefer REST error, fallback to WS error)
  const error = positionsError || (positionsWsError ? new Error(positionsWsError) : null);

  // WebSocket connection status
  const wsConnected = positionsWsConnected || ordersWsConnected;

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

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* WebSocket Connection Status */}
          <Tooltip
            title={
              wsConnected
                ? 'Real-time updates active'
                : positionsWsError || ordersWsError
                  ? 'Using polling updates (15s refresh)'
                  : 'Connecting to real-time updates...'
            }
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <FiberManualRecordIcon
                sx={{
                  fontSize: 8,
                  color: wsConnected
                    ? '#00FF88'
                    : positionsWsError || ordersWsError
                      ? 'rgba(255, 255, 255, 0.3)'
                      : '#FFA500',
                  animation: wsConnected || positionsWsError || ordersWsError
                    ? 'none'
                    : 'pulse 1.5s infinite',
                  '@keyframes pulse': {
                    '0%': { opacity: 1 },
                    '50%': { opacity: 0.4 },
                    '100%': { opacity: 1 },
                  },
                }}
              />
              <Typography
                variant="caption"
                sx={{
                  color: wsConnected
                    ? 'rgba(255, 255, 255, 0.5)'
                    : positionsWsError || ordersWsError
                      ? 'rgba(255, 255, 255, 0.3)'
                      : '#FFA500',
                  fontSize: '0.625rem',
                  textTransform: 'uppercase',
                }}
              >
                {wsConnected ? 'Live' : positionsWsError || ordersWsError ? 'Polling' : 'Connecting'}
              </Typography>
            </Box>
          </Tooltip>

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
      </Box>

      {/* Table Content */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {activeTab === 0 && (
          <PositionsTable
            positions={filteredPositions}
            isLoading={isLoading}
            error={error}
            onClosePosition={handleClosePosition}
            onRefresh={refetchPositions}
          />
        )}
        {activeTab === 1 && (
          <OrdersTable
            orders={filteredOrders}
            isLoading={ordersLoading && restOrders.length === 0}
            error={ordersError || (ordersWsError ? new Error(ordersWsError) : null)}
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
