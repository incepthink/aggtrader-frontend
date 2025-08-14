// components/swap/TokenSelectionModal.tsx
"use client";

import { Modal } from "antd";
import React from "react";
import { TOKENS } from "@/utils/spot/TokenList";
import type { Token } from "@/types/swap.types";

interface TokenSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTokenSelect: (token: Token) => void;
  currentTokenOne: Token;
  title?: string;
}

export const TokenSelectionModal: React.FC<TokenSelectionModalProps> = ({
  isOpen,
  onClose,
  onTokenSelect,
  currentTokenOne,
  title = "Select a token",
}) => {
  const handleTokenSelect = (token: Token) => {
    onTokenSelect(token);
    onClose();
  };

  return (
    <Modal open={isOpen} footer={null} onCancel={onClose} title={title}>
      <div className="modalContent">
        {(TOKENS as Token[]).map((token, i) => (
          <div
            key={i}
            className="tokenChoice"
            onClick={() => handleTokenSelect(token)}
          >
            <img src={token.img} alt={token.ticker} className="tokenLogo" />
            <div className="tokenChoiceNames">
              <div className="tokenName">{token.name}</div>
              <div className="tokenTicker">{token.ticker}</div>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
};
