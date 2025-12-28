import React from "react";
import { Typography, Box, Stack, Divider, Chip } from "@mui/material";
import GlowBox from "@/components/common/ui/GlowBox";
import { XpPreviewData } from "@/types/xp";
import { formatXP } from "@/utils/xp/formatters";
import { leagueColors } from "@/utils/xp/leagueConfig";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

interface XpPreviewCardProps {
  previewData: XpPreviewData;
}

const XpPreviewCard: React.FC<XpPreviewCardProps> = ({ previewData }) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatVolume = (volume: number) => {
    return `$${volume.toFixed(2)}`;
  };

  return (
    <GlowBox padding={3}>
      <Stack spacing={2.5}>
        {/* Header */}
        <Box display="flex" alignItems="center" gap={1}>
          <TrendingUpIcon sx={{ color: "#00F5E0" }} />
          <Typography
            variant="h5"
            sx={{ fontWeight: 600, color: "white", flex: 1 }}
          >
            Expected This Week
          </Typography>
          <Chip
            label={previewData.league.toUpperCase()}
            sx={{
              bgcolor: leagueColors[previewData.league] + "20",
              color: leagueColors[previewData.league],
              fontWeight: 600,
              fontSize: "0.75rem",
            }}
          />
        </Box>

        {/* Total Expected XP */}
        <Box
          sx={{
            bgcolor: "rgba(0, 245, 224, 0.05)",
            borderRadius: 2,
            p: 2.5,
            border: "1px solid rgba(0, 245, 224, 0.2)",
          }}
        >
          <Typography
            variant="body2"
            sx={{ color: "rgba(255,255,255,0.6)", mb: 0.5 }}
          >
            Projected XP
          </Typography>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              color: "#00F5E0",
              fontSize: { xs: "2rem", sm: "2.5rem" },
            }}
          >
            ~{formatXP(previewData.total_xp)}
          </Typography>
        </Box>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.1)" }} />

        {/* Activity Breakdown */}
        <Box>
          <Typography
            variant="body2"
            sx={{
              color: "rgba(255,255,255,0.7)",
              fontWeight: 600,
              mb: 2,
            }}
          >
            This Week&apos;s Activity
          </Typography>

          <Stack spacing={1.5}>
            {/* Volume */}
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)" }}>
                Volume
              </Typography>
              <Typography variant="body2" sx={{ color: "white", fontWeight: 600 }}>
                {formatVolume(previewData.eligible_volume)}
              </Typography>
            </Box>

            {/* Swaps */}
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)" }}>
                Swaps
              </Typography>
              <Typography variant="body2" sx={{ color: "white", fontWeight: 600 }}>
                {previewData.total_swaps}
              </Typography>
            </Box>

            {/* Unique Pairs */}
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)" }}>
                Unique Pairs
              </Typography>
              <Typography variant="body2" sx={{ color: "white", fontWeight: 600 }}>
                {previewData.unique_pairs_count}
              </Typography>
            </Box>

            {/* New Pairs Bonus */}
            {previewData.new_pairs_count > 0 && (
              <Box
                display="flex"
                justifyContent="space-between"
                sx={{
                  bgcolor: "rgba(0, 245, 224, 0.05)",
                  p: 1.5,
                  borderRadius: 1,
                  mt: 1,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ color: "#00F5E0", fontWeight: 600 }}
                >
                  New Pairs Bonus ({previewData.new_pairs_count} pairs)
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "#00F5E0", fontWeight: 700 }}
                >
                  +{formatXP(previewData.pair_bonus_xp)} XP
                </Typography>
              </Box>
            )}
          </Stack>
        </Box>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.1)" }} />

        {/* Period Info */}
        <Box>
          <Typography
            variant="body2"
            sx={{ color: "rgba(255,255,255,0.6)", mb: 0.5 }}
          >
            Period
          </Typography>
          <Typography variant="body2" sx={{ color: "white", fontWeight: 600 }}>
            {formatDate(previewData.week_start)} -{" "}
            {formatDate(previewData.week_end)}
          </Typography>
        </Box>

        {/* Warning */}
        <Box
          sx={{
            bgcolor: "rgba(255, 152, 0, 0.05)",
            borderRadius: 1,
            p: 1.5,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <WarningAmberIcon
            sx={{ color: "rgba(255, 152, 0, 0.8)", fontSize: "1.2rem" }}
          />
          <Typography variant="body2" sx={{ color: "rgba(255, 152, 0, 0.9)" }}>
            Points distribute at week end
          </Typography>
        </Box>
      </Stack>
    </GlowBox>
  );
};

export default XpPreviewCard;
