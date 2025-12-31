import { NextRequest, NextResponse } from 'next/server';
import { v1 as uuidv1 } from 'uuid';

/**
 * API Route: POST /api/kuma/get-typed-data
 *
 * Returns the EIP-712 typed data structure that the client should sign
 * for wallet association with Kuma API
 *
 * This ensures the client signs exactly what Kuma expects
 */

/**
 * Convert UUID v1 to uint128 format for Kuma signatures
 * Based on Kuma SDK implementation
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
    const sandbox = process.env.NEXT_PUBLIC_KUMA_SANDBOX === 'true';

    // Generate nonce (UUID v1)
    const nonce = uuidv1();

    // Kuma exchange contract addresses and chain IDs
    // Source: https://api-docs-v1.kuma.bid
    const exchangeContractAddress = sandbox
      ? '0x6332648a69e921A3F8b1C2aA632CaA79d0965c89' // Sandbox (XCHAIN Testnet)
      : '0xB231947A9B2075BaF978eA321eC6512344071F7C'; // Production (XCHAIN Mainnet)

    const chainId = sandbox ? 64002 : 94524;

    // Kuma's EIP-712 typed data structure for wallet association
    // Based on Kuma SDK source code
    const typedData = {
      domain: {
        name: 'Kuma',
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
