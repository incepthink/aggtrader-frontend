import React from "react";
import { Box, Typography, Chip, Stack, Grid } from "@mui/material";
import { WeeklyData } from "@/types/xp";
import {
  formatDateRange,
  formatCurrency,
  formatXP,
} from "@/utils/xp/formatters";
import { leagueColors, leagueGradients } from "@/utils/xp/leagueConfig";

interface WeeklyBreakdownCardProps {
  week: WeeklyData;
}

const WeeklyBreakdownCard: React.FC<WeeklyBreakdownCardProps> = ({ week }) => {
  return (
    <Box
      className="neon-panel"
      sx={{
        border: `1px solid ${leagueColors[week.league]}40`,
      }}
    >
      {/* Week Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        gap={2}
        mb={3}
      >
        <Typography
          variant="h5"
          sx={{
            fontWeight: 600,
            color: "white",
            fontSize: { xs: "1.25rem", sm: "1.5rem" },
          }}
        >
          {formatDateRange(week.week_start, week.week_end)}
        </Typography>
        <Chip
          label={week.league.toUpperCase()}
          sx={{
            backgroundColor: leagueColors[week.league],
            color: "#000",
            fontWeight: 700,
            fontSize: "1rem",
          }}
        />
      </Box>

      {/* Total XP */}
      <Box mb={3}>
        <Typography
          variant="h3"
          sx={{
            fontWeight: 700,
            color: "#00F5E0",
            fontSize: { xs: "2rem", sm: "2.5rem", lg: "3rem" },
            mb: 1,
          }}
        >
          {formatXP(week.total_xp)} XP
        </Typography>
      </Box>

      {/* XP Breakdown */}
      <Box
        mb={3}
        sx={{
          backgroundColor: "rgba(0,0,0,0.3)",
          padding: 2,
          borderRadius: 2,
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 600,
            color: "white",
            mb: 2,
            fontSize: { xs: "1rem", sm: "1.1rem" },
          }}
        >
          XP Breakdown
        </Typography>
        <Stack spacing={1.5}>
          <Box display="flex" gap={2} alignItems="baseline">
            <Typography
              variant="body1"
              sx={{
                color: "rgba(255,255,255,0.8)",
                minWidth: "fit-content"
              }}
            >
              Swap XP (after decay):
            </Typography>
            <Typography
              variant="body1"
              sx={{ fontWeight: 600, color: "white" }}
            >
              {formatXP(week.swap_xp_decayed)}
            </Typography>
          </Box>
          <Box display="flex" gap={2} alignItems="baseline">
            <Typography
              variant="body1"
              sx={{
                color: "rgba(255,255,255,0.8)",
                minWidth: "fit-content"
              }}
            >
              Pair Bonus:
            </Typography>
            <Typography
              variant="body1"
              sx={{ fontWeight: 600, color: "#00F5E0" }}
            >
              +{formatXP(week.pair_bonus_xp)}
            </Typography>
          </Box>
        </Stack>
      </Box>

      {/* Activity Stats */}
      <Box>
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 600,
            color: "white",
            mb: 2,
            fontSize: { xs: "1rem", sm: "1.1rem" },
          }}
        >
          📊 Activity
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Box
              sx={{
                backgroundColor: "rgba(0,0,0,0.2)",
                padding: 2,
                borderRadius: 1,
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <Typography
                variant="body2"
                sx={{ color: "rgba(255,255,255,0.6)", mb: 0.5 }}
              >
                Volume
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600, color: "white" }}>
                {formatCurrency(week.eligible_volume)}
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Box
              sx={{
                backgroundColor: "rgba(0,0,0,0.2)",
                padding: 2,
                borderRadius: 1,
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <Typography
                variant="body2"
                sx={{ color: "rgba(255,255,255,0.6)", mb: 0.5 }}
              >
                Fees Paid
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600, color: "white" }}>
                {formatCurrency(week.total_fees)}
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Box
              sx={{
                backgroundColor: "rgba(0,0,0,0.2)",
                padding: 2,
                borderRadius: 1,
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <Typography
                variant="body2"
                sx={{ color: "rgba(255,255,255,0.6)", mb: 0.5 }}
              >
                Total Swaps
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600, color: "white" }}>
                {week.total_swaps}
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Box
              sx={{
                backgroundColor: "rgba(0,0,0,0.2)",
                padding: 2,
                borderRadius: 1,
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <Typography
                variant="body2"
                sx={{ color: "rgba(255,255,255,0.6)", mb: 0.5 }}
              >
                Total Pairs Traded
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600, color: "white" }}>
                {week.unique_pairs_count}
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Box
              sx={{
                backgroundColor: "rgba(0,0,0,0.2)",
                padding: 2,
                borderRadius: 1,
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <Typography
                variant="body2"
                sx={{ color: "rgba(255,255,255,0.6)", mb: 0.5 }}
              >
                Unique Pairs Traded
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600, color: "white" }}>
                {week.new_pairs_count}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default WeeklyBreakdownCard;
