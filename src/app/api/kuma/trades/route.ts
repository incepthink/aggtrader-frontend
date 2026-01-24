import { NextRequest, NextResponse } from 'next/server';

// Force deployment to non-US regions to avoid Kuma geo-restrictions
export const runtime = 'nodejs';
export const preferredRegion = ['fra1', 'arn1', 'sin1']; // Frankfurt, Stockholm, Singapore

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const market = searchParams.get('market') || 'BTC-USD';
    const limit = searchParams.get('limit') || '50';

    // Construct Katana Perps API URL (sandbox for Bokuto testnet)
    const katanaApiUrl = `https://api-perps-sandbox.katana.network/v1/trades?market=${market}&limit=${limit}`;

    console.log('[Katana Perps Proxy] Fetching trades:', katanaApiUrl);

    // Fetch from Katana Perps API
    const response = await fetch(katanaApiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Katana Perps API responded with status: ${response.status}`);
    }

    const data = await response.json();

    // Return the data with CORS headers
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('[Katana Perps Proxy] Error fetching trades:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trades', message: String(error) },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
