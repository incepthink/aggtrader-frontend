import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * API Route: POST /api/kuma/create-order
 *
 * Server-side proxy for Katana Perps order submission to avoid CORS issues
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
 * Generate HMAC signature for Katana Perps API authentication
 *
 * Per Katana Perps API docs: HMAC-SHA256(message: request body, key: API secret)
 * For POST requests, the message is the stringified JSON body
 */
function generateHmacSignature(apiSecret: string, body: string): string {
  return crypto.createHmac('sha256', apiSecret).update(body).digest('hex');
}

/**
 * Format and validate quantity according to Katana Perps API requirements
 * - Must be a multiple of stepSize
 * - Must meet minimum order size
 * - Must be formatted as string with 8 decimals
 */
function formatQuantity(quantity: string, stepSize: number = 0.0001, minimum: number = 0.0005): string {
  const value = parseFloat(quantity);

  // Round to nearest stepSize increment
  const rounded = Math.round(value / stepSize) * stepSize;

  // Enforce minimum
  const final = Math.max(rounded, minimum);

  // Format to 8 decimals
  return final.toFixed(8);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nonce, wallet, market, type, side, quantity, signature, reduceOnly, price, postOnly, triggerPrice, triggerType } = body;

    // Validate required fields
    if (!nonce || !wallet || !market || type === undefined || side === undefined || !quantity || !signature) {
      return NextResponse.json(
        { error: 'Missing required fields: nonce, wallet, market, type, side, quantity, signature' },
        { status: 400 }
      );
    }

    // For limit orders, price is required
    const isLimitOrder = type === 'limit';
    if (isLimitOrder && (!price || parseFloat(price) <= 0)) {
      return NextResponse.json(
        { error: 'Price is required for limit orders' },
        { status: 400 }
      );
    }

    // For stop orders, triggerPrice and triggerType are required
    const isStopOrder = ['stopLossMarket', 'stopLossLimit', 'takeProfitMarket', 'takeProfitLimit', 'trailingStopMarket'].includes(type);
    // Stop limit orders (stopLossLimit, takeProfitLimit) require both triggerPrice AND price (limit price)
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
    // Stop limit orders also require a limit price
    if (isStopLimitOrder && (!price || parseFloat(price) <= 0)) {
      return NextResponse.json(
        { error: 'Limit price is required for stop limit orders' },
        { status: 400 }
      );
    }

    // Get Katana Perps API credentials from environment
    // Use testnet credentials for sandbox (Bokuto), mainnet for production
    const sandbox = process.env.NEXT_PUBLIC_KATANA_PERPS_SANDBOX === 'true';
    const apiKey = sandbox
      ? process.env.NEXT_PUBLIC_KATANA_PERPS_API_KEY_TESTNET
      : process.env.NEXT_PUBLIC_KATANA_PERPS_API_KEY;
    const apiSecret = sandbox
      ? process.env.NEXT_PUBLIC_KATANA_PERPS_API_SECRET_TESTNET
      : process.env.NEXT_PUBLIC_KATANA_PERPS_API_SECRET;

    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: 'Katana Perps API credentials not configured' },
        { status: 500 }
      );
    }

    // Determine API base URL
    // Sandbox (Bokuto Testnet): https://api-perps-sandbox.katana.network
    // Production (Katana Mainnet): https://api-perps.katana.network
    const baseUrl = sandbox
      ? 'https://api-perps-sandbox.katana.network'
      : 'https://api-perps.katana.network';

    // Fetch market data to get stepSize and minimum order size
    const marketResponse = await fetch(`${baseUrl}/v1/markets?market=${market}`);
    if (!marketResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch market data' },
        { status: 500 }
      );
    }

    const marketData = await marketResponse.json();
    if (!marketData || marketData.length === 0) {
      return NextResponse.json(
        { error: `Market ${market} not found` },
        { status: 400 }
      );
    }

    const marketInfo = marketData[0];
    const stepSize = parseFloat(marketInfo.stepSize);
    const minimumOrderSize = parseFloat(marketInfo.takerOrderMinimum);

    const path = '/v1/orders';

    // Format quantity according to market rules
    const formattedQuantity = formatQuantity(quantity, stepSize, minimumOrderSize);

    // Format price for limit orders AND stop limit orders (8 decimal places)
    // Limit orders and stop limit orders both need a limit price
    const needsLimitPrice = isLimitOrder || isStopLimitOrder;
    const formattedPrice = needsLimitPrice ? parseFloat(price).toFixed(8) : undefined;

    // Format trigger price for stop orders (8 decimal places)
    const formattedTriggerPrice = isStopOrder ? parseFloat(triggerPrice).toFixed(8) : undefined;

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

    // Prepare request body for Katana Perps API
    // Build parameters object conditionally based on order type
    const parameters: Record<string, any> = {
      nonce,
      wallet: wallet.toLowerCase(), // Normalize to lowercase
      market,
      type,
      side,
      quantity: formattedQuantity, // Formatted with stepSize and minimum
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

    // Generate HMAC signature (sign only the body per Katana Perps API docs)
    const hmacSignature = generateHmacSignature(apiSecret, bodyString);

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
      fullBody: requestBody, // Log full request body for debugging
    });

    // Make request to Katana Perps API
    // Headers: kp-api-key, kp-hmac-signature (per SDK constants)
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
          details: data, // Include full error details for debugging
        },
        { status: response.status }
      );
    }

    console.log('Order created successfully (server-side):', data);

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error('Error in create-order API route:', error);

    let errorMessage = 'Failed to create order';
    let statusCode = 500;

    if (error.message) {
      errorMessage = error.message;
    }

    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
      statusCode = error.response.status || 500;
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}
