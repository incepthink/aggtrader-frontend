// src/components/profile/equity-chart/useScreenSize.ts
import { useState, useEffect } from "react";

export const useScreenSize = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [screenWidth, setScreenWidth] = useState(0);

  useEffect(() => {
    const checkSize = () => {
      const width = window.innerWidth;
      setScreenWidth(width);
      setIsMobile(width < 640);
    };

    checkSize();
    window.addEventListener("resize", checkSize);

    return () => window.removeEventListener("resize", checkSize);
  }, []);

  return { isMobile, screenWidth };
};