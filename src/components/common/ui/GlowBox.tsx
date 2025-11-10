import { Box, type BoxProps } from "@mui/material";
import React from "react";

type GlowBoxProps = BoxProps & {
  children: React.ReactNode;
  padding?: number | string;
  spread?: number;
};

const GlowBox: React.FC<GlowBoxProps> = ({
  children,
  padding = 2,
  spread = 32,
  sx = {},
  ...rest
}) => {
  return (
    <Box
      sx={{
        boxShadow: `inset 0 1px ${spread}px rgba(0, 255, 233, 0.6)`,
        backgroundColor: "primary.dark",
        borderRadius: 2,
        p: padding,
        ...sx,
      }}
      {...rest}
    >
      {children}
    </Box>
  );
};

export default GlowBox;
