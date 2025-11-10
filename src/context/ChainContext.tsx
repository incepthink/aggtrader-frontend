// contexts/ChainContext.tsx
"use client";

import React, {
  createContext,
  useContext,
  ReactNode,
} from "react";
import { useAccount, useChainId } from "wagmi";

// Katana chain - the only supported chain
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

// Katana configuration
export const KATANA_CHAIN = {
  id: katana.id,
  name: "Katana",
  symbol: "ETH",
  wagmiChain: katana,
  rpcUrl: katana.rpcUrls.default.http[0],
  blockExplorerUrl: katana.blockExplorers.default.url,
} as const;

export type ChainId = 747474;
export type ChainName = "KATANA";

interface ChainContextType {
  chainId: ChainId;
  chainName: ChainName;
  chainConfig: typeof KATANA_CHAIN;
  walletChainId: number | undefined;
  isWalletConnected: boolean;
  isChainMismatch: boolean;
}

const ChainContext = createContext<ChainContextType | undefined>(undefined);

interface ChainProviderProps {
  children: ReactNode;
}

export const ChainProvider: React.FC<ChainProviderProps> = ({ children }) => {
  // Wagmi hooks
  const { isConnected } = useAccount();
  const walletChainId = useChainId();

  // Always use Katana - no chain switching needed
  const chainId: ChainId = 747474;
  const chainName: ChainName = "KATANA";
  const chainConfig = KATANA_CHAIN;

  // Check if wallet is on a different chain than Katana
  const isChainMismatch =
    isConnected && walletChainId !== undefined && walletChainId !== chainId;

  const value: ChainContextType = {
    chainId,
    chainName,
    chainConfig,
    walletChainId,
    isWalletConnected: isConnected,
    isChainMismatch,
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
