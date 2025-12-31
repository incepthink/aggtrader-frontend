import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { v1 as uuidv1 } from 'uuid';

/**
 * API Route: GET /api/kuma/account-balance
 *
 * Server-side proxy to fetch Kuma account balance
 *
 * This endpoint:
 * 1. Makes authenticated request to Kuma API to get account data
 * 2. Returns account balance, collateral, and positions
 *
 * Reference: https://api-docs-v1.kuma.bid
 * Endpoint: GET /v1/wallets
 */

/**
 * Generate HMAC signature for Kuma API authentication
 */
function generateHmacSignature(apiSecret: string, message: string): string {
  return crypto.createHmac('sha256', apiSecret).update(message).digest('hex');
}

export async function GET(request: NextRequest) {
  try {
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
    const path = '/v1/wallets';

    // Generate nonce for authenticated GET request (UUID v1 required by Kuma)
    const nonce = uuidv1();

    // For GET requests, the HMAC message is the query string
    const queryString = `nonce=${nonce}`;
    const hmacSignature = generateHmacSignature(apiSecret, queryString);

    console.log('Fetching account balance from Kuma API (GET /v1/wallets)', {
      nonce,
      queryString,
    });

    // Make request to Kuma API with query string
    const response = await fetch(`${baseUrl}${path}?${queryString}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'KUMA-API-KEY': apiKey,
        'KUMA-HMAC-SIGNATURE': hmacSignature,
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
      console.error('Kuma API error:', {
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
  } catch (error: any) {
    console.error('Error in account-balance API route:', error);

    let errorMessage = 'Failed to fetch account balance';
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
