// /components/lend-morpho/borrow/market/BorrowForm/BorrowRepayHeader.tsx
"use client";

import React from "react";
import { Box, Tabs, Tab, Typography } from "@mui/material";

interface BorrowRepayHeaderProps {
  currentTab: "borrow" | "repay";
  onTabChange: (tab: "borrow" | "repay") => void;
  collateralSymbol: string;
  loanSymbol: string;
  hasPosition: boolean;
}

export const BorrowRepayHeader: React.FC<BorrowRepayHeaderProps> = ({
  currentTab,
  onTabChange,
  collateralSymbol,
  loanSymbol,
  hasPosition,
}) => {
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    onTabChange(newValue === 0 ? "borrow" : "repay");
  };

  return (
    <Box sx={{ borderBottom: 1, borderColor: "#2d3748", mb: 3 }}>
      <Tabs
        value={currentTab === "borrow" ? 0 : 1}
        onChange={handleTabChange}
        variant="fullWidth"
        sx={{
          "& .MuiTab-root": {
            color: "#8b949e",
            textTransform: "none",
            fontSize: "16px",
            fontWeight: "600",
            "&.Mui-selected": {
              color: "#58a6ff",
            },
          },
          "& .MuiTabs-indicator": {
            backgroundColor: "#58a6ff",
          },
        }}
      >
        <Tab
          label="Borrow"
          sx={{
            "&.Mui-selected": {
              color: "#f44336 !important",
            },
          }}
        />
        <Tab
          label="Repay"
          sx={{
            "&.Mui-selected": {
              color: "#4caf50 !important",
            },
          }}
        />
      </Tabs>

      {/* Market Info */}
      <Box sx={{ pt: 2, pb: 1 }}>
        <Typography variant="body2" sx={{ color: "#8b949e", mb: 1 }}>
          {currentTab === "borrow"
            ? `Supply ${collateralSymbol} to borrow ${loanSymbol}`
            : `Repay your ${loanSymbol} debt`}
        </Typography>

        {!hasPosition && currentTab === "repay" && (
          <Typography variant="body2" sx={{ color: "#f59e0b" }}>
            No active debt position found
          </Typography>
        )}
      </Box>
    </Box>
  );
};
