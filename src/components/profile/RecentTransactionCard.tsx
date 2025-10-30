// src/components/RecentTransactionCard.tsx - Updated to show "Coming Soon"
import React from "react";

interface RecentTransactionCardProps {
  /** Provide your own image URL or local import */
  placeholderSrc?: string;
  /** Callback when "View All" is clicked */
  onViewAll?: () => void;
}

export default function RecentTransactionCard({
  placeholderSrc = "/assets/no-data-dark.svg",
  onViewAll,
}: RecentTransactionCardProps) {
  return (
    <div className="neon-panel">
      {/* Header */}
      <header className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-white">
            Recent Transaction
          </h3>
        </div>
      </header>

      {/* Coming Soon state */}
      <div className="flex h-[280px] flex-col items-center justify-center gap-4 text-center">
        <div className="w-16 h-16 bg-white/5 rounded-lg flex items-center justify-center">
          <span className="text-2xl text-white/20">🚀</span>
        </div>
        <div>
          <p className="text-white/80 text-lg font-medium mb-1">
            Coming Soon...
          </p>
          <p className="text-white/40 text-sm">
            Transaction history will be available soon
          </p>
        </div>
      </div>
    </div>
  );
}
