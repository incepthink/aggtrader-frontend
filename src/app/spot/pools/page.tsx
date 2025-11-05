// src/app/spot/pools/page.tsx
"use client";

import React from "react";
import { Container, Box } from "@mui/material";
import { useKatanaPools } from "@/hooks/sushiswap/useKatanaPools";
import { PoolsTable } from "@/components/spot/pools/PoolsTable";
import GlowBox from "@/components/common/ui/GlowBox";

const PoolsPage = () => {
  const { data, isLoading, error } = useKatanaPools();

  return (
    <Container
      maxWidth="xl"
      sx={{
        px: "12px !important",
        py: { xs: 1, sm: 2 },
        maxWidth: { xs: "100%", lg: "1400px", xl: "1600px" },
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 3, px: { xs: 1, sm: 0 } }}>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          Pools
        </h1>
        <p className="text-sm sm:text-base text-gray-400">
          Provide liquidity and earn fees from swaps
        </p>
      </Box>

      {/* Stats Cards */}
      {data && !isLoading && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(3, 1fr)",
            },
            gap: 2,
            mb: 3,
          }}
        >
          <GlowBox sx={{ p: { xs: 2, sm: 3 } }}>
            <div className="text-xs sm:text-sm text-gray-400 mb-1">
              Total Pools
            </div>
            <div className="text-xl sm:text-2xl font-bold text-white">
              {data.data.count}
            </div>
          </GlowBox>

          <GlowBox sx={{ p: { xs: 2, sm: 3 } }}>
            <div className="text-xs sm:text-sm text-gray-400 mb-1">
              Total TVL
            </div>
            <div className="text-xl sm:text-2xl font-bold text-white">
              $
              {(
                data.data.pools.reduce(
                  (sum, pool) => sum + pool.liquidityUSD,
                  0
                ) / 1_000_000
              ).toFixed(2)}
              M
            </div>
          </GlowBox>

          <GlowBox sx={{ p: { xs: 2, sm: 3 } }}>
            <div className="text-xs sm:text-sm text-gray-400 mb-1">
              24h Volume
            </div>
            <div className="text-xl sm:text-2xl font-bold text-white">
              $
              {(
                data.data.pools.reduce(
                  (sum, pool) => sum + pool.volumeUSD1d,
                  0
                ) / 1_000_000
              ).toFixed(2)}
              M
            </div>
          </GlowBox>
        </Box>
      )}

      {/* Error State */}
      {error && (
        <GlowBox
          sx={{
            p: { xs: 2, sm: 3 },
            mb: 3,
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
          }}
        >
          <div className="text-red-400 font-medium mb-1">
            Failed to load pools
          </div>
          <div className="text-sm text-red-300">
            {error.message || "Please try again later"}
          </div>
        </GlowBox>
      )}

      {/* Pools Table */}
      <GlowBox sx={{ p: { xs: 1, sm: 2 }, overflow: "hidden" }}>
        <PoolsTable pools={data?.data.pools || []} isLoading={isLoading} />
      </GlowBox>

      {/* Cache Info */}
      {data?.cached && (
        <Box sx={{ mt: 2, textAlign: "center" }}>
          <span className="text-xs text-gray-500">
            Data cached {data.cacheAge ? Math.floor(data.cacheAge / 60) : 0}{" "}
            minutes ago
          </span>
        </Box>
      )}
    </Container>
  );
};

export default PoolsPage;
