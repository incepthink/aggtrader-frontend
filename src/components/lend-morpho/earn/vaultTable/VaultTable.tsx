"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  TablePagination,
} from "@mui/material";
import { useVaultsQuery, type Vault } from "@/hooks/lend-morpho/useVaultsQuery";
import GlowBox from "@/components/common/ui/GlowBox";
import FilterControls from "./FilterControls";
import VaultRow from "./VaultRow";
import LoadingSkeleton from "./LoadingSkeleton";

// Helper function to format large numbers
const formatNumber = (num: number): string => {
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
  return num.toFixed(2);
};

const VaultsTable = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch vaults data
  const {
    data: vaults,
    isLoading,
    error,
    isError,
  } = useVaultsQuery({
    limit: 1000,
  });

  // Pre-compute searchable data for each vault to avoid repeated calculations
  const vaultsWithSearchData = useMemo(() => {
    if (!vaults) return [];

    return vaults.map((vault) => {
      const collateralAssets =
        vault.state?.allocation
          ?.filter((allocation) => allocation?.market?.collateralAsset)
          ?.map((allocation) => allocation.market.collateralAsset!.name) || [];

      const curatorNames =
        vault.metadata?.curators?.map((curator) => curator.name).join(" ") ||
        "";

      // Pre-compute search string for this vault
      const searchString = [
        vault.name || "",
        vault.address,
        curatorNames,
        ...collateralAssets,
      ]
        .join(" ")
        .toLowerCase();

      return {
        ...vault,
        searchString,
        collateralAssets,
        totalCollateralAssets: collateralAssets.length,
        totalSupplyUsd:
          vault.state?.allocation?.reduce((total, allocation) => {
            return total + (allocation?.supplyAssetsUsd || 0);
          }, 0) || 0,
      };
    });
  }, [vaults]);

  // Optimized filtering - only search the pre-computed string
  const filteredVaults = useMemo(() => {
    if (!searchTerm.trim()) return vaultsWithSearchData;

    const searchLower = searchTerm.toLowerCase();
    return vaultsWithSearchData.filter((vault) =>
      vault.searchString.includes(searchLower)
    );
  }, [vaultsWithSearchData, searchTerm]);

  const handleChangePage = useCallback((event: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setRowsPerPage(parseInt(event.target.value, 10));
      setPage(0);
    },
    []
  );

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    setPage(0);
  }, []);

  // Calculate pagination with filtered data
  const paginatedVaults = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredVaults.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredVaults, page, rowsPerPage]);

  // Simple helper functions that use pre-computed data
  const getTotalCollateralAssets = useCallback(
    (vault: any) => vault.totalCollateralAssets,
    []
  );
  const getTotalSupplyUsd = useCallback(
    (vault: any) => vault.totalSupplyUsd,
    []
  );
  const getCollateralAssets = useCallback(
    (vault: any) => vault.collateralAssets,
    []
  );

  // Loading skeleton
  if (isLoading) {
    return (
      <>
        <FilterControls
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
        />
        <LoadingSkeleton />
      </>
    );
  }

  // Error state
  if (isError) {
    return (
      <>
        <FilterControls
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
        />
        <GlowBox>
          <Alert
            severity="error"
            sx={{
              mb: 2,
              bgcolor: "rgba(239, 68, 68, 0.1)",
              color: "#F87171",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: 2,
            }}
          >
            Failed to load vaults: {error?.message}
          </Alert>
        </GlowBox>
      </>
    );
  }

  // Empty state
  if (!vaults || vaults.length === 0) {
    return (
      <>
        <FilterControls
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
        />
        <GlowBox>
          <Alert
            severity="info"
            sx={{
              mb: 2,
              bgcolor: "rgba(59, 130, 246, 0.1)",
              color: "#60A5FA",
              border: "1px solid rgba(59, 130, 246, 0.3)",
              borderRadius: 2,
            }}
          >
            No vaults found.
          </Alert>
        </GlowBox>
      </>
    );
  }

  // No results after filtering
  if (filteredVaults.length === 0 && searchTerm.trim()) {
    return (
      <>
        <FilterControls
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
        />
        <GlowBox>
          <Alert
            severity="info"
            sx={{
              mb: 2,
              bgcolor: "rgba(59, 130, 246, 0.1)",
              color: "#60A5FA",
              border: "1px solid rgba(59, 130, 246, 0.3)",
              borderRadius: 2,
            }}
          >
            No vaults found matching "{searchTerm}". Try adjusting your search
            terms.
          </Alert>
        </GlowBox>
      </>
    );
  }

  return (
    <>
      <FilterControls
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
      />
      <GlowBox>
        <TableContainer
          component={Paper}
          sx={{
            backgroundColor: "rgba(30, 41, 59, 0.4)",
            boxShadow: "none",
            borderRadius: 0,
          }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    color: "#9CA3AF",
                    borderBottom: "1px solid rgba(55, 65, 81, 0.5)",
                    backgroundColor: "transparent",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    py: 2,
                  }}
                >
                  Vault
                </TableCell>
                <TableCell
                  sx={{
                    color: "#9CA3AF",
                    borderBottom: "1px solid rgba(55, 65, 81, 0.5)",
                    backgroundColor: "transparent",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    py: 2,
                  }}
                >
                  Deposits
                </TableCell>
                <TableCell
                  sx={{
                    color: "#9CA3AF",
                    borderBottom: "1px solid rgba(55, 65, 81, 0.5)",
                    backgroundColor: "transparent",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    py: 2,
                  }}
                >
                  Curator
                </TableCell>
                <TableCell
                  sx={{
                    color: "#9CA3AF",
                    borderBottom: "1px solid rgba(55, 65, 81, 0.5)",
                    backgroundColor: "transparent",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    py: 2,
                  }}
                >
                  Collateral
                </TableCell>
                <TableCell
                  sx={{
                    color: "#9CA3AF",
                    borderBottom: "1px solid rgba(55, 65, 81, 0.5)",
                    backgroundColor: "transparent",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    py: 2,
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

          {/* Pagination */}
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
    </>
  );
};

export default VaultsTable;
