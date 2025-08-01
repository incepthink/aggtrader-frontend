// contexts/ChainContext.tsx
"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { mainnet } from "wagmi/chains";

// Define Katana chain (replace with actual values)
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

// Chain configurations
export const SUPPORTED_CHAINS = {
  ETHEREUM: {
    id: mainnet.id,
    name: "Ethereum",
    symbol: "ETH",
    wagmiChain: mainnet,
    rpcUrl: "https://mainnet.infura.io/v3/YOUR_INFURA_KEY",
    blockExplorerUrl: "https://etherscan.io",
  },
  KATANA: {
    id: katana.id,
    name: "Katana",
    symbol: "KATA",
    wagmiChain: katana,
    rpcUrl: katana.rpcUrls.default.http[0],
    blockExplorerUrl: katana.blockExplorers.default.url,
  },
} as const;

export type ChainId =
  (typeof SUPPORTED_CHAINS)[keyof typeof SUPPORTED_CHAINS]["id"];
export type ChainName = keyof typeof SUPPORTED_CHAINS;

interface ChainContextType {
  chainId: ChainId;
  chainName: ChainName;
  chainConfig: (typeof SUPPORTED_CHAINS)[ChainName];
  walletChainId: number | undefined;
  isWalletConnected: boolean;
  isChainMismatch: boolean;
  switchChain: (chainName: ChainName) => Promise<void>;
  switchWalletChain: (chainName: ChainName) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  isSwitching: boolean;
}

const ChainContext = createContext<ChainContextType | undefined>(undefined);

interface ChainProviderProps {
  children: ReactNode;
  defaultChain?: ChainName;
}

export const ChainProvider: React.FC<ChainProviderProps> = ({
  children,
  defaultChain = "ETHEREUM",
}) => {
  const [chainName, setChainName] = useState<ChainName>(defaultChain);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSwitching, setIsSwitching] = useState(false);

  // Wagmi hooks
  const { isConnected, address } = useAccount();
  const walletChainId = useChainId();
  const { switchChain: wagmiSwitchChain, isPending: isSwitchPending } =
    useSwitchChain();

  // Load chain preference from localStorage on mount
  useEffect(() => {
    const savedChain = localStorage.getItem(
      "morpho-selected-chain"
    ) as ChainName;
    if (savedChain && SUPPORTED_CHAINS[savedChain]) {
      setChainName(savedChain);
    }
    setIsLoading(false);
  }, []);

  // Save chain preference to localStorage when it changes
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem("morpho-selected-chain", chainName);
    }
  }, [chainName, isLoading]);

  // Update app chain when wallet chain changes (if it matches a supported chain)
  useEffect(() => {
    if (isConnected && walletChainId) {
      const matchingChain = Object.entries(SUPPORTED_CHAINS).find(
        ([_, config]) => config.id === walletChainId
      );

      if (matchingChain && matchingChain[0] !== chainName) {
        setChainName(matchingChain[0] as ChainName);
        localStorage.setItem("morpho-selected-chain", matchingChain[0]);
      }
    }
  }, [walletChainId, isConnected, chainName]);

  // Switch wallet to specific chain using Wagmi
  const switchWalletChain = useCallback(
    async (targetChainName: ChainName) => {
      const targetChain = SUPPORTED_CHAINS[targetChainName];
      setError(null);
      setIsSwitching(true);

      try {
        await wagmiSwitchChain({ chainId: targetChain.id });
      } catch (error: any) {
        let errorMessage = `Failed to switch to ${targetChain.name}`;

        if (error.name === "UserRejectedRequestError") {
          errorMessage = "User rejected the chain switch request";
        } else if (error.name === "ChainNotConfiguredError") {
          errorMessage = `${targetChain.name} is not configured in your wallet`;
        }

        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsSwitching(false);
      }
    },
    [wagmiSwitchChain]
  );

  // Switch app chain and optionally wallet chain
  const switchChain = useCallback(
    async (targetChainName: ChainName) => {
      setError(null);

      // Always update app state
      setChainName(targetChainName);
      localStorage.setItem("morpho-selected-chain", targetChainName);

      // If wallet is connected, also try to switch wallet chain
      if (isConnected) {
        try {
          await switchWalletChain(targetChainName);
        } catch (error: any) {
          // Error is already set in switchWalletChain
          // Don't revert app state - let user decide what to do
        }
      }
    },
    [isConnected, switchWalletChain]
  );

  const chainConfig = SUPPORTED_CHAINS[chainName];
  const chainId = chainConfig.id;
  const isChainMismatch =
    isConnected && walletChainId !== undefined && walletChainId !== chainId;

  const value: ChainContextType = {
    chainId,
    chainName,
    chainConfig,
    walletChainId,
    isWalletConnected: isConnected,
    isChainMismatch,
    switchChain,
    switchWalletChain,
    isLoading,
    error,
    isSwitching: isSwitching || isSwitchPending,
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
