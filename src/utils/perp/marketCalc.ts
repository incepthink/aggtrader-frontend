/**
 * Market Order Calculation Utility
 *
 * Simulates market order execution over orderbook depth to calculate:
 * - Actual fillable BTC quantity
 * - USD value (notional)
 * - USD cost (value / leverage)
 *
 * Follows Kuma exchange mechanics where:
 * - BUY orders consume ASK liquidity (taking offers to sell)
 * - SELL orders consume BID liquidity (taking offers to buy)
 */

export interface OrderBookLevel {
  price: number;
  qty: number;
}

export interface MarketCalcInput {
  quantity: string;
  quantityUnit: "BTC" | "USD";
  leverage: number;
  asks: OrderBookLevel[];
  bids: OrderBookLevel[];
  fallbackPrice?: number;
  freeCollateral?: number; // Required for BTC mode effective/requested calculation
}

export interface MarketCalcOutput {
  // Buy/Long metrics (orderbook-based, both modes)
  buyQtyBtc: number;
  buyValueUsd: number;
  buyCostUsd: number;

  // Sell/Short metrics (orderbook-based, both modes)
  sellQtyBtc: number;
  sellValueUsd: number;
  sellCostUsd: number;
}

/**
 * Calculate market order metrics for both buy and sell sides
 */
export function calculateMarketMetrics(input: MarketCalcInput): MarketCalcOutput {
  const { quantity, quantityUnit, leverage, asks, bids, fallbackPrice, freeCollateral } = input;

  // Parse quantity
  const qtyValue = parseFloat(quantity);

  // Handle empty or invalid input
  if (!quantity || isNaN(qtyValue) || qtyValue <= 0) {
    return {
      buyQtyBtc: 0,
      buyValueUsd: 0,
      buyCostUsd: 0,
      sellQtyBtc: 0,
      sellValueUsd: 0,
      sellCostUsd: 0,
    };
  }

  // Handle missing orderbook - use fallback price
  if ((!asks || asks.length === 0) && (!bids || bids.length === 0)) {
    if (!fallbackPrice || fallbackPrice <= 0) {
      return {
        buyQtyBtc: 0,
        buyValueUsd: 0,
        buyCostUsd: 0,
        sellQtyBtc: 0,
        sellValueUsd: 0,
        sellCostUsd: 0,
      };
    }

    // Use fallback price for both sides (same for BTC and USD modes)
    if (quantityUnit === "BTC") {
      const value = qtyValue * fallbackPrice;
      const cost = value / leverage;

      // Apply collateral clamp if specified
      let clampedValue = value;
      let clampedQty = qtyValue;
      if (freeCollateral && leverage) {
        const maxValueByCollateral = freeCollateral * leverage;
        if (value > maxValueByCollateral) {
          clampedValue = maxValueByCollateral;
          clampedQty = clampedValue / fallbackPrice;
        }
      }

      return {
        buyQtyBtc: clampedQty,
        buyValueUsd: clampedValue,
        buyCostUsd: clampedValue / leverage,
        sellQtyBtc: clampedQty,
        sellValueUsd: clampedValue,
        sellCostUsd: clampedValue / leverage,
      };
    } else {
      // USD unit
      const qty = qtyValue / fallbackPrice;
      const cost = qtyValue / leverage;
      return {
        buyQtyBtc: qty,
        buyValueUsd: qtyValue,
        buyCostUsd: cost,
        sellQtyBtc: qty,
        sellValueUsd: qtyValue,
        sellCostUsd: cost,
      };
    }
  }

  // Calculate buy/sell metrics using orderbook simulation for BOTH modes
  let buyResult: { qty: number; value: number };
  let sellResult: { qty: number; value: number };

  if (quantityUnit === "USD") {
    // USD mode: target is USD notional, walk orderbook until USD target filled
    buyResult = simulateMarketOrderUsd(qtyValue, asks, fallbackPrice);
    sellResult = simulateMarketOrderUsd(qtyValue, bids, fallbackPrice);
  } else {
    // BTC mode: target is BTC quantity, walk orderbook until BTC quantity filled
    buyResult = simulateMarketOrderBtc(qtyValue, asks, fallbackPrice);
    sellResult = simulateMarketOrderBtc(qtyValue, bids, fallbackPrice);
  }

  // Apply collateral clamp if specified (applies to both modes)
  if (freeCollateral && leverage) {
    const maxValueByCollateral = freeCollateral * leverage;

    // Clamp buy side
    if (buyResult.value > maxValueByCollateral) {
      // Re-simulate with clamped USD budget
      if (quantityUnit === "USD") {
        buyResult = simulateMarketOrderUsd(maxValueByCollateral, asks, fallbackPrice);
      } else {
        // For BTC mode, reduce quantity proportionally
        const clampRatio = maxValueByCollateral / buyResult.value;
        buyResult = simulateMarketOrderBtc(qtyValue * clampRatio, asks, fallbackPrice);
      }
    }

    // Clamp sell side
    if (sellResult.value > maxValueByCollateral) {
      if (quantityUnit === "USD") {
        sellResult = simulateMarketOrderUsd(maxValueByCollateral, bids, fallbackPrice);
      } else {
        const clampRatio = maxValueByCollateral / sellResult.value;
        sellResult = simulateMarketOrderBtc(qtyValue * clampRatio, bids, fallbackPrice);
      }
    }
  }

  return {
    buyQtyBtc: buyResult.qty,
    buyValueUsd: buyResult.value,
    buyCostUsd: buyResult.value / leverage,
    sellQtyBtc: sellResult.qty,
    sellValueUsd: sellResult.value,
    sellCostUsd: sellResult.value / leverage,
  };
}

/**
 * Simulate market order with USD target
 * Walks through orderbook levels until USD target is filled
 */
function simulateMarketOrderUsd(
  targetUsd: number,
  levels: OrderBookLevel[],
  fallbackPrice?: number
): { qty: number; value: number } {
  if (!levels || levels.length === 0) {
    if (!fallbackPrice || fallbackPrice <= 0) {
      return { qty: 0, value: 0 };
    }
    return { qty: targetUsd / fallbackPrice, value: targetUsd };
  }

  let remainingUsd = targetUsd;
  let totalQty = 0;
  let totalValue = 0;

  for (const level of levels) {
    if (remainingUsd <= 0) break;

    const levelUsd = level.price * level.qty;
    const fillUsd = Math.min(remainingUsd, levelUsd);
    const fillQty = fillUsd / level.price;

    totalQty += fillQty;
    totalValue += fillUsd;
    remainingUsd -= fillUsd;
  }

  return { qty: totalQty, value: totalValue };
}

/**
 * Simulate market order with BTC target
 * Walks through orderbook levels until BTC quantity is filled
 */
function simulateMarketOrderBtc(
  targetBtc: number,
  levels: OrderBookLevel[],
  fallbackPrice?: number
): { qty: number; value: number } {
  if (!levels || levels.length === 0) {
    if (!fallbackPrice || fallbackPrice <= 0) {
      return { qty: 0, value: 0 };
    }
    return { qty: targetBtc, value: targetBtc * fallbackPrice };
  }

  let remainingBtc = targetBtc;
  let totalQty = 0;
  let totalValue = 0;

  for (const level of levels) {
    if (remainingBtc <= 0) break;

    const fillQty = Math.min(remainingBtc, level.qty);
    const fillValue = fillQty * level.price;

    totalQty += fillQty;
    totalValue += fillValue;
    remainingBtc -= fillQty;
  }

  return { qty: totalQty, value: totalValue };
}

/**
 * Format BTC quantity for display
 */
export function formatBtcQuantity(qty: number): string {
  if (qty === 0) return "-";
  return qty.toFixed(4);
}

/**
 * Format USD value for display
 */
export function formatUsdValue(value: number): string {
  if (value === 0) return "-";
  return `$${value.toFixed(2)}`;
}

/**
 * Format dual display (buy / sell)
 */
export function formatDualDisplay(
  buyValue: number,
  sellValue: number,
  formatter: (val: number) => string
): string {
  if (buyValue === 0 && sellValue === 0) {
    return "- / -";
  }
  return `${formatter(buyValue)} / ${formatter(sellValue)}`;
}
