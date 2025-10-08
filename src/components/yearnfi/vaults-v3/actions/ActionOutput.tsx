"use client";

import React from "react";
import { Box, Typography, Stack, CircularProgress } from "@mui/material";
import { formatAmount } from "@/lib/yearnfi/lib/utils";

type ActionOutputProps = {
  value: number;
  symbol: string;
  label: string;
  isLoading?: boolean;
  usdValue?: number;
};

export function ActionOutput({
  value,
  symbol,
  label,
  isLoading = false,
  usdValue,
}: ActionOutputProps) {
  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 1 }}
      >
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        {usdValue !== undefined && (
          <Typography variant="caption" color="text.secondary">
            ≈ ${formatAmount(usdValue, 2)}
          </Typography>
        )}
      </Stack>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          p: 2,
          bgcolor: "background.paper",
          borderRadius: 2,
          border: 1,
          borderColor: "divider",
          minHeight: "64px",
        }}
      >
        {isLoading ? (
          <Stack
            direction="row"
            alignItems="center"
            gap={2}
            sx={{ width: "100%" }}
          >
            <CircularProgress size={20} />
            <Typography variant="body2" color="text.secondary">
              Calculating...
            </Typography>
          </Stack>
        ) : (
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ width: "100%" }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: value > 0 ? "text.primary" : "text.disabled",
              }}
            >
              {formatAmount(value, 6)}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontWeight: 500 }}
            >
              {symbol}
            </Typography>
          </Stack>
        )}
      </Box>
    </Box>
  );
}
