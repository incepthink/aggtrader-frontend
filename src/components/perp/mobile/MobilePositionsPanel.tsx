'use client';

import { useState, useMemo } from 'react';
import { Box, Typography, Tabs, Tab, Switch, Button } from '@mui/material';
import { useKatanaPerpsPositions, KatanaPerpsPosition, isLongPosition, calculateUnrealizedPnLPercentage } from '@/hooks/perp/useKatanaPerpsPositions';
import { useKatanaPerpsOrders, KatanaPerpsOrder, formatOrderType } from '@/hooks/perp/useKatanaPerpsOrders';
import { useKatanaPerpsFills, KatanaPerpsFill, formatFillForDisplay } from '@/hooks/perp/useKatanaPerpsFills';
import { usePositionsWebSocket, mergePositions } from '@/hooks/perp/usePositionsWebSocket';
import { useOrdersWebSocket, mergeOrders } from '@/hooks/perp/useOrdersWebSocket';
import { usePerpStore } from '@/store/perpStore';

const MobilePositionsPanel = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [hideOtherMarkets, setHideOtherMarkets] = useState(false);
  const selectedMarket = usePerpStore((s) => s.selectedMarket);

  // REST API hooks for initial data
  const { data: restPositions = [] } = useKatanaPerpsPositions();
  const { data: restOrders = [] } = useKatanaPerpsOrders();

  // WebSocket hooks for real-time updates
  const { positionsMap: wsPositionsMap } = usePositionsWebSocket({ enabled: true });
  const { ordersMap: wsOrdersMap } = useOrdersWebSocket({ enabled: true });

  // Trade history fills
  const { data: fills = [], isLoading: fillsLoading } = useKatanaPerpsFills({
    market: hideOtherMarkets ? selectedMarket : undefined,
    limit: 100,
  });

  // Merge REST data with WebSocket updates
  const positions = useMemo(
    () => mergePositions(restPositions, wsPositionsMap),
    [restPositions, wsPositionsMap]
  );

  const orders = useMemo(
    () => mergeOrders(restOrders, wsOrdersMap),
    [restOrders, wsOrdersMap]
  );

  const filteredPositions = hideOtherMarkets
    ? positions.filter((p) => p.market === selectedMarket)
    : positions;

  const filteredOrders = hideOtherMarkets
    ? orders.filter((o) => o.market === selectedMarket)
    : orders;

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const formatQuantity = (position: KatanaPerpsPosition) => {
    const qty = Math.abs(parseFloat(position.quantity));
    return qty.toFixed(4);
  };

  const formatPrice = (price: string) => {
    const num = parseFloat(price);
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <Box
      sx={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(5, 12, 25, 0.8)',
        borderRadius: '12px',
        overflow: 'hidden',
      }}
    >
      {/* Header with Tabs */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          px: 1.5,
          flexWrap: 'wrap',
        }}
      >
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons={false}
          sx={{
            minHeight: 36,
            '& .MuiTab-root': {
              minHeight: 36,
              minWidth: 'auto',
              px: 1.5,
              py: 0.5,
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: '0.75rem',
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
                    px: 0.5,
                    py: 0.125,
                    borderRadius: 0.5,
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                    fontSize: '0.625rem',
                    minWidth: 14,
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
                    px: 0.5,
                    py: 0.125,
                    borderRadius: 0.5,
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                    fontSize: '0.625rem',
                    minWidth: 14,
                    textAlign: 'center',
                  }}
                >
                  {filteredOrders.length}
                </Box>
              </Box>
            }
          />
          <Tab label="Trade History" sx={{ fontSize: '0.75rem' }} />
        </Tabs>
      </Box>

      {/* Hide Other Markets Toggle */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          gap: 1,
          px: 2,
          py: 1,
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        <Switch
          checked={hideOtherMarkets}
          onChange={(e) => setHideOtherMarkets(e.target.checked)}
          size="small"
          sx={{
            transform: 'scale(0.8)',
            '& .MuiSwitch-switchBase.Mui-checked': {
              color: '#00F5E0',
            },
            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
              backgroundColor: '#00F5E0',
            },
          }}
        />
        <Typography
          variant="caption"
          sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.7rem' }}
        >
          Hide Other Markets
        </Typography>
      </Box>

      {/* Table Headers */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          px: 2,
          py: 1,
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
        }}
      >
        <Typography sx={{ color: '#666', fontSize: '0.65rem', textTransform: 'uppercase' }}>
          Market / Quantity
        </Typography>
        <Typography
          sx={{ color: '#666', fontSize: '0.65rem', textTransform: 'uppercase', textAlign: 'center' }}
        >
          Entry Price / Liq. Price
        </Typography>
        <Typography
          sx={{ color: '#666', fontSize: '0.65rem', textTransform: 'uppercase', textAlign: 'right' }}
        >
          Unrealized P&L (%) / Realized P&L
        </Typography>
      </Box>

      {/* Content */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          maxHeight: '200px',
          minHeight: '80px',
        }}
      >
        {activeTab === 0 && (
          filteredPositions.length === 0 ? (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                py: 4,
              }}
            >
              <Typography sx={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: '0.875rem' }}>
                No open positions
              </Typography>
            </Box>
          ) : (
            filteredPositions.map((position: KatanaPerpsPosition) => {
              const isLong = isLongPosition(position);
              const pnlPercent = calculateUnrealizedPnLPercentage(position);
              const unrealizedPnl = parseFloat(position.unrealizedPnL);
              const realizedPnl = parseFloat(position.realizedPnL);

              return (
                <Box
                  key={position.market}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    px: 2,
                    py: 1.5,
                    borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
                  }}
                >
                  <Box>
                    <Typography sx={{ color: '#fff', fontSize: '0.75rem', fontWeight: 500 }}>
                      {position.market}
                    </Typography>
                    <Typography
                      sx={{
                        color: isLong ? '#00FF88' : '#FF4444',
                        fontSize: '0.7rem',
                      }}
                    >
                      {formatQuantity(position)} {isLong ? 'LONG' : 'SHORT'}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography sx={{ color: '#fff', fontSize: '0.75rem' }}>
                      ${formatPrice(position.entryPrice)}
                    </Typography>
                    <Typography sx={{ color: '#FF4444', fontSize: '0.7rem' }}>
                      ${formatPrice(position.liquidationPrice)}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography
                      sx={{
                        color: unrealizedPnl >= 0 ? '#00FF88' : '#FF4444',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                      }}
                    >
                      ${unrealizedPnl.toFixed(2)} ({pnlPercent.toFixed(2)}%)
                    </Typography>
                    <Typography sx={{ color: '#999', fontSize: '0.7rem' }}>
                      ${realizedPnl.toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
              );
            })
          )
        )}
        {activeTab === 1 && (
          filteredOrders.length === 0 ? (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                py: 4,
              }}
            >
              <Typography sx={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: '0.875rem' }}>
                No open orders
              </Typography>
            </Box>
          ) : (
            filteredOrders.map((order: KatanaPerpsOrder, index: number) => (
              <Box
                key={`${order.orderId}-${index}`}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  px: 2,
                  py: 1.5,
                  borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
                }}
              >
                <Box>
                  <Typography sx={{ color: '#fff', fontSize: '0.75rem', fontWeight: 500 }}>
                    {order.market}
                  </Typography>
                  <Typography
                    sx={{
                      color: order.side === 'buy' ? '#00FF88' : '#FF4444',
                      fontSize: '0.7rem',
                    }}
                  >
                    {formatOrderType(order.type)} {order.side.toUpperCase()}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography sx={{ color: '#fff', fontSize: '0.75rem' }}>
                    ${order.price ? formatPrice(order.price) : 'Market'}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography sx={{ color: '#fff', fontSize: '0.75rem' }}>
                    {parseFloat(order.originalQuantity).toFixed(4)}
                  </Typography>
                </Box>
              </Box>
            ))
          )
        )}
        {activeTab === 2 && (
          fillsLoading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
              <Typography sx={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: '0.875rem' }}>
                Loading...
              </Typography>
            </Box>
          ) : fills.length === 0 ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
              <Typography sx={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: '0.875rem' }}>
                No trade history
              </Typography>
            </Box>
          ) : (
            fills.map((fill: KatanaPerpsFill) => {
              const formatted = formatFillForDisplay(fill);
              const isBuy = fill.side === 'buy';
              return (
                <Box
                  key={fill.fillId}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    px: 2,
                    py: 1.5,
                    borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
                  }}
                >
                  <Box>
                    <Typography sx={{ color: '#fff', fontSize: '0.75rem', fontWeight: 500 }}>
                      {fill.market}
                    </Typography>
                    <Typography
                      sx={{ color: isBuy ? '#00FF88' : '#FF4444', fontSize: '0.7rem' }}
                    >
                      {isBuy ? 'Buy' : 'Sell'} · {formatted.type}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography sx={{ color: '#fff', fontSize: '0.75rem' }}>
                      ${formatted.price}
                    </Typography>
                    <Typography sx={{ color: '#999', fontSize: '0.7rem' }}>
                      {formatted.date}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography sx={{ color: '#fff', fontSize: '0.75rem' }}>
                      {formatted.quantity}
                    </Typography>
                    <Typography sx={{ color: '#999', fontSize: '0.7rem' }}>
                      {formatted.value}
                    </Typography>
                  </Box>
                </Box>
              );
            })
          )
        )}
      </Box>

      {/* Close All Button */}
      <Box sx={{ px: 2, py: 1.5 }}>
        <Button
          fullWidth
          variant="outlined"
          disabled={filteredPositions.length === 0}
          sx={{
            color: '#00F5E0',
            borderColor: '#00F5E0',
            textTransform: 'none',
            fontWeight: 500,
            py: 1,
            fontSize: '0.875rem',
            borderRadius: '24px',
            '&:hover': {
              borderColor: '#00F5E0',
              backgroundColor: 'rgba(0, 245, 224, 0.1)',
            },
            '&:disabled': {
              color: 'rgba(0, 245, 224, 0.3)',
              borderColor: 'rgba(0, 245, 224, 0.3)',
            },
          }}
        >
          Close All
        </Button>
      </Box>
    </Box>
  );
};

export default MobilePositionsPanel;
