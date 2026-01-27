import { NextRequest, NextResponse } from 'next/server';
import { generateHmacSignature, generateUUID, getKumaConfig } from '../utils';

// Use Edge Runtime for better global distribution and non-US deployment
export const runtime = 'edge';
export const preferredRegion = 'bom1';

/**
 * API Route: GET /api/kuma/funding-payments
 *
 * Server-side proxy to fetch Katana Perps funding payment history
 *
 * This endpoint:
 * 1. Makes authenticated request to Katana Perps API to get funding payments
 * 2. Returns array of funding payment records
 *
 * Reference: https://api-docs-v1-perps.katana.network
 * Endpoint: GET /v1/fundingPayments
 */

export async function GET(request: NextRequest) {
  try {
    // Get query params
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet');
    const market = searchParams.get('market');
    const limit = searchParams.get('limit') || '50';
    const start = searchParams.get('start');
    const end = searchParams.get('end');

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

    const path = '/v1/fundingPayments';

    // Generate nonce for authenticated GET request
    const nonce = generateUUID();

    // Build query string with all params
    const params = new URLSearchParams();
    params.set('nonce', nonce);
    params.set('wallet', wallet);
    params.set('limit', limit);
    if (market) params.set('market', market);
    if (start) params.set('start', start);
    if (end) params.set('end', end);

    const queryString = params.toString();
    const hmacSignature = await generateHmacSignature(apiSecret, queryString);

    console.log('Fetching funding payments from Katana Perps API (GET /v1/fundingPayments)', {
      wallet,
      market,
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
        { error: data.message || data.error || 'Failed to fetch funding payments' },
        { status: response.status }
      );
    }

    console.log('Funding payments fetched successfully, count:', Array.isArray(data) ? data.length : 0);

    // Return funding payments array
    return NextResponse.json(data, { status: 200 });
  } catch (error: unknown) {
    console.error('Error in funding-payments API route:', error);

    let errorMessage = 'Failed to fetch funding payments';
    const statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
