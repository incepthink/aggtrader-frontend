export interface TradeHistory {
  market: string;
  side: 'Long' | 'Short';
  quantity: number;
  price: number;
  fee: number;
  realizedPnl: number;
  timestamp: string;
}

export interface PositionsPanelProps {
  tradeHistory?: TradeHistory[];
}
