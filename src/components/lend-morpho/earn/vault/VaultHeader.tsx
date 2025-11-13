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
      <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, sm: 2 }, mb: 2, flexWrap: "wrap" }}>
        <Typography variant="h3" sx={{ fontWeight: "bold", color: "white", fontSize: { xs: "1.5rem", sm: "2rem", md: "2.5rem" } }}>
          {vault.name}
        </Typography>
      </Box>

      {/* Curator Info */}
      {vault.metadata?.curators && vault.metadata.curators.length > 0 && (
        <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, sm: 2 }, mb: 2, flexWrap: "wrap" }}>
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
                fontSize: { xs: "0.7rem", sm: "0.75rem" },
              }}
            />
            <Typography variant="body2" sx={{ color: "#8b949e", fontSize: { xs: "0.75rem", sm: "0.875rem" } }}>
              Steakhouse Financial
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box sx={{ width: 24, height: 24, borderRadius: "50%", overflow: "hidden" }}>
              <img src={vault.asset.logoURI} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </Box>
            <Typography variant="body2" sx={{ color: "#8b949e", fontSize: { xs: "0.75rem", sm: "0.875rem" } }}>
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
            fontSize: { xs: "0.8rem", sm: "0.875rem" },
          }}
        >
          {vault.metadata.description}
        </Typography>
      )}

      {/* Warnings */}
      {vault.warnings && vault.warnings.length > 0 && (
        <Box sx={{ display: "flex", gap: { xs: 0.5, sm: 1 }, mb: 2, flexWrap: "wrap" }}>
          {vault.warnings.map((warning, index) => (
            <Chip
              key={index}
              label={warning.type}
              size="small"
              sx={{
                backgroundColor:
                  warning.level === "RED" ? "#d32f2f" : "#ed6c02",
                color: "white",
                fontSize: { xs: "0.7rem", sm: "0.75rem" },
              }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

export default VaultHeader;
