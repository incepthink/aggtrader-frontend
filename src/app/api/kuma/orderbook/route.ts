import { NextRequest, NextResponse } from 'next/server';
import { getKumaConfig } from '../utils';

// Use Edge Runtime for better global distribution and non-US deployment
export const runtime = 'edge';
export const preferredRegion = ['fra1', 'arn1', 'sin1', 'hnd1', 'syd1'];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const market = searchParams.get('market') || 'BTC-USD';
    const limit = searchParams.get('limit') || '30';

    // Get API base URL from config
    const { baseUrl } = getKumaConfig();

    // Construct Katana Perps API URL
    // level=2 is required for full orderbook data (all price levels), level=1 only returns best bid/ask
    const katanaApiUrl = `${baseUrl}/v1/orderbook?market=${market}&level=2&limit=${limit}`;

    console.log('[Katana Perps Proxy] Fetching orderbook:', katanaApiUrl);

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
    console.error('[Katana Perps Proxy] Error fetching orderbook:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orderbook', message: String(error) },
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
