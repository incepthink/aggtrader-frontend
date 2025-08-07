import React from "react";
import { useAccount } from "wagmi";
import { useKatanaPortfolio } from "@/hooks/useKatanaPortfolio";
import { BACKEND_URL } from "@/utils/constants";

interface EstimatedBalanceCardProps {
  bal: number; // Ethereum balance
}

export default function EstimatedBalanceCard({
  bal,
}: EstimatedBalanceCardProps) {
  const { address } = useAccount();

  // Get Katana portfolio data
  const {
    totalValue: katanaBalance,
    isLoading: katanaLoading,
    error: katanaError,
  } = useKatanaPortfolio(address || null);

  return (
    <div className="neon-panel">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h3 className="text-lg font-semibold text-white">
            Portfolio Balance
          </h3>

          {/* Buttons */}
          <div className="flex flex-wrap gap-3">
            <button className="px-5 py-2 rounded bg-[#00FFE9]/10 text-[#00FFE9] hover:bg-[#00FFE9]/20 text-sm font-medium">
              Deposit
            </button>
            <button className="px-5 py-2 rounded bg-[#00FFE9]/10 text-[#00FFE9] hover:bg-[#00FFE9]/20 text-sm font-medium">
              Withdraw
            </button>
            <button className="px-5 py-2 rounded bg-[#00FFE9]/10 text-[#00FFE9] hover:bg-[#00FFE9]/20 text-sm font-medium">
              Transfer
            </button>
            <button className="px-4 py-2 rounded bg-[#00FFE9]/10 text-[#00FFE9] hover:bg-[#00FFE9]/20 text-sm font-medium">
              ...
            </button>
          </div>
        </div>

        {/* Network Balances Side by Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Ethereum Balance */}
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center">
                <img src="/logos/eth-logo.png" alt="" />
              </div>
              <span className="text-sm font-medium text-white/80">
                Ethereum
              </span>
            </div>

            <div>
              <p className="text-xs text-white/50 mb-1">Estimated Balance</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl md:text-3xl font-semibold text-white">
                  ${bal.toFixed(2)}
                </span>
                <span className="text-sm text-white/60">USD</span>
              </div>
              <p className="text-xs text-white/40 mt-1">Chain ID: 1</p>
            </div>
          </div>

          {/* Katana Balance */}
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center">
                <img src="/logos/katana-logo.jpg" alt="" />
              </div>
              <span className="text-sm font-medium text-white/80">Katana</span>
            </div>

            <div>
              <p className="text-xs text-white/50 mb-1">Estimated Balance</p>
              {katanaLoading ? (
                <div className="flex items-baseline gap-2">
                  <div className="h-8 bg-white/10 rounded animate-pulse w-24"></div>
                  <span className="text-sm text-white/60">USD</span>
                </div>
              ) : katanaError ? (
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl md:text-3xl font-semibold text-red-400">
                    Error
                  </span>
                  <span className="text-sm text-white/60">USD</span>
                </div>
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl md:text-3xl font-semibold text-white">
                    ${katanaBalance.toFixed(2)}
                  </span>
                  <span className="text-sm text-white/60">USD</span>
                </div>
              )}
              <p className="text-xs text-white/40 mt-1">Chain ID: 747474</p>
            </div>
          </div>
        </div>

        {/* Total Portfolio Value */}
        <div className="border-t border-white/10 pt-4">
          <div className="flex justify-between items-center">
            <span className="text-white/70">Total Portfolio Value:</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-semibold text-[#00FFE9]">
                ${katanaLoading ? "..." : (bal + katanaBalance).toFixed(2)}
              </span>
              <span className="text-sm text-white/60">USD</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
