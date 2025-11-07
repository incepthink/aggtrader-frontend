import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  Box,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useRouter } from "next/navigation";
import GlowBox from "@/components/common/ui/GlowBox";
import VaultRow from "./VaultRow";
import VaultMobileCard from "./VaultMobileCard";

interface ResponsiveVaultsContainerProps {
  paginatedVaults: any[];
  filteredVaults: any[];
  page: number;
  rowsPerPage: number;
  formatNumber: (num: number) => string;
  getTotalCollateralAssets: (vault: any) => number;
  getTotalSupplyUsd: (vault: any) => number;
  getCollateralAssets: (vault: any) => string[];
  handleChangePage: (event: unknown, newPage: number) => void;
  handleChangeRowsPerPage: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const ResponsiveVaultsContainer: React.FC<ResponsiveVaultsContainerProps> = ({
  paginatedVaults,
  filteredVaults,
  page,
  rowsPerPage,
  formatNumber,
  getTotalCollateralAssets,
  getTotalSupplyUsd,
  getCollateralAssets,
  handleChangePage,
  handleChangeRowsPerPage,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md")); // Mobile and small tablet
  const isTablet = useMediaQuery(theme.breakpoints.between("md", "lg")); // Tablet
  const router = useRouter();

  const handleVaultClick = (vaultAddress: string) => {
    router.push(`/earn/lend/${vaultAddress}`);
  };

  // Mobile Layout (Card-based)
  if (isMobile) {
    return (
      <GlowBox>
        <Box sx={{ p: 2 }}>
          {paginatedVaults.map((vault: any, index: number) => (
            <VaultMobileCard
              key={vault.address}
              vault={vault}
              formatNumber={formatNumber}
              getTotalCollateralAssets={getTotalCollateralAssets}
              getTotalSupplyUsd={getTotalSupplyUsd}
              getCollateralAssets={getCollateralAssets}
              onVaultClick={handleVaultClick}
            />
          ))}

          {/* Mobile Pagination */}
          {filteredVaults.length > rowsPerPage && (
            <Box sx={{ mt: 2 }}>
              <TablePagination
                component="div"
                count={filteredVaults.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[10, 25, 50]}
                sx={{
                  color: "#9CA3AF",
                  borderTop: "1px solid rgba(55, 65, 81, 0.3)",
                  backgroundColor: "transparent",
                  "& .MuiTablePagination-selectIcon": {
                    color: "#9CA3AF",
                  },
                  "& .MuiTablePagination-select": {
                    color: "#9CA3AF",
                  },
                  "& .MuiTablePagination-displayedRows": {
                    color: "#9CA3AF",
                  },
                  "& .MuiIconButton-root": {
                    color: "#9CA3AF",
                  },
                  "& .MuiIconButton-root.Mui-disabled": {
                    color: "rgba(156, 163, 175, 0.3)",
                  },
                }}
              />
            </Box>
          )}
        </Box>
      </GlowBox>
    );
  }

  // Desktop/Tablet Layout (Table with horizontal scroll on tablet)
  return (
    <GlowBox>
      <TableContainer
        component={Paper}
        sx={{
          backgroundColor: "transparent",
          boxShadow: "none",
          borderRadius: 0,
          // Add horizontal scroll for tablet sizes
          ...(isTablet && {
            overflowX: "auto",
            "&::-webkit-scrollbar": {
              height: "8px",
            },
            "&::-webkit-scrollbar-track": {
              background: "rgba(55, 65, 81, 0.3)",
              borderRadius: "4px",
            },
            "&::-webkit-scrollbar-thumb": {
              background: "rgba(156, 163, 175, 0.5)",
              borderRadius: "4px",
              "&:hover": {
                background: "rgba(156, 163, 175, 0.7)",
              },
            },
          }),
        }}
      >
        <Table sx={{ minWidth: isTablet ? 800 : "auto" }}>
          <TableHead
            sx={{
              backgroundColor: "secondary.light",
              padding: "0px",
              borderRadius: "32px !important",
            }}
          >
            <TableRow>
              <TableCell
                sx={{
                  color: "text.primary",
                  borderBottom: "1px solid rgba(55, 65, 81, 0.5)",
                  backgroundColor: "transparent",
                  fontSize: "1rem",
                  fontWeight: 500,
                  py: 2,
                  minWidth: isTablet ? 200 : "auto",
                }}
              >
                Vault
              </TableCell>
              <TableCell
                sx={{
                  color: "text.primary",
                  borderBottom: "1px solid rgba(55, 65, 81, 0.5)",
                  backgroundColor: "transparent",
                  fontSize: "1rem",
                  fontWeight: 500,
                  py: 2,
                  minWidth: isTablet ? 150 : "auto",
                }}
              >
                Deposits
              </TableCell>
              <TableCell
                sx={{
                  color: "text.primary",
                  borderBottom: "1px solid rgba(55, 65, 81, 0.5)",
                  backgroundColor: "transparent",
                  fontSize: "1rem",
                  fontWeight: 500,
                  py: 2,
                  minWidth: isTablet ? 150 : "auto",
                }}
              >
                Curator
              </TableCell>
              <TableCell
                sx={{
                  color: "text.primary",
                  borderBottom: "1px solid rgba(55, 65, 81, 0.5)",
                  backgroundColor: "transparent",
                  fontSize: "1rem",
                  fontWeight: 500,
                  py: 2,
                  minWidth: isTablet ? 200 : "auto",
                }}
              >
                Collateral
              </TableCell>
              <TableCell
                sx={{
                  color: "text.primary",
                  borderBottom: "1px solid rgba(55, 65, 81, 0.5)",
                  backgroundColor: "transparent",
                  fontSize: "1rem",
                  fontWeight: 500,
                  py: 2,
                  minWidth: isTablet ? 100 : "auto",
                }}
              >
                APY
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {paginatedVaults.map((vault: any, index: number) => (
              <VaultRow
                key={vault.address}
                vault={vault}
                index={index}
                isLastRow={index === paginatedVaults.length - 1}
                formatNumber={formatNumber}
                getTotalCollateralAssets={getTotalCollateralAssets}
                getTotalSupplyUsd={getTotalSupplyUsd}
                getCollateralAssets={getCollateralAssets}
              />
            ))}
          </TableBody>
        </Table>

        {/* Desktop/Tablet Pagination */}
        {filteredVaults.length > rowsPerPage && (
          <TablePagination
            component="div"
            count={filteredVaults.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[10, 25, 50, 100]}
            sx={{
              color: "#9CA3AF",
              borderTop: "1px solid rgba(55, 65, 81, 0.3)",
              backgroundColor: "transparent",
              "& .MuiTablePagination-selectIcon": {
                color: "#9CA3AF",
              },
              "& .MuiTablePagination-select": {
                color: "#9CA3AF",
              },
              "& .MuiTablePagination-displayedRows": {
                color: "#9CA3AF",
              },
              "& .MuiIconButton-root": {
                color: "#9CA3AF",
              },
              "& .MuiIconButton-root.Mui-disabled": {
                color: "rgba(156, 163, 175, 0.3)",
              },
            }}
          />
        )}
      </TableContainer>
    </GlowBox>
  );
};

export default ResponsiveVaultsContainer;
