// components/limit-widget/LimitTokenSelectionModal.tsx
"use client";

import React, {
  type FC,
  useCallback,
  useState,
  useMemo,
  useEffect,
} from "react";
import { CircularProgress, Avatar, Chip } from "@mui/material";
import { Close as CloseIcon, Search as SearchIcon } from "@mui/icons-material";
import { AnimatePresence, motion } from "framer-motion";
import { useAccount, useBalance, type UseBalanceParameters } from "wagmi";
import type { GetBalanceReturnType } from "@wagmi/core";
import {
  useTokensBackend,
  type TokenData,
} from "../../../hooks/useTokensBackend";
import { convertTokenDataToToken } from "@/store/limit-order/utils/simpleCurrency";
import type { Token } from "@/store/limit-order/utils/token.types";
import { isNativeToken } from "@/store/limit-order/utils/token.types";
import { useSpotStore } from "@/store/spotStore";

const PRIORITY_TOKENS = ["ETH", "WETH", "USDC", "USDT", "WBTC", "BNB", "MATIC"];

// Balance-fetching row — logic unchanged, only JSX redesigned
interface LimitTokenRowProps {
  tokenData: TokenData;
  isSelected: boolean;
  isOtherToken: boolean;
  onClick: () => void;
  address?: `0x${string}`;
  chainId: number;
  modalTokenPosition: "tokenOne" | "tokenTwo" | undefined;
  activeTab: "popular" | "all";
}

const LimitTokenRow: FC<LimitTokenRowProps> = ({
  tokenData,
  isSelected,
  isOtherToken,
  onClick,
  address,
  chainId,
  modalTokenPosition,
  activeTab,
}) => {
  const [hovered, setHovered] = useState(false);

  const token = useMemo(() => convertTokenDataToToken(tokenData), [tokenData]);

  const balanceArgs = useMemo<UseBalanceParameters | undefined>(() => {
    if (!address) return undefined;
    const native = isNativeToken(token);
    return {
      address,
      ...(native ? {} : { token: token.address as `0x${string}` }),
      chainId,
      query: { enabled: true },
    };
  }, [address, token, chainId]);

  const { data: balanceRaw, isLoading: isBalanceLoading } = useBalance(balanceArgs);
  const balance = balanceRaw as GetBalanceReturnType | undefined;

  const formattedBalance = useMemo(() => {
    if (!balance) return undefined;
    const num = Number(balance.formatted);
    if (Number.isNaN(num)) return undefined;
    if (num === 0) return undefined;
    if (num < 0.0001) return "< 0.0001";
    if (num < 1) return num.toFixed(4);
    if (num < 1000) return num.toFixed(2);
    return num.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }, [balance]);

  const isPriority = PRIORITY_TOKENS.includes(tokenData.symbol?.toUpperCase() || "");

  const bgColor = isSelected
    ? "rgba(0, 245, 224, 0.08)"
    : hovered
      ? "rgba(255, 255, 255, 0.04)"
      : "transparent";

  const borderLeft = isSelected
    ? "3px solid #00F5E0"
    : hovered
      ? "3px solid rgba(0, 245, 224, 0.35)"
      : "3px solid transparent";

  return (
    <button
      id={`limit-token-item-${tokenData.symbol}`}
      data-testid={`limit-token-item-${tokenData.symbol}`}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        width: "100%",
        padding: "10px 20px 10px 17px",
        background: bgColor,
        borderLeft,
        border: "none",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        cursor: "pointer",
        textAlign: "left",
        transition: "background 0.18s ease, border-left-color 0.18s ease",
      }}
    >
      {/* Token avatar */}
      <div style={{ flexShrink: 0 }}>
        <Avatar
          src={tokenData.logoURI}
          sx={{
            width: 36,
            height: 36,
            bgcolor: "rgba(255,255,255,0.08)",
            color: "rgba(255,255,255,0.7)",
            fontSize: 12,
            fontWeight: 700,
            border: isSelected
              ? "1.5px solid rgba(0,245,224,0.5)"
              : "1.5px solid rgba(255,255,255,0.08)",
          }}
        >
          {!tokenData.logoURI && tokenData.symbol?.slice(0, 2).toUpperCase()}
        </Avatar>
      </div>

      {/* Token info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span
            style={{
              color: isSelected ? "#00F5E0" : "#fff",
              fontSize: 14,
              fontWeight: isPriority ? 600 : 500,
              transition: "color 0.18s ease",
            }}
          >
            {tokenData.symbol}
          </span>
          {isPriority && activeTab === "all" && (
            <Chip
              label="Popular"
              size="small"
              sx={{
                bgcolor: "rgba(0,245,224,0.12)",
                color: "#00F5E0",
                fontSize: "0.65rem",
                height: 18,
                border: "1px solid rgba(0,245,224,0.25)",
              }}
            />
          )}
          {isSelected && (
            <Chip
              label="Selected"
              size="small"
              sx={{
                bgcolor: "rgba(0,245,224,0.15)",
                color: "#00F5E0",
                fontSize: "0.65rem",
                height: 18,
                border: "1px solid rgba(0,245,224,0.3)",
              }}
            />
          )}
          {isOtherToken && (
            <Chip
              label={modalTokenPosition === "tokenOne" ? "Currently buying" : "Currently selling"}
              size="small"
              sx={{
                bgcolor: "rgba(255,165,0,0.12)",
                color: "#FFA500",
                fontSize: "0.65rem",
                height: 18,
                border: "1px solid rgba(255,165,0,0.25)",
              }}
            />
          )}
        </div>
        <div
          style={{
            color: "rgba(255,255,255,0.4)",
            fontSize: 12,
            marginTop: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {tokenData.name}
        </div>
      </div>

      {/* Balance */}
      <div style={{ flexShrink: 0, textAlign: "right", minWidth: 48 }}>
        {isBalanceLoading ? (
          <CircularProgress size={14} sx={{ color: "#00F5E0" }} />
        ) : formattedBalance ? (
          <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>
            {formattedBalance}
          </span>
        ) : null}
      </div>
    </button>
  );
};

interface LimitTokenSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (token: Token) => void;
  selectedToken?: Token;
  otherToken?: Token;
  chainId: number;
  title?: string;
  modalTokenPosition?: "tokenOne" | "tokenTwo";
}

export const LimitTokenSelectionModal: FC<LimitTokenSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  selectedToken,
  otherToken,
  chainId,
  title = "Select a token",
  modalTokenPosition,
}) => {
  const { address } = useAccount();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"popular" | "all">("popular");

  const { setTokenOne, setTokenTwo } = useSpotStore();
  const { tokens: rawTokens, isLoading, isError } = useTokensBackend(chainId);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      setActiveTab("popular");
    }
  }, [isOpen]);

  // Lock body scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const { priorityTokens, allTokens } = useMemo(() => {
    if (!rawTokens || rawTokens.length === 0)
      return { priorityTokens: [], allTokens: [] };

    const priority: TokenData[] = [];
    const regular: TokenData[] = [];

    rawTokens.forEach((token) => {
      if (PRIORITY_TOKENS.includes(token.symbol?.toUpperCase() || "")) {
        priority.push(token);
      } else {
        regular.push(token);
      }
    });

    priority.sort((a, b) => {
      const aIndex = PRIORITY_TOKENS.indexOf(a.symbol?.toUpperCase() || "");
      const bIndex = PRIORITY_TOKENS.indexOf(b.symbol?.toUpperCase() || "");
      return aIndex - bIndex;
    });

    regular.sort((a, b) => (a.symbol || "").localeCompare(b.symbol || ""));

    return {
      priorityTokens: priority,
      allTokens: [...priority, ...regular],
    };
  }, [rawTokens]);

  const tokensToShow = useMemo(
    () => (activeTab === "popular" ? priorityTokens : allTokens),
    [activeTab, priorityTokens, allTokens],
  );

  const filteredTokens = useMemo(() => {
    if (!searchQuery.trim()) return tokensToShow;
    const query = searchQuery.toLowerCase();
    return allTokens.filter(
      (token) =>
        token.symbol?.toLowerCase().includes(query) ||
        token.name?.toLowerCase().includes(query),
    );
  }, [tokensToShow, searchQuery, allTokens]);

  const handleSelect = useCallback(
    (tokenData: TokenData) => {
      const selectedTokenObj = convertTokenDataToToken(tokenData);

      onSelect(selectedTokenObj);

      const spotStoreToken = {
        name: selectedTokenObj.name,
        ticker: selectedTokenObj.ticker,
        img: selectedTokenObj.img,
        address: selectedTokenObj.address,
        decimals: selectedTokenObj.decimals,
        chainId: selectedTokenObj.chainId,
      };

      if (modalTokenPosition === "tokenOne") {
        setTokenOne(spotStoreToken);
      } else if (modalTokenPosition === "tokenTwo") {
        setTokenTwo(spotStoreToken);
      } else {
        setTokenOne(spotStoreToken);
      }

      onClose();
    },
    [onSelect, onClose, modalTokenPosition, setTokenOne, setTokenTwo],
  );

  const handleClose = useCallback(() => onClose(), [onClose]);

  if (isError) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="limit-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={handleClose}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 1200,
              background: "rgba(0, 0, 0, 0.7)",
              backdropFilter: "blur(2px)",
              WebkitBackdropFilter: "blur(8px)",
            }}
          />

          {/* Modal panel */}
          <motion.div
            key="limit-panel"
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: "spring", damping: 28, stiffness: 350 }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 1201,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            <div
              data-testid="limit-token-selection-modal"
              onClick={(e) => e.stopPropagation()}
              style={{
                pointerEvents: "auto",
                width: "100%",
                maxWidth: 480,
                margin: "0 16px",
                maxHeight: "82vh",
                display: "flex",
                flexDirection: "column",
                background: "rgba(5, 5, 18, 0.88)",
                backdropFilter: "blur(40px)",
                WebkitBackdropFilter: "blur(40px)",
                border: "1px solid rgba(0, 255, 233, 0.15)",
                boxShadow:
                  "inset 0 0 0 1px rgba(0, 255, 233, 0.08), inset 0 4px 40px rgba(0, 255, 233, 0.04), 0 32px 80px rgba(0, 0, 0, 0.6)",
                borderRadius: 20,
                overflow: "hidden",
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "20px 24px 18px",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.07)",
                  flexShrink: 0,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span
                    style={{
                      display: "inline-block",
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "#00F5E0",
                      boxShadow: "0 0 8px #00F5E0, 0 0 16px rgba(0,245,224,0.4)",
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      color: "#fff",
                      fontSize: 17,
                      fontWeight: 600,
                      letterSpacing: "-0.2px",
                    }}
                  >
                    {title}
                  </span>
                </div>
                <button
                  onClick={handleClose}
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 8,
                    color: "rgba(255,255,255,0.55)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 32,
                    height: 32,
                    transition: "all 0.2s ease",
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.12)";
                    e.currentTarget.style.color = "#fff";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                    e.currentTarget.style.color = "rgba(255,255,255,0.55)";
                  }}
                >
                  <CloseIcon style={{ fontSize: 16 }} />
                </button>
              </div>

              {/* Search + Tabs */}
              <div style={{ padding: "18px 20px 14px", flexShrink: 0 }}>
                {/* Search input */}
                <div style={{ position: "relative", marginBottom: 14 }}>
                  <SearchIcon
                    style={{
                      position: "absolute",
                      left: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#00F5E0",
                      fontSize: 18,
                      pointerEvents: "none",
                    }}
                  />
                  <input
                    id="limit-token-search-input"
                    data-testid="limit-token-search-input"
                    type="text"
                    placeholder="Search by name or symbol"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoComplete="off"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 12,
                      padding: "10px 14px 10px 38px",
                      color: "#fff",
                      fontSize: 14,
                      outline: "none",
                      transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#00F5E0";
                      e.target.style.boxShadow = "0 0 0 2px rgba(0,245,224,0.15)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "rgba(255,255,255,0.1)";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                  <style>{`#limit-token-search-input::placeholder { color: rgba(255,255,255,0.35) !important; }`}</style>
                </div>

                {/* Custom pill tabs */}
                <div
                  style={{
                    display: "flex",
                    background: "rgba(255,255,255,0.05)",
                    borderRadius: 12,
                    padding: 4,
                    gap: 4,
                  }}
                >
                  {(["popular", "all"] as const).map((tab) => {
                    const isActive = activeTab === tab;
                    const label =
                      tab === "popular"
                        ? `Popular (${priorityTokens.length})`
                        : `All Tokens (${allTokens.length})`;
                    return (
                      <button
                        key={tab}
                        id={tab === "popular" ? "limit-popular-tokens-tab" : "limit-all-tokens-tab"}
                        onClick={() => setActiveTab(tab)}
                        style={{
                          flex: 1,
                          padding: "8px 0",
                          borderRadius: 9,
                          border: "none",
                          cursor: "pointer",
                          fontSize: 13,
                          fontWeight: isActive ? 600 : 500,
                          transition: "all 0.2s ease",
                          background: isActive ? "#00F5E0" : "transparent",
                          color: isActive ? "#000" : "rgba(255,255,255,0.5)",
                          boxShadow: isActive ? "0 0 12px rgba(0,245,224,0.3)" : "none",
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) e.currentTarget.style.color = "rgba(255,255,255,0.85)";
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) e.currentTarget.style.color = "rgba(255,255,255,0.5)";
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Token list */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  borderTop: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                {isLoading ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "48px 0",
                      gap: 12,
                    }}
                  >
                    <CircularProgress size={32} sx={{ color: "#00F5E0" }} />
                    <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 13 }}>
                      Loading tokens...
                    </span>
                  </div>
                ) : filteredTokens.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "56px 24px",
                      color: "rgba(255,255,255,0.35)",
                      fontSize: 14,
                    }}
                  >
                    {searchQuery
                      ? "No tokens found matching your search"
                      : `No ${activeTab} tokens available`}
                  </div>
                ) : (
                  <>
                    <div
                      style={{
                        padding: "10px 20px 6px",
                        color: "rgba(255,255,255,0.4)",
                        fontSize: 11,
                        fontWeight: 500,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                      }}
                    >
                      {searchQuery
                        ? `${filteredTokens.length} results`
                        : `${filteredTokens.length} ${activeTab === "popular" ? "popular" : ""} tokens`}
                    </div>
                    <div>
                      {filteredTokens.map((token: TokenData, index) => {
                        const isCurrentlySelected = selectedToken?.address === token.address;
                        const isOtherToken = otherToken?.address === token.address;

                        return (
                          <LimitTokenRow
                            key={`${token.address}-${index}`}
                            tokenData={token}
                            isSelected={isCurrentlySelected}
                            isOtherToken={isOtherToken}
                            onClick={() => handleSelect(token)}
                            address={address}
                            chainId={chainId}
                            modalTokenPosition={modalTokenPosition}
                            activeTab={activeTab}
                          />
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* Footer */}
              <div
                style={{
                  padding: "10px 20px",
                  borderTop: "1px solid rgba(255,255,255,0.06)",
                  background: "rgba(0,0,0,0.15)",
                  flexShrink: 0,
                }}
              >
                <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>
                  {searchQuery
                    ? `Showing ${filteredTokens.length} results for "${searchQuery}"`
                    : `${activeTab === "popular" ? priorityTokens.length : allTokens.length} ${activeTab} tokens on Katana`}
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
