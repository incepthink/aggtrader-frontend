import React from "react";

export default function EstimatedBalanceCard({ bal }: any) {
  return (
    <div className="neon-panel">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        {/* Balance Info */}
        <div>
          <p className="text-sm text-white/60">Estimated Balance</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-4xl font-semibold text-white">{bal}</span>
            <span className="text-lg text-white/60">USDT</span>
          </div>
          <p className="text-sm text-white/40 mt-1">~{bal} USD</p>
        </div>

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
    </div>
  );
}
