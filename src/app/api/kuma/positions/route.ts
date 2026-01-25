import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { v1 as uuidv1 } from 'uuid';

// Force deployment to non-US regions to avoid Kuma geo-restrictions
export const runtime = 'nodejs';
export const preferredRegion = ['fra1', 'arn1', 'sin1']; // Frankfurt, Stockholm, Singapore

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

/**
 * Generate HMAC signature for Katana Perps API authentication
 */
function generateHmacSignature(apiSecret: string, message: string): string {
  return crypto.createHmac('sha256', apiSecret).update(message).digest('hex');
}

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
    const baseUrl = sandbox
      ? 'https://api-perps-sandbox.katana.network'
      : 'https://api-perps.katana.network';
    const path = '/v1/positions';

    // Generate nonce for authenticated GET request
    const nonce = uuidv1();

    // Build query string with wallet and nonce
    const queryString = `nonce=${nonce}&wallet=${wallet}`;
    const hmacSignature = generateHmacSignature(apiSecret, queryString);

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
  } catch (error: any) {
    console.error('Error in positions API route:', error);

    let errorMessage = 'Failed to fetch positions';
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
