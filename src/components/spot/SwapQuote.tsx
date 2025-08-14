// components/SwapQuote.tsx
"use client";

import React from "react";
import { formatUnits } from "viem";
import type { QuoteResponse, Token } from "../../types/swap.types";

interface SwapQuoteProps {
  quote: QuoteResponse | null;
  tokenOne: Token;
  tokenTwo: Token;
  tokenOneAmount: string;
  isLoading: boolean;
}

const SwapQuote: React.FC<SwapQuoteProps> = ({
  quote,
  tokenOne,
  tokenTwo,
  tokenOneAmount,
  isLoading,
}) => {
  if (!tokenOneAmount || isLoading) {
    return null;
  }

  if (!quote) {
    return (
      <div className="bg-gray-800/50 rounded-lg p-4 mt-4 mb-4">
        <div className="text-center text-gray-400 text-sm">
          Enter an amount to see quote details
        </div>
      </div>
    );
  }

  const expectedOutput = formatUnits(BigInt(quote.toAmount), tokenTwo.decimals);
  const priceImpact = "< 0.01%"; // You can calculate this based on your price data
  const minimumReceived = (parseFloat(expectedOutput) * 0.975).toFixed(6); // Assuming 2.5% slippage

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

      {quote.gas && (
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-400">Estimated Gas</span>
          <span className="text-gray-300">{quote.gas.toLocaleString()}</span>
        </div>
      )}

      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-400">Route</span>
        <span className="text-gray-300">
          {quote.protocols!.length > 1 ? "Multi-hop" : "Direct"}
        </span>
      </div>
    </div>
  );
};

export default SwapQuote;
