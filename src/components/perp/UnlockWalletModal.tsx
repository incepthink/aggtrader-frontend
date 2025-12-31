'use client';

import {
  Dialog,
  DialogContent,
  DialogTitle,
  Box,
  Typography,
  IconButton,
  CircularProgress,
  Alert,
  Button,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { useKumaAuth } from '@/hooks/perp/useKumaAuth';
import { useState } from 'react';

interface UnlockWalletModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * Unlock Wallet Modal
 *
 * This modal handles the Kuma wallet association flow:
 * 1. If wallet is not connected, shows RainbowKit connection options
 * 2. If wallet is connected but not associated, prompts for signature
 * 3. Optionally keeps user logged in for 30 days (stores in session)
 */
const UnlockWalletModal = ({
  open,
  onClose,
  onSuccess,
}: UnlockWalletModalProps) => {
  const { isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const {
    isAssociated,
    isAssociating,
    error,
    associateWallet,
    clearError,
  } = useKumaAuth();

  const [stayLoggedIn, setStayLoggedIn] = useState(true);

  const handleConnect = async () => {
    if (!isConnected) {
      // Open RainbowKit modal
      openConnectModal?.();
    } else {
      // Wallet is connected, now associate it
      const success = await associateWallet();

      if (success) {
        // Store long-term session if enabled
        if (stayLoggedIn) {
          // Store in localStorage for 30 days
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + 30);
          localStorage.setItem('kuma_session_expiry', expiryDate.toISOString());
        }

        // Call success callback and close modal
        onSuccess?.();
        onClose();

        // Log success message for user feedback
        console.log('✅ Wallet unlocked successfully! You can now trade perpetuals.');
      }
      // If not successful, error will be displayed via the error state from useKumaAuth
    }
  };

  const handleClose = () => {
    clearError();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          background: 'linear-gradient(135deg, rgba(15, 25, 45, 0.98), rgba(5, 12, 25, 0.98))',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(0, 245, 224, 0.1)',
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0, 245, 224, 0.15)',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          pb: 2,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            color: '#fff',
            fontWeight: 600,
          }}
        >
          Unlock Wallet
        </Typography>
        <IconButton
          onClick={handleClose}
          sx={{
            color: 'rgba(255, 255, 255, 0.7)',
            '&:hover': {
              color: '#fff',
              background: 'rgba(255, 255, 255, 0.05)',
            },
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {/* Error Display */}
        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 3,
              background: 'rgba(211, 47, 47, 0.1)',
              border: '1px solid rgba(211, 47, 47, 0.3)',
              color: '#ff6b6b',
              '& .MuiAlert-icon': {
                color: '#ff6b6b',
              },
            }}
            onClose={clearError}
          >
            {error}
          </Alert>
        )}

        {/* Info Message */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="body2"
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              textAlign: 'center',
              mb: 2,
            }}
          >
            {!isConnected
              ? 'Connect your wallet to start trading on Kuma'
              : 'Sign a message to unlock your wallet for trading'}
          </Typography>
        </Box>

        {/* Main Action Button */}
        <Button
          fullWidth
          variant="contained"
          onClick={handleConnect}
          disabled={isAssociating}
          sx={{
            py: 1.5,
            mb: 2,
            background: 'linear-gradient(90deg, #00F5E0 0%, #00C9B8 100%)',
            color: '#050C19',
            fontWeight: 600,
            fontSize: '1rem',
            textTransform: 'none',
            borderRadius: 1.5,
            '&:hover': {
              background: 'linear-gradient(90deg, #00E5D0 0%, #00B9A8 100%)',
              boxShadow: '0 4px 20px rgba(0, 245, 224, 0.4)',
            },
            '&:disabled': {
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'rgba(255, 255, 255, 0.3)',
            },
          }}
        >
          {isAssociating ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={20} sx={{ color: '#050C19' }} />
              <span>Waiting for signature...</span>
            </Box>
          ) : !isConnected ? (
            'Connect Wallet'
          ) : (
            'Sign to Unlock'
          )}
        </Button>

        {/* Stay Logged In Checkbox */}
        <FormControlLabel
          control={
            <Checkbox
              checked={stayLoggedIn}
              onChange={(e) => setStayLoggedIn(e.target.checked)}
              sx={{
                color: 'rgba(0, 245, 224, 0.5)',
                '&.Mui-checked': {
                  color: '#00F5E0',
                },
              }}
            />
          }
          label={
            <Typography
              variant="body2"
              sx={{
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '0.875rem',
              }}
            >
              Stay logged in for 30 days
            </Typography>
          }
          sx={{ mb: 2 }}
        />

        {/* Security Notice */}
        <Box
          sx={{
            p: 2,
            background: 'rgba(0, 245, 224, 0.05)',
            border: '1px solid rgba(0, 245, 224, 0.15)',
            borderRadius: 1.5,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: 'rgba(255, 255, 255, 0.5)',
              display: 'block',
              lineHeight: 1.6,
            }}
          >
            By connecting your wallet, you agree to Kuma's Terms of Service.
            Your wallet will be associated with your trading account via a
            secure signature.
          </Typography>
        </Box>

        {/* Connection Hint */}
        {!isConnected && (
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              textAlign: 'center',
              color: 'rgba(255, 255, 255, 0.4)',
              mt: 2,
            }}
          >
            Supported wallets: MetaMask, WalletConnect, Coinbase Wallet, and more
          </Typography>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UnlockWalletModal;
