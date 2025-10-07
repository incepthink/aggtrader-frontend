"use client";

import { useEffect, useState } from "react";

type CounterProps = {
  value: number;
  decimals?: number;
  decimalsToDisplay?: number[];
  idealDecimals?: number;
};

export function Counter({
  value,
  decimals = 2,
  decimalsToDisplay = [2, 4, 6],
  idealDecimals,
}: CounterProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    // Animate from current to new value
    const duration = 800;
    const steps = 30;
    const increment = (value - displayValue) / steps;
    let current = displayValue;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current += increment;

      if (step >= steps) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(current);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  // Determine decimals to show
  let decimalsToShow = idealDecimals || decimals;

  if (decimalsToDisplay) {
    for (const d of decimalsToDisplay) {
      if (Math.abs(displayValue) >= Math.pow(10, -d)) {
        decimalsToShow = d;
        break;
      }
    }
  }

  return (
    <span suppressHydrationWarning>
      {displayValue.toLocaleString("en-US", {
        minimumFractionDigits: decimalsToShow,
        maximumFractionDigits: decimalsToShow,
      })}
    </span>
  );
}
