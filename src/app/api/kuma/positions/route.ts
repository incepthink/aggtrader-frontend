import { NextRequest, NextResponse } from 'next/server';
import { generateHmacSignature, generateUUID, getKumaConfig } from '../utils';

// Use Edge Runtime for better global distribution and non-US deployment
export const runtime = 'edge';
export const preferredRegion = ['fra1', 'arn1', 'sin1', 'hnd1', 'syd1'];

/**
 * API Route: GET /api/kuma/positions
 *
 * Server-side proxy to fetch Katana Perps user positions
 *
 * This endpoint:
 * 1. Makes authenticated request to Katana Perps API to get user positions
 * 2. Returns array of open positions with all relevant data
 *
 * Reference: https://api-docs-v1-perps.katana.network
 * Endpoint: GET /v1/positions
 */

export async function GET(request: NextRequest) {
  try {
    // Get wallet address from query params
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet');

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

    const path = '/v1/positions';

    // Generate nonce for authenticated GET request
    const nonce = generateUUID();

    // Build query string with wallet and nonce
    const queryString = `nonce=${nonce}&wallet=${wallet}`;
    const hmacSignature = await generateHmacSignature(apiSecret, queryString);

    console.log('Fetching positions from Katana Perps API (GET /v1/positions)', {
      wallet,
      nonce,
      sandbox,
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
        { error: data.message || data.error || 'Failed to fetch positions' },
        { status: response.status }
      );
    }

    console.log('Positions fetched successfully:', data);

    // Return positions array (API returns KatanaPerpsPosition[])
    return NextResponse.json(data, { status: 200 });
  } catch (error: unknown) {
    console.error('Error in positions API route:', error);

    let errorMessage = 'Failed to fetch positions';
    const statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
