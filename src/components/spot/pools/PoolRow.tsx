// src/components/common/spot/pools/PoolRow.tsx

import React from "react";
import { Pool } from "./types";
import { PoolTokenIcon } from "./PoolTokenIcon";

interface PoolRowProps {
  pool: Pool;
  onClick?: () => void;
}

export const PoolRow: React.FC<PoolRowProps> = ({ pool, onClick }) => {
  const formatUSD = (value: number) => {
    if (value >= 1_000_000) {
      return `$${(value / 1_000_000).toFixed(2)}m`;
    }
    if (value >= 1_000) {
      return `$${(value / 1_000).toFixed(2)}k`;
    }
    return `$${value.toFixed(2)}`;
  };

  const formatPercent = (value: number) => {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(2)}%`;
  };

  const getChangeColor = (value: number) => {
    if (value > 0) return "text-green-400";
    if (value < 0) return "text-red-400";
    return "text-gray-400";
  };

  return (
    <div
      onClick={onClick}
      className="grid grid-cols-7 gap-2 sm:gap-4 items-center px-3 sm:px-4 py-3 sm:py-4 hover:bg-gray-800/20 cursor-pointer transition-colors"
    >
      {/* Name */}
      <div className="col-span-2 flex items-center gap-2 sm:gap-3">
        <PoolTokenIcon
          token0Symbol={pool.token0Symbol}
          token1Symbol={pool.token1Symbol}
          token0LogoUri={pool.token0LogoUri}
          token1LogoUri={pool.token1LogoUri}
          size={28}
        />
        <div className="flex flex-col min-w-0">
          <span className="text-xs sm:text-sm font-medium text-white truncate">
            {pool.name}
          </span>
          <div className="flex items-center gap-1 sm:gap-2 mt-0.5">
            <span className="text-[10px] sm:text-xs text-gray-400 bg-gray-800/50 px-1.5 sm:px-2 py-0.5 rounded">
              V3
            </span>
            <span className="text-[10px] sm:text-xs text-gray-400 bg-gray-800/50 px-1.5 sm:px-2 py-0.5 rounded">
              {(pool.swapFee * 100).toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      {/* TVL */}
      <div className="flex flex-col">
        <span className="text-xs sm:text-sm font-medium text-white">
          {formatUSD(pool.liquidityUSD)}
        </span>
        <span
          className={`text-[10px] sm:text-xs ${getChangeColor(
            pool.liquidityUSDChange1d
          )}`}
        >
          {formatPercent(pool.liquidityUSDChange1d)}
        </span>
      </div>

      {/* Volume (24h) */}
      <div className="flex flex-col">
        <span className="text-xs sm:text-sm font-medium text-white">
          {formatUSD(pool.volumeUSD1d)}
        </span>
        <span
          className={`text-[10px] sm:text-xs ${getChangeColor(
            pool.volumeUSDChange1d
          )}`}
        >
          {formatPercent(pool.volumeUSDChange1d)}
        </span>
      </div>

      {/* Volume (1w) */}
      <div className="flex flex-col">
        <span className="text-xs sm:text-sm font-medium text-white">
          {formatUSD(pool.volumeUSD1w)}
        </span>
        <span
          className={`text-[10px] sm:text-xs ${getChangeColor(
            pool.volumeUSDChange1w
          )}`}
        >
          {formatPercent(pool.volumeUSDChange1w)}
        </span>
      </div>

      {/* Transactions (24h) */}
      <div className="text-xs sm:text-sm font-medium text-white">
        {pool.txCount1d}
      </div>

      {/* APR */}
      <div className="text-xs sm:text-sm font-medium text-white">
        {formatPercent(pool.totalApr1d)}
      </div>
    </div>
  );
};
