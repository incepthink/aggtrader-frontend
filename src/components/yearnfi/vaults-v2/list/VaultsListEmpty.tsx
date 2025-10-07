"use client";

import React from "react";
import { Box, Typography, Button, Skeleton } from "@mui/material";
import type { TYDaemonVault } from "@/lib/yearnfi/lib/utils/schemas/yDaemonVaultsSchemas";

type VaultsListEmptyProps = {
  isLoading: boolean;
  sortedVaultsToDisplay: TYDaemonVault[];
  currentSearch: string;
  currentCategories: string[] | null;
  currentChains: number[] | null;
  onReset: () => void;
  defaultCategories: string[];
};

export function VaultsListEmpty({
  isLoading,
  sortedVaultsToDisplay,
  currentSearch,
  onReset,
}: VaultsListEmptyProps) {
  if (isLoading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton
            key={i}
            variant="rectangular"
            height={80}
            sx={{
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              borderRadius: 1,
            }}
          />
        ))}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        p: 8,
        gap: 2,
      }}
    >
      <Typography sx={{ fontSize: "1.25rem", fontWeight: 600, color: "white" }}>
        No vaults found
      </Typography>
      <Typography
        sx={{ color: "rgba(255, 255, 255, 0.7)", textAlign: "center" }}
      >
        {currentSearch
          ? `No vaults match your search "${currentSearch}"`
          : "Try adjusting your filters"}
      </Typography>
      <Button
        onClick={onReset}
        sx={{
          mt: 2,
          color: "#00F5E0",
          borderColor: "#00F5E0",
          "&:hover": {
            borderColor: "#00F5E0",
            backgroundColor: "rgba(0, 245, 224, 0.1)",
          },
        }}
        variant="outlined"
      >
        Reset Filters
      </Button>
    </Box>
  );
}
