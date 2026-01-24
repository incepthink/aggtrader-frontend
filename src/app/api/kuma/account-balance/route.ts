import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { v1 as uuidv1 } from 'uuid';

// Force deployment to non-US regions to avoid Kuma geo-restrictions
export const runtime = 'nodejs';
export const preferredRegion = ['fra1', 'arn1', 'sin1']; // Frankfurt, Stockholm, Singapore

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

/**
 * Generate HMAC signature for Katana Perps API authentication
 */
function generateHmacSignature(apiSecret: string, message: string): string {
  return crypto.createHmac('sha256', apiSecret).update(message).digest('hex');
}

export async function GET(request: NextRequest) {
  try {
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
    const path = '/v1/wallets';

    // Generate nonce for authenticated GET request (UUID v1 required by Katana Perps)
    const nonce = uuidv1();

    // For GET requests, the HMAC message is the query string
    const queryString = `nonce=${nonce}`;
    const hmacSignature = generateHmacSignature(apiSecret, queryString);

    console.log('Fetching account balance from Katana Perps API (GET /v1/wallets)', {
      nonce,
      queryString,
      sandbox,
    });

    // Make request to Katana Perps API with query string
    // Headers: kp-api-key, kp-hmac-signature (per SDK constants)
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
