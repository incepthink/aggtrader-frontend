// utils/chartVisibleRange.ts
export type TimeframeOption = '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w';

export const getVisibleBarsForTimeframe = (timeframe: TimeframeOption): number => {
  switch (timeframe) {
    case '1m':
      return 120; // 2 hours
    case '5m':
      return 144; // 12 hours
    case '15m':
      return 96;  // 24 hours
    case '30m':
      return 96;  // 2 days
    case '1h':
      return 168; // 7 days
    case '4h':
      return 168; // 28 days
    case '1d':
      return 90;  // 90 days
    case '1w':
      return 52;  // 52 weeks
    default:
      return 100;
  }
};