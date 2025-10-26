import React from "react";
import {
  Box,
  TextField,
  InputAdornment,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

interface ResponsiveFilterControlsProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

const ResponsiveFilterControls: React.FC<ResponsiveFilterControlsProps> = ({
  searchTerm,
  onSearchChange,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: isMobile ? "flex-start" : "center",
        flexDirection: isMobile ? "column" : "row",
        pt: 4,
        pb: 2,
        gap: isMobile ? 2 : 0,
      }}
    >
      {/* Vaults Heading */}
      <Typography
        variant="h5"
        sx={{
          color: "white",
          fontWeight: 600,
          fontSize: isMobile ? "1.75rem" : "2rem",
          alignSelf: isMobile ? "flex-start" : "auto",
          display: isMobile ? "none" : "visible",
        }}
      >
        Lending
      </Typography>

      {/* Search Controls */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          width: isMobile ? "100%" : "auto",
        }}
      >
        <TextField
          placeholder="Filter vaults"
          size={isMobile ? "medium" : "small"}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          fullWidth={isMobile}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: "#8b949e" }} />
              </InputAdornment>
            ),
            sx: {
              boxShadow: "inset 0 1px 12px rgba(0, 255, 233, 0.6)",
              px: 2,
              py: isMobile ? 1 : 0.5,
              backgroundColor: "primary.dark",
              color: "white",
              minWidth: isMobile ? "100%" : "250px",
              fontSize: isMobile ? "16px" : "14px", // Prevents zoom on iOS
              "& .MuiOutlinedInput-notchedOutline": {
                border: "none",
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                border: "none",
              },
              "&.Mui-hovered .MuiOutlinedInput-notchedOutline": {
                boxShadow: "inset 0 1px 12px rgba(0, 255, 233, 0.7)",
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                boxShadow: "inset 0 1px 12px rgba(0, 255, 233, 0.7)",
              },
              borderRadius: isMobile ? 2 : 1,
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

export default ResponsiveFilterControls;
