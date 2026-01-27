import { NextRequest, NextResponse } from 'next/server';
import { getKumaConfig, generateHmacSignature, generateUUID } from '../utils';

// Use Edge Runtime for better global distribution
export const runtime = 'edge';

/**
 * Generate WebSocket authentication token for Katana Perps
 * This token is required for authenticated WebSocket subscriptions (positions, orders, etc.)
 *
 * The Katana Perps SDK expects the websocketAuthTokenFetch function to return
 * a token string that can be used to authenticate the WebSocket connection.
 *
 * Reference: https://api-docs-v1-perps.katana.network/#websocket-authentication-endpoints
 */
export async function POST(request: NextRequest) {
  try {
    const { wallet } = await request.json();

    if (!wallet) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
    }

    const { apiKey, apiSecret, baseUrl, sandbox } = getKumaConfig();

    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: 'API credentials not configured' },
        { status: 500 }
      );
    }

    // Generate a unique nonce for this auth request (must be UUID v1)
    const nonce = generateUUID();
    const walletLower = wallet.toLowerCase();

    // Build query string for authenticated GET request (same pattern as positions API)
    const queryString = `nonce=${nonce}&wallet=${walletLower}`;
    const hmacSignature = await generateHmacSignature(apiSecret, queryString);

    console.log('Fetching wsToken from Katana Perps API', {
      wallet: walletLower,
      nonce,
      sandbox,
    });

    // Request WebSocket auth token from Katana Perps API
    const response = await fetch(`${baseUrl}/v1/wsToken?${queryString}`, {
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
      console.error('Katana Perps wsToken API error:', {
        status: response.status,
        statusText: response.statusText,
        data,
      });
      return NextResponse.json(
        { error: data.message || data.error || 'Failed to fetch WebSocket token from API' },
        { status: response.status }
      );
    }

    // The API should return a token field
    if (!data.token) {
      console.error('Katana Perps wsToken API returned no token:', data);
      return NextResponse.json(
        { error: 'API returned no token' },
        { status: 500 }
      );
    }

    console.log('wsToken fetched successfully');

    return NextResponse.json({
      token: data.token,
    });
  } catch (error) {
    console.error('Failed to generate WebSocket auth token:', error);
    return NextResponse.json(
      { error: 'Failed to generate authentication token' },
      { status: 500 }
    );
  }
}
