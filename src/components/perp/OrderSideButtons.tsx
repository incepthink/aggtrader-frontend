'use client';

import { Stack, Button, CircularProgress } from '@mui/material';
import { usePerpStore } from '@/store/perpStore';

interface OrderSideButtonsProps {
  onBuy: () => void;
  onSell: () => void;
  disabled?: boolean;
  loading?: boolean;
}

const OrderSideButtons = ({ onBuy, onSell, disabled = false, loading = false }: OrderSideButtonsProps) => {
  const setOrderSide = usePerpStore((s) => s.setOrderSide);

  const handleBuyClick = () => {
    setOrderSide('buy');
    onBuy();
  };

  const handleSellClick = () => {
    setOrderSide('sell');
    onSell();
  };

  return (
    <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
      {/* Buy / Long Button */}
      <Button
        fullWidth
        onClick={handleBuyClick}
        disabled={disabled}
        sx={{
          py: 2,
          fontSize: '16px',
          fontWeight: 600,
          textTransform: 'none',
          background: 'linear-gradient(135deg, #00FF88 0%, #00CC6B 100%)',
          color: '#000',
          border: 'none',
          borderRadius: 1,
          '&:hover': {
            background: 'linear-gradient(135deg, #00CC6B 0%, #00AA55 100%)',
          },
          '&:disabled': {
            background: 'rgba(0, 255, 136, 0.3)',
            color: 'rgba(0, 0, 0, 0.5)',
          },
        }}
      >
        {loading ? (
          <CircularProgress size={20} sx={{ color: '#000' }} />
        ) : (
          'Buy / Long'
        )}
      </Button>

      {/* Sell / Short Button */}
      <Button
        fullWidth
        onClick={handleSellClick}
        disabled={disabled}
        sx={{
          py: 2,
          fontSize: '16px',
          fontWeight: 600,
          textTransform: 'none',
          background: 'linear-gradient(135deg, #FF4444 0%, #CC0000 100%)',
          color: '#fff',
          border: 'none',
          borderRadius: 1,
          '&:hover': {
            background: 'linear-gradient(135deg, #CC0000 0%, #AA0000 100%)',
          },
          '&:disabled': {
            background: 'rgba(255, 68, 68, 0.3)',
            color: 'rgba(255, 255, 255, 0.5)',
          },
        }}
      >
        {loading ? (
          <CircularProgress size={20} sx={{ color: '#fff' }} />
        ) : (
          'Sell / Short'
        )}
      </Button>
    </Stack>
  );
};

export default OrderSideButtons;
