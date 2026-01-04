import React from "react";
import { Typography, Box, Stack, Chip } from "@mui/material";
import GlowBox from "@/components/common/ui/GlowBox";
import { XpPreviewData } from "@/types/xp";
import { formatXP } from "@/utils/xp/formatters";
import { leagueColors } from "@/utils/xp/leagueConfig";
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
      <Stack spacing={3}>
        {/* Header */}
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography
            variant="h5"
            sx={{ fontWeight: 600, color: "white" }}
          >
            Expected This Week
          </Typography>
          <Chip
            label={previewData.league.toUpperCase()}
            sx={{
              backgroundColor: leagueColors[previewData.league],
              color: "#000",
              fontWeight: 700,
              fontSize: "0.75rem",
              px: 2,
            }}
          />
        </Box>

        {/* Projected XP */}
        <Box>
          <Typography
            variant="caption"
            sx={{
              color: "rgba(255,255,255,0.5)",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              fontSize: "0.7rem"
            }}
          >
            Projected XP
          </Typography>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              color: "#00F5E0",
              fontSize: { xs: "2.5rem", sm: "3rem" },
              mt: 0.5,
            }}
          >
            ~{formatXP(previewData.total_xp)}
          </Typography>
        </Box>

        {/* Activity Stats - Grid Layout */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
            gap: 2,
          }}
        >
          {/* Volume */}
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
                fontSize: "0.7rem"
              }}
            >
              Volume
            </Typography>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: "#00F5E0",
                mt: 1,
                fontSize: { xs: "1.5rem", sm: "1.75rem" },
              }}
            >
              {formatVolume(previewData.eligible_volume)}
            </Typography>
          </Box>

          {/* Swaps */}
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
                fontSize: "0.7rem"
              }}
            >
              Swaps
            </Typography>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: "#00F5E0",
                mt: 1,
                fontSize: { xs: "1.5rem", sm: "1.75rem" },
              }}
            >
              {previewData.total_swaps}
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
                fontSize: "0.7rem"
              }}
            >
              Unique Pairs
            </Typography>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: "#00F5E0",
                mt: 1,
                fontSize: { xs: "1.5rem", sm: "1.75rem" },
              }}
            >
              {previewData.unique_pairs_count}
            </Typography>
          </Box>
        </Box>

        {/* New Pairs Bonus */}
        {previewData.new_pairs_count > 0 && (
          <Box
            display="flex"
            justifyContent="space-between"
            sx={{
              bgcolor: "rgba(0, 245, 224, 0.05)",
              p: 2,
              borderRadius: 2,
              border: "1px solid rgba(0, 245, 224, 0.2)",
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

        {/* Period Info */}
        <Box
          sx={{
            bgcolor: "rgba(255, 255, 255, 0.02)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: 2,
            p: 2,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: "rgba(255,255,255,0.5)",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              fontSize: "0.7rem"
            }}
          >
            Period
          </Typography>
          <Typography
            variant="body1"
            sx={{ color: "white", fontWeight: 600, mt: 0.5 }}
          >
            {formatDate(previewData.week_start)} -{" "}
            {formatDate(previewData.week_end)}
          </Typography>
        </Box>

        {/* Warning */}
        <Box
          sx={{
            bgcolor: "rgba(255, 152, 0, 0.05)",
            border: "1px solid rgba(255, 152, 0, 0.2)",
            borderRadius: 2,
            p: 2,
            display: "flex",
            alignItems: "center",
            gap: 1.5,
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
