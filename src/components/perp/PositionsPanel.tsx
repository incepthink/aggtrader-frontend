'use client';

import { useState } from 'react';
import { Box, Typography, Tabs, Tab, Switch, IconButton, Tooltip } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

// Types for future data integration
export interface Position {
  market: string;
  quantity: number;
  value: number;
  entryPrice: number;
  indexPrice: number;
  liquidationPrice: number;
  positionMargin: number;
  unrealizedPnl: number;
  unrealizedPnlPercentage: number;
  realizedPnl: number;
  takeProfit?: number;
  stopLoss?: number;
  adl: number;
}

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
  positions?: Position[];
  orders?: Order[];
  tradeHistory?: TradeHistory[];
}

const PositionsPanel = ({ positions = [], orders = [], tradeHistory = [] }: PositionsPanelProps) => {
  const [activeTab, setActiveTab] = useState(0);
  const [hideOtherMarkets, setHideOtherMarkets] = useState(false);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleCloseAll = () => {
    // Placeholder for close all positions functionality
    console.log('Close all positions');
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
          <Tab label={`Positions ${positions.length}`} />
          <Tab label={`Open Orders ${orders.length}`} />
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
            positions={positions}
            onClosePosition={handleClosePosition}
            onCloseAll={handleCloseAll}
          />
        )}
        {activeTab === 1 && <OrdersTable orders={orders} />}
        {activeTab === 2 && <HistoryTable tradeHistory={tradeHistory} />}
      </Box>
    </Box>
  );
};

// Positions Table Component
const PositionsTable = ({
  positions,
  onClosePosition,
  onCloseAll,
}: {
  positions: Position[];
  onClosePosition: (market: string) => void;
  onCloseAll: () => void;
}) => {
  if (positions.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          py: 4,
        }}
      >
        <Typography sx={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: '0.875rem' }}>
          No open positions
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* Table Header */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '100px 80px 100px 100px 100px 120px 120px 120px 100px 80px 80px 100px',
          gap: 2,
          px: 2,
          py: 1.5,
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          position: 'sticky',
          top: 0,
          background: 'rgba(5, 12, 25, 0.95)',
          zIndex: 1,
        }}
      >
        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.4)', fontWeight: 500 }}>
          MARKET
        </Typography>
        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.4)', fontWeight: 500 }}>
          QUANTITY
        </Typography>
        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.4)', fontWeight: 500 }}>
          VALUE
        </Typography>
        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.4)', fontWeight: 500 }}>
          ENTRY PRICE
        </Typography>
        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.4)', fontWeight: 500 }}>
          INDEX PRICE
        </Typography>
        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.4)', fontWeight: 500 }}>
          LIQUIDATION PRICE
        </Typography>
        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.4)', fontWeight: 500 }}>
          POSITION MARGIN
        </Typography>
        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.4)', fontWeight: 500 }}>
          UNREALIZED P&L (%)
        </Typography>
        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.4)', fontWeight: 500 }}>
          REALIZED P&L
        </Typography>
        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.4)', fontWeight: 500 }}>
          TP/SL
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.4)', fontWeight: 500 }}>
            ADL
          </Typography>
          <Tooltip title="Auto-Deleveraging indicator">
            <InfoOutlinedIcon sx={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.3)' }} />
          </Tooltip>
        </Box>
        <Typography
          variant="caption"
          sx={{ color: 'rgba(255, 255, 255, 0.4)', fontWeight: 500, textAlign: 'right', cursor: 'pointer' }}
          onClick={onCloseAll}
        >
          CLOSE ALL
        </Typography>
      </Box>

      {/* Table Body - Sample data rows would go here */}
      {positions.map((position, index) => (
        <Box
          key={index}
          sx={{
            display: 'grid',
            gridTemplateColumns: '100px 80px 100px 100px 100px 120px 120px 120px 100px 80px 80px 100px',
            gap: 2,
            px: 2,
            py: 1.5,
            borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
            '&:hover': {
              background: 'rgba(255, 255, 255, 0.02)',
            },
          }}
        >
          <Typography sx={{ color: '#fff', fontSize: '0.875rem', fontWeight: 500 }}>
            {position.market}
          </Typography>
          <Typography sx={{ color: '#fff', fontSize: '0.875rem' }}>
            {position.quantity}
          </Typography>
          <Typography sx={{ color: '#fff', fontSize: '0.875rem' }}>
            ${position.value.toFixed(2)}
          </Typography>
          <Typography sx={{ color: '#fff', fontSize: '0.875rem' }}>
            ${position.entryPrice.toFixed(2)}
          </Typography>
          <Typography sx={{ color: '#fff', fontSize: '0.875rem' }}>
            ${position.indexPrice.toFixed(2)}
          </Typography>
          <Typography sx={{ color: '#fff', fontSize: '0.875rem' }}>
            ${position.liquidationPrice.toFixed(2)}
          </Typography>
          <Typography sx={{ color: '#fff', fontSize: '0.875rem' }}>
            ${position.positionMargin.toFixed(2)}
          </Typography>
          <Box>
            <Typography
              sx={{
                color: position.unrealizedPnl >= 0 ? '#00FF88' : '#FF4444',
                fontSize: '0.875rem',
              }}
            >
              ${position.unrealizedPnl.toFixed(2)}
            </Typography>
            <Typography
              sx={{
                color: position.unrealizedPnlPercentage >= 0 ? '#00FF88' : '#FF4444',
                fontSize: '0.75rem',
              }}
            >
              ({position.unrealizedPnlPercentage >= 0 ? '+' : ''}
              {position.unrealizedPnlPercentage.toFixed(2)}%)
            </Typography>
          </Box>
          <Typography
            sx={{
              color: position.realizedPnl >= 0 ? '#00FF88' : '#FF4444',
              fontSize: '0.875rem',
            }}
          >
            ${position.realizedPnl.toFixed(2)}
          </Typography>
          <Typography sx={{ color: '#fff', fontSize: '0.875rem' }}>
            {position.takeProfit && position.stopLoss
              ? `${position.takeProfit}/${position.stopLoss}`
              : '-'}
          </Typography>
          <Typography sx={{ color: '#fff', fontSize: '0.875rem' }}>
            {position.adl}
          </Typography>
          <Typography
            sx={{
              color: '#FF4444',
              fontSize: '0.875rem',
              textAlign: 'right',
              cursor: 'pointer',
              '&:hover': { opacity: 0.8 },
            }}
            onClick={() => onClosePosition(position.market)}
          >
            Close
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

// Open Orders Table Component
const OrdersTable = ({ orders }: { orders: Order[] }) => {
  if (orders.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          py: 4,
        }}
      >
        <Typography sx={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: '0.875rem' }}>
          No open orders
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* Table Header */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '100px 80px 80px 100px 100px 100px 120px 120px 100px',
          gap: 2,
          px: 2,
          py: 1.5,
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          position: 'sticky',
          top: 0,
          background: 'rgba(5, 12, 25, 0.95)',
          zIndex: 1,
        }}
      >
        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.4)', fontWeight: 500 }}>
          MARKET
        </Typography>
        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.4)', fontWeight: 500 }}>
          TYPE
        </Typography>
        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.4)', fontWeight: 500 }}>
          SIDE
        </Typography>
        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.4)', fontWeight: 500 }}>
          QUANTITY
        </Typography>
        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.4)', fontWeight: 500 }}>
          PRICE
        </Typography>
        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.4)', fontWeight: 500 }}>
          FILLED
        </Typography>
        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.4)', fontWeight: 500 }}>
          TOTAL
        </Typography>
        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.4)', fontWeight: 500 }}>
          TRIGGER PRICE
        </Typography>
        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.4)', fontWeight: 500, textAlign: 'right' }}>
          CANCEL
        </Typography>
      </Box>

      {/* Table Body */}
      {orders.map((order, index) => (
        <Box
          key={index}
          sx={{
            display: 'grid',
            gridTemplateColumns: '100px 80px 80px 100px 100px 100px 120px 120px 100px',
            gap: 2,
            px: 2,
            py: 1.5,
            borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
            '&:hover': {
              background: 'rgba(255, 255, 255, 0.02)',
            },
          }}
        >
          <Typography sx={{ color: '#fff', fontSize: '0.875rem', fontWeight: 500 }}>
            {order.market}
          </Typography>
          <Typography sx={{ color: '#fff', fontSize: '0.875rem' }}>
            {order.type}
          </Typography>
          <Typography
            sx={{
              color: order.side === 'Long' ? '#00FF88' : '#FF4444',
              fontSize: '0.875rem',
            }}
          >
            {order.side}
          </Typography>
          <Typography sx={{ color: '#fff', fontSize: '0.875rem' }}>
            {order.quantity}
          </Typography>
          <Typography sx={{ color: '#fff', fontSize: '0.875rem' }}>
            ${order.price.toFixed(2)}
          </Typography>
          <Typography sx={{ color: '#fff', fontSize: '0.875rem' }}>
            {order.filled}%
          </Typography>
          <Typography sx={{ color: '#fff', fontSize: '0.875rem' }}>
            ${order.total.toFixed(2)}
          </Typography>
          <Typography sx={{ color: '#fff', fontSize: '0.875rem' }}>
            {order.triggerPrice ? `$${order.triggerPrice.toFixed(2)}` : '-'}
          </Typography>
          <Typography
            sx={{
              color: '#FF4444',
              fontSize: '0.875rem',
              textAlign: 'right',
              cursor: 'pointer',
              '&:hover': { opacity: 0.8 },
            }}
          >
            Cancel
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

// Trade History Table Component
const HistoryTable = ({ tradeHistory }: { tradeHistory: TradeHistory[] }) => {
  if (tradeHistory.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          py: 4,
        }}
      >
        <Typography sx={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: '0.875rem' }}>
          No trade history
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* Table Header */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '120px 80px 100px 120px 100px 120px 150px',
          gap: 2,
          px: 2,
          py: 1.5,
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          position: 'sticky',
          top: 0,
          background: 'rgba(5, 12, 25, 0.95)',
          zIndex: 1,
        }}
      >
        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.4)', fontWeight: 500 }}>
          MARKET
        </Typography>
        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.4)', fontWeight: 500 }}>
          SIDE
        </Typography>
        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.4)', fontWeight: 500 }}>
          QUANTITY
        </Typography>
        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.4)', fontWeight: 500 }}>
          PRICE
        </Typography>
        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.4)', fontWeight: 500 }}>
          FEE
        </Typography>
        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.4)', fontWeight: 500 }}>
          REALIZED P&L
        </Typography>
        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.4)', fontWeight: 500 }}>
          TIME
        </Typography>
      </Box>

      {/* Table Body */}
      {tradeHistory.map((trade, index) => (
        <Box
          key={index}
          sx={{
            display: 'grid',
            gridTemplateColumns: '120px 80px 100px 120px 100px 120px 150px',
            gap: 2,
            px: 2,
            py: 1.5,
            borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
            '&:hover': {
              background: 'rgba(255, 255, 255, 0.02)',
            },
          }}
        >
          <Typography sx={{ color: '#fff', fontSize: '0.875rem', fontWeight: 500 }}>
            {trade.market}
          </Typography>
          <Typography
            sx={{
              color: trade.side === 'Long' ? '#00FF88' : '#FF4444',
              fontSize: '0.875rem',
            }}
          >
            {trade.side}
          </Typography>
          <Typography sx={{ color: '#fff', fontSize: '0.875rem' }}>
            {trade.quantity}
          </Typography>
          <Typography sx={{ color: '#fff', fontSize: '0.875rem' }}>
            ${trade.price.toFixed(2)}
          </Typography>
          <Typography sx={{ color: '#fff', fontSize: '0.875rem' }}>
            ${trade.fee.toFixed(4)}
          </Typography>
          <Typography
            sx={{
              color: trade.realizedPnl >= 0 ? '#00FF88' : '#FF4444',
              fontSize: '0.875rem',
            }}
          >
            ${trade.realizedPnl.toFixed(2)}
          </Typography>
          <Typography sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem' }}>
            {trade.timestamp}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

export default PositionsPanel;
