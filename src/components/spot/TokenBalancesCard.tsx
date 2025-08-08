// components/TokenBalancesCard.tsx - Updated to use portfolio data and filter for chain_id 1
"use client";

import { CircularProgress } from "@mui/material";
import {
  usePortfolioDetailed,
  type PortfolioToken,
} from "@/hooks/usePortfolioDetailed";
import { useAccount } from "wagmi";
import { useState, useEffect } from "react";

const getTokenLogo = (symbol: string, chainId: number) => {
  const symbolUpper = symbol.toUpperCase();
  switch (symbolUpper) {
    case "ETH":
      return "https://cdn.moralis.io/eth/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.png";
    case "USDC":
      return "/logos/usdc.png";
    case "USDT":
      return "https://cdn.moralis.io/eth/0xdac17f958d2ee523a2206206994597c13d831ec7.png";
    case "WETH":
      return "/logos/weth.png";
    case "WBTC":
      return "/logos/wbtc.png";
    case "LINK":
      return "https://tokens.1inch.io/0x514910771af9ca656af840dff83e8264ecf986ca.png";
    default:
      return null;
  }
};

// Custom hook for managing entry prices in localStorage
const useEntryPrices = (address: string | undefined) => {
  const [entryPrices, setEntryPrices] = useState<{ [key: string]: number }>({});

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

  const updateEntryPrice = (tokenKey: string, price: number) => {
    if (!address) return;

    const newEntryPrices = { ...entryPrices, [tokenKey]: price };
    setEntryPrices(newEntryPrices);

    const storageKey = `entry_prices_${address}`;
    localStorage.setItem(storageKey, JSON.stringify(newEntryPrices));
  };

  const getEntryPrice = (tokenKey: string, defaultPrice: number) => {
    return entryPrices[tokenKey] ?? defaultPrice;
  };

  return { entryPrices, updateEntryPrice, getEntryPrice };
};

// Editable price input component
const EditablePrice = ({
  tokenKey,
  currentPrice,
  defaultPrice,
  onPriceChange,
}: {
  tokenKey: string;
  currentPrice: number;
  defaultPrice: number;
  onPriceChange: (price: number) => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(currentPrice.toFixed(2));

  const handleSave = () => {
    const newPrice = parseFloat(editValue);
    if (!isNaN(newPrice) && newPrice > 0) {
      onPriceChange(newPrice);
      setIsEditing(false);
    } else {
      setEditValue(currentPrice.toFixed(2));
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditValue(currentPrice.toFixed(2));
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center justify-center gap-1">
        <input
          type="number"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyPress}
          onBlur={handleSave}
          className="w-20 px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded text-white text-center focus:outline-none focus:border-[#00F5E0]"
          autoFocus
          step="0.01"
        />
      </div>
    );
  }

  return (
    <div
      className="group flex items-center justify-center"
      onClick={() => setIsEditing(true)}
      title="Click to edit entry price"
    >
      <div className="flex justify-center gap-2 relative cursor-pointer hover:bg-gray-700 px-2 py-1 rounded transition-colors">
        <span>${currentPrice.toFixed(2)}</span>
        {currentPrice !== defaultPrice && (
          <div className="text-xs text-blue-400 mt-1">Custom</div>
        )}
      </div>
    </div>
  );
};

// Utility functions
const formatNumber = (value: number | string) => {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (num >= 1000000) {
    return (num / 1000000).toFixed(2) + "M";
  } else if (num >= 1000) {
    return (num / 1000).toFixed(2) + "K";
  } else if (num >= 1) {
    return num.toFixed(6);
  } else {
    return num.toFixed(8);
  }
};

const formatUSD = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const formatPercent = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export default function TokenBalancesCard() {
  const { address } = useAccount();
  const { data, isLoading, error, totalValue, totalPnL, totalROI } =
    usePortfolioDetailed();

  const { updateEntryPrice, getEntryPrice } = useEntryPrices(address);

  // Filter for only Ethereum mainnet (chain_id: 1) tokens
  const ethereumTokens = data?.filter((token) => token.chain_id === 1) || [];

  // Calculate custom totals based on user-defined entry prices for Ethereum tokens only
  const calculateCustomTotals = () => {
    if (!ethereumTokens.length)
      return { customTotalPnL: 0, customTotalROI: 0, customTotalValue: 0 };

    let customTotalPnL = 0;
    let totalInvested = 0;
    let customTotalValue = 0;

    ethereumTokens.forEach((token) => {
      const tokenKey = `${token.chain_id}-${token.contract_address}`;
      const defaultEntryPrice = token.price_to_usd; // Use current price as default
      const entryPrice = getEntryPrice(tokenKey, defaultEntryPrice);
      const investedValue = entryPrice * token.amount;
      const currentValue = token.value_usd;
      const tokenPnL = currentValue - investedValue;

      customTotalPnL += tokenPnL;
      totalInvested += investedValue;
      customTotalValue += currentValue;
    });

    const customTotalROI =
      totalInvested > 0 ? customTotalPnL / totalInvested : 0;
    return { customTotalPnL, customTotalROI, customTotalValue };
  };

  const { customTotalPnL, customTotalROI, customTotalValue } =
    calculateCustomTotals();

  if (!address) {
    return (
      <div className="relative mx-auto rounded-xl">
        <div className="relative p-4 sm:p-6 md:p-8 rounded-2xl text-white font-sans">
          <div className="text-center py-8">
            <h2 className="text-xl font-semibold mb-2">Connect Your Wallet</h2>
            <p className="text-gray-400 text-sm">
              Connect your wallet to view your token balances
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative mx-auto rounded-xl">
        <div className="relative p-4 sm:p-6 md:p-8 rounded-2xl text-white font-sans">
          <div className="text-lg sm:text-xl font-semibold mb-4">
            Token Balances (Ethereum)
          </div>
          <div className="text-center py-8">
            <div className="text-red-400 text-sm">
              Failed to load token balances
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative mx-auto rounded-xl">
      <div className="relative p-4 sm:p-6 md:p-8 rounded-2xl text-white font-sans">
        {/* Header with Portfolio Summary */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-0">
          <div className="text-lg sm:text-xl font-semibold flex items-center gap-2">
            Token Balances (Ethereum)
          </div>

          {/* Portfolio Summary Stats - Only show if we have Ethereum tokens */}
          {ethereumTokens.length > 0 && (
            <div className="flex gap-6">
              <div className="flex flex-col items-center">
                <div className="text-lg sm:text-xl font-bold">
                  ${customTotalValue.toFixed(2)}
                </div>
                <div className="text-xs text-gray-400">Total Value</div>
              </div>

              <div className="flex flex-col items-center">
                <div
                  className={`text-sm sm:text-lg font-semibold ${
                    customTotalPnL >= 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {customTotalPnL >= 0 ? "+" : ""}${customTotalPnL.toFixed(2)}
                </div>
                <div className="text-xs text-gray-400">P&L</div>
              </div>

              <div className="flex flex-col items-center">
                <div
                  className={`text-sm sm:text-lg font-semibold ${
                    customTotalROI >= 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {customTotalROI >= 0 ? "+" : ""}
                  {formatPercent(customTotalROI)}
                </div>
                <div className="text-xs text-gray-400">ROI</div>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="w-full">
          {isLoading ? (
            <div className="w-full flex justify-center pb-4">
              <CircularProgress sx={{ color: "primary.main" }} />
            </div>
          ) : ethereumTokens.length > 0 ? (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="text-base font-semibold">
                      <th className="text-left font-medium pb-3 text-cyan-300">
                        Token
                      </th>
                      <th className="text-right font-medium pb-3 text-cyan-300">
                        Balance
                      </th>
                      <th className="text-center font-medium pb-3 text-cyan-300">
                        Entry Price
                        <span className="text-white text-[10px] ml-2">
                          Edit
                        </span>
                      </th>
                      <th className="text-center font-medium pb-3 text-cyan-300">
                        Current Price
                      </th>
                      <th className="text-center font-medium pb-3 text-cyan-300">
                        Value
                      </th>
                      <th className="text-center font-medium pb-3 text-cyan-300">
                        P&L
                      </th>
                      <th className="text-center font-medium pb-3 text-cyan-300">
                        ROI
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {ethereumTokens.map((token: PortfolioToken) => {
                      const tokenLogo = getTokenLogo(
                        token.symbol,
                        token.chain_id
                      );
                      const tokenKey = `${token.chain_id}-${token.contract_address}`;

                      // Use current price as default entry price (so P&L starts at 0)
                      const defaultEntryPrice = token.price_to_usd;
                      const entryPrice = getEntryPrice(
                        tokenKey,
                        defaultEntryPrice
                      );

                      // Calculate custom P&L and ROI based on user entry price
                      const investedValue = entryPrice * token.amount;
                      const currentValue = token.value_usd;
                      const customPnL = currentValue - investedValue;
                      const customROI =
                        investedValue > 0 ? customPnL / investedValue : 0;

                      return (
                        <tr
                          key={tokenKey}
                          className="hover:bg-white/5 transition-colors duration-200"
                        >
                          <td className="py-3 border-b border-white/8 last:border-b-0">
                            <div className="flex items-center gap-2">
                              {tokenLogo ? (
                                <img
                                  src={tokenLogo}
                                  alt={token.symbol}
                                  className="w-6 h-6 rounded-full"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = "none";
                                    const fallback =
                                      target.nextElementSibling as HTMLElement;
                                    if (fallback)
                                      fallback.style.display = "flex";
                                  }}
                                />
                              ) : null}
                              <div
                                className="w-6 h-6 rounded-full bg-gradient-to-r from-gray-600 to-gray-800 flex items-center justify-center"
                                style={{ display: tokenLogo ? "none" : "flex" }}
                              >
                                <span className="text-xs font-bold text-white">
                                  {token.symbol.charAt(0)}
                                </span>
                              </div>
                              <div>
                                <div className="font-medium">
                                  {token.symbol}
                                </div>
                                <div className="text-xs text-gray-400">
                                  {token.name}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 border-b border-white/8 last:border-b-0 text-right">
                            {formatNumber(token.amount)}
                          </td>
                          <td className="py-3 border-b border-white/8 last:border-b-0 text-center">
                            <EditablePrice
                              tokenKey={tokenKey}
                              currentPrice={entryPrice}
                              defaultPrice={defaultEntryPrice}
                              onPriceChange={(price) =>
                                updateEntryPrice(tokenKey, price)
                              }
                            />
                          </td>
                          <td className="py-3 border-b border-white/8 last:border-b-0 text-center">
                            ${token.price_to_usd.toFixed(2)}
                          </td>
                          <td className="py-3 border-b border-white/8 last:border-b-0 text-center font-medium">
                            {formatUSD(token.value_usd)}
                          </td>
                          <td
                            className={`py-3 border-b border-white/8 last:border-b-0 text-center font-medium ${
                              customPnL >= 0 ? "text-green-400" : "text-red-400"
                            }`}
                          >
                            {customPnL >= 0 ? "+" : ""}
                            {formatUSD(customPnL)}
                          </td>
                          <td
                            className={`py-3 border-b border-white/8 last:border-b-0 text-center font-medium ${
                              customROI >= 0 ? "text-green-400" : "text-red-400"
                            }`}
                          >
                            {customROI >= 0 ? "+" : ""}
                            {formatPercent(customROI)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="block md:hidden space-y-3">
                {ethereumTokens.map((token: PortfolioToken) => {
                  const tokenLogo = getTokenLogo(token.symbol, token.chain_id);
                  const tokenKey = `${token.chain_id}-${token.contract_address}`;

                  // Use current price as default entry price (so P&L starts at 0)
                  const defaultEntryPrice = token.price_to_usd;
                  const entryPrice = getEntryPrice(tokenKey, defaultEntryPrice);

                  // Calculate custom P&L and ROI based on user entry price
                  const investedValue = entryPrice * token.amount;
                  const currentValue = token.value_usd;
                  const customPnL = currentValue - investedValue;
                  const customROI =
                    investedValue > 0 ? customPnL / investedValue : 0;

                  return (
                    <div
                      key={tokenKey}
                      className="bg-white/5 rounded-lg p-4 border border-white/10"
                    >
                      <div className="flex items-center gap-2 mb-6">
                        {tokenLogo ? (
                          <img
                            src={tokenLogo}
                            alt={token.symbol}
                            className="w-8 h-8 rounded-full"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = "none";
                              const fallback =
                                target.nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = "flex";
                            }}
                          />
                        ) : null}
                        <div
                          className="w-8 h-8 rounded-full bg-gradient-to-r from-gray-600 to-gray-800 flex items-center justify-center"
                          style={{ display: tokenLogo ? "none" : "flex" }}
                        >
                          <span className="text-sm font-bold text-white">
                            {token.symbol.charAt(0)}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-base">
                            {token.symbol}
                          </div>
                          <div className="text-sm text-gray-400">
                            {token.name}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">
                            {formatUSD(token.value_usd)}
                          </div>
                          <div
                            className={`text-sm font-medium ${
                              customPnL >= 0 ? "text-green-400" : "text-red-400"
                            }`}
                          >
                            {customPnL >= 0 ? "+" : ""}
                            {formatUSD(customPnL)}
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-cyan-300 text-xs mb-1">
                            Balance
                          </div>
                          <div className="font-medium text-white">
                            {formatNumber(token.amount)}
                          </div>
                        </div>
                        <div>
                          <div className="text-cyan-300 text-xs mb-1">
                            Current Price
                          </div>
                          <div className="font-medium text-white">
                            ${token.price_to_usd.toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <div className="text-cyan-300 text-xs mb-1">
                            Entry Price
                          </div>
                          <div className="font-medium text-white flex justify-start">
                            <EditablePrice
                              tokenKey={tokenKey}
                              currentPrice={entryPrice}
                              defaultPrice={defaultEntryPrice}
                              onPriceChange={(price) =>
                                updateEntryPrice(tokenKey, price)
                              }
                            />
                          </div>
                        </div>
                        <div>
                          <div className="text-cyan-300 text-xs mb-1">ROI</div>
                          <div
                            className={`font-medium ${
                              customROI >= 0 ? "text-green-400" : "text-red-400"
                            }`}
                          >
                            {customROI >= 0 ? "+" : ""}
                            {formatPercent(customROI)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 text-sm">
                No Ethereum tokens found in your wallet
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
