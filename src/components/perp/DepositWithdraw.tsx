'use client';

import { Box, Typography, Button, Tooltip } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { KumaAccountBalance } from '@/hooks/perp/useKumaAuth';

interface DepositWithdrawProps {
  accountBalance?: KumaAccountBalance | null;
  isLoading?: boolean;
  onDeposit?: () => void;
  onWithdraw?: () => void;
}

const LoadingSpinner = () => (
  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
);

const DepositWithdraw = ({
  accountBalance,
  isLoading = false,
  onDeposit,
  onWithdraw,
}: DepositWithdrawProps) => {
  const showLoading = isLoading && !accountBalance;
  const handleDeposit = () => {
    if (onDeposit) {
      onDeposit();
    } else {
      // Placeholder for deposit functionality
      console.log('Deposit clicked');
    }
  };

  const handleWithdraw = () => {
    if (onWithdraw) {
      onWithdraw();
    } else {
      // Placeholder for withdraw functionality
      console.log('Withdraw clicked');
    }
  };

  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return `$${numValue.toFixed(2)}`;
  };

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
      {/* Balance Information */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {/* Balance */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography
              sx={{
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '0.875rem',
              }}
            >
              Balance
            </Typography>
            <Tooltip title="Total account equity including all positions and unrealized P&L">
              <InfoOutlinedIcon
                sx={{
                  fontSize: 14,
                  color: 'rgba(255, 255, 255, 0.4)',
                  cursor: 'help',
                }}
              />
            </Tooltip>
          </Box>
          <Typography
            sx={{
              color: '#fff',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            {showLoading ? <LoadingSpinner /> : accountBalance ? formatCurrency(accountBalance.equity) : '$0.00'}
          </Typography>
        </Box>

        {/* Free Collateral */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography
              sx={{
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '0.875rem',
              }}
            >
              Free Collateral
            </Typography>
            <Tooltip title="Collateral available for new positions after accounting for existing positions">
              <InfoOutlinedIcon
                sx={{
                  fontSize: 14,
                  color: 'rgba(255, 255, 255, 0.4)',
                  cursor: 'help',
                }}
              />
            </Tooltip>
          </Box>
          <Typography
            sx={{
              color: '#fff',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            {showLoading ? <LoadingSpinner /> : accountBalance ? formatCurrency(accountBalance.freeCollateral) : '$0.00'}
          </Typography>
        </Box>

        {/* Available Collateral */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography
              sx={{
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '0.875rem',
              }}
            >
              Available Collateral
            </Typography>
            <Tooltip title="Total collateral available for trading and withdrawals">
              <InfoOutlinedIcon
                sx={{
                  fontSize: 14,
                  color: 'rgba(255, 255, 255, 0.4)',
                  cursor: 'help',
                }}
              />
            </Tooltip>
          </Box>
          <Typography
            sx={{
              color: '#fff',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            {showLoading ? <LoadingSpinner /> : accountBalance ? formatCurrency(accountBalance.availableCollateral) : '$0.00'}
          </Typography>
        </Box>

        {/* Unrealized P&L */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography
            sx={{
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '0.875rem',
            }}
          >
            Unrealized P&L
          </Typography>
          <Typography
            sx={{
              color:
                accountBalance && parseFloat(accountBalance.unrealizedPnL) > 0
                  ? '#00FF88'
                  : accountBalance && parseFloat(accountBalance.unrealizedPnL) < 0
                  ? '#FF4444'
                  : '#fff',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            {showLoading ? <LoadingSpinner /> : accountBalance ? formatCurrency(accountBalance.unrealizedPnL) : '$0.00'}
          </Typography>
        </Box>
      </Box>

      {/* Separator Line */}
      <Box
        sx={{
          height: '1px',
          background: 'rgba(255, 255, 255, 0.1)',
          my: 1,
        }}
      />

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {/* Deposit Button */}
        <Button
          onClick={handleDeposit}
          sx={{
            width: '100%',
            py: 1.5,
            background: 'transparent',
            border: '1px solid #00F5E0',
            color: '#fff',
            fontSize: '0.875rem',
            fontWeight: 600,
            textTransform: 'none',
            borderRadius: '4px',
            '&:hover': {
              background: 'rgba(0, 245, 224, 0.1)',
              border: '1px solid #00F5E0',
            },
          }}
        >
          Deposit
        </Button>

        {/* Withdraw Button */}
        <Button
          onClick={handleWithdraw}
          sx={{
            width: '100%',
            py: 1.5,
            background: 'transparent',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            color: '#fff',
            fontSize: '0.875rem',
            fontWeight: 600,
            textTransform: 'none',
            borderRadius: '4px',
            '&:hover': {
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.5)',
            },
          }}
        >
          Withdraw
        </Button>
      </Box>
    </Box>
  );
};

export default DepositWithdraw;
