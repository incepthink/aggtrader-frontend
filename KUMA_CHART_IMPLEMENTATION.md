# Kuma SDK Candlestick Chart Implementation

This document describes the implementation of the BTC-USD candlestick chart using Kuma SDK websockets, following the same pattern as the existing Katana chart.

## Files Created

### 1. API Proxy: `src/app/api/kuma/candles/route.ts`

**Purpose**: Next.js API route that acts as a proxy to fetch historical candles from Kuma API.

**Why Needed**: The Kuma REST API doesn't allow CORS requests from localhost, so we use a server-side API route as a proxy.

**Features**:
- Proxies requests to `https://api.kuma.bid/v1/candles`
- Accepts query parameters: `market`, `interval`, `limit`
- Returns data with proper CORS headers
- Handles errors gracefully

### 2. Hook: `src/hooks/perp/useKumaCandleWebSocket.ts`

**Purpose**: Manages WebSocket connection to Kuma SDK for real-time candle data.

**Key Features**:
- Connects to Kuma WebSocket and subscribes to candle data
- Transforms `KumaCandleEventData` to Lightweight Charts `CandlestickData` format
- Maintains a sorted map of candles by timestamp
- Handles connection state, errors, and cleanup
- Updates candle data in real-time as new events arrive

**Parameters**:
```typescript
{
  market: string;        // e.g., 'BTC-USD'
  interval: CandleInterval;  // e.g., CandleInterval.FIVE_MINUTES
  enabled?: boolean;     // Enable/disable websocket connection
}
```

**Returns**:
```typescript
{
  isConnected: boolean;           // WebSocket connection status
  candleData: CandlestickData[];  // Array of candles for chart
  latestCandle: KumaCandleEventData | null;  // Most recent candle update
  error: string | null;           // Error message if any
  wsClient: WebSocketClient | null;  // WebSocket client instance
}
```

**Data Transformation**:
- Kuma SDK provides: `start`, `open`, `high`, `low`, `close`, `baseVolume`, `quoteVolume`, `trades`
- Lightweight Charts expects: `time`, `open`, `high`, `low`, `close`
- The hook transforms timestamps using `start` as `UTCTimestamp`

### 3. Component: `src/components/perp/KumaCandlestickChart.tsx`

**Purpose**: Renders a candlestick chart for perpetual markets using Kuma SDK data.

**Key Features**:
- Uses `useKumaCandleWebSocket` hook for real-time data
- Reuses existing `ChartContainer` component from Katana implementation
- Shows loading state while connecting or waiting for data
- Displays error state with retry functionality
- Includes market info overlay showing connection status and trade count
- Follows the same pattern as `KatanaCandlestickChart.tsx`

**Props**:
```typescript
{
  market?: string;           // Default: 'BTC-USD'
  interval?: CandleInterval; // Default: CandleInterval.FIVE_MINUTES
}
```

**UI States**:
1. **Loading**: Shows spinner while connecting or waiting for candle data
2. **Error**: Displays error message with retry button
3. **Active**: Renders chart with market info overlay

**Market Info Overlay**:
- Connection indicator (green dot = connected)
- Market symbol (e.g., "BTC-USD")
- Interval (e.g., "5m")
- Trade count from latest candle

### 4. Integration: `src/app/perp/page.tsx`

**Changes Made**:
- Imported `KumaCandlestickChart` component
- Imported `CandleInterval` enum from Kuma SDK
- Replaced chart placeholder with `KumaCandlestickChart`
- Configured for BTC-USD market with 5-minute candles

## How It Works

### 1. Historical Data Loading Flow

```
Component Mount
    ↓
Fetch historical candles via API proxy
    ↓
GET /api/kuma/candles (Next.js API route)
    ↓
Proxy fetches from Kuma API
    ↓
Transform & populate candleMapRef
    ↓
Chart renders with historical data
```

### 2. WebSocket Connection Flow

```
Component Mount
    ↓
useKumaCandleWebSocket initializes
    ↓
WebSocketClient.connect()
    ↓
onConnect: Subscribe to candles
    ↓
onMessage: Process candle events
    ↓
Transform & update candleData state
    ↓
Chart rerenders with new data
```

### 3. Data Flow

```
Kuma SDK WebSocket
    ↓
KumaCandleEvent received
    ↓
Transform to CandlestickData format
    ↓
Update candleMapRef (Map by timestamp)
    ↓
Convert to sorted array
    ↓
Pass to ChartContainer
    ↓
Lightweight Charts renders
```

### 4. Candle Update Logic

When a new `KumaCandleEvent` arrives:
1. Check if market and interval match subscription
2. Transform the candle data
3. Update the candle map using `start` timestamp as key
4. This handles both:
   - **New candles**: Added to the map
   - **Updated candles**: Existing candle is updated (same timestamp)
5. Convert map to sorted array
6. Update state to trigger chart rerender

## Available Intervals

From `CandleInterval` enum in Kuma SDK:
- `ONE_MINUTE` - 1m
- `FIVE_MINUTES` - 5m
- `FIFTEEN_MINUTES` - 15m
- `THIRTY_MINUTES` - 30m
- `ONE_HOUR` - 1h
- `FOUR_HOURS` - 4h
- `TWELVE_HOURS` - 12h
- `ONE_DAY` - 1d
- `THREE_DAYS` - 3d
- `ONE_WEEK` - 1w

## Usage Examples

### Basic Usage (Default)
```typescript
<KumaCandlestickChart />
// BTC-USD with 5-minute candles
```

### Custom Market and Interval
```typescript
import { CandleInterval } from '@kumabid/kuma-sdk';

<KumaCandlestickChart
  market="ETH-USD"
  interval={CandleInterval.ONE_HOUR}
/>
```

### Using the Hook Directly
```typescript
import { useKumaCandleWebSocket } from '@/hooks/perp/useKumaCandleWebSocket';
import { CandleInterval } from '@kumabid/kuma-sdk';

function MyComponent() {
  const { isConnected, candleData, latestCandle, error } = useKumaCandleWebSocket({
    market: 'BTC-USD',
    interval: CandleInterval.FIFTEEN_MINUTES,
    enabled: true,
  });

  // Use the data...
}
```

## Pattern Consistency

This implementation follows the **exact same pattern** as the Katana chart:

| Katana Chart | Kuma Chart |
|--------------|------------|
| `useChartData` hook | `useKumaCandleWebSocket` hook |
| `KatanaCandlestickChart` | `KumaCandlestickChart` |
| Uses `ChartContainer` | Uses same `ChartContainer` |
| Token-based data | Market-based data |
| Custom OHLC endpoint | Kuma SDK WebSocket |

## Key Differences from Katana Chart

1. **Data Source**:
   - Katana: Custom REST API endpoints
   - Kuma: WebSocket real-time updates

2. **Data Structure**:
   - Katana: Token addresses
   - Kuma: Market symbols (e.g., "BTC-USD")

3. **Updates**:
   - Katana: Polling/refetch
   - Kuma: Real-time WebSocket push

4. **Simplicity**:
   - Kuma chart is simpler - no timeframe selector, no complex state management
   - Single interval, single market per component instance

## Future Enhancements

Potential improvements to match Katana chart features:

1. **Add Timeframe Selector**: Allow users to switch intervals dynamically
2. **Add Historical Data**: Fetch historical candles on initial load using REST API
3. **Add Chart Header**: Display price, change%, high/low like MarketHeader
4. **Add Trade Markers**: Mark user trades on the chart
5. **Multiple Markets**: Support switching between different perpetual markets
6. **Responsive Layout**: Add mobile/desktop layout variations

## Testing

To test the implementation:

1. Start the dev server: `npm run dev`
2. Navigate to `/perp` page
3. You should see:
   - Market header with BTC-USD ticker data
   - Candlestick chart showing BTC-USD 5-minute candles
   - Real-time updates as new candles arrive
   - Connection indicator (green dot when connected)

## Troubleshooting

### Chart shows "Connecting..." forever
- Check browser console for WebSocket errors
- Verify Kuma SDK API is accessible
- Check network tab for WebSocket connection

### Chart shows "Waiting for candle data..."
- WebSocket is connected but no candles received yet
- Wait for next candle interval to complete
- Check if market symbol is correct

### TypeScript errors
- Ensure all imports are correct
- Verify `@kumabid/kuma-sdk` version is ^1.2.0
- Check `lightweight-charts` is installed

### Chart not updating
- Check console for `[Kuma Candles] Received candle update` logs
- Verify market and interval match subscription
- Check WebSocket connection status
