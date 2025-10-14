import React, { useState, useEffect } from "react";
import { MobileLayout } from "./MobileLayout";
import { DesktopLayout } from "./DesktopLayout";
import { ChartHeaderProps } from "./types";

const ChartHeader: React.FC<ChartHeaderProps> = (props) => {
  const { isOverlay = true } = props;

  // Custom breakpoint state for 1560px
  const [isDesktopSize, setIsDesktopSize] = useState(false);

  useEffect(() => {
    const checkSize = () => {
      const newIsDesktop = window.innerWidth >= 1560;
      setIsDesktopSize(newIsDesktop);
    };

    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  // Desktop layout ONLY shows when: screen >= 1560px AND isOverlay is true
  const shouldShowDesktopLayout = isDesktopSize && isOverlay;
  const shouldShowMobileLayout = !shouldShowDesktopLayout;

  // Determine wrapper classes based on overlay mode
  const wrapperClasses = isOverlay
    ? "absolute top-2 left-2 right-2 md:top-3 md:left-4 md:right-4 z-10"
    : "w-full";

  return (
    <div className={wrapperClasses}>
      {shouldShowMobileLayout && <MobileLayout {...props} />}
      {shouldShowDesktopLayout && <DesktopLayout {...props} />}
    </div>
  );
};

export default ChartHeader;
