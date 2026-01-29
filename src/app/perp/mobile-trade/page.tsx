'use client';

import { Suspense } from 'react';
import { Box, Button, Typography, CircularProgress } from '@mui/material';
import { useRouter, useSearchParams } from 'next/navigation';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

function MobileTradeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const side = searchParams.get('side') || 'buy';

  const handleBack = () => {
    router.back();
  };

  return (
    <Box
      sx={{
        width: '100%',
        minHeight: '100vh',
        backgroundColor: '#050C19',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header with Back Button */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          px: 2,
          py: 2,
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <Button
          onClick={handleBack}
          startIcon={<ArrowBackIcon />}
          sx={{
            color: '#fff',
            textTransform: 'none',
            fontSize: '1rem',
            fontWeight: 500,
            px: 2,
            py: 1,
            borderRadius: '8px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            },
          }}
        >
          Back
        </Button>
        <Typography
          sx={{
            color: '#fff',
            fontSize: '1.125rem',
            fontWeight: 600,
          }}
        >
          {side === 'buy' ? 'Buy / Long' : 'Sell / Short'}
        </Typography>
      </Box>

      {/* Content placeholder */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 4,
        }}
      >
        <Typography sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
          Trade form will be added here
        </Typography>
      </Box>
    </Box>
  );
}

function LoadingFallback() {
  return (
    <Box
      sx={{
        width: '100%',
        minHeight: '100vh',
        backgroundColor: '#050C19',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <CircularProgress sx={{ color: '#00F5E0' }} />
    </Box>
  );
}

export default function MobileTradePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <MobileTradeContent />
    </Suspense>
  );
}
