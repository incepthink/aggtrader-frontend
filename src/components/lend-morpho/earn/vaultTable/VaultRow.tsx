import React from "react";
import {
  TableRow,
  TableCell,
  Box,
  Typography,
  Chip,
  Avatar,
  Tooltip,
  Button,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { Vault } from "@/hooks/lend-morpho/useVaultsQuery";

interface VaultRowProps {
  vault: Vault;
  index: number;
  isLastRow: boolean;
  formatNumber: (num: number) => string;
  getTotalCollateralAssets: (vault: Vault) => number;
  getTotalSupplyUsd: (vault: Vault) => number;
  getCollateralAssets: (vault: Vault) => string[];
}

const VaultRow: React.FC<VaultRowProps> = ({
  vault,
  index,
  isLastRow,
  formatNumber,
  getTotalCollateralAssets,
  getTotalSupplyUsd,
  getCollateralAssets,
}) => {
  const router = useRouter();

  const handleVaultClick = (vaultAddress: string) => {
    router.push(`/lend/earn/${vaultAddress}`);
  };

  return (
    <TableRow
      key={vault.address}
      sx={{
        "&:hover": {
          backgroundColor: "rgba(55, 65, 81, 0.2)",
          cursor: "pointer",
        },
        cursor: "pointer",
        ...(isLastRow && {
          "& td": {
            borderBottom: "none",
          },
        }),
      }}
      onClick={() => handleVaultClick(vault.address)}
    >
      {/* Vault Name */}
      <TableCell
        sx={{
          color: "white",
          borderBottom: isLastRow ? "none" : "1px solid rgba(55, 65, 81, 0.3)",
          py: 2.5,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Avatar
            src={vault.metadata?.image || undefined}
            sx={{
              width: 32,
              height: 32,
              backgroundColor: vault.whitelisted ? "#10B981" : "#F59E0B",
              mr: 2,
              fontSize: "14px",
              fontWeight: "bold",
            }}
          >
            {vault.name?.charAt(0) || "V"}
          </Avatar>
          <Box>
            <Typography
              variant="body1"
              sx={{
                fontWeight: 600,
                fontSize: "0.95rem",
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
        </Box>
      </TableCell>

      {/* Deposits */}
      <TableCell
        sx={{
          color: "white",
          borderBottom: isLastRow ? "none" : "1px solid rgba(55, 65, 81, 0.3)",
          py: 2.5,
        }}
      >
        <Box>
          <Typography
            variant="body1"
            sx={{
              fontWeight: 600,
              fontSize: "0.95rem",
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
      </TableCell>

      {/* Curator */}
      <TableCell
        sx={{
          color: "white",
          borderBottom: isLastRow ? "none" : "1px solid rgba(55, 65, 81, 0.3)",
          py: 2.5,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
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
      </TableCell>

      {/* Collateral */}
      <TableCell
        sx={{
          color: "white",
          borderBottom: isLastRow ? "none" : "1px solid rgba(55, 65, 81, 0.3)",
          py: 2.5,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
          {getCollateralAssets(vault).length > 0 ? (
            <>
              {getCollateralAssets(vault)
                .slice(0, 2)
                .map((asset, assetIndex) => (
                  <Chip
                    key={assetIndex}
                    label={asset}
                    size="small"
                    sx={{
                      backgroundColor: "rgba(55, 65, 81, 0.6)",
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
              {getCollateralAssets(vault).length > 2 && (
                <Tooltip
                  title={
                    <Box
                      sx={{
                        width: "200px",
                        p: 1.5,
                      }}
                    >
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: 600,
                          mb: 1,
                          color: "white",
                          fontSize: "0.8rem",
                        }}
                      >
                        All Collateral Assets:
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 0.5,
                        }}
                      >
                        {getCollateralAssets(vault).map(
                          (asset, tooltipIndex) => (
                            <Chip
                              key={tooltipIndex}
                              label={asset}
                              size="small"
                              sx={{
                                backgroundColor: "rgba(16, 185, 129, 0.8)",
                                color: "white",
                                fontSize: "0.7rem",
                                height: "20px",
                                borderRadius: "10px",
                                "& .MuiChip-label": {
                                  px: 1,
                                },
                              }}
                            />
                          )
                        )}
                      </Box>
                    </Box>
                  }
                  arrow
                  placement="top"
                  PopperProps={{
                    style: { zIndex: 9999 },
                  }}
                  componentsProps={{
                    tooltip: {
                      sx: {
                        bgcolor: "rgba(17, 24, 39, 0.98)",
                        border: "1px solid rgba(55, 65, 81, 0.5)",
                        borderRadius: "8px",
                        maxWidth: "none",
                        boxShadow: "0 10px 25px rgba(0, 0, 0, 0.5)",
                      },
                    },
                    arrow: {
                      sx: {
                        color: "rgba(17, 24, 39, 0.98)",
                      },
                    },
                  }}
                >
                  <Chip
                    label={`+${getCollateralAssets(vault).length - 2}`}
                    size="small"
                    sx={{
                      backgroundColor: "#10B981",
                      color: "white",
                      fontSize: "0.75rem",
                      height: "24px",
                      borderRadius: "12px",
                      cursor: "pointer",
                      "&:hover": {
                        backgroundColor: "#059669",
                      },
                      "& .MuiChip-label": {
                        px: 1.5,
                      },
                    }}
                  />
                </Tooltip>
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
      </TableCell>

      {/* APY */}
      <TableCell
        sx={{
          color: "white",
          borderBottom: isLastRow ? "none" : "1px solid rgba(55, 65, 81, 0.3)",
          py: 2.5,
        }}
      >
        <Box>
          <Typography
            sx={{
              color: (vault.state?.netApy || 0) > 0 ? "#10B981" : "#EF4444",
              fontWeight: "bold",
              fontSize: "0.95rem",
              mb: 0.5,
            }}
          >
            {vault.state?.netApy
              ? `${(vault.state.netApy * 100).toFixed(2)}%`
              : "0.00%"}
          </Typography>
          {vault.asset?.yield?.apr && (
            <Typography
              variant="caption"
              sx={{
                color: "#9CA3AF",
                fontSize: "0.8rem",
              }}
            >
              Base: {(vault.asset.yield.apr * 100).toFixed(2)}%
            </Typography>
          )}
        </Box>
      </TableCell>
    </TableRow>
  );
};

export default VaultRow;
