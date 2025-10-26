// components/swap/SwapSettings.tsx
"use client";

import React, { useState } from "react";
import {
  Popover,
  Typography,
  Paper,
  IconButton,
  Box,
  Button,
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";

interface SwapSettingsProps {
  slippage: number;
  onSlippageChange: (e: any) => void;
}

export const SwapSettings: React.FC<SwapSettingsProps> = ({
  slippage,
  onSlippageChange,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handlePopoverOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
  };

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    // Toggle popover on click for mobile devices
    if (anchorEl) {
      handlePopoverClose();
    } else {
      handlePopoverOpen(event);
    }
  };

  const handleSlippageClick = (value: number) => {
    onSlippageChange({ target: { value } });
  };

  const open = Boolean(anchorEl);

  const slippageOptions = [
    { value: 0.5, label: "0.5%" },
    { value: 2.5, label: "2.5%" },
    { value: 5, label: "5.0%" },
  ];

  return (
    <>
      <div className="flex items-center gap-0.5">
        <p className="text-xs opacity-60">Slippage: {slippage}%</p>
        <IconButton
          onMouseEnter={handlePopoverOpen}
          onClick={handleClick}
          sx={{
            color: "white",
            transition: "all 0.3s",
            "&:hover": {
              transform: "rotate(90deg)",
              color: "#00F5E0",
            },
          }}
        >
          <SettingsIcon sx={{ fontSize: "1.5rem" }} />
        </IconButton>
      </div>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handlePopoverClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        disableRestoreFocus
        slotProps={{
          paper: {
            onMouseLeave: handlePopoverClose,
            sx: {
              backgroundColor: "#0a1929",
              border: "1px solid #1e3a52",
            },
          },
        }}
      >
        <Paper
          sx={{
            p: 2,
            minWidth: 240,
            backgroundColor: "#0a1929",
            color: "white",
            boxShadow: "0 4px 20px rgba(0, 245, 224, 0.1)",
          }}
        >
          <Typography variant="body2" sx={{ mb: 2, color: "#b0bec5" }}>
            Slippage Tolerance
          </Typography>
          <Box
            sx={{
              display: "flex",
              gap: 0,
              backgroundColor: "#1e3a52",
              borderRadius: "8px",
              padding: "0px",
            }}
          >
            {slippageOptions.map((option) => (
              <Button
                key={option.value}
                onClick={() => handleSlippageClick(option.value)}
                sx={{
                  flex: 1,
                  py: 0.5,
                  px: 1,
                  borderRadius: "6px",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  textTransform: "none",
                  backgroundColor:
                    slippage === option.value ? "#00F5E0" : "transparent",
                  color: slippage === option.value ? "#0a1929" : "white",
                  transition: "all 0.2s",
                  "&:hover": {
                    backgroundColor:
                      slippage === option.value
                        ? "#00F5E0"
                        : "rgba(0, 245, 224, 0.1)",
                  },
                }}
              >
                {option.label}
              </Button>
            ))}
          </Box>
        </Paper>
      </Popover>
    </>
  );
};
