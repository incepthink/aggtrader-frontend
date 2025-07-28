"use client";

import React, { useState, useMemo, useCallback } from "react";
import { Alert } from "@mui/material";
import { useVaultsQuery, type Vault } from "@/hooks/lend-morpho/useVaultsQuery";
import GlowBox from "@/components/common/ui/GlowBox";
import ResponsiveFilterControls from "./ResponsiveFilterControls";
import ResponsiveLoadingSkeleton from "./ResponsiveLoadingSkeleton";
import ResponsiveVaultsContainer from "./ResponsiveVaultsContainer";
import FilterControls from "./FilterControls";

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
        <ResponsiveFilterControls
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
        />
        <ResponsiveLoadingSkeleton />
      </>
    );
  }

  // Error state
  if (isError) {
    return (
      <>
        <ResponsiveFilterControls
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
        <ResponsiveFilterControls
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
      <ResponsiveFilterControls
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
      />
      <ResponsiveVaultsContainer
        paginatedVaults={paginatedVaults}
        filteredVaults={filteredVaults}
        page={page}
        rowsPerPage={rowsPerPage}
        formatNumber={formatNumber}
        getTotalCollateralAssets={getTotalCollateralAssets}
        getTotalSupplyUsd={getTotalSupplyUsd}
        getCollateralAssets={getCollateralAssets}
        handleChangePage={handleChangePage}
        handleChangeRowsPerPage={handleChangeRowsPerPage}
      />
    </>
  );
};

export default VaultsTable;
