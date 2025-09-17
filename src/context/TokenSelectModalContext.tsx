// contexts/TokenSelectModalContext.tsx
"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface TokenSelectModalContextType {
  // Limit order token selection
  isLimitTokenModalOpen: boolean;
  limitModalPosition: "token0" | "token1" | null;
  openLimitTokenModal: (position: "token0" | "token1") => void;
  closeLimitTokenModal: () => void;
}

const TokenSelectModalContext =
  createContext<TokenSelectModalContextType | null>(null);

export const useTokenSelectModal = () => {
  const context = useContext(TokenSelectModalContext);
  if (!context) {
    throw new Error(
      "useTokenSelectModal must be used within TokenSelectModalProvider"
    );
  }
  return context;
};

interface TokenSelectModalProviderProps {
  children: ReactNode;
}

export const TokenSelectModalProvider: React.FC<
  TokenSelectModalProviderProps
> = ({ children }) => {
  const [isLimitTokenModalOpen, setIsLimitTokenModalOpen] = useState(false);
  const [limitModalPosition, setLimitModalPosition] = useState<
    "token0" | "token1" | null
  >(null);

  const openLimitTokenModal = (position: "token0" | "token1") => {
    setLimitModalPosition(position);
    setIsLimitTokenModalOpen(true);
  };

  const closeLimitTokenModal = () => {
    setIsLimitTokenModalOpen(false);
    setLimitModalPosition(null);
  };

  const value: TokenSelectModalContextType = {
    isLimitTokenModalOpen,
    limitModalPosition,
    openLimitTokenModal,
    closeLimitTokenModal,
  };

  return (
    <TokenSelectModalContext.Provider value={value}>
      {children}
    </TokenSelectModalContext.Provider>
  );
};
