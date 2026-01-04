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
              variant="caption"
              sx={{
                color: "rgba(255,255,255,0.5)",
                mb: 2,
                display: "block",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                fontSize: "0.9rem",
              }}
            >
              TOTAL XP
            </Typography>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                color: "#00F5E0",
                fontSize: { xs: "2rem", sm: "2.5rem" },
                mb: 1,
              }}
            >
              {formatXP(xpData.total_xp)}
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.875rem" }}
            >
              Lifetime earnings
            </Typography>
          </GlowBox>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <GlowBox padding={3}>
            <Typography
              variant="caption"
              sx={{
                color: "rgba(255,255,255,0.5)",
                mb: 2,
                display: "block",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                fontSize: "0.9rem",
              }}
            >
              ACTIVE WEEKS
            </Typography>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                color: "white",
                fontSize: { xs: "2rem", sm: "2.5rem" },
                mb: 1,
              }}
            >
              {xpData.total_weeks}
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.875rem" }}
            >
              Currently in season
            </Typography>
          </GlowBox>
        </Grid>

        <Grid size={{ xs: 12, sm: 12, lg: 4 }}>
          <GlowBox padding={3}>
            <Typography
              variant="caption"
              sx={{
                color: "rgba(255,255,255,0.5)",
                mb: 2,
                display: "block",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                fontSize: "0.9rem",
              }}
            >
              CURRENT LEAGUE
            </Typography>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                color: currentLeague ? leagueColors[currentLeague] : "white",
                fontSize: { xs: "2rem", sm: "2.5rem" },
                mb: 1,
              }}
            >
              {currentLeague ? currentLeague.toUpperCase() : "N/A"}
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.875rem" }}
            >
              Tier badge
            </Typography>
          </GlowBox>
        </Grid>
      </Grid>
    </Box>
  );
};

export default XpHeaderStats;
