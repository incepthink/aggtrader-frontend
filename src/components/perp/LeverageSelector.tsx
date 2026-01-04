"use client";

import { Box, Typography, Button } from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { usePerpStore } from "@/store/perpStore";

const LeverageSelector = () => {
  const leverage = usePerpStore((s) => s.leverage);
  const openLeverageModal = usePerpStore((s) => s.openLeverageModal);

  return (
    <Box sx={{ width: "100%" }}>
      <Button
        fullWidth
        onClick={openLeverageModal}
        endIcon={<KeyboardArrowDownIcon />}
        sx={{
          justifyContent: "space-between",
          minWidth: "auto",
          px: 1.5,
          py: 0.9,
          fontSize: "0.875rem",
          fontWeight: 600,
          color: "#00F5E0",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 1,
          background: "transparent",
          textTransform: "none",
          "&:hover": {
            background: "rgba(0, 245, 224, 0.1)",
            border: "1px solid #00F5E0",
          },
          "& .MuiButton-endIcon": {
            marginLeft: 0,
          },
        }}
      >
        {`Leverage: ${leverage}x`}
      </Button>
    </Box>
  );
};

export default LeverageSelector;
