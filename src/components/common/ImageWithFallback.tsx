"use client";

import { useState } from "react";
import Image from "next/image";
import { Box } from "@mui/material";

type ImageWithFallbackProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
};

export function ImageWithFallback({
  src,
  alt,
  width,
  height,
  className,
}: ImageWithFallbackProps) {
  const [error, setError] = useState(false);

  if (error) {
    // Fallback to a simple colored circle with first letter
    return (
      <Box
        className={className}
        sx={{
          width,
          height,
          borderRadius: "50%",
          bgcolor: "primary.main",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontWeight: "bold",
          fontSize: width / 2,
        }}
      >
        {alt.charAt(0).toUpperCase()}
      </Box>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={() => setError(true)}
      style={{ borderRadius: "50%" }}
    />
  );
}
