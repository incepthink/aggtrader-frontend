'use client';

import { useState } from 'react';
import { Box, Typography, Tabs, Tab, Switch, IconButton, Tooltip, CircularProgress } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CloseIcon from '@mui/icons-material/Close';
import {
  useKatanaPerpsPositions,
  KatanaPerpsPosition,
  calculateUnrealizedPnLPercentage,
  isLongPosition,
  formatPositionQuantity,
} from '@/hooks/perp/useKatanaPerpsPositions';
import { usePerpStore } from '@/store/perpStore';

// Types for orders and trade history (for future integration)
export interface Order {
  market: string;
  type: 'Limit' | 'Market' | 'Stop';
  side: 'Long' | 'Short';
  quantity: number;
  price: number;
  filled: number;
  total: number;
  triggerPrice?: number;
  createdAt: string;
}

export interface TradeHistory {
  market: string;
  side: 'Long' | 'Short';
  quantity: number;
  price: number;
  fee: number;
  realizedPnl: number;
  timestamp: string;
}

interface PositionsPanelProps {
  orders?: Order[];
  tradeHistory?: TradeHistory[];
}

const PositionsPanel = ({ orders = [], tradeHistory = [] }: PositionsPanelProps) => {
  const [activeTab, setActiveTab] = useState(0);
  const [hideOtherMarkets, setHideOtherMarkets] = useState(false);
  const selectedMarket = usePerpStore((s) => s.selectedMarket);

  // Fetch positions from Katana Perps API
  const { data: positions = [], isLoading, error, refetch } = useKatanaPerpsPositions();

  // Filter positions by selected market if hideOtherMarkets is enabled
  const filteredPositions = hideOtherMarkets
    ? positions.filter((p) => p.market === selectedMarket)
    : positions;

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleClosePosition = (market: string) => {
    // Placeholder for closing individual position
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
                  {orders.length}
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
        {activeTab === 1 && <OrdersTable orders={orders} />}
        {activeTab === 2 && <HistoryTable tradeHistory={tradeHistory} />}
      </Box>
    </Box>
  );
};

// Table styles
const tableStyles = {
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
  },
  th: {
    padding: '8px 16px',
    textAlign: 'left' as const,
    fontSize: '0.75rem',
    fontWeight: 500,
    color: 'rgba(255, 255, 255, 0.4)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    whiteSpace: 'nowrap' as const,
  },
  td: {
    padding: '12px 16px',
    fontSize: '0.875rem',
    color: '#fff',
    borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
  },
  tr: {
    transition: 'background-color 0.2s',
  },
};

// Positions Table Component
const PositionsTable = ({
  positions,
  isLoading,
  error,
  onClosePosition,
  onRefresh,
}: {
  positions: KatanaPerpsPosition[];
  isLoading: boolean;
  error: Error | null;
  onClosePosition: (market: string) => void;
  onRefresh: () => void;
}) => {
  // Loading state
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
          Loading positions...
        </Typography>
      </Box>
    );
  }

  // Error state
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
          Failed to load positions
        </Typography>
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
      </Box>
    );
  }

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <table style={tableStyles.table}>
        <thead>
          <tr style={{ background: 'rgba(5, 12, 25, 0.95)' }}>
            <th style={tableStyles.th}>MARKET</th>
            <th style={tableStyles.th}>QUANTITY</th>
            <th style={tableStyles.th}>VALUE</th>
            <th style={tableStyles.th}>ENTRY PRICE</th>
            <th style={tableStyles.th}>INDEX PRICE</th>
            <th style={tableStyles.th}>LIQUIDATION PRICE</th>
            <th style={tableStyles.th}>POSITION MARGIN</th>
            <th style={tableStyles.th}>UNREALIZED P&L (%)</th>
            <th style={tableStyles.th}>REALIZED P&L</th>
            <th style={tableStyles.th}>TP/SL</th>
            <th style={tableStyles.th}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                ADL
                <Tooltip title="Auto-Deleveraging risk indicator (1-5). Higher means higher risk of forced deleveraging.">
                  <InfoOutlinedIcon sx={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.3)' }} />
                </Tooltip>
              </span>
            </th>
            <th style={{ ...tableStyles.th, textAlign: 'center', width: '60px' }}></th>
          </tr>
        </thead>
        <tbody>
          {positions.length === 0 ? (
            <tr>
              <td colSpan={12} style={{ ...tableStyles.td, textAlign: 'center', padding: '48px 16px' }}>
                <Typography sx={{ color: '#00F5E0', fontSize: '0.875rem' }}>
                  No open positions
                </Typography>
              </td>
            </tr>
          ) : (
            positions.map((position, index) => {
              const isLong = isLongPosition(position);
              const unrealizedPnL = parseFloat(position.unrealizedPnL);
              const unrealizedPnLPercentage = calculateUnrealizedPnLPercentage(position);
              const realizedPnL = parseFloat(position.realizedPnL);
              const positionValue = parseFloat(position.value);
              const entryPrice = parseFloat(position.entryPrice);
              const indexPrice = parseFloat(position.indexPrice);
              const liquidationPrice = parseFloat(position.liquidationPrice);
              const marginRequirement = parseFloat(position.marginRequirement);

              return (
                <tr
                  key={`${position.market}-${index}`}
                  style={tableStyles.tr}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  {/* Market */}
                  <td style={tableStyles.td}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontWeight: 500 }}>{position.market}</span>
                      <span
                        style={{
                          color: isLong ? '#00FF88' : '#FF4444',
                          fontSize: '0.625rem',
                          fontWeight: 600,
                        }}
                      >
                        {isLong ? 'LONG' : 'SHORT'}
                      </span>
                    </span>
                  </td>

                  {/* Quantity */}
                  <td style={tableStyles.td}>{formatPositionQuantity(position)}</td>

                  {/* Value */}
                  <td style={tableStyles.td}>
                    ${positionValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>

                  {/* Entry Price */}
                  <td style={tableStyles.td}>
                    ${entryPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>

                  {/* Index Price */}
                  <td style={tableStyles.td}>
                    ${indexPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>

                  {/* Liquidation Price */}
                  <td style={tableStyles.td}>
                    ${liquidationPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>

                  {/* Position Margin */}
                  <td style={tableStyles.td}>
                    ${marginRequirement.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>

                  {/* Unrealized P&L (%) */}
                  <td style={tableStyles.td}>
                    <div>
                      <div style={{ color: unrealizedPnL >= 0 ? '#00FF88' : '#FF4444' }}>
                        {unrealizedPnL >= 0 ? '+' : ''}
                        ${unrealizedPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div style={{ color: unrealizedPnLPercentage >= 0 ? '#00FF88' : '#FF4444', fontSize: '0.75rem' }}>
                        ({unrealizedPnLPercentage >= 0 ? '+' : ''}{unrealizedPnLPercentage.toFixed(2)}%)
                      </div>
                    </div>
                  </td>

                  {/* Realized P&L */}
                  <td style={{ ...tableStyles.td, color: realizedPnL >= 0 ? '#00FF88' : '#FF4444' }}>
                    {realizedPnL >= 0 ? '+' : ''}
                    ${realizedPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>

                  {/* TP/SL */}
                  <td style={{ ...tableStyles.td, color: 'rgba(255, 255, 255, 0.5)' }}>-</td>

                  {/* ADL */}
                  <td style={tableStyles.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          style={{
                            width: '4px',
                            height: '12px',
                            backgroundColor:
                              level <= position.adlQuintile
                                ? position.adlQuintile >= 4
                                  ? '#FF4444'
                                  : position.adlQuintile >= 2
                                    ? '#FFA500'
                                    : '#00FF88'
                                : 'rgba(255, 255, 255, 0.1)',
                            borderRadius: '2px',
                          }}
                        />
                      ))}
                    </div>
                  </td>

                  {/* Close Button */}
                  <td style={{ ...tableStyles.td, textAlign: 'center' }}>
                    <Tooltip title="Close Position">
                      <IconButton
                        size="small"
                        onClick={() => onClosePosition(position.market)}
                        sx={{
                          color: 'rgba(255, 255, 255, 0.5)',
                          '&:hover': {
                            color: '#FF4444',
                            bgcolor: 'rgba(255, 68, 68, 0.1)',
                          },
                        }}
                      >
                        <CloseIcon sx={{ fontSize: 16 }} />
                      </IconButton>
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

// Open Orders Table Component
const OrdersTable = ({ orders }: { orders: Order[] }) => {
  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <table style={tableStyles.table}>
        <thead>
          <tr style={{ background: 'rgba(5, 12, 25, 0.95)' }}>
            <th style={tableStyles.th}>MARKET</th>
            <th style={tableStyles.th}>TYPE</th>
            <th style={tableStyles.th}>SIDE</th>
            <th style={tableStyles.th}>QUANTITY</th>
            <th style={tableStyles.th}>PRICE</th>
            <th style={tableStyles.th}>FILLED</th>
            <th style={tableStyles.th}>TOTAL</th>
            <th style={tableStyles.th}>TRIGGER PRICE</th>
            <th style={{ ...tableStyles.th, textAlign: 'right' }}>CANCEL</th>
          </tr>
        </thead>
        <tbody>
          {orders.length === 0 ? (
            <tr>
              <td colSpan={9} style={{ ...tableStyles.td, textAlign: 'center', padding: '48px 16px' }}>
                <Typography sx={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: '0.875rem' }}>
                  No open orders
                </Typography>
              </td>
            </tr>
          ) : (
            orders.map((order, index) => (
              <tr
                key={index}
                style={tableStyles.tr}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <td style={{ ...tableStyles.td, fontWeight: 500 }}>{order.market}</td>
                <td style={tableStyles.td}>{order.type}</td>
                <td style={{ ...tableStyles.td, color: order.side === 'Long' ? '#00FF88' : '#FF4444' }}>
                  {order.side}
                </td>
                <td style={tableStyles.td}>{order.quantity}</td>
                <td style={tableStyles.td}>${order.price.toFixed(2)}</td>
                <td style={tableStyles.td}>{order.filled}%</td>
                <td style={tableStyles.td}>${order.total.toFixed(2)}</td>
                <td style={tableStyles.td}>
                  {order.triggerPrice ? `$${order.triggerPrice.toFixed(2)}` : '-'}
                </td>
                <td
                  style={{
                    ...tableStyles.td,
                    color: '#FF4444',
                    textAlign: 'right',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

// Trade History Table Component
const HistoryTable = ({ tradeHistory }: { tradeHistory: TradeHistory[] }) => {
  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <table style={tableStyles.table}>
        <thead>
          <tr style={{ background: 'rgba(5, 12, 25, 0.95)' }}>
            <th style={tableStyles.th}>MARKET</th>
            <th style={tableStyles.th}>SIDE</th>
            <th style={tableStyles.th}>QUANTITY</th>
            <th style={tableStyles.th}>PRICE</th>
            <th style={tableStyles.th}>FEE</th>
            <th style={tableStyles.th}>REALIZED P&L</th>
            <th style={tableStyles.th}>TIME</th>
          </tr>
        </thead>
        <tbody>
          {tradeHistory.length === 0 ? (
            <tr>
              <td colSpan={7} style={{ ...tableStyles.td, textAlign: 'center', padding: '48px 16px' }}>
                <Typography sx={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: '0.875rem' }}>
                  No trade history
                </Typography>
              </td>
            </tr>
          ) : (
            tradeHistory.map((trade, index) => (
              <tr
                key={index}
                style={tableStyles.tr}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <td style={{ ...tableStyles.td, fontWeight: 500 }}>{trade.market}</td>
                <td style={{ ...tableStyles.td, color: trade.side === 'Long' ? '#00FF88' : '#FF4444' }}>
                  {trade.side}
                </td>
                <td style={tableStyles.td}>{trade.quantity}</td>
                <td style={tableStyles.td}>${trade.price.toFixed(2)}</td>
                <td style={tableStyles.td}>${trade.fee.toFixed(4)}</td>
                <td style={{ ...tableStyles.td, color: trade.realizedPnl >= 0 ? '#00FF88' : '#FF4444' }}>
                  ${trade.realizedPnl.toFixed(2)}
                </td>
                <td style={{ ...tableStyles.td, color: 'rgba(255, 255, 255, 0.6)' }}>
                  {trade.timestamp}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default PositionsPanel;
