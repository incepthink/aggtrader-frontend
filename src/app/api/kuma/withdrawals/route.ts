import { NextRequest, NextResponse } from 'next/server';
import { generateHmacSignature, generateUUID, getKumaConfig } from '../utils';

// Use Edge Runtime for better global distribution and non-US deployment
export const runtime = 'edge';
export const preferredRegion = 'bom1';

/**
 * API Route: GET /api/kuma/withdrawals
 *
 * Server-side proxy to fetch Katana Perps withdrawal history
 *
 * This endpoint:
 * 1. Makes authenticated request to Katana Perps API to get withdrawals
 * 2. Returns array of withdrawal records
 *
 * Reference: https://api-docs-v1-perps.katana.network
 * Endpoint: GET /v1/withdrawals
 */

export async function GET(request: NextRequest) {
  try {
    // Get query params
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet');
    const limit = searchParams.get('limit') || '50';
    const fromId = searchParams.get('fromId');

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

    const path = '/v1/withdrawals';

    // Generate nonce for authenticated GET request
    const nonce = generateUUID();

    // Build query string with all params
    const params = new URLSearchParams();
    params.set('nonce', nonce);
    params.set('wallet', wallet);
    params.set('limit', limit);
    if (fromId) params.set('fromId', fromId);

    const queryString = params.toString();
    const hmacSignature = await generateHmacSignature(apiSecret, queryString);

    console.log('Fetching withdrawals from Katana Perps API (GET /v1/withdrawals)', {
      wallet,
      limit,
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
        { error: data.message || data.error || 'Failed to fetch withdrawals' },
        { status: response.status }
      );
    }

    console.log('Withdrawals fetched successfully, count:', Array.isArray(data) ? data.length : 0);

    // Return withdrawals array
    return NextResponse.json(data, { status: 200 });
  } catch (error: unknown) {
    console.error('Error in withdrawals API route:', error);

    let errorMessage = 'Failed to fetch withdrawals';
    const statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
