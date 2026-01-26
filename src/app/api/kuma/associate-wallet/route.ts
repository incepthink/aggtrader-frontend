import { NextRequest, NextResponse } from 'next/server';
import { generateHmacSignature, getKumaConfig } from '../utils';

// Use Edge Runtime for better global distribution and non-US deployment
export const runtime = 'edge';
export const preferredRegion = 'bom1';

/**
 * API Route: POST /api/kuma/associate-wallet
 *
 * Server-side proxy for Katana Perps wallet association to avoid CORS and geo-restrictions
 *
 * This endpoint:
 * 1. Receives wallet address, nonce, and signature from client
 * 2. Makes direct HTTP request to Katana Perps API with HMAC authentication
 * 3. Returns the result to the client
 *
 * Reference: https://api-docs-v1-perps.katana.network
 * Endpoint: POST /v1/wallets
 */

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
    const { apiKey, apiSecret, baseUrl, sandbox } = getKumaConfig();

    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: 'Katana Perps API credentials not configured' },
        { status: 500 }
      );
    }

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
    const hmacSignature = await generateHmacSignature(apiSecret, bodyString);

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
  } catch (error: unknown) {
    console.error('Error in associate-wallet API route:', error);

    let errorMessage = 'Failed to associate wallet';
    const statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
