import { NextRequest, NextResponse } from 'next/server';
import { v1 as uuidv1 } from 'uuid';

// Force deployment to non-US regions to avoid Kuma geo-restrictions
export const runtime = 'nodejs';
export const preferredRegion = ['fra1', 'arn1', 'sin1']; // Frankfurt, Stockholm, Singapore

/**
 * API Route: POST /api/kuma/get-typed-data
 *
 * Returns the EIP-712 typed data structure that the client should sign
 * for wallet association with Katana Perps API
 *
 * This ensures the client signs exactly what Katana Perps expects
 */

/**
 * Convert UUID v1 to uint128 format for Katana Perps signatures
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
    const { wallet } = body;

    if (!wallet) {
      return NextResponse.json(
        { error: 'Missing required field: wallet' },
        { status: 400 }
      );
    }

    // Get sandbox mode from environment
    const sandbox = process.env.NEXT_PUBLIC_KATANA_PERPS_SANDBOX === 'true';

    // Generate nonce (UUID v1)
    const nonce = uuidv1();

    // Katana Perps exchange contract addresses and chain IDs
    // Sandbox (Bokuto Testnet): chainId 737373, contract 0xcE3765616b9e354E64530875f492dc4DfddF2118
    // Production (Katana Mainnet): chainId 747474, contract 0x835Ba5b1B202773A94Daaa07168b26B22584637a
    const exchangeContractAddress = sandbox
      ? '0xcE3765616b9e354E64530875f492dc4DfddF2118' // Sandbox (Bokuto Testnet)
      : '0x835Ba5b1B202773A94Daaa07168b26B22584637a'; // Production (Katana Mainnet)

    const chainId = sandbox ? 737373 : 747474;

    // Katana Perps EIP-712 typed data structure for wallet association
    // Based on Katana Perps SDK constants (EIP_712_DOMAIN_NAME = 'KatanaPerps')
    const typedData = {
      domain: {
        name: 'KatanaPerps',
        version: sandbox ? '1.0.0-sandbox' : '1.0.0',
        chainId,
        verifyingContract: exchangeContractAddress,
      },
      types: {
        WalletAssociation: [
          { name: 'nonce', type: 'uint128' },
          { name: 'wallet', type: 'address' },
        ],
      },
      primaryType: 'WalletAssociation',
      message: {
        nonce: uuidToUint128(nonce), // Convert UUID to uint128
        wallet: wallet.toLowerCase(),
      },
    };

    return NextResponse.json({
      nonce, // Return original UUID for API submission
      typedData,
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error in get-typed-data API route:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
