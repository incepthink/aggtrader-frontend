export type TimeframeOption = "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";

export type MetricDisplayMode = "usd" | "percentage";

export interface TimeframeMetrics {
  priceChange: { absolute: number; percentage: number };
  volumeChange: { absolute: number; percentage: number };
  totalVolume: number;
  avgPrice: number;
  timeframe: TimeframeOption;
}

export interface ChartHeaderProps {
  tokenOne: any;
  currentPrice: number | null;
  priceLoading: boolean;
  priceHasError: boolean;
  priceChange: {
    percentage: number;
    absolute: number;
  };
  ohlcData: any;
  isLoading: boolean;
  onRefresh: () => void;
  selectedTimeframe: TimeframeOption;
  onTimeframeChange: (timeframe: TimeframeOption) => void;
  isProcessingTimeframe: boolean;
  timeframeMetrics: TimeframeMetrics | null;
  isOverlay?: boolean;
}
