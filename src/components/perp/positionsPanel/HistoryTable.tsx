'use client';

import { Box, Typography, CircularProgress } from '@mui/material';
import { useKatanaPerpsFills, KatanaPerpsFill, formatFillForDisplay } from '@/hooks/perp/useKatanaPerpsFills';
import { tableStyles } from './tableStyles';

interface HistoryTableProps {
  hideOtherMarkets?: boolean;
  selectedMarket?: string;
}

const columns = [
  { key: 'date', label: 'DATE' },
  { key: 'market', label: 'MARKET' },
  { key: 'side', label: 'SIDE' },
  { key: 'price', label: 'PRICE' },
  { key: 'quantity', label: 'QUANTITY' },
  { key: 'value', label: 'VALUE' },
  { key: 'fee', label: 'TRADE FEE' },
  { key: 'type', label: 'TYPE' },
  { key: 'liquidity', label: 'LIQUIDITY' },
  { key: 'realizedPnL', label: 'REALIZED P&L' },
  { key: 'status', label: 'STATUS' },
];

export const HistoryTable = ({ hideOtherMarkets, selectedMarket }: HistoryTableProps) => {
  const { data: fills = [], isLoading, isError, error } = useKatanaPerpsFills({
    market: hideOtherMarkets ? selectedMarket : undefined,
    limit: 100,
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
        <CircularProgress size={32} sx={{ color: '#00F5E0' }} />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box sx={{ py: 4, px: 2, textAlign: 'center' }}>
        <Typography sx={{ color: '#FF4444', fontSize: '0.875rem' }}>
          {(error as Error)?.message || 'Failed to load trade history'}
        </Typography>
      </Box>
    );
  }

  if (fills.length === 0) {
    return (
      <Box sx={{ py: 8, textAlign: 'center' }}>
        <Typography sx={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: '0.875rem' }}>
          No trade history
        </Typography>
      </Box>
    );
  }

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <table style={tableStyles.table}>
        <thead>
          <tr style={{ background: 'rgba(5, 12, 25, 0.95)' }}>
            {columns.map((col) => (
              <th key={col.key} style={tableStyles.th}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {fills.map((fill) => (
            <HistoryRow key={fill.fillId} fill={fill} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

interface HistoryRowProps {
  fill: KatanaPerpsFill;
}

const HistoryRow = ({ fill }: HistoryRowProps) => {
  const formatted = formatFillForDisplay(fill);
  const isBuy = fill.side === 'buy';
  const sideColor = isBuy ? '#00FF88' : '#FF4444';
  const pnlColor = formatted.realizedPnL >= 0 ? '#00FF88' : '#FF4444';

  return (
    <tr
      style={tableStyles.tr}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)')}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
    >
      {/* Date */}
      <td style={tableStyles.td}>{formatted.date}</td>

      {/* Market */}
      <td style={tableStyles.td}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: '#F7931A',
            }}
          />
          {fill.market}
        </Box>
      </td>

      {/* Side */}
      <td style={{ ...tableStyles.td, color: sideColor, fontWeight: 500 }}>
        {isBuy ? 'Buy' : 'Sell'}
      </td>

      {/* Price */}
      <td style={{ ...tableStyles.td, fontFamily: 'monospace' }}>{formatted.price}</td>

      {/* Quantity */}
      <td style={{ ...tableStyles.td, fontFamily: 'monospace' }}>{formatted.quantity}</td>

      {/* Value */}
      <td style={tableStyles.td}>{formatted.value}</td>

      {/* Trade Fee */}
      <td style={tableStyles.td}>{formatted.fee}</td>

      {/* Type */}
      <td style={tableStyles.td}>{formatted.type}</td>

      {/* Liquidity */}
      <td style={tableStyles.td}>{formatted.liquidity}</td>

      {/* Realized P&L */}
      <td style={{ ...tableStyles.td, color: pnlColor, fontWeight: 500 }}>
        {formatted.realizedPnLFormatted}
      </td>

      {/* Status */}
      <td style={tableStyles.td}>
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            px: 1.5,
            py: 0.5,
            borderRadius: '4px',
            backgroundColor:
              fill.txStatus === 'mined'
                ? 'rgba(0, 255, 136, 0.1)'
                : fill.txStatus === 'pending'
                  ? 'rgba(255, 193, 7, 0.1)'
                  : 'rgba(255, 68, 68, 0.1)',
            color:
              fill.txStatus === 'mined'
                ? '#00FF88'
                : fill.txStatus === 'pending'
                  ? '#FFC107'
                  : '#FF4444',
            fontSize: '0.75rem',
            fontWeight: 500,
          }}
        >
          {formatted.statusFormatted}
        </Box>
      </td>
    </tr>
  );
};
