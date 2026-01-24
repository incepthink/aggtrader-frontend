'use client';

import { useEffect, useState } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { useKatanaPerpsAuth } from '@/hooks/perp/useKumaAuth';
import UnlockWalletModal from './UnlockWalletModal';

const BOKUTO_CHAIN_ID = 737373;

/**
 * Automatically triggers Katana Perps wallet association when user visits /perp page
 * Works for both scenarios:
 * 1. User already connected wallet on Katana pages -> shows unlock modal on /perp visit
 * 2. User connects wallet while on /perp page -> shows unlock modal after connection
 *
 * IMPORTANT: Only shows modal after user is confirmed to be on Bokuto network
 */
export const KatanaPerpsAuthWrapper = () => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { isAssociated, isAssociating } = useKatanaPerpsAuth();
  const [hasAttempted, setHasAttempted] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const isOnBokuto = chainId === BOKUTO_CHAIN_ID;

  useEffect(() => {
    // Reset attempt tracker when wallet changes or disconnects
    if (!isConnected || !address) {
      setHasAttempted(false);
      setShowModal(false);
      return;
    }

    // Don't show modal if not on Bokuto network - let BokutoSwitcher handle chain switching first
    if (!isOnBokuto) {
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
  }, [isConnected, address, isAssociated, isAssociating, hasAttempted, isOnBokuto]);

  // Auto-close modal when association succeeds
  useEffect(() => {
    if (isAssociated && showModal) {
      setShowModal(false);
    }
  }, [isAssociated, showModal]);

  // Reset hasAttempted when switching TO Bokuto (to allow modal to show after chain switch)
  useEffect(() => {
    if (isOnBokuto && isConnected && !isAssociated) {
      setHasAttempted(false);
    }
  }, [isOnBokuto, isConnected, isAssociated]);

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
