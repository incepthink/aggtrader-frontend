"use client";

import React from "react";
import { useDerivedStateTwap } from "../../../store/limit-order/derivedstate-twap-provider";

export const LimitSwitchTokensButton = () => {
  const {
    mutate: { switchTokens },
  } = useDerivedStateTwap();

  return (
    <div className="relative flex items-center justify-center -my-4">
      {/* Left line */}
      <div className="flex-1 h-px bg-gray-600"></div>

      {/* Switch button */}
      <button
        onClick={switchTokens}
        className="group relative z-10 p-3 mx-4 bg-[#00F5E0] hover:bg-[#00F5E0]/90 rounded-full transition-all duration-200 hover:shadow-lg"
      >
        <svg
          className="w-5 h-5 text-black transition-transform duration-200 group-hover:rotate-180"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
          />
        </svg>
      </button>

      {/* Right line */}
      <div className="flex-1 h-px bg-gray-600"></div>
    </div>
  );
};
