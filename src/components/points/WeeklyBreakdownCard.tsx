import React from "react";
import { Box, Typography, Chip, Stack } from "@mui/material";
import { WeeklyData } from "@/types/xp";
import {
  formatDateRange,
  formatCurrency,
  formatXP,
} from "@/utils/xp/formatters";
import { leagueColors } from "@/utils/xp/leagueConfig";

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
        mb={4}
      >
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
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
            fontSize: "0.75rem",
            px: 2,
          }}
        />
      </Box>

      {/* Total XP */}
      <Box mb={4}>
        <Typography
          variant="h2"
          sx={{
            fontWeight: 700,
            color: "#00F5E0",
            fontSize: { xs: "2.5rem", sm: "3rem" },
          }}
        >
          {formatXP(week.total_xp)} XP
        </Typography>
      </Box>

      {/* XP Breakdown */}
      <Box mb={4}>
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 700,
            color: "white",
            mb: 2.5,
            fontSize: "0.875rem",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          XP Breakdown
        </Typography>
        <Stack spacing={2}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography
              variant="body1"
              sx={{
                color: "rgba(255,255,255,0.9)",
              }}
            >
              Swap XP (after decay)
            </Typography>
            <Typography
              variant="body1"
              sx={{ fontWeight: 600, color: "#00F5E0" }}
            >
              {formatXP(week.swap_xp_decayed)}
            </Typography>
          </Box>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography
              variant="body1"
              sx={{
                color: "rgba(255,255,255,0.9)",
              }}
            >
              Pair Bonus
            </Typography>
            <Typography
              variant="body1"
              sx={{ fontWeight: 600, color: "#4ade80" }}
            >
              +{formatXP(week.pair_bonus_xp)}
            </Typography>
          </Box>
        </Stack>
      </Box>

      {/* Activity */}
      <Box mb={4}>
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 700,
            color: "white",
            mb: 2.5,
            fontSize: "0.875rem",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          Activity
        </Typography>
        <Stack spacing={2}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography
              variant="body1"
              sx={{
                color: "rgba(255,255,255,0.9)",
              }}
            >
              Volume
            </Typography>
            <Typography
              variant="body1"
              sx={{ fontWeight: 600, color: "#00F5E0" }}
            >
              {formatCurrency(week.eligible_volume)}
            </Typography>
          </Box>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography
              variant="body1"
              sx={{
                color: "rgba(255,255,255,0.9)",
              }}
            >
              Fees Paid
            </Typography>
            <Typography
              variant="body1"
              sx={{ fontWeight: 600, color: "#00F5E0" }}
            >
              {formatCurrency(week.total_fees)}
            </Typography>
          </Box>
        </Stack>
      </Box>

      {/* Stat Boxes - Grid Layout */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
          gap: 2,
          pt: 3,
          borderTop: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        {/* Total Swaps */}
        <Box
          sx={{
            bgcolor: "rgba(255, 255, 255, 0.02)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: 2,
            p: 2.5,
            textAlign: "center",
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: "rgba(255,255,255,0.5)",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              fontSize: "0.7rem",
            }}
          >
            Total Swaps
          </Typography>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: "#00F5E0",
              mt: 1,
              fontSize: { xs: "1.75rem", sm: "2rem" },
            }}
          >
            {week.total_swaps}
          </Typography>
        </Box>

        {/* Pairs Traded */}
        <Box
          sx={{
            bgcolor: "rgba(255, 255, 255, 0.02)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: 2,
            p: 2.5,
            textAlign: "center",
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: "rgba(255,255,255,0.5)",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              fontSize: "0.7rem",
            }}
          >
            Pairs Traded
          </Typography>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: "#00F5E0",
              mt: 1,
              fontSize: { xs: "1.75rem", sm: "2rem" },
            }}
          >
            {week.unique_pairs_count}
          </Typography>
        </Box>

        {/* Unique Pairs */}
        <Box
          sx={{
            bgcolor: "rgba(255, 255, 255, 0.02)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: 2,
            p: 2.5,
            textAlign: "center",
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: "rgba(255,255,255,0.5)",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              fontSize: "0.7rem",
            }}
          >
            Unique Pairs
          </Typography>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: "#00F5E0",
              mt: 1,
              fontSize: { xs: "1.75rem", sm: "2rem" },
            }}
          >
            {week.new_pairs_count}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default WeeklyBreakdownCard;
