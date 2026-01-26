import { NextRequest, NextResponse } from 'next/server';
import { generateHmacSignature, generateUUID, getKumaConfig } from '../utils';

// Use Edge Runtime for better global distribution and non-US deployment
export const runtime = 'edge';
export const preferredRegion = ['fra1', 'arn1', 'sin1', 'hnd1', 'syd1'];

/**
 * API Route: GET /api/kuma/account-balance
 *
 * Server-side proxy to fetch Katana Perps account balance
 *
 * This endpoint:
 * 1. Makes authenticated request to Katana Perps API to get account data
 * 2. Returns account balance, collateral, and positions
 *
 * Reference: https://api-docs-v1-perps.katana.network
 * Endpoint: GET /v1/wallets
 */

export async function GET(request: NextRequest) {
  // Suppress unused variable warning - request is part of Next.js API route signature
  void request;

  try {
    // Get Katana Perps API credentials from environment
    const { apiKey, apiSecret, baseUrl, sandbox } = getKumaConfig();

    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: 'Katana Perps API credentials not configured' },
        { status: 500 }
      );
    }

    const path = '/v1/wallets';

    // Generate nonce for authenticated GET request
    const nonce = generateUUID();

    // For GET requests, the HMAC message is the query string
    const queryString = `nonce=${nonce}`;
    const hmacSignature = await generateHmacSignature(apiSecret, queryString);

    console.log('Fetching account balance from Katana Perps API (GET /v1/wallets)', {
      nonce,
      queryString,
      sandbox,
    });

    // Make request to Katana Perps API with query string
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
        { error: data.message || data.error || 'Failed to fetch account balance' },
        { status: response.status }
      );
    }

    console.log('Account balance fetched successfully (raw):', data);

    // GET /v1/wallets might return an array or single object
    // If it's an array, take the first wallet
    const walletData = Array.isArray(data) ? data[0] : data;

    console.log('Account balance (processed):', walletData);

    return NextResponse.json(walletData, { status: 200 });
  } catch (error: unknown) {
    console.error('Error in account-balance API route:', error);

    let errorMessage = 'Failed to fetch account balance';
    const statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
