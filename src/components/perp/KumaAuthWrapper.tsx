'use client';

import { useEffect, useRef, useState } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { useKatanaPerpsAuth } from '@/hooks/perp/useKumaAuth';
import { usePerpBalanceStore } from '@/store/perpBalanceStore';
import UnlockWalletModal from './UnlockWalletModal';

const KATANA_CHAIN_ID = 747474;

/**
 * Automatically triggers Katana Perps wallet association when user visits /perp page
 * Works for both scenarios:
 * 1. User already connected wallet on Katana pages -> shows unlock modal on /perp visit
 * 2. User connects wallet while on /perp page -> shows unlock modal after connection
 *
 * IMPORTANT: Only shows modal after user is confirmed to be on Katana network
 */
export const KatanaPerpsAuthWrapper = () => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { isAssociating } = useKatanaPerpsAuth();
  const isAssociated = usePerpBalanceStore((state) => state.isAssociated);
  const [attemptedAddress, setAttemptedAddress] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const wasAssociatedRef = useRef(false);

  const isOnKatana = chainId === KATANA_CHAIN_ID;

  useEffect(() => {
    // Reset attempt tracker when wallet disconnects
    if (!isConnected || !address) {
      setAttemptedAddress(null);
      setShowModal(false);
      return;
    }

    // Don't show modal if not on Katana network - let KatanaSwitcher handle chain switching first
    if (!isOnKatana) {
      setShowModal(false);
      return;
    }

    // Only trigger once per wallet address per page visit
    // Using the address itself as the key so switching wallets re-triggers the modal
    if (attemptedAddress === address || isAssociated || isAssociating) {
      return;
    }

    // Small delay to ensure wallet client is fully ready
    const timer = setTimeout(() => {
      setAttemptedAddress(address);
      setShowModal(true);
    }, 300);

    return () => clearTimeout(timer);
  }, [isConnected, address, isAssociated, isAssociating, attemptedAddress, isOnKatana]);

  // Auto-close modal when association succeeds
  useEffect(() => {
    if (isAssociated && showModal) {
      setShowModal(false);
    }
  }, [isAssociated, showModal]);

  // Re-allow modal when a previously-valid session is revoked (e.g. 401 from balance API)
  useEffect(() => {
    if (isAssociated) {
      wasAssociatedRef.current = true;
    } else if (wasAssociatedRef.current && attemptedAddress === address) {
      wasAssociatedRef.current = false;
      setAttemptedAddress(null);
    }
  }, [isAssociated, address, attemptedAddress]);

  return (
    <UnlockWalletModal
      open={showModal}
      onClose={() => setShowModal(false)}
      onSuccess={() => setShowModal(false)}
    />
  );
};

// Keep the old name as an alias for backwards compatibility
export const KumaAuthWrapper = KatanaPerpsAuthWrapper;
