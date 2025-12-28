'use client';

import { Box, Typography } from '@mui/material';

interface OrderSummaryProps {
  quantity: string;
  currentPrice?: number;
  leverage: number;
}

const OrderSummary = ({ quantity, currentPrice, leverage }: OrderSummaryProps) => {
  /**
   * Calculate the initial margin requirement (cost to open position)
   * Cost = (quantity * currentPrice) / leverage
   */
  const calculateCost = (): string => {
    if (!quantity || !currentPrice || !leverage || parseFloat(quantity) === 0) {
      return '- / -';
    }
    const cost = (parseFloat(quantity) * currentPrice) / leverage;
    return `$${cost.toFixed(2)}`;
  };

  /**
   * Calculate the total position value
   * Value = quantity * currentPrice
   */
  const calculateValue = (): string => {
    if (!quantity || !currentPrice || parseFloat(quantity) === 0) {
      return '- / -';
    }
    const value = parseFloat(quantity) * currentPrice;
    return `$${value.toFixed(2)}`;
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        p: 2,
        background: 'rgba(255, 255, 255, 0.02)',
        borderRadius: 1,
      }}
    >
      {/* Cost */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography
          variant="caption"
          sx={{
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: '0.75rem',
          }}
        >
          Cost
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: '#fff',
            fontSize: '0.75rem',
            fontWeight: 500,
          }}
        >
          {calculateCost()}
        </Typography>
      </Box>

      {/* Value */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography
          variant="caption"
          sx={{
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: '0.75rem',
          }}
        >
          Value
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: '#fff',
            fontSize: '0.75rem',
            fontWeight: 500,
          }}
        >
          {calculateValue()}
        </Typography>
      </Box>

      {/* Taker/Maker Fees */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography
          variant="caption"
          sx={{
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: '0.75rem',
          }}
        >
          Taker / Maker Fee
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: '#fff',
            fontSize: '0.75rem',
            fontWeight: 500,
          }}
        >
          0.03% / -0.005%
        </Typography>
      </Box>
    </Box>
  );
};

export default OrderSummary;
