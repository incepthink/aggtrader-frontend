'use client';

import { Box, Typography } from '@mui/material';
import { MarketCalcOutput, formatDualDisplay, formatUsdValue, formatFeeRate } from '@/utils/perp/marketCalc';

interface OrderSummaryProps {
  marketMetrics: MarketCalcOutput;
  takerFeeRate?: string;
  makerFeeRate?: string;
}

const OrderSummary = ({ marketMetrics, takerFeeRate, makerFeeRate }: OrderSummaryProps) => {
  /**
   * Format cost display (buy / sell)
   * Both modes use orderbook-based buy/sell metrics
   */
  const displayCost = (): string => {
    return formatDualDisplay(
      marketMetrics.buyCostUsd,
      marketMetrics.sellCostUsd,
      formatUsdValue
    );
  };

  /**
   * Format value display (buy / sell)
   * Both modes use orderbook-based buy/sell metrics
   */
  const displayValue = (): string => {
    return formatDualDisplay(
      marketMetrics.buyValueUsd,
      marketMetrics.sellValueUsd,
      formatUsdValue
    );
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
          {displayCost()}
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
          {displayValue()}
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
          {formatFeeRate(takerFeeRate || '0')} / {formatFeeRate(makerFeeRate || '0')}
        </Typography>
      </Box>
    </Box>
  );
};

export default OrderSummary;
