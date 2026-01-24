import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Force deployment to non-US regions to avoid Kuma geo-restrictions
export const runtime = 'nodejs';
export const preferredRegion = ['fra1', 'arn1', 'sin1']; // Frankfurt, Stockholm, Singapore

/**
 * API Route: POST /api/kuma/associate-wallet
 *
 * Server-side proxy for Katana Perps wallet association to avoid CORS issues
 *
 * This endpoint:
 * 1. Receives wallet address, nonce, and signature from client
 * 2. Makes direct HTTP request to Katana Perps API with HMAC authentication
 * 3. Returns the result to the client
 *
 * Reference: https://api-docs-v1-perps.katana.network
 * Endpoint: POST /v1/wallets
 */

/**
 * Generate HMAC signature for Katana Perps API authentication
 *
 * Per Katana Perps API docs: HMAC-SHA256(message: request body, key: API secret)
 * For POST requests, the message is the stringified JSON body
 */
function generateHmacSignature(apiSecret: string, body: string): string {
  return crypto.createHmac('sha256', apiSecret).update(body).digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nonce, wallet, signature } = body;

    // Validate required fields
    if (!nonce || !wallet || !signature) {
      return NextResponse.json(
        { error: 'Missing required fields: nonce, wallet, signature' },
        { status: 400 }
      );
    }

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

    // Prepare request body for Katana Perps API
    const requestBody = {
      parameters: {
        nonce,
        wallet: wallet.toLowerCase(), // Normalize to lowercase
      },
      signature,
    };

    const bodyString = JSON.stringify(requestBody);

    // Generate HMAC signature (sign only the body per Katana Perps API docs)
    const hmacSignature = generateHmacSignature(apiSecret, bodyString);

    console.log('Submitting wallet association to Katana Perps API:', {
      wallet: wallet.toLowerCase(),
      nonce,
      bodyLength: bodyString.length,
      sandbox,
    });

    // Make request to Katana Perps API
    // Headers: kp-api-key, kp-hmac-signature (per SDK constants)
    const response = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
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
        data,
      });

      return NextResponse.json(
        { error: data.message || data.error || 'Failed to associate wallet' },
        { status: response.status }
      );
    }

    console.log('Wallet associated successfully (server-side):', data);

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error('Error in associate-wallet API route:', error);

    let errorMessage = 'Failed to associate wallet';
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
