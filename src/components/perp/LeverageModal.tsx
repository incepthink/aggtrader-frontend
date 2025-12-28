'use client';

import { Typography, Slider, Stack, Button } from '@mui/material';
import GenericModal from '@/components/common/ui/GenericModal';
import { usePerpStore } from '@/store/perpStore';

const LeverageModal = () => {
  const leverageModalOpen = usePerpStore((s) => s.leverageModalOpen);
  const closeLeverageModal = usePerpStore((s) => s.closeLeverageModal);
  const leverage = usePerpStore((s) => s.leverage);
  const setLeverage = usePerpStore((s) => s.setLeverage);
  const selectedMarket = usePerpStore((s) => s.selectedMarket);

  const handleLeverageChange = (_event: Event, newValue: number | number[]) => {
    setLeverage(newValue as number);
  };

  const handleQuickSelect = (value: number) => {
    setLeverage(value);
  };

  const quickSelectValues = [1, 15, 25, 40, 50];

  return (
    <GenericModal
      isOpen={leverageModalOpen}
      onClose={closeLeverageModal}
      title={`${selectedMarket} Leverage`}
      size="sm"
    >
      {/* Warning Text */}
      <Typography
        sx={{
          color: '#FFA500',
          fontSize: '0.875rem',
          mb: 3,
          textAlign: 'center',
        }}
      >
        Higher leverage increases the risk of liquidation.
      </Typography>

      {/* Current Leverage Display */}
      <Typography
        variant="h4"
        sx={{
          textAlign: 'center',
          mb: 3,
          color: '#00F5E0',
          fontWeight: 600,
        }}
      >
        {leverage}x
      </Typography>

      {/* Slider */}
      <Slider
        value={leverage}
        onChange={handleLeverageChange}
        min={1}
        max={50}
        step={1}
        marks={[
          { value: 1, label: '1x' },
          { value: 25, label: '25x' },
          { value: 50, label: '50x' },
        ]}
        sx={{
          color: '#00F5E0',
          '& .MuiSlider-track': {
            background: 'linear-gradient(90deg, #00F5E0 0%, #FF6B35 100%)',
            border: 'none',
          },
          '& .MuiSlider-rail': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
          },
          '& .MuiSlider-thumb': {
            backgroundColor: '#00F5E0',
            border: '2px solid #fff',
            width: 16,
            height: 16,
            '&:hover, &.Mui-focusVisible': {
              boxShadow: '0 0 0 8px rgba(0, 245, 224, 0.16)',
            },
          },
          '& .MuiSlider-mark': {
            backgroundColor: 'rgba(255, 255, 255, 0.3)',
            width: 2,
            height: 8,
          },
          '& .MuiSlider-markLabel': {
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: '0.75rem',
          },
        }}
      />

      {/* Quick Select Buttons */}
      <Stack direction="row" spacing={1} sx={{ mt: 4 }}>
        {quickSelectValues.map((value) => (
          <Button
            key={value}
            onClick={() => handleQuickSelect(value)}
            variant={leverage === value ? 'contained' : 'outlined'}
            size="small"
            sx={{
              flex: 1,
              fontSize: '0.875rem',
              fontWeight: 500,
              textTransform: 'none',
              ...(leverage === value
                ? {
                    backgroundColor: '#00F5E0',
                    color: '#000',
                    '&:hover': {
                      backgroundColor: '#00D4C0',
                    },
                  }
                : {
                    color: '#00F5E0',
                    borderColor: '#00F5E0',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 245, 224, 0.1)',
                      borderColor: '#00F5E0',
                    },
                  }),
            }}
          >
            {value}x
          </Button>
        ))}
      </Stack>

      {/* Confirm Button */}
      <Button
        fullWidth
        onClick={closeLeverageModal}
        sx={{
          mt: 3,
          py: 1.5,
          fontSize: '1rem',
          fontWeight: 600,
          textTransform: 'none',
          background: '#00F5E0',
          color: '#000',
          '&:hover': {
            background: '#00D4C0',
          },
        }}
      >
        Confirm
      </Button>
    </GenericModal>
  );
};

export default LeverageModal;
