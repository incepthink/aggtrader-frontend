"use client";
import { useSpotStore } from "@/store/spotStore";
import React from "react";
import SearchIcon from "@mui/icons-material/Search";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";

const TokenSelect = () => {
  const { tokenOne, openModal } = useSpotStore();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openModal("tokenOne");
  };

  return (
    <div
      onClick={handleClick}
      className="relative cursor-pointer"
      role="button"
      tabIndex={0}
      // onKeyDown={(e) => {
      //   if (e.key === 'Enter' || e.key === ' ') {
      //     e.preventDefault();
      //     openModal("tokenOne");
      //   }
      // }}
    >
      {/* Search Input Appearance */}
      <div className="neon-bg max-w-xs  px-4 py-3 rounded-lg flex items-center gap-3 border border-gray-600 hover:border-gray-500 transition-colors duration-200">
        {/* Search Icon */}
        <SearchIcon className="text-gray-400 w-5 h-5" />
        
        {/* Token Display or Placeholder */}
        <div className="flex items-center gap-3 flex-1">
          {/* {tokenOne ? (
            <>
              <div className="w-6 h-6">
                <img
                  src={tokenOne.img}
                  alt={tokenOne.ticker}
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <span className="text-white font-medium">{tokenOne.ticker}</span>
            </>
          ) : (
            <span className="text-gray-400">Search for a token...</span>
          )} */}
          <span className="text-gray-400">Search for a token...</span>
        </div>
        
        {/* Dropdown Arrow */}
        <ArrowDropDownIcon className="text-gray-400 w-5 h-5" />
      </div>
    </div>
  );
};

export default TokenSelect;