"use client";

import React, { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { Container, Box, Stack, Typography } from "@mui/material";
import { BACKEND_URL } from "@/utils/constants";
import { XpDashboardData, ApiResponse, XpPreviewData } from "@/types/xp";
import XpHeaderStats from "@/components/points/XpHeaderStats";
import XpPreviewCard from "@/components/points/XpPreviewCard";
import WeeklyBreakdownCard from "@/components/points/WeeklyBreakdownCard";
import {
  NotConnectedState,
  LoadingState,
  ErrorState,
  NoWeeklyDataState,
} from "@/components/points/EmptyStates";

const PointsPage: React.FC = () => {
  const { address, isConnected } = useAccount();
  const [xpData, setXpData] = useState<XpDashboardData | null>(null);
  const [previewData, setPreviewData] = useState<XpPreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchXP() {
      if (!address) return;

      setLoading(true);
      setError(null);

      try {
        // Fetch both actual XP and preview data in parallel
        const [xpResponse, previewResponse] = await Promise.all([
          fetch(`${BACKEND_URL}/user/xp/${address}`),
          fetch(`${BACKEND_URL}/xp/preview/${address}`),
        ]);

        let hasHistoricalData = false;
        let hasPreviewData = false;

        // Handle historical XP data
        try {
          const xpDataResult: ApiResponse = await xpResponse.json();
          console.log("XP Data:", xpDataResult);

          if (xpDataResult.status === "success" && xpDataResult.data) {
            setXpData(xpDataResult.data);
            hasHistoricalData = true;
          } else {
            // Don't set error for "no data yet" - user might be new
            console.log("No historical XP data:", xpDataResult.msg);
          }
        } catch (xpErr) {
          console.warn("Failed to fetch historical XP:", xpErr);
          // Don't set error - user might be new
        }

        // Handle preview data (optional - don't fail if preview isn't available)
        try {
          const previewDataResult: XpPreviewData = await previewResponse.json();
          console.log("Preview Data:", previewDataResult);

          if (previewDataResult && previewDataResult.is_preview) {
            setPreviewData(previewDataResult);
            hasPreviewData = true;
          }
        } catch (previewErr) {
          console.warn("Preview data not available:", previewErr);
          // Don't set error - preview is optional
        }

        // Only set error if we have neither historical nor preview data
        if (!hasHistoricalData && !hasPreviewData) {
          setError("No XP data found. Start trading to earn XP!");
        }
      } catch (err) {
        console.error("Failed to fetch XP:", err);
        setError("Failed to load XP data. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    if (isConnected && address) {
      fetchXP();
    } else {
      setXpData(null);
      setPreviewData(null);
      setError(null);
    }
  }, [isConnected, address]);

  // Render not connected state
  if (!isConnected) {
    return <NotConnectedState />;
  }

  // Render loading state
  if (loading) {
    return <LoadingState />;
  }

  // Render error state only if no data at all (neither historical nor preview)
  if (error && !xpData && !previewData) {
    return <ErrorState error={error} />;
  }

  // Render dashboard with data
  return (
    <div className="min-h-screen bg-gray-900">
      <Container maxWidth="xl" sx={{ py: { xs: 4, sm: 6, lg: 10 } }}>
        {/* Page Title */}
        <Typography
          variant="h3"
          component="h1"
          gutterBottom
          sx={{
            fontSize: { xs: "2rem", sm: "2.5rem", lg: "3rem" },
            fontWeight: 700,
            color: "white",
            mb: 4,
          }}
        >
          XP Dashboard
        </Typography>

        {/* First-time user welcome message */}
        {!xpData && previewData && (
          <Box
            sx={{
              bgcolor: "rgba(0, 245, 224, 0.05)",
              border: "1px solid rgba(0, 245, 224, 0.2)",
              borderRadius: 2,
              p: 3,
              mb: 4,
            }}
          >
            <Typography
              variant="h6"
              sx={{ color: "#00F5E0", fontWeight: 600, mb: 1 }}
            >
              Welcome to XP! 🎉
            </Typography>
            <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.8)" }}>
              You&apos;ve started earning XP this week! Your points will be officially
              distributed at the end of the week. Keep trading to maximize your
              rewards!
            </Typography>
          </Box>
        )}

        {/* Header Stats - only show if historical data exists */}
        {xpData && <XpHeaderStats xpData={xpData} />}

        {/* Expected Points Preview */}
        {previewData && (
          <Box mb={6}>
            <Typography
              variant="h4"
              gutterBottom
              sx={{
                fontSize: { xs: "1.5rem", sm: "2rem" },
                fontWeight: 600,
                color: "white",
                mb: 3,
              }}
            >
              {xpData ? "Current Week Progress" : "Your First Week"}
            </Typography>
            <XpPreviewCard previewData={previewData} />
          </Box>
        )}

        {/* Weekly Breakdown - only show if historical data exists */}
        {xpData && (
          <Box>
            <Typography
              variant="h4"
              gutterBottom
              sx={{
                fontSize: { xs: "1.5rem", sm: "2rem" },
                fontWeight: 600,
                color: "white",
                mb: 3,
              }}
            >
              Weekly Breakdown
            </Typography>

            {xpData.weekly_data.length > 0 ? (
              <Stack spacing={3}>
                {xpData.weekly_data.map((week, index) => (
                  <WeeklyBreakdownCard key={index} week={week} />
                ))}
              </Stack>
            ) : (
              <NoWeeklyDataState />
            )}
          </Box>
        )}

        {/* No data at all state */}
        {!xpData && !previewData && (
          <NoWeeklyDataState />
        )}
      </Container>
    </div>
  );
};

export default PointsPage;
