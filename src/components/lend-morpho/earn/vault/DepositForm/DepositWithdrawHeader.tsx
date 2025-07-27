// components/DepositWithdrawHeader.tsx
"use client";
import React from "react";
import { Box, Typography, Tabs, Tab, Badge } from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";

interface DepositWithdrawHeaderProps {
  symbol: string;
  currentTab: "deposit" | "withdraw";
  onTabChange: (tab: "deposit" | "withdraw") => void;
  hasPosition: boolean;
  userPosition?: number;
}

export const DepositWithdrawHeader: React.FC<DepositWithdrawHeaderProps> = ({
  symbol,
  currentTab,
  onTabChange,
  hasPosition,
  userPosition = 0,
}) => {
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    onTabChange(newValue === 0 ? "deposit" : "withdraw");
  };

  // If user has no position, show simple deposit header
  if (!hasPosition) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
        <TrendingUpIcon sx={{ color: "#4caf50", fontSize: 20 }} />
        <Typography variant="h6" sx={{ color: "white", fontWeight: "bold" }}>
          Deposit {symbol}
        </Typography>
        <InfoIcon sx={{ color: "#8b949e", fontSize: 16 }} />
      </Box>
    );
  }

  // Show tabbed interface when user has a position
  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
        <Typography variant="h6" sx={{ color: "white", fontWeight: "bold" }}>
          Manage {symbol} Position
        </Typography>

        {/* Position indicator */}
        <Badge
          badgeContent={userPosition.toFixed(2)}
          sx={{
            "& .MuiBadge-badge": {
              backgroundColor: "#4caf50",
              color: "white",
              fontSize: "10px",
              fontWeight: "bold",
              right: -3,
              top: 3,
            },
          }}
        >
          <Box sx={{ width: 8, height: 8 }} />
        </Badge>
      </Box>

      <Tabs
        value={currentTab === "deposit" ? 0 : 1}
        onChange={handleTabChange}
        sx={{
          minHeight: "auto",
          "& .MuiTabs-root": {
            minHeight: "auto",
          },
          "& .MuiTabs-scroller": {
            minHeight: "auto",
          },
          "& .MuiTab-root": {
            color: "#8b949e",
            fontSize: "16px",
            fontWeight: "bold",
            textTransform: "none",
            minHeight: "auto",
            padding: "12px 24px",
            minWidth: "auto",
          },
          "& .MuiTabs-indicator": {
            backgroundColor: currentTab === "withdraw" ? "#ef4444" : "#4caf50",
            height: 3,
            borderRadius: "3px 3px 0 0",
          },
          "& .MuiTabs-flexContainer": {
            gap: 1,
          },
        }}
      >
        <Tab
          icon={<TrendingUpIcon sx={{ fontSize: 18, mb: 0.5 }} />}
          iconPosition="start"
          label="Deposit"
          sx={{
            backgroundColor:
              currentTab === "deposit"
                ? "rgba(76, 175, 80, 0.1)"
                : "transparent",
            borderRadius: "8px 8px 0 0",
            border:
              currentTab === "deposit"
                ? "1px solid rgba(76, 175, 80, 0.3)"
                : "1px solid transparent",
            borderBottom: "none",
            "&.Mui-selected": {
              color: "#4caf50",
            },
            "& .MuiTab-iconWrapper": {
              color: currentTab === "deposit" ? "#4caf50" : "#8b949e",
            },
          }}
        />
        <Tab
          icon={<TrendingDownIcon sx={{ fontSize: 18, mb: 0.5 }} />}
          iconPosition="start"
          label="Withdraw"
          sx={{
            backgroundColor:
              currentTab === "withdraw"
                ? "rgba(239, 68, 68, 0.1)"
                : "transparent",
            borderRadius: "8px 8px 0 0",
            border:
              currentTab === "withdraw"
                ? "1px solid rgba(239, 68, 68, 0.3)"
                : "1px solid transparent",
            borderBottom: "none",
            "&.Mui-selected": {
              color: "#ef4444 !important",
            },
            "& .MuiTab-iconWrapper": {
              color: currentTab === "withdraw" ? "#ef4444" : "#8b949e",
            },
          }}
        />
      </Tabs>
    </Box>
  );
};
