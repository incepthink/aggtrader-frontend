export interface TradeMarker {
  id: string; // transaction hash
  timestamp: number; // milliseconds
  tokenAddress: string; // which token chart to show on
  price: number; // execution price
  amount: string; // amount traded
  type: 'buy' | 'sell'; // buy or sell
  txHash: string; // transaction hash
  blockNumber: number; // block number
}

const TRADES_KEY = 'katana_trade_markers';

/**
 * Get all saved trade markers
 */
export function getTradeMarkers(): TradeMarker[] {
  try {
    const stored = localStorage.getItem(TRADES_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error loading trade markers:', error);
    return [];
  }
}

/**
 * Save a new trade marker
 */
export function saveTradeMarker(trade: TradeMarker): void {
  try {
    const existing = getTradeMarkers();
    const updated = [...existing, trade];
    localStorage.setItem(TRADES_KEY, JSON.stringify(updated));
    console.log('Trade marker saved:', trade);
  } catch (error) {
    console.error('Error saving trade marker:', error);
  }
}

/**
 * Get trade markers for a specific token
 */
export function getTradeMarkersForToken(tokenAddress: string): TradeMarker[] {
  const all = getTradeMarkers();
  return all.filter(t => t.tokenAddress.toLowerCase() === tokenAddress.toLowerCase());
}

/**
 * Clear all trade markers (optional - for testing)
 */
export function clearTradeMarkers(): void {
  localStorage.removeItem(TRADES_KEY);
}