"use client";

import { Stack, Button } from "@mui/material";
import { PercentageButtonsProps } from "../types";
import { getPercentageButtonSx } from "../styles";

const PercentageButtons = ({
  percentages,
  selectedPercentage,
  onSelect,
}: PercentageButtonsProps) => {
  return (
    <Stack direction="row" spacing={1}>
      {percentages.map((percentage) => (
        <Button
          key={percentage}
          onClick={() => onSelect(percentage)}
          variant="outlined"
          size="small"
          sx={getPercentageButtonSx(selectedPercentage === percentage.toString())}
        >
          {percentage}%
        </Button>
      ))}
    </Stack>
  );
};

export default PercentageButtons;
