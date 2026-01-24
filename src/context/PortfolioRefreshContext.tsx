"use client";

import React, { createContext, useContext, useCallback, useRef } from "react";

interface PortfolioRefreshContextType {
  triggerRefresh: () => void;
  registerRefreshHandler: (handler: () => void) => void;
}

const PortfolioRefreshContext = createContext<PortfolioRefreshContextType | null>(
  null
);

export function PortfolioRefreshProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const refreshHandlerRef = useRef<(() => void) | null>(null);

  const registerRefreshHandler = useCallback((handler: () => void) => {
    refreshHandlerRef.current = handler;
  }, []);

  const triggerRefresh = useCallback(() => {
    if (refreshHandlerRef.current) {
      console.log("🔄 Portfolio refresh triggered");
      refreshHandlerRef.current();
    }
  }, []);

  return (
    <PortfolioRefreshContext.Provider
      value={{ triggerRefresh, registerRefreshHandler }}
    >
      {children}
    </PortfolioRefreshContext.Provider>
  );
}

export function usePortfolioRefresh() {
  const context = useContext(PortfolioRefreshContext);
  if (!context) {
    throw new Error(
      "usePortfolioRefresh must be used within PortfolioRefreshProvider"
    );
  }
  return context;
}
