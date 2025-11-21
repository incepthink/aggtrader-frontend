"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  TextField,
  Chip,
  InputAdornment,
  Typography,
  Popover,
  MenuItem,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import GlowBox from "@/components/common/ui/GlowBox";
import {
  ALL_VAULTSV3_KINDS_KEYS,
  ALL_VAULTSV3_CATEGORIES_KEYS,
} from "@/lib/yearnfi/vaults-v3/constants";

type FiltersProps = {
  types: string[] | null;
  categories: string[] | null;
  searchValue: string;
  chains: number[] | null;
  onChangeChains: (chains: number[] | null) => void;
  onChangeTypes: (types: string[] | null) => void;
  onChangeCategories: (categories: string[] | null) => void;
  onSearch: (search: string) => void;
  shouldDebounce?: boolean;
};

const CHAIN_OPTIONS = [{ id: 747474, name: "Katana" }];

type FilterBoxProps = {
  label: string;
  selected: (string | number)[];
  options: { id: string | number; name: string }[];
  allOptions: (string | number)[];
  onChange: (values: any[]) => void;
  noAll?: Boolean;
};

function FilterBox({
  label,
  selected,
  options,
  allOptions,
  onChange,
  noAll,
}: FilterBoxProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelect = (value: string | number | "all") => {
    if (value === "all") {
      onChange(allOptions);
    } else {
      onChange([value]);
    }
    handleClose();
  };

  const open = Boolean(anchorEl);

  // Check if all options are selected
  const isAllSelected = selected.length === allOptions.length;

  // Get display value
  const getDisplayChip = () => {
    if (isAllSelected) {
      return (
        <Chip
          label="All"
          size="small"
          sx={{
            backgroundColor: "rgba(0, 245, 224, 0.2)",
            color: "#00F5E0",
            height: "24px",
            fontSize: "0.75rem",
          }}
        />
      );
    } else if (selected.length === 1) {
      const option = options.find((opt) => opt.id === selected[0]);
      return (
        <Chip
          label={option?.name || selected[0]}
          size="small"
          sx={{
            backgroundColor: "rgba(0, 245, 224, 0.2)",
            color: "#00F5E0",
            height: "24px",
            fontSize: "0.75rem",
          }}
        />
      );
    }
    return (
      <Typography
        sx={{ fontSize: "0.875rem", color: "rgba(255, 255, 255, 0.4)" }}
      >
        Select {label.toLowerCase()}
      </Typography>
    );
  };

  return (
    <>
      <Box
        onClick={handleClick}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: { xs: 1, sm: 2 },
          p: { xs: 1, sm: 1.5 },
          backgroundColor: "rgba(0, 0, 0, 0.3)",
          borderRadius: 1,
          border: "1px solid rgba(255, 255, 255, 0.2)",
          cursor: "pointer",
          transition: "all 0.2s",
          "&:hover": {
            borderColor: "#00F5E0",
            backgroundColor: "rgba(0, 0, 0, 0.4)",
          },
        }}
      >
        <Typography
          sx={{
            fontSize: { xs: "0.75rem", sm: "0.875rem" },
            color: "rgba(255, 255, 255, 0.7)",
            minWidth: { xs: "50px", sm: "60px" },
          }}
        >
          {label}
        </Typography>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, flex: 1 }}>
          {getDisplayChip()}
        </Box>

        <KeyboardArrowDownIcon
          sx={{
            color: "rgba(255, 255, 255, 0.5)",
            fontSize: { xs: "1rem", sm: "1.25rem" },
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
          }}
        />
      </Box>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        PaperProps={{
          sx: {
            backgroundColor: "rgba(17, 24, 39, 0.95)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "8px",
            mt: 1,
            minWidth: anchorEl?.offsetWidth || 200,
          },
        }}
      >
        <Box sx={{ p: 1 }}>
          {!noAll && (
            <MenuItem
              onClick={() => handleSelect("all")}
              sx={{
                color: "white",
                fontSize: "0.875rem",
                borderRadius: 1,
                "&:hover": {
                  backgroundColor: "rgba(0, 245, 224, 0.1)",
                },
                ...(isAllSelected && {
                  backgroundColor: "rgba(0, 245, 224, 0.2)",
                }),
              }}
            >
              All
            </MenuItem>
          )}
          {options.map((option) => (
            <MenuItem
              key={option.id}
              onClick={() => handleSelect(option.id)}
              sx={{
                color: "white",
                fontSize: "0.875rem",
                borderRadius: 1,
                "&:hover": {
                  backgroundColor: "rgba(0, 245, 224, 0.1)",
                },
                ...(selected.length === 1 &&
                  selected[0] === option.id && {
                    backgroundColor: "rgba(0, 245, 224, 0.2)",
                  }),
              }}
            >
              {option.name}
            </MenuItem>
          ))}
        </Box>
      </Popover>
    </>
  );
}

export function Filters({
  types,
  categories,
  searchValue,
  chains,
  onChangeChains,
  onChangeTypes,
  onChangeCategories,
  onSearch,
  shouldDebounce = false,
}: FiltersProps) {
  const [localSearch, setLocalSearch] = useState(searchValue);

  useEffect(() => {
    if (!shouldDebounce) {
      onSearch(localSearch);
      return;
    }

    const timer = setTimeout(() => {
      onSearch(localSearch);
    }, 500);

    return () => clearTimeout(timer);
  }, [localSearch, shouldDebounce, onSearch]);

  const typeOptions = ALL_VAULTSV3_KINDS_KEYS.map((key) => ({
    id: key,
    name: key,
  }));

  const categoryOptions = ALL_VAULTSV3_CATEGORIES_KEYS.map((key) => ({
    id: key,
    name: key,
  }));

  const chainOptions = CHAIN_OPTIONS.map((chain) => ({
    id: chain.id,
    name: chain.name,
  }));

  return (
    <GlowBox>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "2fr 1fr 1fr 1fr"
          },
          gap: { xs: 1.5, sm: 2 },
        }}
      >
        {/* Search */}
        <TextField
          fullWidth
          placeholder="Search vaults..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: "rgba(255, 255, 255, 0.5)", fontSize: { xs: "1.25rem", sm: "1.5rem" } }} />
              </InputAdornment>
            ),
            sx: {
              color: "white",
              backgroundColor: "rgba(0, 0, 0, 0.3)",
              fontSize: { xs: "0.875rem", sm: "1rem" },
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "rgba(255, 255, 255, 0.2)",
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: "#00F5E0",
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: "#00F5E0",
              },
            },
          }}
          sx={{
            gridColumn: { xs: "1", sm: "1 / -1", md: "auto" },
          }}
        />

        <FilterBox
          label="Type"
          selected={types || []}
          options={typeOptions}
          allOptions={ALL_VAULTSV3_KINDS_KEYS}
          onChange={onChangeTypes}
        />

        <FilterBox
          label="Category"
          selected={categories || []}
          options={categoryOptions}
          allOptions={ALL_VAULTSV3_CATEGORIES_KEYS}
          onChange={onChangeCategories}
        />

        <FilterBox
          label="Chain"
          noAll={true}
          selected={chains || []}
          options={chainOptions}
          allOptions={[1, 747474]}
          onChange={onChangeChains}
        />
      </Box>
    </GlowBox>
  );
}
