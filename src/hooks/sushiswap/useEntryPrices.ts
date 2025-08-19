// hooks/useEntryPrices.ts
import { useState, useEffect } from "react";
import type { PortfolioToken } from "@/hooks/usePortfolioDetailed";

export interface EntryPriceData {
  price: number;
  isCustom: boolean; // Track if user has manually edited this price
  timestamp: number; // When the price was first stored
}

export const useEntryPrices = (
  address: string | undefined,
  tokens?: PortfolioToken[]
) => {
  const [entryPrices, setEntryPrices] = useState<{
    [key: string]: EntryPriceData;
  }>({});

  // Load entry prices from localStorage on mount
  useEffect(() => {
    if (!address) return;

    const storageKey = `entry_prices_${address}`;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        setEntryPrices(JSON.parse(stored));
      } catch (error) {
        console.error("Error parsing stored entry prices:", error);
        setEntryPrices({});
      }
    }
  }, [address]);

  // Store initial prices for new tokens (when user first loads the website)
  useEffect(() => {
    if (!address || !tokens || tokens.length === 0) return;

    const storageKey = `entry_prices_${address}`;
    let hasNewTokens = false;
    const updatedEntryPrices = { ...entryPrices };

    tokens.forEach((token) => {
      const tokenKey = `${token.chain_id}-${token.contract_address}`;

      // If this token doesn't have an entry price stored yet, store the current price
      if (!updatedEntryPrices[tokenKey]) {
        updatedEntryPrices[tokenKey] = {
          price: token.price_to_usd,
          isCustom: false, // Not custom since it's auto-stored
          timestamp: Date.now(),
        };
        hasNewTokens = true;
      }
    });

    // Only update state and localStorage if we found new tokens
    if (hasNewTokens) {
      setEntryPrices(updatedEntryPrices);
      localStorage.setItem(storageKey, JSON.stringify(updatedEntryPrices));
    }
  }, [address, tokens, entryPrices]);

  const updateEntryPrice = (tokenKey: string, price: number) => {
    if (!address) return;

    const newEntryPrices = {
      ...entryPrices,
      [tokenKey]: {
        price,
        isCustom: true, // Mark as custom when user manually edits
        timestamp: entryPrices[tokenKey]?.timestamp || Date.now(),
      },
    };
    setEntryPrices(newEntryPrices);

    const storageKey = `entry_prices_${address}`;
    localStorage.setItem(storageKey, JSON.stringify(newEntryPrices));
  };

  const getEntryPrice = (tokenKey: string, fallbackPrice: number) => {
    const storedData = entryPrices[tokenKey];
    return storedData?.price ?? fallbackPrice;
  };

  const isCustomPrice = (tokenKey: string) => {
    return entryPrices[tokenKey]?.isCustom ?? false;
  };

  return {
    entryPrices,
    updateEntryPrice,
    getEntryPrice,
    isCustomPrice,
  };
};
