'use client';

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { useKatanaPerpsAuth } from '@/hooks/perp/useKumaAuth';
import UnlockWalletModal from './UnlockWalletModal';

/**
 * Automatically triggers Katana Perps wallet association when user visits /perp page
 * Works for both scenarios:
 * 1. User already connected wallet on Katana pages -> shows unlock modal on /perp visit
 * 2. User connects wallet while on /perp page -> shows unlock modal after connection
 */
export const KatanaPerpsAuthWrapper = () => {
  const { address, isConnected } = useAccount();
  const { isAssociated, isAssociating } = useKatanaPerpsAuth();
  const [hasAttempted, setHasAttempted] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Reset attempt tracker when wallet changes or disconnects
    if (!isConnected || !address) {
      setHasAttempted(false);
      setShowModal(false);
      return;
    }

    // Only trigger once per wallet address per page visit
    if (hasAttempted || isAssociated || isAssociating) {
      return;
    }

    // Small delay to ensure wallet client is fully ready
    const timer = setTimeout(() => {
      setHasAttempted(true);
      setShowModal(true);
    }, 300);

    return () => clearTimeout(timer);
  }, [isConnected, address, isAssociated, isAssociating, hasAttempted]);

  // Auto-close modal when association succeeds
  useEffect(() => {
    if (isAssociated && showModal) {
      setShowModal(false);
    }
  }, [isAssociated, showModal]);

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
