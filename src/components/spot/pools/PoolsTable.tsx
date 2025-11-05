// src/components/common/spot/pools/PoolsTable.tsx

import React, { useState } from "react";
import { Pool } from "./types";
import { PoolRow } from "./PoolRow";

interface PoolsTableProps {
  pools: Pool[];
  isLoading: boolean;
}

type SortField =
  | "name"
  | "liquidityUSD"
  | "volumeUSD1d"
  | "volumeUSD1w"
  | "txCount1d"
  | "totalApr1d";
type SortDirection = "asc" | "desc";

export const PoolsTable: React.FC<PoolsTableProps> = ({ pools, isLoading }) => {
  const [sortField, setSortField] = useState<SortField>("liquidityUSD");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const sortedPools = React.useMemo(() => {
    return [...pools].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      if (sortField === "name") {
        const aStr = String(aVal);
        const bStr = String(bVal);
        return sortDirection === "asc"
          ? aStr.localeCompare(bStr)
          : bStr.localeCompare(aStr);
      }

      // Numeric sorting
      const aNum = Number(aVal);
      const bNum = Number(bVal);

      if (sortDirection === "asc") {
        return aNum - bNum;
      } else {
        return bNum - aNum;
      }
    });
  }, [pools, sortField, sortDirection]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <span className="text-gray-600 text-xs sm:text-base">⇅</span>;
    }
    return (
      <span className="text-[#00F5E0] text-xs sm:text-base">
        {sortDirection === "asc" ? "↑" : "↓"}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 sm:py-20">
        <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-t-2 border-b-2 border-[#00F5E0]"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Mobile: Horizontal scroll wrapper */}
      <div className="overflow-x-auto -mx-1 sm:mx-0">
        <div className="min-w-[800px]">
          {/* Header */}
          <div className="grid grid-cols-7 gap-2 sm:gap-4 items-center px-3 sm:px-4 py-3 sm:py-4 bg-gray-800/30 border-b border-gray-700/50">
            <button
              onClick={() => handleSort("name")}
              className="col-span-2 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-semibold text-gray-300 hover:text-white transition-colors text-left"
            >
              Name
              <SortIcon field="name" />
            </button>
            <button
              onClick={() => handleSort("liquidityUSD")}
              className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-semibold text-gray-300 hover:text-white transition-colors text-left"
            >
              TVL
              <SortIcon field="liquidityUSD" />
            </button>
            <button
              onClick={() => handleSort("volumeUSD1d")}
              className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-semibold text-gray-300 hover:text-white transition-colors text-left"
            >
              <span className="hidden sm:inline">Volume (24h)</span>
              <span className="sm:hidden">Vol 24h</span>
              <SortIcon field="volumeUSD1d" />
            </button>
            <button
              onClick={() => handleSort("volumeUSD1w")}
              className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-semibold text-gray-300 hover:text-white transition-colors text-left"
            >
              <span className="hidden sm:inline">Volume (1w)</span>
              <span className="sm:hidden">Vol 1w</span>
              <SortIcon field="volumeUSD1w" />
            </button>
            <button
              onClick={() => handleSort("txCount1d")}
              className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-semibold text-gray-300 hover:text-white transition-colors text-left"
            >
              <span className="hidden sm:inline">Transactions (24h)</span>
              <span className="sm:hidden">Txs</span>
              <SortIcon field="txCount1d" />
            </button>
            <button
              onClick={() => handleSort("totalApr1d")}
              className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-semibold text-gray-300 hover:text-white transition-colors text-left"
            >
              APR
              <SortIcon field="totalApr1d" />
            </button>
          </div>

          {/* Rows */}
          <div className="divide-y divide-gray-800/50">
            {sortedPools.length === 0 ? (
              <div className="flex items-center justify-center py-8 sm:py-12 text-sm sm:text-base text-gray-400">
                No pools found
              </div>
            ) : (
              sortedPools.map((pool) => (
                <PoolRow
                  key={pool.id}
                  pool={pool}
                  onClick={() => {
                    // Handle pool click - navigate to pool detail page
                    console.log("Pool clicked:", pool.id);
                  }}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
