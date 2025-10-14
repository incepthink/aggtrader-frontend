import React, { useState, useEffect } from "react";
import { MobileLayout } from "./MobileLayout";
import { DesktopLayout } from "./DesktopLayout";
import { EthereumChartHeaderProps } from "./types";

const EthereumChartHeader: React.FC<EthereumChartHeaderProps> = (props) => {
  const { isOverlay = true } = props;

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

  const shouldShowDesktopLayout = isDesktopSize && isOverlay;
  const shouldShowMobileLayout = !shouldShowDesktopLayout;

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

export default EthereumChartHeader;

export type {
  TimeframeOption,
  MetricDisplayMode,
  TimeframeMetrics,
  EthereumChartHeaderProps,
} from "./types";
export { formatCompact } from "./utils";
