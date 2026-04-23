"use client";
import React from "react";
import { Box, Typography } from "@mui/material";
import { ProjectedEarnings as ProjectedEarningsType } from "./vault";

interface ProjectedEarningsProps {
  current: ProjectedEarningsType;
  projected: ProjectedEarningsType;
  hasAmount: boolean;
  mode?: "deposit" | "withdraw";
}

export const ProjectedEarnings: React.FC<ProjectedEarningsProps> = ({
  current,
  projected,
  hasAmount,
  mode = "deposit",
}) => {
  const currentMonthly = current.monthlyUsd;
  const projectedMonthly = projected.monthlyUsd;
  const currentYearly = current.yearlyUsd;
  const projectedYearly = projected.yearlyUsd;

  const hasChange = hasAmount && projectedMonthly !== currentMonthly;
  const changeColor = mode === "withdraw" ? "#ef4444" : "#00F5E0";
  const changePrefix = mode === "withdraw" ? "-" : "+";

  const EarningsColumn = ({
    label,
    currentVal,
    projectedVal,
  }: {
    label: string;
    currentVal: number;
    projectedVal: number;
  }) => (
    <Box sx={{ flex: 1 }}>
      <Typography
        variant="caption"
        sx={{
          color: "#8b949e",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          fontSize: "10px",
          display: "block",
          mb: 1,
        }}
      >
        {label}
      </Typography>

      {/* Current value */}
      <Typography variant="body2" sx={{ color: "white", fontWeight: 500 }}>
        ${currentVal.toFixed(4)}
      </Typography>

      {/* Arrow + projected */}
      {hasChange && (
        <Box sx={{ mt: 0.75 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Typography variant="caption" sx={{ color: "#8b949e" }}>→</Typography>
            <Typography
              variant="body2"
              sx={{ color: changeColor, fontWeight: "bold" }}
            >
              ${projectedVal.toFixed(4)}
            </Typography>
          </Box>
          <Typography
            variant="caption"
            sx={{
              color: changeColor,
              opacity: 0.75,
              fontSize: "10px",
              display: "block",
              mt: 0.25,
            }}
          >
            {changePrefix}${Math.abs(projectedVal - currentVal).toFixed(4)}
          </Typography>
        </Box>
      )}
    </Box>
  );

  return (
    <Box sx={{ mb: 2 }}>
      <Typography
        variant="caption"
        sx={{
          color: "#8b949e",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          fontSize: "11px",
          fontWeight: 500,
          display: "block",
          mb: 1.5,
        }}
      >
        Projected Earnings
      </Typography>

      <Box
        sx={{
          border: "1px solid rgba(0, 245, 224, 0.08)",
          borderRadius: 2,
          backgroundColor: "rgba(0, 245, 224, 0.02)",
          p: 2,
        }}
      >
        <Box sx={{ display: "flex", gap: 2 }}>
          <EarningsColumn
            label="Monthly (USD)"
            currentVal={currentMonthly}
            projectedVal={projectedMonthly}
          />

          {/* Vertical divider */}
          <Box
            sx={{
              width: "1px",
              backgroundColor: "rgba(0, 245, 224, 0.08)",
              alignSelf: "stretch",
            }}
          />

          <EarningsColumn
            label="Yearly (USD)"
            currentVal={currentYearly}
            projectedVal={projectedYearly}
          />
        </Box>

        {hasAmount && (
          <Typography
            variant="caption"
            sx={{
              color: changeColor,
              opacity: 0.6,
              fontSize: "10px",
              display: "block",
              mt: 1.5,
              pt: 1.5,
              borderTop: "1px solid rgba(0, 245, 224, 0.06)",
            }}
          >
            {mode === "withdraw"
              ? "Reduced earnings after withdrawal"
              : "Additional earnings from deposit"}
          </Typography>
        )}
      </Box>
    </Box>
  );
};
