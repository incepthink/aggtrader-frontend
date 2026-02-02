import { NextRequest, NextResponse } from 'next/server';
import { generateHmacSignature, getKumaConfig } from '../utils';

// Use Edge Runtime for better global distribution and non-US deployment
export const runtime = 'edge';
export const preferredRegion = 'bom1';

/**
 * API Route: POST /api/kuma/create-order
 *
 * Server-side proxy for Katana Perps order submission to avoid CORS and geo-restrictions
 *
 * This endpoint:
 * 1. Receives order parameters and signature from client
 * 2. Makes direct HTTP request to Katana Perps API with HMAC authentication
 * 3. Returns the order result to the client
 *
 * Reference: https://api-docs-v1-perps.katana.network
 * Endpoint: POST /v1/orders
 */

/**
 * Format and validate quantity according to Katana Perps API requirements
 */
function formatQuantity(
  quantity: string,
  stepSize: number = 0.0001,
  minimum: number = 0.0005
): string {
  const value = parseFloat(quantity);
  const rounded = Math.round(value / stepSize) * stepSize;
  const final = Math.max(rounded, minimum);
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
    const {
      nonce,
      wallet,
      market,
      type,
      side,
      quantity,
      signature,
      reduceOnly,
      price,
      postOnly,
      triggerPrice,
      triggerType,
    } = body;

    // Validate required fields
    if (
      !nonce ||
      !wallet ||
      !market ||
      type === undefined ||
      side === undefined ||
      !quantity ||
      !signature
    ) {
      return NextResponse.json(
        { error: 'Missing required fields: nonce, wallet, market, type, side, quantity, signature' },
        { status: 400 }
      );
    }

    // For limit orders, price is required
    const isLimitOrder = type === 'limit';
    if (isLimitOrder && (!price || parseFloat(price) <= 0)) {
      return NextResponse.json({ error: 'Price is required for limit orders' }, { status: 400 });
    }

    // For stop orders, triggerPrice and triggerType are required
    const isStopOrder = [
      'stopLossMarket',
      'stopLossLimit',
      'takeProfitMarket',
      'takeProfitLimit',
      'trailingStopMarket',
    ].includes(type);
    const isStopLimitOrder = ['stopLossLimit', 'takeProfitLimit'].includes(type);

    if (isStopOrder && (!triggerPrice || parseFloat(triggerPrice) <= 0)) {
      return NextResponse.json(
        { error: 'Trigger price is required for stop orders' },
        { status: 400 }
      );
    }
    if (isStopOrder && !triggerType) {
      return NextResponse.json(
        { error: 'Trigger type is required for stop orders' },
        { status: 400 }
      );
    }
    if (isStopLimitOrder && (!price || parseFloat(price) <= 0)) {
      return NextResponse.json(
        { error: 'Limit price is required for stop limit orders' },
        { status: 400 }
      );
    }

    // Get Katana Perps API credentials from environment
    const { apiKey, apiSecret, baseUrl, sandbox } = getKumaConfig();

    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: 'Katana Perps API credentials not configured' },
        { status: 500 }
      );
    }

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

    const path = '/v1/orders';

    // Format quantity according to market rules
    const formattedQuantity = formatQuantity(quantity, stepSize, minimumOrderSize);

    // Format price for limit orders AND stop limit orders (must be whole number with 8 decimal zeros)
    const needsLimitPrice = isLimitOrder || isStopLimitOrder;
    const formattedPrice = needsLimitPrice ? formatPrice(price) : undefined;

    // Format trigger price for stop orders (must be whole number with 8 decimal zeros)
    const formattedTriggerPrice = isStopOrder ? formatPrice(triggerPrice) : undefined;

    console.log('Order formatting:', {
      original: quantity,
      stepSize,
      minimumOrderSize,
      formatted: formattedQuantity,
      price: formattedPrice,
      triggerPrice: formattedTriggerPrice,
      triggerType,
      isLimitOrder,
      isStopOrder,
      isStopLimitOrder,
      postOnly,
    });

    // Build parameters object conditionally based on order type
    const parameters: Record<string, unknown> = {
      nonce,
      wallet: wallet.toLowerCase(),
      market,
      type,
      side,
      quantity: formattedQuantity,
    };

    // Add price for limit orders AND stop limit orders
    if (needsLimitPrice && formattedPrice) {
      parameters.price = formattedPrice;
    }

    // Add postOnly for limit orders and stop limit orders (timeInForce: 'GTX' means post-only)
    if ((isLimitOrder || isStopLimitOrder) && postOnly) {
      parameters.timeInForce = 'gtx'; // GTX = Post-Only (Good Till Crossing)
    }

    // Add triggerPrice and triggerType for stop orders
    if (isStopOrder && formattedTriggerPrice) {
      parameters.triggerPrice = formattedTriggerPrice;
      parameters.triggerType = triggerType; // "index" or "last"
    }

    // Add reduceOnly if specified
    if (reduceOnly !== undefined) {
      parameters.reduceOnly = reduceOnly;
    }

    const requestBody = {
      parameters,
      signature,
    };

    const bodyString = JSON.stringify(requestBody);

    // Generate HMAC signature
    const hmacSignature = await generateHmacSignature(apiSecret, bodyString);

    console.log('Submitting order to Katana Perps API:', {
      wallet: wallet.toLowerCase(),
      market,
      type,
      side,
      quantity: formattedQuantity,
      price: formattedPrice,
      triggerPrice: formattedTriggerPrice,
      triggerType,
      isLimitOrder,
      isStopOrder,
      isStopLimitOrder,
      postOnly,
      nonce,
      bodyLength: bodyString.length,
      sandbox,
      fullBody: requestBody,
    });

    // Make request to Katana Perps API
    const response = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'kp-api-key': apiKey,
        'kp-hmac-signature': hmacSignature,
      },
      body: bodyString,
    });

    const responseText = await response.text();
    let data;

    try {
      data = JSON.parse(responseText);
    } catch {
      data = { message: responseText };
    }

    if (!response.ok) {
      console.error('Katana Perps API error:', {
        status: response.status,
        statusText: response.statusText,
        responseData: data,
        sentRequest: requestBody,
      });

      return NextResponse.json(
        {
          error: data.message || data.error || 'Failed to create order',
          details: data,
        },
        { status: response.status }
      );
    }

    console.log('Order created successfully (server-side):', data);

    return NextResponse.json(data, { status: 200 });
  } catch (error: unknown) {
    console.error('Error in create-order API route:', error);

    let errorMessage = 'Failed to create order';
    const statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
