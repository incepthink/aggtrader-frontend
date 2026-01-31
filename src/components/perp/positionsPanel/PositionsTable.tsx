'use client';

import { Box, Typography, Tooltip, IconButton, CircularProgress } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CloseIcon from '@mui/icons-material/Close';
import {
  KatanaPerpsPosition,
  calculateUnrealizedPnLPercentage,
  isLongPosition,
  formatPositionQuantity,
} from '@/hooks/perp/useKatanaPerpsPositions';
import { tableStyles } from './tableStyles';

interface PositionsTableProps {
  positions: KatanaPerpsPosition[];
  isLoading: boolean;
  error: Error | null;
  onClosePosition: (position: KatanaPerpsPosition) => void;
  onRefresh: () => void;
  closingMarket: string | null;
  closeError: string | null;
  onClearError: () => void;
}

export const PositionsTable = ({
  positions,
  isLoading,
  error,
  onClosePosition,
  onRefresh,
  closingMarket,
  closeError,
  onClearError,
}: PositionsTableProps) => {
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
      {/* Close Error Banner */}
      {closeError && (
        <Box
          sx={{
            px: 2,
            py: 1,
            bgcolor: 'rgba(255, 68, 68, 0.1)',
            borderBottom: '1px solid rgba(255, 68, 68, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography sx={{ color: '#FF4444', fontSize: '0.75rem' }}>
            {closeError}
          </Typography>
          <IconButton
            size="small"
            onClick={onClearError}
            sx={{ color: '#FF4444', p: 0.5 }}
          >
            <CloseIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </Box>
      )}
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
                    <Tooltip title={closingMarket === position.market ? 'Closing...' : 'Close Position'}>
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => onClosePosition(position)}
                          disabled={closingMarket !== null}
                          sx={{
                            color: closingMarket === position.market ? '#00F5E0' : 'rgba(255, 255, 255, 0.5)',
                            '&:hover': {
                              color: '#FF4444',
                              bgcolor: 'rgba(255, 68, 68, 0.1)',
                            },
                            '&.Mui-disabled': {
                              color: 'rgba(255, 255, 255, 0.2)',
                            },
                          }}
                        >
                          {closingMarket === position.market ? (
                            <CircularProgress size={14} sx={{ color: '#00F5E0' }} />
                          ) : (
                            <CloseIcon sx={{ fontSize: 16 }} />
                          )}
                        </IconButton>
                      </span>
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
