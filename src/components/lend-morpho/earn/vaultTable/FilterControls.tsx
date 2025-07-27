import React from "react";
import { Box, TextField, InputAdornment, Typography } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import InfoIcon from "@mui/icons-material/Info";

interface FilterControlsProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

const FilterControls: React.FC<FilterControlsProps> = ({
  searchTerm,
  onSearchChange,
}) => {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        p: 2,
        pt: 4,
      }}
    >
      {/* Vaults Heading */}
      <Typography
        variant="h5"
        sx={{
          color: "white",
          fontWeight: 600,
          fontSize: "1.5rem",
        }}
      >
        Vaults
      </Typography>

      {/* Search Controls */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <TextField
          placeholder="Filter vaults"
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
      </Box>
    </Box>
  );
};

export default FilterControls;
