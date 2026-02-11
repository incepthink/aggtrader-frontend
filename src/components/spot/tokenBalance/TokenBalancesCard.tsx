// components/spot/tokenBalance/TokenBalancesCard.tsx - Refactored
"use client";

import { useEffect } from "react";
import { CircularProgress } from "@mui/material";
import { usePortfolioData } from "@/hooks/usePortfolioData";
import { getChainName } from "@/utils/portfolio/portfolioHelpers";
import { PortfolioHeader } from "./PortfolioHeader";
import { PortfolioStats } from "./PortfolioStats";
import { PortfolioContent } from "./PortfolioContent";
import { useUserReferralData } from "@/hooks/useUserReferralData";
import { usePortfolioRefresh } from "@/context/PortfolioRefreshContext";

export default function TokenBalancesCard() {
  const {
    // Data
    normalizedData,
    portfolioTotals,
    priceStats,

    // Loading states
    isLoading,
    isPriceLoading,
    isRefetching,

    // Errors
    error,
    priceError,

    // Actions
    handleRefetch,

    // Entry price functions
    updateEntryPrice,
    getEntryPrice,
    isCustomPrice,

    // Metadata
    address,
    chainId,
  } = usePortfolioData();

  const { data: referralData } = useUserReferralData(address);
  const { registerRefreshHandler } = usePortfolioRefresh();

  const chainName = getChainName(chainId);

  // Register the refresh handler so swap component can trigger refresh
  useEffect(() => {
    registerRefreshHandler(handleRefetch);
  }, [registerRefreshHandler, handleRefetch]);

  // Wallet not connected state
  if (!address && !referralData) {
    return (
      <div className="relative mx-auto rounded-xl">
        <div className="relative p-4 sm:p-6 md:p-8 rounded-2xl text-white font-sans">
          <div className="text-center py-8">
            <h2 className="text-xl font-semibold mb-2">Connect Your Wallet</h2>
            <p className="text-gray-400 text-sm">
              Connect your wallet to view your token balances and P&L
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="relative mx-auto rounded-xl">
        <div className="relative p-4 sm:p-6 md:p-8 rounded-2xl text-white font-sans">
          <PortfolioHeader
            isRefetching={isRefetching}
            isLoading={isLoading}
            hasTokens={false}
            totals={portfolioTotals}
            onRefetch={handleRefetch}
          />
          <div className="text-center py-8">
            <div className="text-red-400 text-sm">
              Failed to load portfolio data:{" "}
              {typeof error === "string" ? error : "Unknown error"}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative mx-auto rounded-xl">
      <div className="relative p-4 rounded-2xl text-white font-sans">
        <PortfolioHeader
          isRefetching={isRefetching || isPriceLoading}
          isLoading={isLoading}
          hasTokens={normalizedData.length > 0}
          totals={portfolioTotals}
          onRefetch={handleRefetch}
          priceError={priceError?.message}
          lastPriceUpdate={priceStats.lastUpdated}
        />

        {/* Chain Indicator */}
        <div className="mb-4">
          <div className="text-sm text-gray-400 flex items-center gap-2">
            {isPriceLoading && (
              <span className="text-yellow-400 text-xs">
                • Updating prices...
              </span>
            )}
            {priceError && (
              <span className="text-red-400 text-xs">• Price fetch error</span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="w-full">
          {isLoading || isRefetching ? (
            <div className="w-full flex justify-center pb-4">
              <CircularProgress sx={{ color: "primary.main" }} />
            </div>
          ) : (
            <>
              <PortfolioStats
                priceError={priceError}
                priceStats={priceStats}
                isPriceLoading={isPriceLoading}
              />

              <PortfolioContent
                referralData={referralData}
                normalizedData={normalizedData}
                getEntryPrice={getEntryPrice}
                isCustomPrice={isCustomPrice}
                updateEntryPrice={updateEntryPrice}
                chainName={chainName}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
