import { NextRequest, NextResponse } from 'next/server';
import { generateHmacSignature, generateUUID, getKumaConfig } from '../utils';

// Use Edge Runtime for better global distribution and non-US deployment
export const runtime = 'edge';
export const preferredRegion = 'bom1';

/**
 * API Route: GET /api/kuma/orders
 *
 * Server-side proxy to fetch Katana Perps user orders
 *
 * This endpoint:
 * 1. Makes authenticated request to Katana Perps API to get user orders
 * 2. Returns array of orders with all relevant data
 *
 * Reference: https://api-docs-v1-perps.katana.network
 * Endpoint: GET /v1/orders
 */

export async function GET(request: NextRequest) {
  try {
    // Get parameters from query params
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet');
    const closed = searchParams.get('closed') === 'true';
    const market = searchParams.get('market');
    const limit = searchParams.get('limit');

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
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

    // Generate nonce for authenticated GET request
    const nonce = generateUUID();

    // Build query string with required and optional parameters
    let queryString = `nonce=${nonce}&wallet=${wallet}`;

    if (closed) {
      queryString += `&closed=true`;
    }

    if (market) {
      queryString += `&market=${market}`;
    }

    if (limit) {
      queryString += `&limit=${limit}`;
    }

    const hmacSignature = await generateHmacSignature(apiSecret, queryString);

    console.log('Fetching orders from Katana Perps API (GET /v1/orders)', {
      wallet,
      nonce,
      sandbox,
      closed,
      market,
    });

    // Make request to Katana Perps API
    const response = await fetch(`${baseUrl}${path}?${queryString}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'kp-api-key': apiKey,
        'kp-hmac-signature': hmacSignature,
      },
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
        data,
      });

      return NextResponse.json(
        { error: data.message || data.error || 'Failed to fetch orders' },
        { status: response.status }
      );
    }

    console.log('Orders fetched successfully:', data);

    // Return orders array (API returns KatanaPerpsOrder[])
    return NextResponse.json(data, { status: 200 });
  } catch (error: unknown) {
    console.error('Error in orders API route:', error);

    let errorMessage = 'Failed to fetch orders';
    const statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
