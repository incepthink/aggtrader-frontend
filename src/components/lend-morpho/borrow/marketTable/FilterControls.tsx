// components/lend/markets/FilterControls.tsx
import React from "react";
import {
  Box,
  TextField,
  InputAdornment,
  Typography,
  Chip,
  Button,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { styled } from "@mui/material/styles";

const FilterContainer = styled(Box)({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "28px 0 12px 0",
  flexWrap: "wrap",
  gap: "16px",
});

const FilterSection = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "16px",
});

const FilterButton = styled(Button)<{ active?: boolean }>(({ active }) => ({
  backgroundColor: active ? "#4F46E5" : "transparent",
  color: active ? "#FFFFFF" : "#8B8D98",
  border: "1px solid #3A3D4A",
  borderRadius: "8px",
  textTransform: "none",
  fontSize: "14px",
  fontWeight: "500",
  padding: "8px 16px",
  minWidth: "auto",
  "&:hover": {
    backgroundColor: active ? "#4338CA" : "rgba(79, 70, 229, 0.1)",
    borderColor: "#4F46E5",
  },
}));

interface FilterControlsProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  whitelistedOnly?: boolean;
  onWhitelistedToggle?: () => void;
}

const FilterControls: React.FC<FilterControlsProps> = ({
  searchTerm,
  onSearchChange,
  whitelistedOnly = true,
  onWhitelistedToggle,
}) => {
  return (
    <FilterContainer>
      {/* Left side - Title and filters */}
      <FilterSection>
        <Typography
          variant="h5"
          sx={{
            color: "white",
            fontWeight: 600,
            fontSize: "1.5rem",
            mr: 3,
          }}
        >
          Markets
        </Typography>

        {/* <Typography
          variant="body2"
          sx={{ color: "#8B8D98", fontSize: "14px", mr: 1 }}
        >
          Whitelisted:
        </Typography>
        <Chip
          label={whitelistedOnly ? "ON" : "OFF"}
          size="small"
          onClick={onWhitelistedToggle}
          sx={{
            backgroundColor: whitelistedOnly ? "#4F46E5" : "#3A3D4A",
            color: "#FFFFFF",
            fontSize: "12px",
            height: "24px",
            cursor: "pointer",
            "&:hover": {
              backgroundColor: whitelistedOnly ? "#4338CA" : "#4F46E5",
            },
          }}
        /> */}
      </FilterSection>

      {/* Right side - Search */}
      <FilterSection>
        <TextField
          placeholder="Filter markets"
          size="small"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: "#8b949e" }} />
              </InputAdornment>
            ),
            sx: {
              backgroundColor: "#2d3748",
              color: "white",
              minWidth: "250px",
              "& .MuiOutlinedInput-notchedOutline": {
                border: "none",
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                border: "none",
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                border: "1px solid #3b82f6",
              },
            },
          }}
          sx={{
            "& .MuiInputBase-input": {
              color: "white",
            },
            "& .MuiInputBase-input::placeholder": {
              color: "#8b949e",
              opacity: 1,
            },
          }}
        />
      </FilterSection>
    </FilterContainer>
  );
};

export default FilterControls;
