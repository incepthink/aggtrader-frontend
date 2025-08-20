import { CandlestickData } from 'lightweight-charts';

export interface TokenInfo {
  ticker: string;
  img?: string;
  address?: string;
  isNative?: boolean;
}

export interface PriceChange {
  percentage: number;
  absolute: number;
}

export interface OHLCMetadata {
  totalValueLockedUSD?: number;
  volumeUSD?: number;
}

export interface OHLCData {
  chart: Array<{
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
  }>;
  metadata: OHLCMetadata;
}

export interface ChartDataState {
  ohlcData: OHLCData | null;
  chartData: CandlestickData[];
  currentPrice: number | null;
  priceChange: PriceChange;
  high: number;
  low: number;
}

export interface ChartLoadingState {
  isLoading: boolean;
  ohlcLoading: boolean;
  priceLoading: boolean;
}

export interface ChartErrorState {
  error: string | null;
  priceHasError: boolean;
  priceErrorData: any;
  isSupported: boolean;
}

export type ChartResolution = 'hour' | 'day';

export const KATANA_CHAIN_ID = 747474;
export const WRON_ADDRESS = '0xEE7D8BCFb72bC1880D0Cf19822eB0A2e6577aB62';

export const CHART_CONFIG = {
  REFRESH_INTERVAL: 300000, // 5 minutes
  PRICE_REFRESH_INTERVAL: 30000, // 30 seconds
  PRICE_STALE_TIME: 15000, // 15 seconds
  DEFAULT_DAYS: 30,
  DEFAULT_ZOOM_DAYS: 3,
  INIT_DELAY: 100,
  RESOLUTION_CHANGE_DELAY: 200,
} as const;