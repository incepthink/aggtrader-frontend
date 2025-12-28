'use client';

import { Box, FormControlLabel, Checkbox, Divider } from '@mui/material';
import { usePerpStore } from '@/store/perpStore';
import OrderTypeTabs from './OrderTypeTabs';
import LeverageSelector from './LeverageSelector';
import LeverageModal from './LeverageModal';
import QuantityInput from './QuantityInput';
import OrderSideButtons from './OrderSideButtons';
import OrderSummary from './OrderSummary';

interface OrderFormProps {
  market: string;
  currentPrice?: number;
}

const OrderForm = ({ market, currentPrice }: OrderFormProps) => {
  const quantity = usePerpStore((s) => s.quantity);
  const leverage = usePerpStore((s) => s.leverage);
  const reduceOnly = usePerpStore((s) => s.reduceOnly);
  const tpSlEnabled = usePerpStore((s) => s.tpSlEnabled);
  const freeCollateral = usePerpStore((s) => s.freeCollateral);
  const setReduceOnly = usePerpStore((s) => s.setReduceOnly);
  const setTpSlEnabled = usePerpStore((s) => s.setTpSlEnabled);

  // Placeholder handlers for buy/sell actions
  // TODO: Connect to useCreateOrder hook
  const handleBuy = () => {
    console.log('Buy order initiated:', {
      market,
      side: 'buy',
      quantity,
      leverage,
      currentPrice,
      reduceOnly,
    });
  };

  const handleSell = () => {
    console.log('Sell order initiated:', {
      market,
      side: 'sell',
      quantity,
      leverage,
      currentPrice,
      reduceOnly,
    });
  };

  // Disable order buttons if quantity is empty or zero
  const isOrderDisabled = !quantity || parseFloat(quantity) === 0;

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        p: 2,
        gap: 2,
      }}
    >
      {/* Order Type Tabs */}
      <OrderTypeTabs />

      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />

      {/* Leverage Selector */}
      <LeverageSelector />

      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />

      {/* Quantity Input Section */}
      <QuantityInput
        market={market}
        freeCollateral={freeCollateral}
        currentPrice={currentPrice}
        leverage={leverage}
      />

      {/* Advanced Options */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={reduceOnly}
              onChange={(e) => setReduceOnly(e.target.checked)}
              sx={{
                color: 'rgba(255, 255, 255, 0.3)',
                '&.Mui-checked': {
                  color: '#00F5E0',
                },
                '& .MuiSvgIcon-root': {
                  fontSize: 20,
                },
              }}
            />
          }
          label="Reduce-Only"
          sx={{
            '& .MuiFormControlLabel-label': {
              fontSize: '0.875rem',
              color: 'rgba(255, 255, 255, 0.7)',
            },
          }}
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={tpSlEnabled}
              onChange={(e) => setTpSlEnabled(e.target.checked)}
              disabled // Disabled until TP/SL implementation
              sx={{
                color: 'rgba(255, 255, 255, 0.3)',
                '&.Mui-checked': {
                  color: '#00F5E0',
                },
                '&.Mui-disabled': {
                  color: 'rgba(255, 255, 255, 0.2)',
                },
                '& .MuiSvgIcon-root': {
                  fontSize: 20,
                },
              }}
            />
          }
          label="TP/SL"
          sx={{
            '& .MuiFormControlLabel-label': {
              fontSize: '0.875rem',
              color: 'rgba(255, 255, 255, 0.4)',
            },
          }}
        />
      </Box>

      {/* Order Side Buttons */}
      <OrderSideButtons onBuy={handleBuy} onSell={handleSell} disabled={isOrderDisabled} />

      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />

      {/* Order Summary */}
      <OrderSummary quantity={quantity} currentPrice={currentPrice} leverage={leverage} />

      {/* Leverage Modal */}
      <LeverageModal />
    </Box>
  );
};

export default OrderForm;
