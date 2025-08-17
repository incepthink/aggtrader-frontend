import React from "react";
import { formatUnits } from "viem";
import { useAccount } from "wagmi";

interface QuoteData {
  amountOut: string;
  priceImpact: number;
  swapPrice: number;
  amountIn: string;
  tokenFrom: {
    address: string;
    decimals: number;
    symbol: string;
    name: string;
  };
  tokenTo: {
    address: string;
    decimals: number;
    symbol: string;
    name: string;
  };
  status: string;
}

interface SwapDetailsProps {
  quote: QuoteData | null;
  slippage: number;
  tokenInAmount: string;
  isLoadingQuote?: boolean;
}

// Loading skeleton component with flowing animation
const LoadingSkeleton: React.FC<{ width?: string }> = ({ width = "w-16" }) => (
  <div
    className={`${width} h-4 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 rounded animate-pulse bg-[length:200%_100%] animate-flow`}
  >
    <style jsx>{`
      @keyframes flow {
        0% {
          background-position: 200% 0;
        }
        100% {
          background-position: -200% 0;
        }
      }
      .animate-flow {
        animation: flow 1.5s ease-in-out infinite;
      }
    `}</style>
  </div>
);

// Animated number component
const AnimatedNumber: React.FC<{
  value: string;
  isLoading: boolean;
  className?: string;
}> = ({ value, isLoading, className = "" }) => {
  if (isLoading) {
    return <LoadingSkeleton width="w-20" />;
  }

  return (
    <span className={`transition-all duration-300 ease-in-out ${className}`}>
      {value}
    </span>
  );
};

export const SwapDetails: React.FC<SwapDetailsProps> = ({
  quote,
  slippage,
  tokenInAmount,
  isLoadingQuote = false,
}) => {
  const { address } = useAccount();

  // Always show the component if we have tokenInAmount or if loading
  if (!tokenInAmount && !isLoadingQuote) return null;

  // Calculate values only if we have a quote
  let amountOut = 0;
  let amountIn = 0;
  let minReceived = 0;
  let maxReceived = 0;
  let fee = 0;
  let priceImpactFormatted = "0.0000";
  let priceImpactColor = "text-green-500";
  let exchangeRate = "0.000000";

  if (quote && !isLoadingQuote) {
    amountOut = parseFloat(
      formatUnits(BigInt(quote.amountOut), quote.tokenTo.decimals)
    );
    amountIn = parseFloat(
      formatUnits(BigInt(quote.amountIn), quote.tokenFrom.decimals)
    );

    // Calculate min/max received based on slippage
    const slippageDecimal = slippage / 100;
    minReceived = amountOut * (1 - slippageDecimal);
    maxReceived = amountOut * (1 + slippageDecimal);

    // Calculate fee (assuming 0.25% Sushi fee)
    const feePercentage = 0.0025;
    fee = amountIn * feePercentage;

    // Format price impact
    priceImpactFormatted = (quote.priceImpact * 100).toFixed(4);
    priceImpactColor =
      quote.priceImpact > 0.05
        ? "text-red-500"
        : quote.priceImpact > 0.01
        ? "text-yellow-500"
        : "text-green-500";

    // Exchange rate
    exchangeRate = (amountOut / amountIn).toFixed(6);
  }

  // Format address
  const formatAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  // Get token symbols for display
  const fromSymbol = quote?.tokenFrom.symbol || "Token";
  const toSymbol = quote?.tokenTo.symbol || "Token";

  return (
    <>
      <style jsx>{`
        @keyframes flow {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
        @keyframes shimmer {
          0% {
            opacity: 0.5;
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0.5;
          }
        }
        .animate-flow {
          animation: flow 1.5s ease-in-out infinite;
          background: linear-gradient(90deg, #374151, #4b5563, #374151);
          background-size: 200% 100%;
        }
        .animate-shimmer {
          animation: shimmer 1.5s ease-in-out infinite;
        }
      `}</style>

      <div className="bg-gray-800/50 rounded-lg p-4 mb-4 space-y-3 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Price impact</span>
          <AnimatedNumber
            value={`${
              quote && quote.priceImpact > 0 ? "+" : ""
            }${priceImpactFormatted}%`}
            isLoading={isLoadingQuote}
            className={priceImpactColor}
          />
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-400">Max. received</span>
          <div className="text-white flex items-center gap-2">
            <AnimatedNumber
              value={`${maxReceived.toFixed(6)} ${toSymbol}`}
              isLoading={isLoadingQuote}
            />
          </div>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-400">Min. received</span>
          <div className="text-white flex items-center gap-2">
            <AnimatedNumber
              value={`${minReceived.toFixed(6)} ${toSymbol}`}
              isLoading={isLoadingQuote}
            />
          </div>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-400">Fee (0.25%)</span>
          <div className="text-white flex items-center gap-2">
            <AnimatedNumber
              value={`${fee.toFixed(6)} ${fromSymbol}`}
              isLoading={isLoadingQuote}
            />
          </div>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-400">Network fee</span>
          <div className="text-white flex items-center gap-2">
            {isLoadingQuote ? (
              <LoadingSkeleton width="w-24" />
            ) : (
              <span>~0.001 ETH ($3)</span>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-400">Routing source</span>
          <div className="text-white flex items-center gap-2">
            {isLoadingQuote ? (
              <LoadingSkeleton width="w-32" />
            ) : (
              <span>SushiSwap API</span>
            )}
          </div>
        </div>

        {address && (
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Recipient</span>
            <div className="text-white flex items-center gap-2">
              {isLoadingQuote ? (
                <LoadingSkeleton width="w-28" />
              ) : (
                <span>{formatAddress(address)}</span>
              )}
            </div>
          </div>
        )}

        <div className="border-t border-gray-600 pt-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Exchange rate</span>
            <div className="text-white flex items-center gap-2">
              <AnimatedNumber
                value={`1 ${fromSymbol} = ${exchangeRate} ${toSymbol}`}
                isLoading={isLoadingQuote}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
