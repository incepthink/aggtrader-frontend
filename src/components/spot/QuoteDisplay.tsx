// components/swap/QuoteDisplay.tsx
"use client";

import React from "react";
import { formatUnits } from "viem";
import type { QuoteResponse, Token } from "@/types/swap.types";

interface QuoteDisplayProps {
  quote: QuoteResponse | null;
  isLoadingQuote: boolean;
  tokenOneAmount: string;
  tokenTwo: Token;
  slippage: number;
}

export const QuoteDisplay: React.FC<QuoteDisplayProps> = ({
  quote,
  isLoadingQuote,
  tokenOneAmount,
  tokenTwo,
  slippage,
}) => {
  if (!tokenOneAmount || isLoadingQuote) {
    return (
      <div className="bg-gray-800/50 rounded-lg p-4 mt-4 mb-4">
        <div className="text-center text-gray-400 text-sm">
          {isLoadingQuote
            ? "Loading quote..."
            : "Enter an amount to see quote details"}
        </div>
      </div>
    );
  }

  if (!quote || !quote.toAmount) {
    return null;
  }

  // Add validation for toAmount
  let expectedOutput = "0";
  try {
    expectedOutput = formatUnits(BigInt(quote.toAmount), tokenTwo.decimals);
  } catch (error) {
    console.error("Error parsing quote amount:", error);
    return (
      <div className="bg-gray-800/50 rounded-lg p-4 mt-4 mb-4">
        <div className="text-center text-gray-400 text-sm">
          Invalid quote data
        </div>
      </div>
    );
  }

  const priceImpact = "< 0.01%"; // You can calculate this based on your price data
  const minimumReceived = (
    parseFloat(expectedOutput) *
    (1 - slippage / 100)
  ).toFixed(6);

  return (
    <div className="bg-gray-800/50 rounded-lg p-4 mt-4 mb-4 space-y-3">
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-400">Expected Output</span>
        <span className="text-white font-medium">
          {parseFloat(expectedOutput).toFixed(6)} {tokenTwo.ticker}
        </span>
      </div>

      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-400">Price Impact</span>
        <span className="text-green-400">{priceImpact}</span>
      </div>

      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-400">Minimum Received</span>
        <span className="text-gray-300">
          {minimumReceived} {tokenTwo.ticker}
        </span>
      </div>

      {quote.estimatedGas && (
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-400">Estimated Gas</span>
          <span className="text-gray-300">
            {quote.estimatedGas.toLocaleString()}
          </span>
        </div>
      )}

      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-400">Route</span>
        <span className="text-gray-300">
          {quote.protocols && quote.protocols.length > 1
            ? "Multi-hop"
            : "Direct"}
        </span>
      </div>
    </div>
  );
};
