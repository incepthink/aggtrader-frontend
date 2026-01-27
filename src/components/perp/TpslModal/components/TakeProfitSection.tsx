"use client";

import { Stack, Typography, Divider } from "@mui/material";
import PriceInputRow from "./PriceInputRow";
import PercentageButtons from "./PercentageButtons";
import PriceSlider from "./PriceSlider";
import { TpSlSectionProps } from "../types";
import { TP_PERCENTAGES } from "../constants";

const TakeProfitSection = ({
  price,
  onPriceChange,
  triggerType,
  onTriggerTypeChange,
  percentage,
  onPercentageChange,
  onClear,
  onPercentageSelect,
  basePrice,
  positionSide,
}: Omit<TpSlSectionProps, "type">) => {
  // For Long positions: TP above current price (error if price <= basePrice)
  // For Short positions: TP below current price (error if price >= basePrice)
  const hasError = positionSide === 0
    ? !!(price && parseFloat(price) <= basePrice)
    : !!(price && parseFloat(price) >= basePrice);

  const triggerLabel = triggerType === "index" ? "Index" : "Last";

  return (
    <>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 1.5 }}
      >
        <Typography variant="subtitle2" sx={{ color: "#fff", fontWeight: 600 }}>
          Take Profit
        </Typography>
        <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.6)" }}>
          Trigger by Change %
        </Typography>
      </Stack>

      <Stack spacing={2} sx={{ mb: 3 }}>
        <PriceInputRow
          price={price}
          onPriceChange={onPriceChange}
          triggerType={triggerType}
          onTriggerTypeChange={onTriggerTypeChange}
          percentage={percentage}
          onPercentageChange={onPercentageChange}
          onClear={onClear}
          hasError={hasError}
        />

        <PercentageButtons
          percentages={TP_PERCENTAGES}
          selectedPercentage={percentage}
          onSelect={onPercentageSelect}
        />

        <PriceSlider
          value={percentage ? parseFloat(percentage) : 0}
          onChange={(value) => onPercentageChange(value.toString())}
          color="profit"
        />

        <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.5)" }}>
          When {triggerLabel} Price reaches {price || "-"}, it will trigger a Take
          Profit Market order to close this {positionSide === 0 ? "" : "short "}position. Estimated P&L is -.
        </Typography>
      </Stack>

      <Divider sx={{ my: 2, borderColor: "rgba(255, 255, 255, 0.1)" }} />
    </>
  );
};

export default TakeProfitSection;
