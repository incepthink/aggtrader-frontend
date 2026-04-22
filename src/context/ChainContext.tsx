// contexts/ChainContext.tsx
"use client";

import React, {
  createContext,
  useContext,
  ReactNode,
} from "react";
import { useAccount, useChainId } from "wagmi";

// Katana chain - main chain for spot, lending, vaults
export const katana = {
  id: 747474,
  name: "Katana",
  nativeCurrency: {
    decimals: 18,
    name: "Ethereum",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.katana.network/"],
    },
  },
  blockExplorers: {
    default: {
      name: "Katana Explorer",
      url: "https://explorer.katanarpc.com",
    },
  },
} as const;

// Bokuto chain - testnet for perpetual trading
export const bokuto = {
  id: 737373,
  name: "Bokuto",
  nativeCurrency: {
    decimals: 18,
    name: "Ethereum",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: ["https://rpc-bokuto.katanarpc.com"],
    },
  },
  blockExplorers: {
    default: {
      name: "Bokuto Explorer",
      url: "https://bokuto.katanascan.com",
    },
  },
} as const;

// Katana configuration
export const KATANA_CHAIN = {
  id: katana.id,
  name: "Katana",
  symbol: "ETH",
  wagmiChain: katana,
  rpcUrl: katana.rpcUrls.default.http[0],
  blockExplorerUrl: katana.blockExplorers.default.url,
} as const;

// Bokuto configuration
export const BOKUTO_CHAIN = {
  id: bokuto.id,
  name: "Bokuto",
  symbol: "ETH",
  wagmiChain: bokuto,
  rpcUrl: bokuto.rpcUrls.default.http[0],
  blockExplorerUrl: bokuto.blockExplorers.default.url,
} as const;

export type ChainId = 747474 | 737373;
export type ChainName = "KATANA" | "BOKUTO";

interface ChainContextType {
  chainId: ChainId;
  chainName: ChainName;
  chainConfig: typeof KATANA_CHAIN | typeof BOKUTO_CHAIN;
  walletChainId: number | undefined;
  isWalletConnected: boolean;
  isChainMismatch: boolean;
  requiredChainId: ChainId;
}

const ChainContext = createContext<ChainContextType | undefined>(undefined);

interface ChainProviderProps {
  children: ReactNode;
}

export const ChainProvider: React.FC<ChainProviderProps> = ({ children }) => {
  // Wagmi hooks
  const { isConnected } = useAccount();

  // Use useChainId with explicit config fallback to prevent ChainNotConfiguredError
  let walletChainId: number | undefined;
  try {
    walletChainId = useChainId();
  } catch (error) {
    // If chain detection fails (injected provider not ready), default to undefined
    walletChainId = undefined;
  }

  // Determine required chain based on current route — all routes require Katana
  const requiredChainId: ChainId = 747474;

  const chainId: ChainId = requiredChainId;
  const chainName: ChainName = "KATANA";
  const chainConfig = KATANA_CHAIN;

  // Check if wallet is on a different chain than required for current route
  const isChainMismatch =
    isConnected && walletChainId !== undefined && walletChainId !== requiredChainId;

  const value: ChainContextType = {
    chainId,
    chainName,
    chainConfig,
    walletChainId,
    isWalletConnected: isConnected,
    isChainMismatch,
    requiredChainId,
  };

  return (
    <ChainContext.Provider value={value}>{children}</ChainContext.Provider>
  );
};

// Custom hook to use chain context
export const useChain = (): ChainContextType => {
  const context = useContext(ChainContext);
  if (context === undefined) {
    throw new Error("useChain must be used within a ChainProvider");
  }
  return context;
};
