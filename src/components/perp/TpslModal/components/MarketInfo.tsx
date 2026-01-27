"use client";

import { Box, Typography, Stack } from "@mui/material";
import { MarketInfoProps } from "../types";
import { marketInfoBoxSx } from "../styles";

const MarketInfo = ({ market, indexPrice, lastPrice }: MarketInfoProps) => {
  return (
    <Stack direction="row" justifyContent="space-between" sx={marketInfoBoxSx}>
      <Box>
        <Typography
          variant="caption"
          sx={{ color: "rgba(255, 255, 255, 0.6)" }}
        >
          Market
        </Typography>
        <Typography variant="body2" sx={{ color: "#fff", fontWeight: 600 }}>
          {market}
        </Typography>
      </Box>
      <Box>
        <Typography
          variant="caption"
          sx={{ color: "rgba(255, 255, 255, 0.6)" }}
        >
          Index Price
        </Typography>
        <Typography variant="body2" sx={{ color: "#fff", fontWeight: 600 }}>
          {indexPrice > 0 ? `$${indexPrice.toFixed(2)}` : "-"}
        </Typography>
      </Box>
      <Box>
        <Typography
          variant="caption"
          sx={{ color: "rgba(255, 255, 255, 0.6)" }}
        >
          Last Price
        </Typography>
        <Typography variant="body2" sx={{ color: "#fff", fontWeight: 600 }}>
          {lastPrice > 0 ? `$${lastPrice.toFixed(2)}` : "-"}
        </Typography>
      </Box>
    </Stack>
  );
};

export default MarketInfo;
