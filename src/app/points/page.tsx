"use client";

import React, { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { Container, Box, Stack, Typography } from "@mui/material";
import { BACKEND_URL } from "@/utils/constants";
import { XpDashboardData, ApiResponse } from "@/types/xp";
import XpHeaderStats from "@/components/points/XpHeaderStats";
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchXP() {
      if (!address) return;

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${BACKEND_URL}/user/xp/${address}`);
        const data: ApiResponse = await response.json();
        console.log(data);

        if (data.status === "success" && data.data) {
          setXpData(data.data);
        } else {
          setError(data.msg || "Failed to fetch XP data");
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

  // Render error state
  if (error && !xpData) {
    return <ErrorState error={error} />;
  }

  // Render dashboard with data
  return (
    <div className="min-h-screen bg-gray-900">
      <Container maxWidth="xl" sx={{ py: { xs: 4, sm: 6, lg: 10 } }}>
        {/* Header Stats */}
        {xpData && <XpHeaderStats xpData={xpData} />}

        {/* Weekly Breakdown */}
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

          {xpData && xpData.weekly_data.length > 0 ? (
            <Stack spacing={3}>
              {xpData.weekly_data.map((week, index) => (
                <WeeklyBreakdownCard key={index} week={week} />
              ))}
            </Stack>
          ) : (
            <NoWeeklyDataState />
          )}
        </Box>
      </Container>
    </div>
  );
};

export default PointsPage;
