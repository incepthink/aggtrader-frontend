// components/ChainSync.tsx
"use client";

import { useEffect } from "react";
import { useChainId, useAccount } from "wagmi";
import { useSpotStore } from "@/store/spotStore";

/**
 * Component that syncs the store chainId with the connected wallet's chain
 * Should be placed high in your component tree (e.g., in layout or main app component)
 */
export const ChainSync: React.FC = () => {
  const { isConnected } = useAccount();
  const connectedChainId = useChainId();
  const syncWithConnectedChain = useSpotStore((s) => s.syncWithConnectedChain);

  useEffect(() => {
    // Only sync when wallet is connected
    if (isConnected && connectedChainId) {
      syncWithConnectedChain(connectedChainId);
    }
  }, [isConnected, connectedChainId, syncWithConnectedChain]);

  // This component doesn't render anything
  return null;
};
