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
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { useKatanaPerpsAuth } from '@/hooks/perp/useKumaAuth';
import { useState, useRef } from 'react';
import { createSessionKey } from '@/utils/perp/sessionKeyStorage';

const KATANA_CHAIN_ID = 747474;

interface UnlockWalletModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * Unlock Wallet Modal
 *
 * This modal handles the Katana Perps wallet association flow:
 * 1. If wallet is not connected, shows RainbowKit connection options
 * 2. If wallet is connected but on wrong chain, triggers chain switch to Katana
 * 3. If wallet is connected on correct chain, prompts for signature
 * 4. Optionally keeps user logged in for 30 days (stores in session)
 */
const UnlockWalletModal = ({
  open,
  onClose,
  onSuccess,
}: UnlockWalletModalProps) => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { openConnectModal } = useConnectModal();
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain();
  const {
    isAssociated,
    isAssociating,
    error,
    associateWallet,
    clearError,
  } = useKatanaPerpsAuth();

  const [stayLoggedIn, setStayLoggedIn] = useState(true);
  const [chainSwitchError, setChainSwitchError] = useState<string | null>(null);
  const stayLoggedInRef = useRef(stayLoggedIn);
  stayLoggedInRef.current = stayLoggedIn;

  const isOnKatana = chainId === KATANA_CHAIN_ID;
  const needsChainSwitch = isConnected && !isOnKatana;

  const handleConnect = async () => {
    // Clear any previous chain switch error
    setChainSwitchError(null);

    if (!isConnected) {
      // Step 1: Open RainbowKit modal to connect wallet
      openConnectModal?.();
    } else if (needsChainSwitch) {
      // Step 2: Switch to Katana network
      try {
        switchChain(
          { chainId: KATANA_CHAIN_ID },
          {
            onError: (err) => {
              console.error('Failed to switch chain:', err);
              setChainSwitchError(err.message || 'Failed to switch network');
            },
          }
        );
      } catch (err: any) {
        console.error('Failed to switch chain:', err);
        setChainSwitchError(err.message || 'Failed to switch network');
      }
    } else {
      // Step 3: Wallet is connected and on correct chain, associate it
      const success = await associateWallet();

      if (success && address) {
        // Store session key in localStorage if "stay logged in" is enabled
        if (stayLoggedInRef.current) {
          // Create session key for 30 days
          const sessionSignature = `session_${Date.now()}_${address.slice(2, 10)}`;
          createSessionKey(address, sessionSignature, 30);
          console.log('Session key created for 30 days');
        } else {
          // Create session key for 1 day (browser session equivalent)
          const sessionSignature = `session_${Date.now()}_${address.slice(2, 10)}`;
          createSessionKey(address, sessionSignature, 1);
          console.log('Session key created for 1 day');
        }

        // Call success callback and close modal
        onSuccess?.();
        onClose();

        // Log success message for user feedback
        console.log('Wallet unlocked successfully! You can now trade perpetuals.');
      }
      // If not successful, error will be displayed via the error state from useKumaAuth
    }
  };

  const displayError = error || chainSwitchError;

  const handleClose = () => {
    clearError();
    setChainSwitchError(null);
    onClose();
  };

  // Determine button state
  const isLoading = isAssociating || isSwitchingChain;
  const getButtonText = () => {
    if (isSwitchingChain) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CircularProgress size={20} sx={{ color: '#050C19' }} />
          <span>Switching network...</span>
        </Box>
      );
    }
    if (isAssociating) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CircularProgress size={20} sx={{ color: '#050C19' }} />
          <span>Waiting for signature...</span>
        </Box>
      );
    }
    if (!isConnected) {
      return 'Connect Wallet';
    }
    if (needsChainSwitch) {
      return 'Switch to Katana Network';
    }
    return 'Sign to Unlock';
  };

  const getInfoMessage = () => {
    if (!isConnected) {
      return 'Connect your wallet to start trading on Katana Perps';
    }
    if (needsChainSwitch) {
      return 'Switch to Katana network to continue';
    }
    return 'Sign a message to unlock your wallet for trading';
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
        {displayError && (
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
            onClose={() => {
              clearError();
              setChainSwitchError(null);
            }}
          >
            {displayError}
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
            {getInfoMessage()}
          </Typography>
        </Box>

        {/* Main Action Button */}
        <Button
          fullWidth
          variant="contained"
          onClick={handleConnect}
          disabled={isLoading}
          sx={{
            py: 1.5,
            mb: 2,
            background: needsChainSwitch
              ? 'linear-gradient(90deg, #FFA500 0%, #FF8C00 100%)'
              : 'linear-gradient(90deg, #00F5E0 0%, #00C9B8 100%)',
            color: '#050C19',
            fontWeight: 600,
            fontSize: '1rem',
            textTransform: 'none',
            borderRadius: 1.5,
            '&:hover': {
              background: needsChainSwitch
                ? 'linear-gradient(90deg, #FFB520 0%, #FF9C10 100%)'
                : 'linear-gradient(90deg, #00E5D0 0%, #00B9A8 100%)',
              boxShadow: needsChainSwitch
                ? '0 4px 20px rgba(255, 165, 0, 0.4)'
                : '0 4px 20px rgba(0, 245, 224, 0.4)',
            },
            '&:disabled': {
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'rgba(255, 255, 255, 0.3)',
            },
          }}
        >
          {getButtonText()}
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
            By connecting your wallet, you agree to Katana Perps Terms of Service.
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
