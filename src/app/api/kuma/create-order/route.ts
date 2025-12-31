import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * API Route: POST /api/kuma/create-order
 *
 * Server-side proxy for Kuma order submission to avoid CORS issues
 *
 * This endpoint:
 * 1. Receives order parameters and signature from client
 * 2. Makes direct HTTP request to Kuma API with HMAC authentication
 * 3. Returns the order result to the client
 *
 * Reference: https://api-docs-v1.kuma.bid/#orders-amp-trade-endpoints
 * Endpoint: POST /v1/orders
 */

/**
 * Generate HMAC signature for Kuma API authentication
 *
 * Per Kuma API docs: HMAC-SHA256(message: request body, key: API secret)
 * For POST requests, the message is the stringified JSON body
 */
function generateHmacSignature(apiSecret: string, body: string): string {
  return crypto.createHmac('sha256', apiSecret).update(body).digest('hex');
}

/**
 * Format quantity to 8 decimal precision as required by Kuma API
 */
function formatQuantity(quantity: string): string {
  return parseFloat(quantity).toFixed(8);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nonce, wallet, market, type, side, quantity, signature, reduceOnly } = body;

    // Validate required fields
    if (!nonce || !wallet || !market || type === undefined || side === undefined || !quantity || !signature) {
      return NextResponse.json(
        { error: 'Missing required fields: nonce, wallet, market, type, side, quantity, signature' },
        { status: 400 }
      );
    }

    // Get Kuma API credentials from environment
    const apiKey = process.env.NEXT_PUBLIC_KUMA_API_KEY;
    const apiSecret = process.env.NEXT_PUBLIC_KUMA_API_SECRET;
    const sandbox = process.env.NEXT_PUBLIC_KUMA_SANDBOX === 'true';

    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: 'Kuma API credentials not configured' },
        { status: 500 }
      );
    }

    // Determine API base URL
    const baseUrl = sandbox ? 'https://api.kuma.bid' : 'https://api.kuma.bid';
    const path = '/v1/orders';

    // Prepare request body for Kuma API
    // Per API docs: market orders must have limitPrice and triggerPrice set to "0.00000000"
    const requestBody = {
      parameters: {
        nonce,
        wallet: wallet.toLowerCase(), // Normalize to lowercase
        market,
        type, // 0 for market order
        side, // 0 for buy, 1 for sell
        quantity: formatQuantity(quantity), // 8 decimal precision
        ...(reduceOnly !== undefined && { reduceOnly }),
      },
      signature,
    };

    const bodyString = JSON.stringify(requestBody);

    // Generate HMAC signature (sign only the body per Kuma API docs)
    const hmacSignature = generateHmacSignature(apiSecret, bodyString);

    console.log('Submitting order to Kuma API:', {
      wallet: wallet.toLowerCase(),
      market,
      type,
      side,
      quantity: formatQuantity(quantity),
      nonce,
      bodyLength: bodyString.length,
    });

    // Make request to Kuma API
    const response = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'KUMA-API-KEY': apiKey,
        'KUMA-HMAC-SIGNATURE': hmacSignature,
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
      console.error('Kuma API error:', {
        status: response.status,
        statusText: response.statusText,
        data,
      });

      return NextResponse.json(
        { error: data.message || data.error || 'Failed to create order' },
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
