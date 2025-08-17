// components/swap/SwapInput.tsx
"use client";

import { Input } from "antd";
import React from "react";
import { formatUSDPrice } from "@/utils/spot/swapUtils";

interface SwapInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled: boolean;
  placeholder?: string;
  label: string;
  showPrice?: boolean;
  price?: number | null;
  isLoadingPrice?: boolean;
}

export const SwapInput: React.FC<SwapInputProps> = ({
  value,
  onChange,
  disabled,
  placeholder = "0",
  label,
  showPrice = false,
  price,
  isLoadingPrice = false,
}) => {
  return (
    <div className="input-container">
      <Input
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        type="number"
        style={{ maxWidth: "350px" }}
        className="outline-none focus:outline-none! focus:ring-0! focus:border-transparent focus:shadow-none [&.ant-input:focus]:outline-none [&.ant-input:focus]:shadow-none [&.ant-input:focus]:border-transparent [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-inner-spin-button]:m-0"
      />
      <span className="input-tag">{label}</span>

      {/* Price display */}
      {showPrice && value && (
        <div className="text-sm text-gray-300 font-medium -mt-5 mb-2 px-3">
          {isLoadingPrice ? (
            <div className="animate-pulse bg-gray-600 h-4 w-16 rounded"></div>
          ) : price !== null ? (
            `≈ $${formatUSDPrice(parseFloat(value), price || null)}`
          ) : (
            <div className="text-gray-500">Price unavailable</div>
          )}
        </div>
      )}
    </div>
  );
};
