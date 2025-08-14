// components/swap/TokenSelector.tsx
"use client";

import { DownOutlined } from "@ant-design/icons";
import React from "react";
import type { Token } from "@/types/swap.types";
import MaxButton from "./MaxButton";

interface TokenSelectorProps {
  token: Token;
  onClick: () => void;
  showMaxButton?: boolean;
  onMaxClick?: (balance: string) => void;
  position?: "top" | "bottom";
}

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
        <img
          src={token.img}
          alt={`${token.ticker}Logo`}
          className="assetLogo"
        />
        <p className="text-white">{token.ticker}</p>
        <DownOutlined />
      </div>

      {showMaxButton && (
        <div
          className={
            position === "top"
              ? "max-btn-container"
              : "absolute right-5 bottom-6"
          }
        >
          <MaxButton
            token={token.address}
            setToken={onMaxClick || (() => {})}
            showBtn={position === "top"}
          />
        </div>
      )}
    </div>
  );
};
