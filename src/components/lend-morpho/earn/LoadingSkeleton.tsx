"use client";

import React from "react";
import { Box, Container, Skeleton, Paper } from "@mui/material";

const LoadingSkeleton: React.FC = () => {
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" },
          gap: 4,
        }}
      >
        {/* Left Column - Vault Info */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {/* Header Skeleton */}
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
              <Skeleton
                variant="text"
                width={300}
                height={40}
                sx={{ bgcolor: "#2d3748" }}
              />
              <Skeleton
                variant="circular"
                width={32}
                height={32}
                sx={{ bgcolor: "#2d3748" }}
              />
            </Box>
            <Skeleton
              variant="text"
              width="80%"
              height={20}
              sx={{ bgcolor: "#2d3748", mb: 1 }}
            />
            <Skeleton
              variant="text"
              width="60%"
              height={20}
              sx={{ bgcolor: "#2d3748" }}
            />
          </Box>

          {/* Stats Cards Skeleton */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                md: "repeat(4, 1fr)",
              },
              gap: 3,
            }}
          >
            {Array.from({ length: 4 }).map((_, index) => (
              <Paper
                key={index}
                sx={{
                  p: 3,
                  backgroundColor: "#1a1d29",
                  borderRadius: 2,
                }}
              >
                <Skeleton
                  variant="text"
                  width="60%"
                  height={16}
                  sx={{ bgcolor: "#2d3748", mb: 2 }}
                />
                <Skeleton
                  variant="text"
                  width="80%"
                  height={32}
                  sx={{ bgcolor: "#2d3748", mb: 1 }}
                />
                <Skeleton
                  variant="text"
                  width="40%"
                  height={16}
                  sx={{ bgcolor: "#2d3748" }}
                />
              </Paper>
            ))}
          </Box>

          {/* Tabs Skeleton */}
          <Paper
            sx={{
              backgroundColor: "#1a1d29",
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            {/* Tab Header Skeleton */}
            <Box sx={{ borderBottom: 1, borderColor: "#2d3748", p: 2 }}>
              <Box sx={{ display: "flex", gap: 3 }}>
                {Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton
                    key={index}
                    variant="text"
                    width={80}
                    height={24}
                    sx={{ bgcolor: "#2d3748" }}
                  />
                ))}
              </Box>
            </Box>

            {/* Tab Content Skeleton */}
            <Box sx={{ p: 3 }}>
              <Box sx={{ mb: 3 }}>
                <Skeleton
                  variant="text"
                  width="40%"
                  height={24}
                  sx={{ bgcolor: "#2d3748", mb: 2 }}
                />
                <Skeleton
                  variant="text"
                  width="20%"
                  height={32}
                  sx={{ bgcolor: "#2d3748" }}
                />
              </Box>

              {/* Chart Area Skeleton */}
              <Paper
                sx={{
                  height: 400,
                  backgroundColor: "#0f1419",
                  borderRadius: 2,
                  p: 2,
                  mb: 3,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Skeleton
                  variant="rectangular"
                  width="100%"
                  height="100%"
                  sx={{ bgcolor: "#2d3748", borderRadius: 1 }}
                />
              </Paper>

              {/* Bottom Cards Skeleton */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, 1fr)",
                    md: "repeat(4, 1fr)",
                  },
                  gap: 2,
                }}
              >
                {Array.from({ length: 4 }).map((_, index) => (
                  <Paper key={index} sx={{ p: 2, backgroundColor: "#2d3748" }}>
                    <Skeleton
                      variant="text"
                      width="60%"
                      height={16}
                      sx={{ bgcolor: "#1a1d29", mb: 1 }}
                    />
                    <Skeleton
                      variant="text"
                      width="40%"
                      height={20}
                      sx={{ bgcolor: "#1a1d29" }}
                    />
                  </Paper>
                ))}
              </Box>
            </Box>
          </Paper>
        </Box>

        {/* Right Column - Deposit Form Skeleton */}
        <Paper
          sx={{
            p: 3,
            backgroundColor: "#1a1d29",
            borderRadius: 2,
            position: "sticky",
            top: 20,
          }}
        >
          {/* Header */}
          <Skeleton
            variant="text"
            width="60%"
            height={24}
            sx={{ bgcolor: "#2d3748", mb: 3 }}
          />

          {/* Amount Input */}
          <Box sx={{ mb: 3 }}>
            <Skeleton
              variant="rectangular"
              width="100%"
              height={56}
              sx={{ bgcolor: "#2d3748", borderRadius: 1, mb: 1 }}
            />
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Skeleton
                variant="text"
                width="30%"
                height={16}
                sx={{ bgcolor: "#2d3748" }}
              />
              <Skeleton
                variant="text"
                width="40%"
                height={16}
                sx={{ bgcolor: "#2d3748" }}
              />
            </Box>
          </Box>

          {/* Position Section */}
          <Box sx={{ mb: 3 }}>
            <Skeleton
              variant="text"
              width="50%"
              height={20}
              sx={{ bgcolor: "#2d3748", mb: 2 }}
            />
            <Skeleton
              variant="text"
              width="30%"
              height={32}
              sx={{ bgcolor: "#2d3748", mb: 2 }}
            />
            <Skeleton
              variant="text"
              width="40%"
              height={24}
              sx={{ bgcolor: "#2d3748", mb: 2 }}
            />

            <Box sx={{ mb: 2 }}>
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
              >
                <Skeleton
                  variant="text"
                  width="60%"
                  height={16}
                  sx={{ bgcolor: "#2d3748" }}
                />
                <Skeleton
                  variant="text"
                  width="20%"
                  height={16}
                  sx={{ bgcolor: "#2d3748" }}
                />
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Skeleton
                  variant="text"
                  width="60%"
                  height={16}
                  sx={{ bgcolor: "#2d3748" }}
                />
                <Skeleton
                  variant="text"
                  width="20%"
                  height={16}
                  sx={{ bgcolor: "#2d3748" }}
                />
              </Box>
            </Box>
          </Box>

          {/* Action Button */}
          <Skeleton
            variant="rectangular"
            width="100%"
            height={48}
            sx={{ bgcolor: "#2d3748", borderRadius: 2, mb: 2 }}
          />

          {/* Additional Info */}
          <Paper sx={{ p: 2, backgroundColor: "#0f1419" }}>
            <Skeleton
              variant="text"
              width="100%"
              height={12}
              sx={{ bgcolor: "#2d3748", mb: 1 }}
            />
            <Skeleton
              variant="text"
              width="80%"
              height={12}
              sx={{ bgcolor: "#2d3748", mb: 1 }}
            />
            <Skeleton
              variant="text"
              width="60%"
              height={12}
              sx={{ bgcolor: "#2d3748" }}
            />
          </Paper>
        </Paper>
      </Box>
    </Container>
  );
};

export default LoadingSkeleton;
