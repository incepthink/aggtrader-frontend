"use client";

import React from "react";
import { useDerivedStateTwap } from "../../../store/limit-order/derivedstate-twap-provider";
import { TimeUnit } from "@orbs-network/twap-sdk";

const EXPIRATION_OPTIONS = [
  {
    label: "1 day",
    value: { unit: TimeUnit.Days, value: 1 },
  },
  {
    label: "1 week",
    value: { unit: TimeUnit.Days, value: 7 },
  },
  {
    label: "1 month",
    value: { unit: TimeUnit.Days, value: 30 },
  },
  {
    label: "1 year",
    value: { unit: TimeUnit.Days, value: 365 },
  },
];

export const LimitExpiryInput = () => {
  const {
    state: { expiry },
    mutate: { setExpiry },
  } = useDerivedStateTwap();

  const isSelected = (option: any) => {
    return (
      expiry?.unit === option.value.unit && expiry?.value === option.value.value
    );
  };

  return (
    <div className="flex flex-wrap justify-between items-center py-3 px-1">
      <span className="text-gray-400 font-medium whitespace-nowrap mr-4 mb-2">
        Expires in
      </span>

      <div className="flex gap-2 flex-wrap">
        {EXPIRATION_OPTIONS.map((option) => (
          <button
            key={`${option.value.unit}-${option.value.value}`}
            onClick={() => setExpiry(option.value)}
            className={`px-4 py-1 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
              isSelected(option)
                ? "bg-[#00F5E0] text-black"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};
