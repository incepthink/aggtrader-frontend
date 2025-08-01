// components/ChainSwitcher.tsx
"use client";

import React from "react";
import { useChain, SUPPORTED_CHAINS, ChainName } from "@/context/ChainContext";

interface ChainSwitcherProps {
  className?: string;
  variant?: "default" | "compact";
}

const ChainSwitcher: React.FC<ChainSwitcherProps> = ({
  className = "",
  variant = "default",
}) => {
  const { chainName, switchChain, isLoading } = useChain();

  if (isLoading) {
    return (
      <div
        className={`animate-pulse bg-gray-200 rounded-lg h-10 w-32 ${className}`}
      />
    );
  }

  const handleChainSwitch = (newChainName: ChainName) => {
    if (newChainName !== chainName) {
      switchChain(newChainName);
    }
  };

  if (variant === "compact") {
    return (
      <div className={`relative inline-block ${className}`}>
        <select
          value={chainName}
          onChange={(e) => handleChainSwitch(e.target.value as ChainName)}
          className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {Object.entries(SUPPORTED_CHAINS).map(([key, config]) => (
            <option key={key} value={key}>
              {config.name}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
          <svg
            className="fill-current h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
          >
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-100 rounded-lg p-1 ${className}`}>
      <div className="flex space-x-1">
        {Object.entries(SUPPORTED_CHAINS).map(([key, config]) => {
          const isActive = key === chainName;
          return (
            <button
              key={key}
              onClick={() => handleChainSwitch(key as ChainName)}
              className={`
                px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
                ${
                  isActive
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }
              `}
            >
              <div className="flex items-center space-x-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    key === "ETHEREUM" ? "bg-blue-500" : "bg-purple-500"
                  }`}
                />
                <span>{config.name}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ChainSwitcher;
