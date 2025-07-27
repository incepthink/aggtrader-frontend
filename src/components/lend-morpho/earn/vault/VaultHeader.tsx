"use client";

import React from "react";
import { Box, Typography, Avatar, Chip, Tooltip, Link } from "@mui/material";
import { VaultDetail } from "@/hooks/lend-morpho/ValutDescriptionHooks";

interface VaultHeaderProps {
  vault: VaultDetail;
}

const VaultHeader: React.FC<VaultHeaderProps> = ({ vault }) => {
  return (
    <Box>
      {/* Vault Title and Asset */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
        <Typography variant="h3" sx={{ fontWeight: "bold", color: "white" }}>
          {vault.name}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Avatar
            src={vault.metadata?.image}
            sx={{
              width: 32,
              height: 32,
              backgroundColor: "#4caf50",
            }}
          >
            {vault.asset.symbol.charAt(0)}
          </Avatar>
          <Typography variant="h5" sx={{ color: "#8b949e" }}>
            {vault.asset.symbol}
          </Typography>
        </Box>
      </Box>

      {/* Curator Info */}
      {vault.metadata?.curators && vault.metadata.curators.length > 0 && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Chip
              icon={
                <Avatar
                  src={vault.metadata.curators[0].image}
                  sx={{ width: 20, height: 20 }}
                >
                  {vault.metadata.curators[0].name?.charAt(0)}
                </Avatar>
              }
              label={vault.metadata.curators[0].name}
              size="small"
              sx={{
                backgroundColor: "#2d3748",
                color: "white",
                "& .MuiChip-icon": { marginLeft: "4px" },
              }}
            />
            <Typography variant="body2" sx={{ color: "#8b949e" }}>
              Steakhouse Financial
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Avatar
              sx={{
                width: 20,
                height: 20,
                backgroundColor: "#4caf50",
              }}
            >
              U
            </Avatar>
            <Typography variant="body2" sx={{ color: "#8b949e" }}>
              {vault.asset.symbol}
            </Typography>
          </Box>
        </Box>
      )}

      {/* Description */}
      {vault.metadata?.description && (
        <Typography
          variant="body2"
          sx={{
            color: "#8b949e",
            lineHeight: 1.6,
            mb: 2,
          }}
        >
          {vault.metadata.description}
        </Typography>
      )}

      {/* Warnings */}
      {vault.warnings && vault.warnings.length > 0 && (
        <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
          {vault.warnings.map((warning, index) => (
            <Chip
              key={index}
              label={warning.type}
              size="small"
              sx={{
                backgroundColor:
                  warning.level === "RED" ? "#d32f2f" : "#ed6c02",
                color: "white",
              }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

export default VaultHeader;
