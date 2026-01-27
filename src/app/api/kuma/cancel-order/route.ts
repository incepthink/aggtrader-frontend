import { NextRequest, NextResponse } from 'next/server';
import { generateHmacSignature, getKumaConfig } from '../utils';

// Use Edge Runtime for better global distribution and non-US deployment
export const runtime = 'edge';
export const preferredRegion = 'bom1';

/**
 * API Route: POST /api/kuma/cancel-order
 *
 * Server-side proxy for Katana Perps order cancellation to avoid CORS and geo-restrictions
 *
 * This endpoint:
 * 1. Receives cancel order parameters and signature from client
 * 2. Makes direct HTTP DELETE request to Katana Perps API with HMAC authentication
 * 3. Returns the cancellation result to the client
 *
 * Reference: https://api-docs-v1-perps.katana.network
 * Endpoint: DELETE /v1/orders
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nonce, wallet, orderIds, signature } = body;

    // Validate required fields
    if (!nonce || !wallet || !signature) {
      return NextResponse.json(
        { error: 'Missing required fields: nonce, wallet, signature' },
        { status: 400 }
      );
    }

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { error: 'Missing required field: orderIds (must be a non-empty array)' },
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

    const path = '/v1/orders';

    // Build request body according to Katana Perps API spec
    const requestBody = {
      parameters: {
        nonce,
        wallet: wallet.toLowerCase(),
        orderIds,
      },
      signature,
    };

    const bodyString = JSON.stringify(requestBody);

    // Generate HMAC signature
    const hmacSignature = await generateHmacSignature(apiSecret, bodyString);

    console.log('Canceling orders on Katana Perps API:', {
      wallet: wallet.toLowerCase(),
      orderIds,
      nonce,
      sandbox,
    });

    // Make DELETE request to Katana Perps API
    const response = await fetch(`${baseUrl}${path}`, {
      method: 'DELETE',
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
          error: data.message || data.error || 'Failed to cancel order',
          details: data,
        },
        { status: response.status }
      );
    }

    console.log('Orders canceled successfully:', data);

    // Response is an array of KatanaPerpsCanceledOrder objects
    // [{ orderId: string, clientOrderId?: string, status: 'canceled' | 'notFound' }]
    return NextResponse.json(data, { status: 200 });
  } catch (error: unknown) {
    console.error('Error in cancel-order API route:', error);

    let errorMessage = 'Failed to cancel order';

    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
