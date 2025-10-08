"use client";

import React from "react";
import { IconButton, Box } from "@mui/material";
import { SwapVert } from "@mui/icons-material";

type ActionSwitchProps = {
  onSwitch: () => void;
  disabled?: boolean;
};

export function ActionSwitch({
  onSwitch,
  disabled = false,
}: ActionSwitchProps) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        my: 2,
      }}
    >
      <IconButton
        onClick={onSwitch}
        disabled={disabled}
        sx={{
          bgcolor: "primary.dark",
          border: 2,
          borderColor: "divider",
          "&:hover": {
            bgcolor: "primary.main",
            transform: "rotate(180deg)",
            transition: "all 0.3s ease",
          },
        }}
      >
        <SwapVert />
      </IconButton>
    </Box>
  );
}
