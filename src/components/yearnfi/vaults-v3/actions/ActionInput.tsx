"use client";

import React from "react";
import { Box, TextField, Button, Typography, Stack } from "@mui/material";
import { formatAmount } from "@/lib/yearnfi/lib/utils";

type ActionInputProps = {
  value: string;
  onChange: (value: string) => void;
  onMax: () => void;
  balance: number;
  symbol: string;
  label: string;
  disabled?: boolean;
};

export function ActionInput({
  value,
  onChange,
  onMax,
  balance,
  symbol,
  label,
  disabled = false,
}: ActionInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    if (inputValue === "") {
      onChange("");
      return;
    }
    if (!/^\d*\.?\d*$/.test(inputValue)) {
      return;
    }
    onChange(inputValue);
  };

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 1 }}
      >
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Balance: {formatAmount(balance, 4)} {symbol}
        </Typography>
      </Stack>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          p: 2,
          bgcolor: "primary.dark",
          borderRadius: 2,
          border: 1,
          borderColor: "divider",
        }}
      >
        <TextField
          fullWidth
          value={value}
          onChange={handleChange}
          placeholder="0.00"
          disabled={disabled}
          variant="standard"
          InputProps={{
            disableUnderline: true,
            sx: {
              fontSize: "1.5rem",
              fontWeight: 600,
              color: "text.primary",
            },
          }}
          sx={{
            "& input": {
              textAlign: "left",
            },
          }}
        />
        <Button
          variant="outlined"
          size="small"
          onClick={onMax}
          disabled={disabled}
          sx={{
            minWidth: "60px",
            fontWeight: 600,
          }}
        >
          MAX
        </Button>
      </Box>
    </Box>
  );
}
