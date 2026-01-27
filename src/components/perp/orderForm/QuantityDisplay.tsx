"use client";

import { Box, Typography } from "@mui/material";

interface QuantityDisplayProps {
  displayValue: string;
}

const QuantityDisplay = ({ displayValue }: QuantityDisplayProps) => {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        py: 1,
      }}
    >
      <Typography
        variant="caption"
        sx={{
          color: "rgba(255, 255, 255, 0.6)",
          fontSize: "0.75rem",
        }}
      >
        Quantity
      </Typography>
      <Typography
        variant="caption"
        sx={{
          color: "#fff",
          fontSize: "0.75rem",
          fontWeight: 500,
        }}
      >
        {displayValue}
      </Typography>
    </Box>
  );
};

export default QuantityDisplay;
