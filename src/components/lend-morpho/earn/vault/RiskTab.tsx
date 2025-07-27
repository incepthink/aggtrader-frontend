import React from "react";
import { Box, Typography } from "@mui/material";
import { VaultDetail } from "@/hooks/lend-morpho/ValutDescriptionHooks";

interface RiskTabProps {
  vault: VaultDetail;
}

const RiskTab: React.FC<RiskTabProps> = ({ vault }) => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ color: "white", mb: 2 }}>
        Risk Information
      </Typography>
      <Typography variant="body1" sx={{ color: "#8b949e" }}>
        Risk analysis coming soon...
      </Typography>
    </Box>
  );
};

export default RiskTab;
