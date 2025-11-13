import { Tooltip, Box, Typography } from "@mui/material";
import GlowBox from "@/components/common/ui/GlowBox";
import { VaultYieldEntry } from "./VaultsV3ListRow";

interface CustomAPYDisplayProps {
  vaultYieldEntry: VaultYieldEntry;
}

export const CustomAPYDisplay = ({
  vaultYieldEntry,
}: CustomAPYDisplayProps) => {
  return (
    <Tooltip
      title={
        <GlowBox padding={2} spread={12}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 1, sm: 2 } }}>
            {Object.entries(vaultYieldEntry).map(([key, value]) => {
              return (
                <Box
                  key={key}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: { xs: 2, sm: 4, md: 8 },
                  }}
                >
                  <Typography sx={{ fontSize: { xs: "0.7rem", sm: "0.75rem" }, color: "white" }}>
                    {key}
                  </Typography>
                  <Typography sx={{ fontSize: { xs: "0.7rem", sm: "0.75rem" }, color: "white" }}>
                    {value}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </GlowBox>
      }
      placement="top"
      arrow
      enterTouchDelay={0}
      leaveTouchDelay={3000}
      slotProps={{
        popper: {
          modifiers: [
            {
              name: "offset",
              options: {
                offset: [0, -8],
              },
            },
          ],
        },
        tooltip: {
          sx: {
            backgroundColor: "transparent",
            padding: 0,
            maxWidth: { xs: "90vw", sm: "none" },
          },
        },
        arrow: {
          sx: {
            color: "primary.dark",
          },
        },
      }}
      TransitionProps={{
        timeout: 300,
      }}
    >
      <Typography
        sx={{
          borderBottom: "2px dotted rgba(255, 255, 255, 0.4)",
          cursor: "pointer",
          fontSize: { xs: "0.875rem", sm: "0.875rem" },
          display: "inline-block",
          color: "white",
        }}
      >
        ⚔️ {vaultYieldEntry?.Total}
      </Typography>
    </Tooltip>
  );
};
