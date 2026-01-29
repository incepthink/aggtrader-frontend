'use client';

import { Box, Button } from '@mui/material';
import { useRouter } from 'next/navigation';

interface MobileActionButtonsProps {
  disabled?: boolean;
}

export default function MobileActionButtons({ disabled = false }: MobileActionButtonsProps) {
  const router = useRouter();

  const handleBuyLong = () => {
    router.push('/perp/mobile-trade?side=buy');
  };

  const handleSellShort = () => {
    router.push('/perp/mobile-trade?side=sell');
  };

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1.5,
        px: 2,
        py: 1.5,
        width: '100%',
      }}
    >
      {/* Buy / Long Button */}
      <Button
        fullWidth
        onClick={handleBuyLong}
        disabled={disabled}
        sx={{
          py: 1.5,
          fontSize: '16px',
          fontWeight: 600,
          textTransform: 'none',
          color: '#000',
          background: 'linear-gradient(135deg, #00FF88 0%, #00CC6B 100%)',
          border: '1px solid #00FF88',
          borderRadius: '24px',
          '&:hover': {
            background: 'linear-gradient(135deg, #00E67A 0%, #00B85F 100%)',
          },
          '&:disabled': {
            background: 'rgba(0, 255, 136, 0.2)',
            color: 'rgba(0, 255, 136, 0.5)',
            border: '1px solid rgba(0, 255, 136, 0.3)',
          },
        }}
      >
        Buy / Long
      </Button>

      {/* Sell / Short Button */}
      <Button
        fullWidth
        onClick={handleSellShort}
        disabled={disabled}
        sx={{
          py: 1.5,
          fontSize: '16px',
          fontWeight: 600,
          textTransform: 'none',
          color: '#fff',
          background: 'transparent',
          border: '1px solid #FF4444',
          borderRadius: '24px',
          '&:hover': {
            background: 'rgba(255, 68, 68, 0.1)',
          },
          '&:disabled': {
            color: 'rgba(255, 68, 68, 0.5)',
            border: '1px solid rgba(255, 68, 68, 0.3)',
          },
        }}
      >
        Sell / Short
      </Button>
    </Box>
  );
}
