import React from "react";
import { Typography, Box, Chip, Grid } from "@mui/material";
import GlowBox from "@/components/common/ui/GlowBox";
import { XpDashboardData } from "@/types/xp";
import { formatXP } from "@/utils/xp/formatters";
import { leagueColors } from "@/utils/xp/leagueConfig";

interface XpHeaderStatsProps {
  xpData: XpDashboardData;
}

const XpHeaderStats: React.FC<XpHeaderStatsProps> = ({ xpData }) => {
  const currentLeague = xpData.weekly_data[0]?.league;

  return (
    <Box mb={6}>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <GlowBox padding={3}>
            <Typography
              variant="body2"
              sx={{ color: "rgba(255,255,255,0.7)", mb: 1 }}
            >
              Total XP
            </Typography>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                color: "#00F5E0",
                fontSize: { xs: "2rem", sm: "2.5rem" },
              }}
            >
              {formatXP(xpData.total_xp)}
            </Typography>
          </GlowBox>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <GlowBox padding={3}>
            <Typography
              variant="body2"
              sx={{ color: "rgba(255,255,255,0.7)", mb: 1 }}
            >
              Active Weeks
            </Typography>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                color: "white",
                fontSize: { xs: "2rem", sm: "2.5rem" },
              }}
            >
              {xpData.total_weeks}
            </Typography>
          </GlowBox>
        </Grid>

        <Grid size={{ xs: 12, sm: 12, lg: 4 }}>
          <GlowBox padding={3}>
            <Typography
              variant="body2"
              sx={{ color: "rgba(255,255,255,0.7)", mb: 1 }}
            >
              Current League
            </Typography>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                color: currentLeague ? leagueColors[currentLeague] : "white",
                fontSize: { xs: "2rem", sm: "2.5rem" },
              }}
            >
              {currentLeague ? currentLeague.toUpperCase() : "N/A"}
            </Typography>
          </GlowBox>
        </Grid>
      </Grid>
    </Box>
  );
};

export default XpHeaderStats;
