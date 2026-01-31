"use client";

import { useMemo, useCallback } from "react";
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Stack,
  Button,
  Slider,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { usePerpStore } from "@/store/perpStore";

interface QuantityInputProps {
  market: string;
  freeCollateral: number;
  currentPrice?: number;
  leverage: number;
  hidePercentageControls?: boolean;
  disableUsdUnit?: boolean;
}

const QuantityInput = ({
  market,
  freeCollateral,
  currentPrice,
  leverage,
  hidePercentageControls = false,
  disableUsdUnit = false,
}: QuantityInputProps) => {
  const quantity = usePerpStore((s) => s.quantity);
  const quantityPercentage = usePerpStore((s) => s.quantityPercentage);
  const quantityUnit = usePerpStore((s) => s.quantityUnit);
  const setQuantity = usePerpStore((s) => s.setQuantity);
  const setQuantityPercentage = usePerpStore((s) => s.setQuantityPercentage);
  const setQuantityUnit = usePerpStore((s) => s.setQuantityUnit);

  // Extract asset symbol from market (e.g., "BTC" from "BTC-USD")
  const assetSymbol = market.split("-")[0];

  /**
   * Calculate maximum quantity based on unit mode
   * BTC mode: maxQuantity = (freeCollateral * leverage) / currentPrice
   * USD mode: maxQuantity = freeCollateral * leverage
   */
  const maxQuantity = useMemo(() => {
    if (!freeCollateral) {
      return 0;
    }

    if (quantityUnit === "USD") {
      // USD mode: max is total buying power in USD
      return freeCollateral * leverage;
    } else {
      // BTC mode: max is buying power converted to BTC
      if (!currentPrice || currentPrice === 0) {
        return 0;
      }
      return (freeCollateral * leverage) / currentPrice;
    }
  }, [freeCollateral, leverage, currentPrice, quantityUnit]);

  /**
   * Handle percentage button clicks
   * Sets both quantity and percentage state
   */
  const handlePercentageClick = useCallback(
    (percentage: number) => {
      setQuantityPercentage(percentage);
      const calculatedQuantity = (maxQuantity * percentage) / 100;
      setQuantity(calculatedQuantity > 0 ? calculatedQuantity.toFixed(8) : "");
    },
    [maxQuantity, setQuantity, setQuantityPercentage],
  );

  /**
   * Handle direct quantity input
   * Updates quantity and calculates corresponding percentage
   */
  const handleQuantityChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;

      // Allow empty input
      if (value === "") {
        setQuantity("");
        setQuantityPercentage(0);
        return;
      }

      // Validate numeric input
      const numericValue = parseFloat(value);
      if (isNaN(numericValue) || numericValue < 0) {
        return;
      }

      setQuantity(value);

      // Update percentage based on input
      if (maxQuantity > 0) {
        const percentage = (numericValue / maxQuantity) * 100;
        setQuantityPercentage(Math.min(100, Math.max(0, percentage)));
      }
    },
    [maxQuantity, setQuantity, setQuantityPercentage],
  );

  /**
   * Handle slider change
   * Updates both percentage and quantity
   */
  const handleSliderChange = useCallback(
    (_event: Event, value: number | number[]) => {
      const percentage = value as number;
      handlePercentageClick(percentage);
    },
    [handlePercentageClick],
  );

  const percentageButtons = [25, 50, 75, 100];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {/* Label with Asset Selector */}
      {/* <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography
          variant="caption"
          sx={{
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: '0.75rem',
          }}
        >
          Quantity
        </Typography>
        <Button
          size="small"
          endIcon={<KeyboardArrowDownIcon />}
          disabled // Disabled until multi-market support
          sx={{
            minWidth: 'auto',
            px: 1,
            py: 0.25,
            fontSize: '0.75rem',
            fontWeight: 500,
            color: 'rgba(255, 255, 255, 0.4)',
            textTransform: 'none',
            '&.Mui-disabled': {
              color: 'rgba(255, 255, 255, 0.4)',
            },
          }}
        >
          {assetSymbol}
        </Button>
      </Box> */}

      {/* Input Field */}
      {/* <TextField
        value={quantity}
        onChange={handleQuantityChange}
        placeholder="- / -"
        type="number"
        fullWidth
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <Typography
                variant="caption"
                sx={{
                  color: "rgba(255, 255, 255, 0.6)",
                  fontSize: "0.75rem",
                }}
              >
                {assetSymbol}
              </Typography>
            </InputAdornment>
          ),
          inputProps: {
            step: "any",
            min: 0,
          },
        }}
        sx={{
          "& .MuiOutlinedInput-root": {
            backgroundColor: "rgba(255, 255, 255, 0.02)",
            fontSize: "0.875rem",
            "& fieldset": {
              borderColor: "rgba(255, 255, 255, 0.1)",
            },
            "&:hover fieldset": {
              borderColor: "rgba(255, 255, 255, 0.2)",
            },
            "&.Mui-focused fieldset": {
              borderColor: "#00F5E0",
            },
          },
          "& input": {
            color: "#fff",
            "&::placeholder": {
              color: "rgba(255, 255, 255, 0.3)",
              opacity: 1,
            },
          },
          "& input[type=number]": {
            MozAppearance: "textfield",
          },
          "& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button":
            {
              WebkitAppearance: "none",
              margin: 0,
            },
        }}
      /> */}

      <div className="flex w-full items-center bg-[rgba(255,255,255,0.02)] border-2 border-[rgba(255,255,255,0.1)] mb-3">
        <p className="p-2 text-sm text-white/80 shrink-0">Quantity</p>

        <input
          type="text"
          value={quantity}
          onChange={handleQuantityChange}
          className="
      flex-1 min-w-0
      bg-transparent px-3 py-1 text-sm text-white
      outline-none
      focus:ring-0
    "
          placeholder="0.00"
        />

        {disableUsdUnit ? (
          <span className="shrink-0 text-white text-sm p-1 border-l border-[rgba(255,255,255,0.1)]">
            {assetSymbol}
          </span>
        ) : (
          <select
            value={quantityUnit}
            onChange={(e) => setQuantityUnit(e.target.value as "BTC" | "USD")}
            className="
        shrink-0
        text-white text-sm
        p-1
        outline-none cursor-pointer
        border-l border-[rgba(255,255,255,0.1)]
        appearance-none
        [&>option:checked]:bg-[#00F5E0]
        [&>option:checked]:text-black
        [&>option]:bg-black
        [&>option]:text-white
        [&>option:hovered]:bg-white/5
      "
          >
            <option value="BTC">{assetSymbol}</option>
            <option value="USD">USD</option>
          </select>
        )}
      </div>

      {/* Percentage Buttons */}
      {!hidePercentageControls && (
        <Stack direction="row" spacing={1}>
          {percentageButtons.map((percentage) => (
            <Button
              key={percentage}
              onClick={() => handlePercentageClick(percentage)}
              size="small"
              variant={
                Math.abs(quantityPercentage - percentage) < 0.1
                  ? "contained"
                  : "outlined"
              }
              sx={{
                flex: 1,
                fontSize: "0.75rem",
                fontWeight: 500,
                textTransform: "none",
                minWidth: "auto",
                py: 0.5,
                ...(Math.abs(quantityPercentage - percentage) < 0.1
                  ? {
                      backgroundColor: "#00F5E0",
                      color: "#000",
                      "&:hover": {
                        backgroundColor: "#00D4C0",
                      },
                    }
                  : {
                      color: "rgba(255, 255, 255, 0.7)",
                      borderColor: "rgba(255, 255, 255, 0.2)",
                      "&:hover": {
                        backgroundColor: "rgba(255, 255, 255, 0.05)",
                        borderColor: "rgba(255, 255, 255, 0.3)",
                      },
                    }),
              }}
            >
              {percentage}%
            </Button>
          ))}
        </Stack>
      )}

      {/* Slider */}
      {!hidePercentageControls && (
        <Slider
          value={quantityPercentage}
          onChange={handleSliderChange}
          min={0}
          max={100}
          step={1}
          sx={{
            color: "#00F5E0",
            height: 4,
            "& .MuiSlider-track": {
              backgroundColor: "#00F5E0",
              border: "none",
            },
            "& .MuiSlider-rail": {
              backgroundColor: "rgba(255, 255, 255, 0.1)",
            },
            "& .MuiSlider-thumb": {
              width: 12,
              height: 12,
              backgroundColor: "#00F5E0",
              "&:hover, &.Mui-focusVisible": {
                boxShadow: "0 0 0 8px rgba(0, 245, 224, 0.16)",
              },
            },
          }}
        />
      )}

      {/* Max Quantity Info */}
      {maxQuantity > 0 && (
        <Typography
          variant="caption"
          sx={{
            color: "rgba(255, 255, 255, 0.4)",
            fontSize: "0.7rem",
            textAlign: "right",
          }}
        >
          Max:{" "}
          {quantityUnit === "USD"
            ? `$${maxQuantity.toFixed(2)}`
            : `${maxQuantity.toFixed(8)} ${assetSymbol}`}
        </Typography>
      )}
    </Box>
  );
};

export default QuantityInput;
