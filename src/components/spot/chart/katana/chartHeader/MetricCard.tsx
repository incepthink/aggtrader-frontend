import React from "react";
import { MetricDisplayMode } from "./types";

interface MetricCardProps {
  label: string;
  value: string | React.ReactNode;
  isClickable?: boolean;
  onClick?: () => void;
  colorClass?: string;
  disabled?: boolean;
  variant?: "grid" | "row";
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  isClickable = false,
  onClick,
  colorClass = "text-white",
  disabled = false,
  variant = "grid",
}) => {
  const isRowVariant = variant === "row";
  const alignmentClass = isRowVariant ? "items-start" : "items-start";
  const textAlignClass = isRowVariant ? "text-left" : "text-left";

  return (
    <div className={`flex flex-col ${alignmentClass}`}>
      <p className={`text-xs text-gray-400 mb-1 ${textAlignClass}`}>{label}</p>
      {isClickable ? (
        <button
          onClick={onClick}
          className={`text-sm font-medium hover:opacity-80 transition-opacity cursor-pointer ${textAlignClass} ${colorClass}`}
          disabled={disabled}
        >
          {value}
        </button>
      ) : (
        <p className={`text-sm font-medium ${textAlignClass} ${colorClass}`}>
          {value}
        </p>
      )}
    </div>
  );
};
