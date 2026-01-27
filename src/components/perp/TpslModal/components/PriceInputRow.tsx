"use client";

import {
  Stack,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputAdornment,
  Typography,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { PriceInputRowProps, TriggerType } from "../types";
import { inputFieldSx, selectFieldSx, clearButtonSx } from "../styles";

const PriceInputRow = ({
  price,
  onPriceChange,
  triggerType,
  onTriggerTypeChange,
  percentage,
  onPercentageChange,
  onClear,
  hasError,
}: PriceInputRowProps) => {
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      {/* Price Input */}
      <TextField
        size="small"
        type="number"
        value={price}
        onChange={(e) => onPriceChange(e.target.value)}
        placeholder="0.0"
        error={hasError}
        sx={inputFieldSx}
      />

      {/* Dropdown: Index/Last */}
      <FormControl size="small" sx={{ minWidth: 100 }}>
        <Select
          value={triggerType}
          onChange={(e) => onTriggerTypeChange(e.target.value as TriggerType)}
          sx={selectFieldSx}
        >
          <MenuItem value="index">Index</MenuItem>
          <MenuItem value="last">Last</MenuItem>
        </Select>
      </FormControl>

      {/* Percentage Input */}
      <TextField
        size="small"
        type="number"
        value={percentage}
        onChange={(e) => onPercentageChange(e.target.value)}
        placeholder="0.0"
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <Typography sx={{ color: "rgba(255, 255, 255, 0.6)" }}>
                %
              </Typography>
            </InputAdornment>
          ),
        }}
        sx={inputFieldSx}
      />

      {/* Clear Button */}
      <IconButton onClick={onClear} size="small" sx={clearButtonSx}>
        <CloseIcon fontSize="small" />
      </IconButton>
    </Stack>
  );
};

export default PriceInputRow;
