"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useDerivedStateTwap } from "@/store/limit-order/derivedstate-twap-provider";
import {
  SimpleAmount,
  SimplePrice,
} from "@/store/limit-order/utils/simpleCurrency";

const PRICE_OPTIONS = [
  { label: "Market", value: 0 },
  { label: "+1%", value: 1 },
  { label: "+5%", value: 5 },
  { label: "+10%", value: 10 },
];

export const LimitPriceInput = () => {
  const {
    state: {
      token0,
      token1,
      marketPrice,
      limitPrice,
      isLimitPriceInverted,
      limitPriceString,
    },
    mutate: { setIsLimitPriceInverted, setLimitPrice },
    isToken0Loading,
    isLoading,
  } = useDerivedStateTwap();

  const [priceOptionIndex, setPriceOptionIndex] = useState<number | undefined>(
    0
  );

  // Format price properly without scientific notation
  const formatPrice = (price: number): string => {
    if (!price || isNaN(price) || price === 0) return "0";

    // For very small numbers (less than 0.0001)
    if (price < 0.0001) {
      return price.toFixed(10).replace(/\.?0+$/, "");
    }

    // For small numbers (less than 1)
    if (price < 1) {
      return price.toFixed(8).replace(/\.?0+$/, "");
    }

    // For normal numbers (less than 1 million)
    if (price < 1000000) {
      return price.toFixed(6).replace(/\.?0+$/, "");
    }

    // For very large numbers, use exponential notation
    return price.toExponential(2);
  };

  // Reset when tokens change
  useEffect(() => {
    if (token0 && token1) {
      setPriceOptionIndex(0);
      setIsLimitPriceInverted(false);
    }
  }, [token0?.address, token1?.address, setIsLimitPriceInverted]);

  // Calculate and set price based on market price and selected option - MAIN FIX
  useEffect(() => {
    if (!marketPrice || !token0 || !token1) return;

    try {
      // Extract the base market price using toSignificant - SAFER EXTRACTION
      const marketPriceStr = marketPrice.toSignificant(18);
      let baseMarketPrice = parseFloat(marketPriceStr);

      // Handle edge cases and extreme values - PROTECTION AGAINST 1e-12
      if (!baseMarketPrice || isNaN(baseMarketPrice) || baseMarketPrice === 0) {
        console.warn("Invalid market price:", marketPriceStr);
        setLimitPrice("0");
        return;
      }

      // Protect against extreme values that cause scientific notation
      if (baseMarketPrice < 1e-15 || baseMarketPrice > 1e15) {
        console.warn(
          "Extreme market price detected, using fallback:",
          baseMarketPrice
        );
        setLimitPrice("0");
        return;
      }

      let finalPrice: number;

      if (typeof priceOptionIndex === "number" && priceOptionIndex > 0) {
        // Apply percentage adjustment
        const adjustment = PRICE_OPTIONS[priceOptionIndex].value;

        if (isLimitPriceInverted) {
          // When inverted, we want the inverted price to be higher
          // FIXED: Better handling of inversion with small numbers
          const adjustedBasePrice = baseMarketPrice / (1 + adjustment / 100);

          // Protect against division by zero or extremely small numbers
          if (adjustedBasePrice < 1e-15) {
            console.warn("Adjusted base price too small for inversion");
            setLimitPrice("0");
            return;
          }

          finalPrice = 1 / adjustedBasePrice;
        } else {
          // Normal case - just increase the price
          finalPrice = baseMarketPrice * (1 + adjustment / 100);
        }
      } else {
        // Market price (no adjustment)
        if (isLimitPriceInverted) {
          // FIXED: Better protection for inversion
          if (baseMarketPrice < 1e-15) {
            console.warn("Base market price too small for inversion");
            setLimitPrice("0");
            return;
          }
          finalPrice = 1 / baseMarketPrice;
        } else {
          finalPrice = baseMarketPrice;
        }
      }

      // Additional check before formatting
      if (!finalPrice || isNaN(finalPrice) || finalPrice < 0) {
        console.warn("Invalid final price:", finalPrice);
        setLimitPrice("0");
        return;
      }

      // Format and set the price
      const formattedPrice = formatPrice(finalPrice);
      setLimitPrice(formattedPrice);
    } catch (error) {
      console.error("Price calculation error:", error);
      setLimitPrice("0");
    }
  }, [
    marketPrice,
    priceOptionIndex,
    isLimitPriceInverted,
    token0,
    token1,
    setLimitPrice,
  ]);

  const handleInputChange = (value: string) => {
    // Allow only numbers and decimal points
    const cleanValue = value.replace(/[^0-9.]/g, "");

    // Prevent multiple decimal points
    const parts = cleanValue.split(".");
    if (parts.length > 2) {
      return;
    }

    setPriceOptionIndex(undefined);
    setLimitPrice(cleanValue);
  };

  const handleInvert = () => {
    setPriceOptionIndex(0); // Reset to market price when inverting
    setIsLimitPriceInverted((prev) => !prev);
  };

  const handlePriceOptionClick = (index: number) => {
    setPriceOptionIndex(index);
  };

  // Display tokens based on inversion state
  const displayTokens = isLimitPriceInverted
    ? [token1, token0]
    : [token0, token1];

  if (isLoading) {
    return (
      <div className="border border-[#00FFE9] rounded-xl p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-12 bg-gray-700 rounded mb-4"></div>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-8 bg-gray-700 rounded flex-1"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden border border-[#00FFE9] rounded-xl">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-gray-600 p-3">
        <div className="flex items-center gap-2 whitespace-nowrap text-sm text-white">
          <span className="font-medium">When 1</span>
          {displayTokens[0] ? (
            <>
              {displayTokens[0].img ? (
                <img
                  src={displayTokens[0].img}
                  alt={displayTokens[0].ticker}
                  className="w-4 h-4 rounded-full"
                />
              ) : (
                <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                  {displayTokens[0].ticker?.[0] || "?"}
                </div>
              )}
              <span className="font-medium">{displayTokens[0].ticker}</span>
            </>
          ) : (
            <>
              <div className="w-4 h-4 bg-gray-600 rounded-full animate-pulse"></div>
              <div className="w-16 h-4 bg-gray-600 rounded animate-pulse"></div>
            </>
          )}
          <span className="text-gray-400">is worth</span>
        </div>

        <button
          onClick={handleInvert}
          className="p-2 hover:bg-gray-700 rounded-lg transition-all duration-200 hover:rotate-180 text-white"
          type="button"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
            />
          </svg>
        </button>
      </div>

      {/* Price Input Section */}
      <div className="flex flex-col gap-2 px-3 py-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={limitPriceString || ""}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="0.0"
              className="w-full bg-transparent text-3xl font-medium text-white placeholder-gray-500 border-none outline-none focus:ring-0"
              inputMode="decimal"
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          {displayTokens[1] ? (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg">
              {displayTokens[1].img ? (
                <img
                  src={displayTokens[1].img}
                  alt={displayTokens[1].ticker}
                  className="w-6 h-6 rounded-full"
                />
              ) : (
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-sm font-bold text-white">
                  {displayTokens[1].ticker?.[0] || "?"}
                </div>
              )}
              <span className="font-medium text-white">
                {displayTokens[1].ticker}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg animate-pulse">
              <div className="w-6 h-6 bg-gray-600 rounded-full"></div>
              <div className="w-12 h-4 bg-gray-600 rounded"></div>
            </div>
          )}
        </div>

        {/* Price Options */}
        <div className="flex gap-2 mt-2">
          {PRICE_OPTIONS.map((option, index) => (
            <button
              key={option.label}
              onClick={() => handlePriceOptionClick(index)}
              className={`px-3 py-1 text-sm font-medium rounded-full transition-colors ${
                priceOptionIndex === index
                  ? "bg-[#00FFE9] text-black"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
