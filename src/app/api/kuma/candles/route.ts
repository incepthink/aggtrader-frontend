import { NextRequest, NextResponse } from 'next/server';
import { getKumaConfig } from '../utils';

// Use Edge Runtime for better global distribution and non-US deployment
export const runtime = 'edge';
export const preferredRegion = ['fra1', 'arn1', 'sin1', 'hnd1', 'syd1'];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const market = searchParams.get('market') || 'BTC-USD';
    const interval = searchParams.get('interval') || '5m';
    const limit = searchParams.get('limit') || '100';

    // Get API base URL from config
    const { baseUrl } = getKumaConfig();

    // Construct Katana Perps API URL
    const katanaApiUrl = `${baseUrl}/v1/candles?market=${market}&interval=${interval}&limit=${limit}`;

    console.log('[Katana Perps Proxy] Fetching candles:', katanaApiUrl);

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
    console.error('[Katana Perps Proxy] Error fetching candles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch candles', message: String(error) },
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
