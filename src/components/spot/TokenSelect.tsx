// components/spot/TokenSelect.tsx
"use client";
import { useSpotStore } from "@/store/spotStore";
import { useTokenSelectModal } from "@/context/TokenSelectModalContext";
import React from "react";
import SearchIcon from "@mui/icons-material/Search";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";

interface TokenSelectProps {
  activeTab: "swap" | "limit";
}

const TokenSelect: React.FC<TokenSelectProps> = ({ activeTab }) => {
  const { tokenOne, openModal } = useSpotStore();
  const { openLimitTokenModal } = useTokenSelectModal();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (activeTab === "swap") {
      // Classic swap behavior
      openModal("tokenOne");
    } else if (activeTab === "limit") {
      // Limit order behavior - open token0 (selling token)
      openLimitTokenModal("token0");
    }
  };

  return (
    <div
      onClick={handleClick}
      className="relative cursor-pointer"
      role="button"
      tabIndex={0}
    >
      {/* Search Input Appearance */}
      <div className="neon-bg max-w-xs px-4 py-3 rounded-lg flex items-center gap-3 border border-gray-600 hover:border-gray-500 transition-colors duration-200">
        {/* Search Icon */}
        <SearchIcon className="text-gray-400 w-5 h-5" />

        {/* Token Display or Placeholder */}
        <div className="flex items-center gap-3 flex-1">
          <span className="text-gray-400">Search for a token...</span>
        </div>

        {/* Dropdown Arrow */}
        <ArrowDropDownIcon className="text-gray-400 w-5 h-5" />
      </div>
    </div>
  );
};

export default TokenSelect;
