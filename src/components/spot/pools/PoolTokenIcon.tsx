// src/components/common/spot/pools/PoolTokenIcon.tsx

import React from "react";
import Image from "next/image";

interface PoolTokenIconProps {
  token0Symbol: string;
  token1Symbol: string;
  token0LogoUri: string | null;
  token1LogoUri: string | null;
  size?: number;
}

export const PoolTokenIcon: React.FC<PoolTokenIconProps> = ({
  token0Symbol,
  token1Symbol,
  token0LogoUri,
  token1LogoUri,
  size = 32,
}) => {
  const getFallbackLogo = (symbol: string) => {
    return `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${symbol}/logo.png`;
  };

  return (
    <div className="flex items-center -space-x-2">
      {/* Token 0 */}
      <div
        className="relative rounded-full border-2 border-gray-900 bg-gray-800 overflow-hidden z-10"
        style={{ width: size, height: size }}
      >
        {token0LogoUri ? (
          <Image
            src={token0LogoUri}
            alt={token0Symbol}
            width={size}
            height={size}
            className="object-cover"
            onError={(e) => {
              // Fallback to placeholder on error
              const target = e.target as HTMLImageElement;
              target.src = getFallbackLogo(token0Symbol);
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-400">
            {token0Symbol.slice(0, 2)}
          </div>
        )}
      </div>

      {/* Token 1 */}
      <div
        className="relative rounded-full border-2 border-gray-900 bg-gray-800 overflow-hidden"
        style={{ width: size, height: size }}
      >
        {token1LogoUri ? (
          <Image
            src={token1LogoUri}
            alt={token1Symbol}
            width={size}
            height={size}
            className="object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = getFallbackLogo(token1Symbol);
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-400">
            {token1Symbol.slice(0, 2)}
          </div>
        )}
      </div>
    </div>
  );
};
