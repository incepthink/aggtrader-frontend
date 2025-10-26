// components/swap/TokenSelector.tsx
"use client";

import { DownOutlined } from "@ant-design/icons";
import React from "react";
import { formatUnits } from "viem";
import { useAccount, useBalance } from "wagmi";
import type { Token } from "../../../../hooks/sushiswap/useSwapPrices";

interface TokenSelectorProps {
  token: Token;
  onClick: () => void;
  showMaxButton?: boolean;
  onMaxClick?: (balance: string) => void;
  position?: "top" | "bottom";
}

// Balance display component
const BalanceDisplay: React.FC<{
  token: Token;
  showMaxButton?: boolean;
  onMaxClick?: (balance: string) => void;
}> = ({ token, showMaxButton = false, onMaxClick }) => {
  const { address } = useAccount();

  // pulls ERC-20 balance if `token` supplied, native balance otherwise
  let balanceQuery;
  if (token.address === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee") {
    balanceQuery = useBalance({
      address,
    });
  } else {
    balanceQuery = useBalance({
      address,
      token: token.address as `0x${string}`,
    });
  }

  console.log(balanceQuery, "balanceQuery");

  const maxHuman = balanceQuery.data
    ? formatUnits(balanceQuery.data.value, balanceQuery.data.decimals)
    : "0";

  const handleMaxClick = () => {
    if (onMaxClick) {
      onMaxClick(parseFloat(maxHuman).toFixed(8));
    }
  };

  return (
    <div className="max-btn">
      <span>Balance: </span>
      <span>{parseFloat(maxHuman).toFixed(8)}</span>
      {showMaxButton && (
        <span onClick={handleMaxClick} className="max">
          Max
        </span>
      )}
    </div>
  );
};

export const TokenSelector: React.FC<TokenSelectorProps> = ({
  token,
  onClick,
  showMaxButton = false,
  onMaxClick,
  position = "top",
}) => {
  const containerClass =
    position === "top" ? "assetOneContainer" : "assetTowContainer";
  const assetClass = position === "top" ? "assetOne" : "assetTwo";

  return (
    <div className={containerClass}>
      <div className={assetClass} onClick={onClick}>
        <img src={token.img} alt={``} className="assetLogo" />
        <p className="text-white">{token.ticker}</p>
        <DownOutlined />
      </div>

      {/* Always show balance, optionally show max button */}
      <div
        className={
          position === "top" ? "max-btn-container" : "absolute right-5 bottom-4"
        }
      >
        <BalanceDisplay
          token={token}
          showMaxButton={showMaxButton}
          onMaxClick={onMaxClick}
        />
      </div>
    </div>
  );
};
