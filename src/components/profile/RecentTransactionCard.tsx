// src/components/RecentTransactionCard.tsx
import React from "react";

interface RecentTransactionCardProps {
  /** Provide your own image URL or local import */
  placeholderSrc?: string;
}

export default function RecentTransactionCard({
  placeholderSrc = "/images/no-data.svg", // replace with your asset
}: RecentTransactionCardProps) {
  return (
    <div className="neon-panel w-full">
      {/* header */}
      <header className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Recent Transaction</h3>
        <button className="text-xs text-cyan-300 hover:underline">
          View All
        </button>
      </header>

      {/* pill */}
      <div className="mb-6 w-max rounded bg-cyan-400/10 px-4 py-1 text-xs text-cyan-200">
        Lowest Withdrawal Fees Globally
      </div>

      {/* empty-state placeholder */}
      <div className="flex h-[180px] flex-col items-center justify-center gap-4 text-gray-500">
        <img
          src={placeholderSrc}
          alt="No Data"
          className="h-12 w-12 opacity-30"
        />
        <p className="text-sm">No Data</p>
      </div>
    </div>
  );
}
