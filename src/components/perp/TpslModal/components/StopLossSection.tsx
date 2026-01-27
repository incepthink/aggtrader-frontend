"use client";

import { Stack, Typography } from "@mui/material";
import PriceInputRow from "./PriceInputRow";
import PercentageButtons from "./PercentageButtons";
import PriceSlider from "./PriceSlider";
import { TpSlSectionProps } from "../types";
import { SL_PERCENTAGES } from "../constants";

const StopLossSection = ({
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
  // For Long positions: SL below current price (error if price >= basePrice)
  // For Short positions: SL above current price (error if price <= basePrice)
  const hasError = positionSide === 0
    ? !!(price && parseFloat(price) >= basePrice)
    : !!(price && parseFloat(price) <= basePrice);

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
          Stop Loss
        </Typography>
        <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.6)" }}>
          Trigger by Change %
        </Typography>
      </Stack>

      <Stack spacing={2}>
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
          percentages={SL_PERCENTAGES}
          selectedPercentage={percentage}
          onSelect={onPercentageSelect}
        />

        <PriceSlider
          value={percentage ? parseFloat(percentage) : 0}
          onChange={(value) => onPercentageChange(value.toString())}
          color="loss"
        />

        <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.5)" }}>
          When {triggerLabel} Price reaches {price || "-"}, it will trigger a Stop
          Loss Market order to close this {positionSide === 0 ? "" : "short "}position. Estimated P&L is -.
        </Typography>
      </Stack>
    </>
  );
};

export default StopLossSection;
