export interface TradeMarker {
  id: string;
  timestamp: number;
  tokenAddress: string;
  price: number;
  amount: string;
  type: 'buy' | 'sell';
  txHash: string;
  blockNumber: number;
}

const TRADES_KEY = 'katana_trade_markers';

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

// UPDATED: Check for duplicates before saving
export function saveTradeMarker(trade: TradeMarker): void {
  try {
    const existing = getTradeMarkers();
    
    // Check if txHash already exists
    const duplicate = existing.some(t => t.txHash === trade.txHash);
    if (duplicate) {
      console.log('Trade marker already exists, skipping:', trade.txHash);
      return;
    }
    
    const updated = [...existing, trade];
    localStorage.setItem(TRADES_KEY, JSON.stringify(updated));
    console.log('Trade marker saved:', trade);
  } catch (error) {
    console.error('Error saving trade marker:', error);
  }
}

export function getTradeMarkersForToken(tokenAddress: string): TradeMarker[] {
  const all = getTradeMarkers();
  return all.filter(t => t.tokenAddress.toLowerCase() === tokenAddress.toLowerCase());
}

export function clearTradeMarkers(): void {
  localStorage.removeItem(TRADES_KEY);
}