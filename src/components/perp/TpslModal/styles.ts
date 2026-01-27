import { SxProps, Theme } from "@mui/material";

export const inputFieldSx: SxProps<Theme> = {
  flex: 1,
  "& .MuiOutlinedInput-root": {
    color: "#fff",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    "& fieldset": {
      borderColor: "rgba(255, 255, 255, 0.2)",
    },
    "&:hover fieldset": {
      borderColor: "rgba(255, 255, 255, 0.3)",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#00F5E0",
    },
    "&.Mui-error fieldset": {
      borderColor: "#EF4444",
    },
  },
};

export const selectFieldSx: SxProps<Theme> = {
  color: "#fff",
  backgroundColor: "rgba(0, 0, 0, 0.3)",
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "#00F5E0",
  },
};

export const getPercentageButtonSx = (isSelected: boolean): SxProps<Theme> => ({
  flex: 1,
  fontSize: "0.75rem",
  textTransform: "none",
  color: isSelected ? "#000" : "rgba(255, 255, 255, 0.6)",
  backgroundColor: isSelected ? "#FF8C00" : "transparent",
  borderColor: isSelected ? "#FF8C00" : "rgba(255, 255, 255, 0.2)",
  "&:hover": {
    backgroundColor: isSelected ? "#FF7700" : "rgba(255, 255, 255, 0.05)",
    borderColor: isSelected ? "#FF7700" : "rgba(255, 255, 255, 0.3)",
  },
});

export const getProfitSliderSx: SxProps<Theme> = {
  color: "#22C55E",
  "& .MuiSlider-track": {
    backgroundColor: "#22C55E",
    border: "none",
  },
  "& .MuiSlider-rail": {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  "& .MuiSlider-thumb": {
    backgroundColor: "#22C55E",
    border: "2px solid #fff",
    width: 16,
    height: 16,
  },
};

export const getLossSliderSx: SxProps<Theme> = {
  color: "#EF4444",
  "& .MuiSlider-track": {
    backgroundColor: "#EF4444",
    border: "none",
  },
  "& .MuiSlider-rail": {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  "& .MuiSlider-thumb": {
    backgroundColor: "#EF4444",
    border: "2px solid #fff",
    width: 16,
    height: 16,
  },
};

export const clearButtonSx: SxProps<Theme> = {
  color: "rgba(255, 255, 255, 0.6)",
  "&:hover": {
    color: "#fff",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
};

export const tabsSx: SxProps<Theme> = {
  mb: 2,
  "& .MuiTabs-indicator": {
    backgroundColor: "#00F5E0",
  },
  "& .MuiTab-root": {
    color: "rgba(255, 255, 255, 0.6)",
    textTransform: "none",
    fontSize: "0.875rem",
    fontWeight: 500,
    "&.Mui-selected": {
      color: "#00F5E0",
    },
  },
};

export const confirmButtonSx: SxProps<Theme> = {
  mt: 3,
  py: 1.5,
  fontSize: "1rem",
  fontWeight: 600,
  textTransform: "none",
  background: "#00F5E0",
  color: "#000",
  "&:hover": {
    background: "#00D4C0",
  },
};

export const marketInfoBoxSx: SxProps<Theme> = {
  mb: 2,
  p: 2,
  backgroundColor: "rgba(0, 0, 0, 0.3)",
  borderRadius: 1,
};
