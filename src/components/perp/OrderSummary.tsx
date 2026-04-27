"use client";

import { Box, Typography } from "@mui/material";
import {
  MarketCalcOutput,
  formatUsdValue,
  formatFeeRate,
} from "@/utils/perp/marketCalc";

interface OrderSummaryProps {
  marketMetrics: MarketCalcOutput;
  takerFeeRate?: string;
  makerFeeRate?: string;
}

const OrderSummary = ({
  marketMetrics,
  takerFeeRate,
  makerFeeRate,
}: OrderSummaryProps) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 1,
        p: 2,
        background: "rgba(255, 255, 255, 0.02)",
        borderRadius: 1,
      }}
    >
      {/* Cost */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: "rgba(255, 255, 255, 0.6)",
            fontSize: "0.72rem",
          }}
        >
          Margin
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: "#fff",
            fontSize: "0.72rem",
            fontWeight: 500,
          }}
        >
          {marketMetrics.buyCostUsd === 0 && marketMetrics.sellCostUsd === 0 ? (
              "- / -"
            ) : (
              <>
                <span style={{ color: "#00C076" }}>{formatUsdValue(marketMetrics.buyCostUsd)}</span>
                {" / "}
                <span style={{ color: "#EF4444" }}>{formatUsdValue(marketMetrics.sellCostUsd)}</span>
              </>
            )}
        </Typography>
      </Box>

      {/* Value */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: "rgba(255, 255, 255, 0.6)",
            fontSize: "0.72rem",
          }}
        >
          Value
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: "#fff",
            fontSize: "0.72rem",
            fontWeight: 500,
          }}
        >
          {marketMetrics.buyValueUsd === 0 && marketMetrics.sellValueUsd === 0 ? (
              "- / -"
            ) : (
              <>
                <span style={{ color: "#00C076" }}>{formatUsdValue(marketMetrics.buyValueUsd)}</span>
                {" / "}
                <span style={{ color: "#EF4444" }}>{formatUsdValue(marketMetrics.sellValueUsd)}</span>
              </>
            )}
        </Typography>
      </Box>

      {/* Taker/Maker Fees */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: "rgba(255, 255, 255, 0.6)",
            fontSize: "0.72rem",
          }}
        >
          Taker / Maker Fee
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: "#fff",
            fontSize: "0.72rem",
            fontWeight: 500,
          }}
        >
          {formatFeeRate(takerFeeRate || "0")} /{" "}
          {formatFeeRate(makerFeeRate || "0")}
        </Typography>
      </Box>
    </Box>
  );
};

export default OrderSummary;
