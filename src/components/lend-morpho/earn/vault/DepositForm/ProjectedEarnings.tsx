// components/ProjectedEarnings.tsx
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
  const isDecrease = projectedMonthly < currentMonthly;

  // Colors based on mode
  const changeColor = mode === "withdraw" ? "#ef4444" : "#4caf50";
  const changePrefix = mode === "withdraw" ? "-" : "+";

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="body2" sx={{ color: "#8b949e", mb: 2 }}>
        Projected Earnings
      </Typography>

      {/* Monthly Earnings */}
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
        <Typography variant="body2" sx={{ color: "#8b949e" }}>
          Projected Earnings / Month (USD)
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="body2" sx={{ color: "white" }}>
            ${currentMonthly.toFixed(4)}
          </Typography>

          {hasChange && (
            <>
              <Typography variant="body2" sx={{ color: "#8b949e" }}>
                →
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: changeColor, fontWeight: "medium" }}
              >
                ${projectedMonthly.toFixed(4)}
              </Typography>
              <Typography variant="caption" sx={{ color: changeColor }}>
                ({changePrefix}$
                {Math.abs(projectedMonthly - currentMonthly).toFixed(4)})
              </Typography>
            </>
          )}
        </Box>
      </Box>

      {/* Yearly Earnings */}
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
        <Typography variant="body2" sx={{ color: "#8b949e" }}>
          Projected Earnings / Year (USD)
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="body2" sx={{ color: "white" }}>
            ${currentYearly.toFixed(4)}
          </Typography>

          {hasChange && (
            <>
              <Typography variant="body2" sx={{ color: "#8b949e" }}>
                →
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: changeColor, fontWeight: "medium" }}
              >
                ${projectedYearly.toFixed(4)}
              </Typography>
              <Typography variant="caption" sx={{ color: changeColor }}>
                ({changePrefix}$
                {Math.abs(projectedYearly - currentYearly).toFixed(4)})
              </Typography>
            </>
          )}
        </Box>
      </Box>

      {/* Additional context message */}
      {hasAmount && (
        <Typography
          variant="caption"
          sx={{ color: "#8b949e", mt: 1, display: "block" }}
        >
          {mode === "withdraw"
            ? "Reduced earnings after withdrawal"
            : "Additional earnings from deposit"}
        </Typography>
      )}
    </Box>
  );
};
