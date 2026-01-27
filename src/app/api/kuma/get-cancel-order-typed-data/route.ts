import { NextRequest, NextResponse } from 'next/server';
import { generateUUID, getKumaConfig } from '../utils';

// Use Edge Runtime for better global distribution and non-US deployment
export const runtime = 'edge';
export const preferredRegion = 'bom1';

/**
 * API Route: POST /api/kuma/get-cancel-order-typed-data
 *
 * Returns the EIP-712 typed data structure that the client should sign
 * for order cancellation on Katana Perps API
 *
 * Reference: https://api-docs-v1-perps.katana.network
 */

/**
 * Convert UUID to uint128 format for Katana Perps signatures
 * Based on Katana Perps SDK implementation
 */
function uuidToUint128(uuid: string): string {
  const hexString = `0x${uuid.replace(/-/g, '')}`;
  const uint128 = BigInt.asUintN(128, BigInt(hexString));
  return uint128.toString();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { wallet, orderIds } = body;

    // Validate required fields
    if (!wallet) {
      return NextResponse.json({ error: 'Missing required field: wallet' }, { status: 400 });
    }

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { error: 'Missing required field: orderIds (must be a non-empty array)' },
        { status: 400 }
      );
    }

    // Get sandbox mode from environment
    const { sandbox } = getKumaConfig();

    // Generate nonce (UUID v1)
    const nonce = generateUUID();

    // Katana Perps exchange contract addresses and chain IDs
    const exchangeContractAddress = sandbox
      ? '0xcE3765616b9e354E64530875f492dc4DfddF2118' // Sandbox (Bokuto Testnet)
      : '0x835Ba5b1B202773A94Daaa07168b26B22584637a'; // Production (Katana Mainnet)

    const chainId = sandbox ? 737373 : 747474;

    // Katana Perps EIP-712 typed data structure for order cancellation by orderId
    // Based on SDK's getOrderCancellationByOrderIdSignatureTypedData
    const typedData = {
      domain: {
        name: 'KatanaPerps',
        version: sandbox ? '1.0.0-sandbox' : '1.0.0',
        chainId,
        verifyingContract: exchangeContractAddress,
      },
      types: {
        OrderCancellationByOrderId: [
          { name: 'nonce', type: 'uint128' },
          { name: 'wallet', type: 'address' },
          { name: 'delegatedKey', type: 'address' },
          { name: 'orderIds', type: 'string[]' },
        ],
      },
      primaryType: 'OrderCancellationByOrderId',
      message: {
        nonce: uuidToUint128(nonce),
        wallet: wallet.toLowerCase(),
        delegatedKey: '0x0000000000000000000000000000000000000000',
        orderIds: orderIds,
      },
    };

    console.log('Cancel order typed data generated:', {
      wallet: wallet.toLowerCase(),
      orderIds,
      nonce,
      sandbox,
    });

    return NextResponse.json(
      {
        nonce, // Return original UUID for API submission
        typedData,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Error in get-cancel-order-typed-data API route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
