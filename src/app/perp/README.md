# Perpetual Trading Page Structure

## Layout Overview

The page uses **CSS Grid** with 3 columns and 3 rows matching the Kuma design:

```
┌────────────────────────────────┬─────────────┬────────────────┐
│  CHART HEADER (✓ DONE)         │             │                │
│  (MarketHeader in GlowBox)     │             │                │
├────────────────────────────────┤  ORDERBOOK  │  ORDER FORM    │
│                                │  / TRADES   │  / TRADE       │
│  CHART BODY                    │             │  PANEL         │
│  (Candlestick chart)           │             │                │
│                                │             │                │
├────────────────────────────────┼─────────────┴────────────────┤
│                                │                              │
│  POSITIONS / ORDERS / HISTORY  │  DEPOSIT / WITHDRAW          │
│  (Tabs)                        │                              │
└────────────────────────────────┴──────────────────────────────┘
```

## Grid Configuration

```typescript
gridTemplateColumns: '1fr 280px 350px'
//                    ↑   ↑     ↑
//                    |   |     └─ Trade Panel (fixed width)
//                    |   └─────── Orderbook (fixed width)
//                    └─────────── Chart (flexible)

gridTemplateRows: 'auto 1fr 280px'
//                 ↑    ↑   ↑
//                 |    |   └─ Bottom section (fixed height)
//                 |    └─────── Main content (flexible)
//                 └──────────── Headers (auto height)
```

## Where to Add Components

### 1. Chart Header (✓ Already Added)
**Location:** `gridColumn: '1 / 2', gridRow: '1 / 2'`
- Wrapped in: `<GlowBox>`
- Component: `<MarketHeader />`
- Shows: Price, Index, 24h Change, Funding, Open Interest, Volume
- Status: ✓ Complete with real-time WebSocket data

### 2. Chart Body
**Location:** `gridColumn: '1 / 2', gridRow: '2 / 3'`
```typescript
{/* Add Chart Component Here */}
// Replace the placeholder with:
<TradingViewChart
  market="BTC-USD"
  tickerData={tickerData}
/>
```

### 3. Orderbook/Trades
**Location:** `gridColumn: '2 / 3', gridRow: '1 / 3'` (spans header + chart height)
```typescript
{/* Add Orderbook/Trades Component Here */}
// Replace the entire GlowBox with a component that includes:
// - Tabs at top (Orderbook / Trades)
// - Content area below
// Example:
<GlowBox sx={{ height: '100%' }}>
  <Tabs>
    <Tab label="Orderbook" />
    <Tab label="Trades" />
  </Tabs>
  <TabPanel value="orderbook">
    <OrderbookComponent market="BTC-USD" />
  </TabPanel>
  <TabPanel value="trades">
    <RecentTradesComponent market="BTC-USD" />
  </TabPanel>
</GlowBox>
```

### 4. Order Form / Trade Panel
**Location:** `gridColumn: '3 / 4', gridRow: '1 / 3'` (spans header + chart height)
```typescript
{/* Add Order Form Component Here */}
// Replace with:
<GlowBox sx={{ height: '100%' }}>
  <OrderTypeSelector /> {/* Limit / Market / Stop */}
  <OrderForm
    market="BTC-USD"
    orderType="limit"
  />
  <DepositWithdrawSection /> {/* At bottom */}
</GlowBox>
```

### 5. Positions / Orders / History
**Location:** `gridColumn: '1 / 2', gridRow: '3 / 4'` (bottom-left)
```typescript
{/* Add Positions/Orders/History Tabs Component Here */}
// Replace with:
<GlowBox sx={{ height: '100%' }}>
  <Tabs>
    <Tab label="Positions" />
    <Tab label="Open Orders" />
    <Tab label="Trade History" />
  </Tabs>
  <TabPanel value="positions">
    <PositionsTable />
  </TabPanel>
  <TabPanel value="orders">
    <OpenOrdersTable />
  </TabPanel>
  <TabPanel value="history">
    <TradeHistoryTable />
  </TabPanel>
</GlowBox>
```

### 6. Deposit / Withdraw
**Location:** `gridColumn: '2 / 4', gridRow: '3 / 4'` (bottom-right, spans 2 columns)
```typescript
{/* Add Deposit/Withdraw Component Here */}
// Replace with:
<GlowBox sx={{ height: '100%' }}>
  <Tabs>
    <Tab label="Deposit" />
    <Tab label="Withdraw" />
  </Tabs>
  <TabPanel value="deposit">
    <DepositForm />
  </TabPanel>
  <TabPanel value="withdraw">
    <WithdrawForm />
  </TabPanel>
</GlowBox>
```

## Key Features

### Real-time Data Flow
- WebSocket hook: `useKumaWebSocket('BTC-USD')`
- Returns: `{ isConnected, tickerData, error }`
- Auto-updates: Chart header, price displays, funding countdown

### GlowBox Styling
All sections wrapped in `<GlowBox>` for consistent glassmorphic design:
```typescript
<GlowBox sx={{ height: '100%', ... }}>
  {/* Your component */}
</GlowBox>
```

### Responsive Layout
- Chart area is flexible (`1fr`) - takes remaining space
- Orderbook and Trade Panel have fixed widths (280px, 350px)
- Bottom section has fixed height (280px)

## Next Steps

1. **Chart Component**: Integrate TradingView Lightweight Charts or similar
2. **Orderbook**: Subscribe to `orderbook` WebSocket channel
3. **Recent Trades**: Subscribe to `trades` WebSocket channel
4. **Order Form**: Connect to Kuma's trading API
5. **Positions Table**: Fetch user positions (requires authentication)

## WebSocket Subscriptions Needed

```typescript
// Already subscribed:
wsClient.subscribePublic([{ name: 'tickers' }], ['BTC-USD']);

// Add these for other components:
wsClient.subscribePublic([
  { name: 'candles', interval: '15m' },  // For chart
  { name: 'trades' },                     // For recent trades
  { name: 'orderBookLevel2' },            // For orderbook
], ['BTC-USD']);

// For authenticated data (positions, orders):
wsClient.subscribeAuthenticated([
  { name: 'positions' },
  { name: 'orders' },
]);
```
