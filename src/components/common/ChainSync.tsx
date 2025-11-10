// components/ChainSync.tsx
"use client";

/**
 * Component that syncs the store chainId with the connected wallet's chain
 * NOTE: This component is now a no-op since the app only supports Katana (chainId: 747474)
 * Kept for backwards compatibility but does nothing.
 */
export const ChainSync: React.FC = () => {
  // No-op - app is Katana-only now
  return null;
};
