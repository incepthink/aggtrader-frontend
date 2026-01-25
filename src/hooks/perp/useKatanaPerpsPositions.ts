'use client';

import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';

/**
 * Position data from Katana Perps API
 * Matches KatanaPerpsPosition from @katanaperps/katana-perps-sdk
 */
export interface KatanaPerpsPosition {
  /** Market symbol (e.g., "BTC-USD") */
  market: string;
  /** Base quantity, negative for short positions */
  quantity: string;
  /** Maximum absolute quantity of the position during its existence */
  maximumQuantity: string;
  /** Average entry price of the position */
  entryPrice: string;
  /** Average exit price of the position */
  exitPrice: string;
  /** Current mark price of the market */
  markPrice: string;
  /** Current index price of the market */
  indexPrice: string;
  /** Index price beyond which the position will be liquidated */
  liquidationPrice: string;
  /** Position value at mark price */
  value: string;
  /** Realized PnL of the position in quote terms, including funding payments */
  realizedPnL: string;
  /** Unrealized PnL of the position in quote terms at the mark price */
  unrealizedPnL: string;
  /** Current initial margin requirement of the position */
  marginRequirement: string;
  /** Cross-margined position leverage */
  leverage: string;
  /** Net total of all funding payments for the position */
  totalFunding: string;
  /** Total of all trade quantities that increased the position in base terms */
  totalOpen: string;
  /** Total of all trade quantities that decreased the position in base terms */
  totalClose: string;
  /** Position ADL risk, 0-5 (5 is highest risk) */
  adlQuintile: number;
  /** Id of the fill that opened the position */
  openedByFillId: string;
  /** Id of the fill that most recently updated the position */
  lastFillId: string;
  /** The timestamp indicating when the item was created */
  time: number;
}

/**
 * Fetch positions from the API
 */
async function fetchPositions(wallet: string): Promise<KatanaPerpsPosition[]> {
  const response = await fetch(`/api/kuma/positions?wallet=${wallet}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch positions');
  }

  return response.json();
}

/**
 * Hook to fetch user's open positions from Katana Perps
 *
 * @returns Query result with positions array, loading state, and error
 */
export function useKatanaPerpsPositions() {
  const { address, isConnected } = useAccount();

  return useQuery({
    queryKey: ['katana-perps-positions', address],
    queryFn: () => fetchPositions(address!),
    enabled: isConnected && !!address,
    staleTime: 10000, // 10 seconds - positions change frequently
    gcTime: 60000, // 1 minute
    refetchInterval: 15000, // Auto-refresh every 15 seconds
    refetchOnWindowFocus: true,
  });
}

/**
 * Helper to calculate unrealized PnL percentage
 */
export function calculateUnrealizedPnLPercentage(position: KatanaPerpsPosition): number {
  const unrealizedPnL = parseFloat(position.unrealizedPnL);
  const marginRequirement = parseFloat(position.marginRequirement);

  if (marginRequirement === 0) return 0;

  return (unrealizedPnL / marginRequirement) * 100;
}

/**
 * Helper to determine if position is long or short
 */
export function isLongPosition(position: KatanaPerpsPosition): boolean {
  return parseFloat(position.quantity) > 0;
}

/**
 * Helper to format position quantity for display (absolute value)
 */
export function formatPositionQuantity(position: KatanaPerpsPosition): string {
  const qty = Math.abs(parseFloat(position.quantity));
  return qty.toFixed(6);
}
