"use client";

import { Slider } from "@mui/material";
import { PriceSliderProps } from "../types";
import { getProfitSliderSx, getLossSliderSx } from "../styles";

const PriceSlider = ({ value, onChange, color }: PriceSliderProps) => {
  return (
    <Slider
      value={value}
      onChange={(_, newValue) => onChange(newValue as number)}
      min={0}
      max={100}
      step={0.1}
      sx={color === "profit" ? getProfitSliderSx : getLossSliderSx}
    />
  );
};

export default PriceSlider;
