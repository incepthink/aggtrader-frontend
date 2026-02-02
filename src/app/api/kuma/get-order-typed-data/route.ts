import { NextRequest, NextResponse } from 'next/server';
import { generateUUID, getKumaConfig } from '../utils';

// Use Edge Runtime for better global distribution and non-US deployment
export const runtime = 'edge';
export const preferredRegion = 'bom1';

/**
 * API Route: POST /api/kuma/get-order-typed-data
 *
 * Returns the EIP-712 typed data structure that the client should sign
 * for order submission to Katana Perps API
 *
 * This ensures the client signs exactly what Katana Perps expects for order creation
 *
 * Reference: https://api-docs-v1-perps.katana.network
 */

/**
 * Convert UUID to uint128 format for Katana Perps signatures
 * Based on Katana Perps SDK implementation
 */
function uuidToUint128(uuid: string): string {
  const hexString = `0x${uuid.replace(/-/g, '')}`;
  const uint128 = BigInt.asUintN(128, BigInt(hexString));
  return uint128.toString();
}

/**
 * Format and validate quantity according to Katana Perps API requirements
 * - Must be a multiple of stepSize
 * - Must meet minimum order size
 * - Must be formatted as string with 8 decimals
 */
function formatQuantity(quantity: string, stepSize: number, minimum: number): string {
  const value = parseFloat(quantity);

  // Round to nearest stepSize increment
  const rounded = Math.round(value / stepSize) * stepSize;

  // Enforce minimum
  const final = Math.max(rounded, minimum);

  // Format to 8 decimals
  return final.toFixed(8);
}

/**
 * Format price to whole number with 8 decimal zeros
 * Katana Perps API requires prices to be whole numbers formatted as "X.00000000"
 */
function formatPrice(price: string | number): string {
  const value = typeof price === 'string' ? parseFloat(price) : price;
  const rounded = Math.round(value);
  return rounded.toFixed(8);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { wallet, market, type, side, quantity, price, triggerPrice, triggerType, reduceOnly } = body;

    // Validate required fields
    if (!wallet || !market || type === undefined || side === undefined || !quantity) {
      return NextResponse.json(
        { error: 'Missing required fields: wallet, market, type, side, quantity' },
        { status: 400 }
      );
    }

    // For limit orders (type=1), price is required
    const isLimitOrder = type === 1;
    if (isLimitOrder && (!price || parseFloat(price) <= 0)) {
      return NextResponse.json(
        { error: 'Price is required for limit orders' },
        { status: 400 }
      );
    }

    // Stop order types: stopLossMarket=2, stopLossLimit=3, takeProfitMarket=4, takeProfitLimit=5, trailingStopMarket=6
    const isStopOrder = type >= 2 && type <= 6;
    // Stop limit orders (type=3, 5) require both triggerPrice AND price (limit price)
    const isStopLimitOrder = type === 3 || type === 5;

    if (isStopOrder && (!triggerPrice || parseFloat(triggerPrice) <= 0)) {
      return NextResponse.json(
        { error: 'Trigger price is required for stop orders' },
        { status: 400 }
      );
    }
    if (isStopOrder && (triggerType === undefined || triggerType === null)) {
      return NextResponse.json(
        { error: 'Trigger type is required for stop orders' },
        { status: 400 }
      );
    }
    // Stop limit orders also require a limit price
    if (isStopLimitOrder && (!price || parseFloat(price) <= 0)) {
      return NextResponse.json(
        { error: 'Limit price is required for stop limit orders' },
        { status: 400 }
      );
    }

    // Get sandbox mode from environment
    const { baseUrl, sandbox } = getKumaConfig();

    // Fetch market data to get stepSize and minimum order size
    const marketResponse = await fetch(`${baseUrl}/v1/markets?market=${market}`);
    if (!marketResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch market data' }, { status: 500 });
    }

    const marketData = await marketResponse.json();
    if (!marketData || marketData.length === 0) {
      return NextResponse.json({ error: `Market ${market} not found` }, { status: 400 });
    }

    const marketInfo = marketData[0];
    const stepSize = parseFloat(marketInfo.stepSize);
    const minimumOrderSize = parseFloat(marketInfo.takerOrderMinimum);

    // Format quantity according to market rules
    const formattedQuantity = formatQuantity(quantity, stepSize, minimumOrderSize);

    // Format price for limit orders AND stop limit orders (must be whole number with 8 decimal zeros)
    const needsLimitPrice = isLimitOrder || isStopLimitOrder;
    const formattedPrice = needsLimitPrice ? formatPrice(price) : '0.00000000';

    // Format trigger price for stop orders (must be whole number with 8 decimal zeros)
    const formattedTriggerPrice = isStopOrder ? formatPrice(triggerPrice) : '0.00000000';

    console.log('Typed data quantity formatting:', {
      original: quantity,
      stepSize,
      minimumOrderSize,
      formatted: formattedQuantity,
      price: formattedPrice,
      triggerPrice: formattedTriggerPrice,
      triggerType: isStopOrder ? triggerType : 0,
      isLimitOrder,
      isStopOrder,
      isStopLimitOrder,
      reduceOnly: !!reduceOnly,
      sandbox,
    });

    // Generate nonce (UUID v4 - compatible with Edge runtime)
    const nonce = generateUUID();

    // Katana Perps exchange contract addresses and chain IDs
    const exchangeContractAddress = sandbox
      ? '0xcE3765616b9e354E64530875f492dc4DfddF2118' // Sandbox (Bokuto Testnet)
      : '0x835Ba5b1B202773A94Daaa07168b26B22584637a'; // Production (Katana Mainnet)

    const chainId = sandbox ? 737373 : 747474;

    // Katana Perps EIP-712 typed data structure for order submission
    const emptyPipString = '0.00000000';

    const typedData = {
      domain: {
        name: 'KatanaPerps',
        version: sandbox ? '1.0.0-sandbox' : '1.0.0',
        chainId,
        verifyingContract: exchangeContractAddress,
      },
      types: {
        Order: [
          { name: 'nonce', type: 'uint128' },
          { name: 'wallet', type: 'address' },
          { name: 'marketSymbol', type: 'string' },
          { name: 'orderType', type: 'uint8' },
          { name: 'orderSide', type: 'uint8' },
          { name: 'quantity', type: 'string' },
          { name: 'limitPrice', type: 'string' },
          { name: 'triggerPrice', type: 'string' },
          { name: 'triggerType', type: 'uint8' },
          { name: 'callbackRate', type: 'string' },
          { name: 'conditionalOrderId', type: 'uint128' },
          { name: 'isReduceOnly', type: 'bool' },
          { name: 'timeInForce', type: 'uint8' },
          { name: 'selfTradePrevention', type: 'uint8' },
          { name: 'isLiquidationAcquisitionOnly', type: 'bool' },
          { name: 'delegatedPublicKey', type: 'address' },
          { name: 'clientOrderId', type: 'string' },
        ],
      },
      primaryType: 'Order',
      message: {
        nonce: uuidToUint128(nonce),
        wallet: wallet.toLowerCase(),
        marketSymbol: market,
        orderType: type,
        orderSide: side,
        quantity: formattedQuantity,
        limitPrice: formattedPrice,
        triggerPrice: formattedTriggerPrice,
        triggerType: isStopOrder ? triggerType : 0,
        callbackRate: emptyPipString,
        conditionalOrderId: 0,
        isReduceOnly: !!reduceOnly,
        timeInForce: 0, // 0 = GTC (Good Till Cancel)
        selfTradePrevention: 0, // 0 = DC (Decrement and Cancel)
        isLiquidationAcquisitionOnly: false,
        delegatedPublicKey: '0x0000000000000000000000000000000000000000',
        clientOrderId: '',
      },
    };

    return NextResponse.json(
      {
        nonce, // Return original UUID for API submission
        typedData,
        formattedQuantity, // Return formatted quantity so client knows what will be used
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Error in get-order-typed-data API route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
