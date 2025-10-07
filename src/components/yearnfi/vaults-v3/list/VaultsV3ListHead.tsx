"use client";

import React from "react";
import { Box, Typography } from "@mui/material";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import type { TSortDirection } from "@/lib/yearnfi/lib/types";
import type { TPossibleSortBy } from "@/hooks/vaults-v2/useVaultsQueryArgs";

type VaultsV3ListHeadProps = {
  sortBy: TPossibleSortBy;
  sortDirection: TSortDirection;
  onSort: (sortBy: string, sortDirection: TSortDirection) => void;
  items: {
    label: string;
    value: string;
    sortable: boolean;
    className?: string;
  }[];
};

export function VaultsV3ListHead({
  sortBy,
  sortDirection,
  onSort,
  items,
}: VaultsV3ListHeadProps) {
  const handleSort = (value: string, currentlySortable: boolean) => {
    if (!currentlySortable) return;

    if (sortBy === value) {
      const newDirection =
        sortDirection === "asc"
          ? "desc"
          : sortDirection === "desc"
          ? ""
          : "asc";
      onSort(value, newDirection);
    } else {
      onSort(value, "desc");
    }
  };

  const getSortIcon = (itemValue: string, isSortable: boolean) => {
    if (!isSortable) return null;

    if (sortBy === itemValue && sortDirection !== "") {
      return sortDirection === "asc" ? (
        <ArrowUpwardIcon sx={{ fontSize: "1rem", color: "#00F5E0" }} />
      ) : (
        <ArrowDownwardIcon sx={{ fontSize: "1rem", color: "#00F5E0" }} />
      );
    }

    return (
      <UnfoldMoreIcon
        sx={{ fontSize: "1rem", color: "rgba(255, 255, 255, 0.3)" }}
      />
    );
  };

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(12, 1fr)",
          md: "repeat(16, 1fr)",
        },
        gap: 2,
        p: 2,
        backgroundColor: "rgba(0, 0, 0, 0.2)",
        borderRadius: 1,
        mb: 2,
      }}
    >
      {items.map((item) => (
        <Box
          key={item.value}
          className={item.className}
          onClick={() => handleSort(item.value, item.sortable)}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: item.value === "tvl" ? "flex-end" : "flex-start",
            gap: 0.5,
            cursor: item.sortable ? "pointer" : "default",
            userSelect: "none",
            "&:hover": item.sortable
              ? {
                  "& .MuiTypography-root": {
                    color: "#00F5E0",
                  },
                  "& .MuiSvgIcon-root": {
                    color: "#00F5E0",
                  },
                }
              : {},
          }}
        >
          <Typography
            sx={{
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "rgba(255, 255, 255, 0.7)",
              textTransform: "uppercase",
              transition: "color 0.2s",
            }}
          >
            {item.label}
          </Typography>
          {getSortIcon(item.value, item.sortable)}
        </Box>
      ))}
    </Box>
  );
}
