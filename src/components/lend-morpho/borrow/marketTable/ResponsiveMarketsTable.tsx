"use client";

import React, { useState, useMemo, useCallback } from "react";
import { Alert } from "@mui/material";
import { useRouter } from "next/navigation";
import { useMarketsQuery } from "@/hooks/lend-morpho/useMarketsQuery";
import GlowBox from "@/components/common/ui/GlowBox";
import ResponsiveMarketsFilterControls from "./ResponsiveMarketsFilterControls";
import ResponsiveMarketsContainer from "./ResponsiveMarketsContainer";
import UniversalLoadingSkeleton from "../../UniversalLoadingSkeleton";

const ResponsiveMarketsTable: React.FC = () => {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [searchTerm, setSearchTerm] = useState("");
  const [whitelistedOnly, setWhitelistedOnly] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const ITEMS_PER_PAGE = 1000; // Fetch more data initially

  const {
    data: markets,
    isLoading,
    error,
    isError,
  } = useMarketsQuery({
    whitelistedOnly,
    limit: ITEMS_PER_PAGE,
    skip: 0,
  });

  console.log("MARKETSS::", markets);

  // Pre-compute searchable data for each market to avoid repeated calculations
  const marketsWithSearchData = useMemo(() => {
    if (!markets) return [];

    return markets
      .filter(
        (market) => market?.collateralAsset?.symbol && market?.loanAsset?.symbol
      )
      .map((market) => {
        // Pre-compute search string for this market
        const searchString = [
          market.collateralAsset?.symbol || "",
          market.loanAsset?.symbol || "",
          market.uniqueKey,
        ]
          .join(" ")
          .toLowerCase();

        return {
          ...market,
          searchString,
        };
      });
  }, [markets]);

  // Optimized filtering - only search the pre-computed string
  const filteredMarkets = useMemo(() => {
    if (!searchTerm.trim()) return marketsWithSearchData;

    const searchLower = searchTerm.toLowerCase();
    return marketsWithSearchData.filter((market) =>
      market.searchString.includes(searchLower)
    );
  }, [marketsWithSearchData, searchTerm]);

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

  const handleWhitelistedToggle = useCallback(() => {
    setWhitelistedOnly((prev) => !prev);
    setPage(0);
  }, []);

  const toggleFavorite = useCallback(
    (marketId: string, event: React.MouseEvent) => {
      event.stopPropagation();
      setFavorites((prev) => {
        const newFavorites = new Set(prev);
        if (newFavorites.has(marketId)) {
          newFavorites.delete(marketId);
        } else {
          newFavorites.add(marketId);
        }
        return newFavorites;
      });
    },
    []
  );

  const handleRowClick = useCallback(
    (market: any) => {
      router.push(`/lend/borrow/${market.uniqueKey}`);
    },
    [router]
  );

  // Calculate pagination with filtered data
  const paginatedMarkets = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredMarkets.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredMarkets, page, rowsPerPage]);

  // Loading skeleton
  if (isLoading) {
    return (
      <>
        <ResponsiveMarketsFilterControls
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          whitelistedOnly={whitelistedOnly}
          onWhitelistedToggle={handleWhitelistedToggle}
        />
        <UniversalLoadingSkeleton type="markets" />
      </>
    );
  }

  // Error state
  if (isError) {
    return (
      <>
        <ResponsiveMarketsFilterControls
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          whitelistedOnly={whitelistedOnly}
          onWhitelistedToggle={handleWhitelistedToggle}
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
            Failed to load markets: {error?.message}
          </Alert>
        </GlowBox>
      </>
    );
  }

  // Empty state
  if (!markets || marketsWithSearchData.length === 0) {
    return (
      <>
        <ResponsiveMarketsFilterControls
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          whitelistedOnly={whitelistedOnly}
          onWhitelistedToggle={handleWhitelistedToggle}
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
            No markets found.
          </Alert>
        </GlowBox>
      </>
    );
  }

  // No results after filtering
  if (filteredMarkets.length === 0 && searchTerm.trim()) {
    return (
      <>
        <ResponsiveMarketsFilterControls
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          whitelistedOnly={whitelistedOnly}
          onWhitelistedToggle={handleWhitelistedToggle}
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
            No markets found matching "{searchTerm}". Try adjusting your search
            terms.
          </Alert>
        </GlowBox>
      </>
    );
  }

  return (
    <>
      <ResponsiveMarketsFilterControls
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        whitelistedOnly={whitelistedOnly}
        onWhitelistedToggle={handleWhitelistedToggle}
      />
      <ResponsiveMarketsContainer
        paginatedMarkets={paginatedMarkets}
        filteredMarkets={filteredMarkets}
        page={page}
        rowsPerPage={rowsPerPage}
        favorites={favorites}
        handleRowClick={handleRowClick}
        toggleFavorite={toggleFavorite}
        handleChangePage={handleChangePage}
        handleChangeRowsPerPage={handleChangeRowsPerPage}
      />
    </>
  );
};

export default ResponsiveMarketsTable;
