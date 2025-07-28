import React from "react";
import { Box, Typography, Chip, Avatar, Tooltip, Button } from "@mui/material";
import { Vault } from "@/hooks/lend-morpho/useVaultsQuery";

interface VaultMobileCardProps {
  vault: any;
  formatNumber: (num: number) => string;
  getTotalCollateralAssets: (vault: any) => number;
  getTotalSupplyUsd: (vault: any) => number;
  getCollateralAssets: (vault: any) => string[];
  onVaultClick: (address: string) => void;
}

const VaultMobileCard: React.FC<VaultMobileCardProps> = ({
  vault,
  formatNumber,
  getTotalCollateralAssets,
  getTotalSupplyUsd,
  getCollateralAssets,
  onVaultClick,
}) => {
  return (
    <Box
      sx={{
        backgroundColor: "rgba(31, 41, 55, 0.8)",
        borderRadius: 2,
        p: 3,
        mb: 2,
        border: "1px solid rgba(55, 65, 81, 0.3)",
        cursor: "pointer",
        transition: "all 0.2s ease-in-out",
        "&:hover": {
          backgroundColor: "rgba(55, 65, 81, 0.4)",
          transform: "translateY(-1px)",
        },
      }}
      onClick={() => onVaultClick(vault.address)}
    >
      {/* Header with Vault Info */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <Avatar
          src={vault.metadata?.image || undefined}
          sx={{
            width: 40,
            height: 40,
            backgroundColor: vault.whitelisted ? "#10B981" : "#F59E0B",
            mr: 2,
            fontSize: "16px",
            fontWeight: "bold",
          }}
        >
          {vault.name?.charAt(0) || "V"}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              fontSize: "1.1rem",
              color: "white",
              mb: 0.5,
            }}
          >
            {vault.name || "Unknown Vault"}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: "#9CA3AF",
              fontFamily: "monospace",
              fontSize: "0.8rem",
            }}
          >
            {`${vault.address.slice(0, 6)}...${vault.address.slice(-4)}`}
          </Typography>
        </Box>
        <Button
          variant="contained"
          size="small"
          sx={{
            backgroundColor: "#3B82F6",
            color: "white",
            fontSize: "0.75rem",
            textTransform: "none",
            borderRadius: "6px",
            px: 2,
            "&:hover": {
              backgroundColor: "#2563EB",
            },
          }}
          onClick={(e) => {
            e.stopPropagation();
            onVaultClick(vault.address);
          }}
        >
          Deposit
        </Button>
      </Box>

      {/* Stats Row */}
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Box>
          <Typography
            variant="body1"
            sx={{
              fontWeight: 600,
              fontSize: "1.1rem",
              color: "white",
              mb: 0.5,
            }}
          >
            ${formatNumber(getTotalSupplyUsd(vault))}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: "#9CA3AF",
              fontSize: "0.8rem",
            }}
          >
            {getTotalCollateralAssets(vault)} markets
          </Typography>
        </Box>
        <Box sx={{ textAlign: "right" }}>
          <Typography
            sx={{
              color: (vault.state?.netApy || 0) > 0 ? "#10B981" : "#EF4444",
              fontWeight: "bold",
              fontSize: "1.1rem",
              mb: 0.5,
            }}
          >
            {vault.state?.netApy
              ? `${(vault.state.netApy * 100).toFixed(2)}%`
              : "0.00%"}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: "#9CA3AF",
              fontSize: "0.8rem",
            }}
          >
            APY
          </Typography>
        </Box>
      </Box>

      {/* Curator */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        {vault.metadata?.curators && vault.metadata.curators.length > 0 ? (
          <>
            <Avatar
              src={vault.metadata.curators[0].image || undefined}
              sx={{
                width: 24,
                height: 24,
                mr: 1.5,
                fontSize: "12px",
              }}
            >
              {vault.metadata.curators[0].name?.charAt(0) || "C"}
            </Avatar>
            <Tooltip title={vault.metadata.curators[0].url || ""}>
              <Typography
                variant="body2"
                sx={{
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  fontWeight: 500,
                  color: "white",
                }}
              >
                {vault.metadata.curators[0].name || "Unknown Curator"}
              </Typography>
            </Tooltip>
          </>
        ) : (
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Avatar
              sx={{
                width: 24,
                height: 24,
                backgroundColor: "rgba(107, 114, 128, 0.5)",
                mr: 1.5,
                fontSize: "12px",
              }}
            >
              ?
            </Avatar>
            <Typography
              variant="body2"
              sx={{
                color: "#9CA3AF",
                fontSize: "0.9rem",
              }}
            >
              No Curator
            </Typography>
          </Box>
        )}
      </Box>

      {/* Collateral Assets */}
      <Box>
        <Typography
          variant="caption"
          sx={{
            color: "#9CA3AF",
            fontSize: "0.8rem",
            mb: 1,
            display: "block",
          }}
        >
          Collateral
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
          {getCollateralAssets(vault).length > 0 ? (
            <>
              {getCollateralAssets(vault)
                .slice(0, 3)
                .map((asset, assetIndex) => (
                  <Chip
                    key={assetIndex}
                    label={asset}
                    size="small"
                    sx={{
                      backgroundColor: "primary.light",
                      color: "white",
                      fontSize: "0.75rem",
                      height: "24px",
                      borderRadius: "12px",
                      "& .MuiChip-label": {
                        px: 1.5,
                      },
                    }}
                  />
                ))}
              {getCollateralAssets(vault).length > 3 && (
                <Chip
                  label={`+${getCollateralAssets(vault).length - 3}`}
                  size="small"
                  sx={{
                    backgroundColor: "primary.light",
                    color: "white",
                    fontSize: "0.75rem",
                    height: "24px",
                    borderRadius: "12px",
                    cursor: "pointer",
                    "& .MuiChip-label": {
                      px: 1.5,
                    },
                  }}
                />
              )}
            </>
          ) : (
            <Typography
              variant="caption"
              sx={{
                color: "#9CA3AF",
                fontSize: "0.8rem",
              }}
            >
              No collateral
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default VaultMobileCard;
