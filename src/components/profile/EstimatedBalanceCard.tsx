import React from "react";
import { useAccount } from "wagmi";
import { useKatanaPortfolio } from "@/hooks/useKatanaPortfolio";
import { CircularProgress } from "@mui/material";
import { useWallet } from "@/lib/yearnfi/lib/contexts/useWallet";

export default function EstimatedBalanceCard() {
  const { address } = useAccount();

  // Get Katana portfolio data
  const {
    totalValue: katanaBalance,
    isLoading: katanaLoading,
    error: katanaError,
  } = useKatanaPortfolio(address || null);

  const { cumulatedValueInV3Vaults, isLoading: vaultsLoading } = useWallet();

  // Calculate total balance
  const totalBalance = katanaBalance + cumulatedValueInV3Vaults;
  const isLoadingTotal = katanaLoading || vaultsLoading;

  return (
    <div className="neon-panel">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        {/* Balance Info */}
        <div>
          <p className="text-sm text-white/60">Estimated Balance</p>
          <div className="flex items-baseline gap-2 mt-1">
            {isLoadingTotal ? (
              <div className="flex items-center h-[60px]">
                <CircularProgress size={20} sx={{ color: "#00FFE9" }} />
              </div>
            ) : katanaError ? (
              <>
                <span className="text-4xl font-semibold text-red-400">
                  Unavailable
                </span>
              </>
            ) : (
              <>
                <span className="text-4xl font-semibold text-white">
                  {totalBalance.toFixed(2)}
                </span>
                <span className="text-lg text-white/60">USD</span>
              </>
            )}
          </div>
          <p className="text-sm text-white/40 mt-1">
            Katana ({katanaBalance.toFixed(2)}) + V3 Vaults (
            {cumulatedValueInV3Vaults.toFixed(2)})
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap gap-3">
          <button className="px-5 py-2 rounded bg-[#00FFE9]/10 opacity-50 cursor-not-allowed text-[#00FFE9] hover:bg-[#00FFE9]/20 text-sm font-medium">
            Deposit
          </button>
          <button className="px-5 py-2 rounded bg-[#00FFE9]/10 opacity-50 cursor-not-allowed text-[#00FFE9] hover:bg-[#00FFE9]/20 text-sm font-medium">
            Withdraw
          </button>
          <button className="px-5 py-2 rounded bg-[#00FFE9]/10 opacity-50 cursor-not-allowed text-[#00FFE9] hover:bg-[#00FFE9]/20 text-sm font-medium">
            Transfer
          </button>
          <button className="px-4 py-2 rounded bg-[#00FFE9]/10 opacity-50 cursor-not-allowed text-[#00FFE9] hover:bg-[#00FFE9]/20 text-sm font-medium">
            ...
          </button>
        </div>
      </div>
    </div>
  );
}
