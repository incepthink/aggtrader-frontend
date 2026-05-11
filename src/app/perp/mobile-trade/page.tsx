'use client';

import { Suspense, useState } from 'react';
import { Box, Button, Typography, CircularProgress, Collapse } from '@mui/material';
import { useRouter } from 'next/navigation';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import OrderbookTrades from '@/components/perp/OrderbookTrades';
import OrderForm from '@/components/perp/orderForm/OrderForm';
import DepositWithdraw from '@/components/perp/DepositWithdraw';
import { KumaAuthWrapper } from '@/components/perp/KumaAuthWrapper';
import { MobileBottomNavbar, MobilePositionsPanel } from '@/components/perp/mobile';
import { useKumaBalance } from '@/hooks/perp/useKumaBalance';
import { useKumaWebSocket } from '@/hooks/perp/useWebsocketClient';
import { usePerpStore } from '@/store/perpStore';

function MobileTradeContent() {
  const router = useRouter();
  const selectedMarket = usePerpStore((s) => s.selectedMarket) || 'BTC-USD';
  const { balance: accountBalance, isLoading: isBalanceLoading } = useKumaBalance();
  useKumaWebSocket(selectedMarket);
  const [collateralOpen, setCollateralOpen] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const formatCurrency = (value: string | number | undefined) => {
    if (value === undefined || value === null) return '$0.00';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (Number.isNaN(num)) return '$0.00';
    return `$${num.toFixed(2)}`;
  };

  return (
    <>
      <KumaAuthWrapper />
      <Box
        sx={{
          width: '100%',
          minHeight: '100dvh',
          backgroundColor: '#050C19',
          display: 'flex',
          flexDirection: 'column',
          pb: '60px',
        }}
      >
        {/* Back Button */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            px: 1.5,
            py: 1,
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <Button
            onClick={handleBack}
            startIcon={<ArrowBackIcon sx={{ fontSize: 18 }} />}
            sx={{
              color: '#fff',
              textTransform: 'none',
              fontSize: '0.875rem',
              fontWeight: 500,
              px: 1.5,
              py: 0.5,
              minWidth: 0,
              borderRadius: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.08)' },
            }}
          >
            Back
          </Button>
        </Box>

        {/* Available Collateral dropdown */}
        <Box
          onClick={() => setCollateralOpen((v) => !v)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2,
            py: 1.25,
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            cursor: 'pointer',
            userSelect: 'none',
            '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.02)' },
          }}
        >
          <Typography
            sx={{
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '0.8125rem',
            }}
          >
            Available Collateral
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography sx={{ color: '#fff', fontSize: '0.875rem', fontWeight: 500 }}>
              {isBalanceLoading && !accountBalance
                ? '—'
                : formatCurrency(accountBalance?.availableCollateral)}
            </Typography>
            <KeyboardArrowDownIcon
              sx={{
                color: 'rgba(255, 255, 255, 0.5)',
                fontSize: 18,
                transform: collateralOpen ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s ease',
              }}
            />
          </Box>
        </Box>

        <Collapse in={collateralOpen} unmountOnExit>
          <Box
            sx={{
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
            }}
          >
            <DepositWithdraw
              accountBalance={accountBalance}
              isLoading={isBalanceLoading}
              buttonLayout="row"
            />
          </Box>
        </Collapse>

        {/* Two-column trading area: Orderbook | OrderForm */}
        <Box
          sx={{
            display: 'flex',
            gap: 0.5,
            px: 0.5,
            py: 0.5,
            minHeight: '520px',
          }}
        >
          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <OrderbookTrades
              market={selectedMarket}
              hideTabBar
              controlledTab={0}
            />
          </Box>
          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <OrderForm market={selectedMarket} />
          </Box>
        </Box>

        {/* Positions / Open Orders / Trade History */}
        <Box sx={{ flexShrink: 0, px: 1.5, py: 1 }}>
          <MobilePositionsPanel />
        </Box>

        {/* Mobile Bottom Navbar */}
        <MobileBottomNavbar />
      </Box>
    </>
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
