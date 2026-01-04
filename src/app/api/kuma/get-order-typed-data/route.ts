import { NextRequest, NextResponse } from 'next/server';
import { v1 as uuidv1 } from 'uuid';

/**
 * API Route: POST /api/kuma/get-order-typed-data
 *
 * Returns the EIP-712 typed data structure that the client should sign
 * for order submission to Kuma API
 *
 * This ensures the client signs exactly what Kuma expects for order creation
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

/**
 * Format and validate quantity according to Kuma API requirements
 * - Must be a multiple of stepSize
 * - Must meet minimum order size
 * - Must be formatted as string with 8 decimals
 */
function formatQuantity(quantity: string, stepSize: number, minimum: number): string {
  const value = parseFloat(quantity);

  // Round to nearest stepSize increment
  const rounded = Math.round(value / stepSize) * stepSize;

  // Enforce minimum
  const final = Math.max(rounded, minimum);

  // Format to 8 decimals
  return final.toFixed(8);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { wallet, market, type, side, quantity } = body;

    // Validate required fields
    if (!wallet || !market || type === undefined || side === undefined || !quantity) {
      return NextResponse.json(
        { error: 'Missing required fields: wallet, market, type, side, quantity' },
        { status: 400 }
      );
    }

    // Get sandbox mode from environment
    const sandbox = process.env.NEXT_PUBLIC_KUMA_SANDBOX === 'true';

    // Determine API base URL
    const baseUrl = sandbox ? 'https://api.kuma.bid' : 'https://api.kuma.bid';

    // Fetch market data to get stepSize and minimum order size
    const marketResponse = await fetch(`${baseUrl}/v1/markets?market=${market}`);
    if (!marketResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch market data' },
        { status: 500 }
      );
    }

    const marketData = await marketResponse.json();
    if (!marketData || marketData.length === 0) {
      return NextResponse.json(
        { error: `Market ${market} not found` },
        { status: 400 }
      );
    }

    const marketInfo = marketData[0];
    const stepSize = parseFloat(marketInfo.stepSize);
    const minimumOrderSize = parseFloat(marketInfo.takerOrderMinimum);

    // Format quantity according to market rules
    const formattedQuantity = formatQuantity(quantity, stepSize, minimumOrderSize);

    console.log('Typed data quantity formatting:', {
      original: quantity,
      stepSize,
      minimumOrderSize,
      formatted: formattedQuantity,
    });

    // Generate nonce (UUID v1)
    const nonce = uuidv1();

    // Kuma exchange contract addresses and chain IDs
    // Source: https://api-docs-v1.kuma.bid
    const exchangeContractAddress = sandbox
      ? '0x6332648a69e921A3F8b1C2aA632CaA79d0965c89' // Sandbox (XCHAIN Testnet)
      : '0xB231947A9B2075BaF978eA321eC6512344071F7C'; // Production (XCHAIN Mainnet)

    const chainId = sandbox ? 64002 : 94524;

    // Kuma's EIP-712 typed data structure for order submission
    // Based on Kuma SDK implementation (signatures.js)
    const emptyPipString = '0.00000000';

    const typedData = {
      domain: {
        name: 'Kuma',
        version: sandbox ? '1.0.0-sandbox' : '1.0.0',
        chainId,
        verifyingContract: exchangeContractAddress,
      },
      types: {
        Order: [
          { name: 'nonce', type: 'uint128' },
          { name: 'wallet', type: 'address' },
          { name: 'marketSymbol', type: 'string' }, // Note: marketSymbol not market
          { name: 'orderType', type: 'uint8' }, // Note: orderType not type
          { name: 'orderSide', type: 'uint8' }, // Note: orderSide not side
          { name: 'quantity', type: 'string' },
          { name: 'limitPrice', type: 'string' },
          { name: 'triggerPrice', type: 'string' },
          { name: 'triggerType', type: 'uint8' },
          { name: 'callbackRate', type: 'string' },
          { name: 'conditionalOrderId', type: 'uint128' },
          { name: 'isReduceOnly', type: 'bool' },
          { name: 'timeInForce', type: 'uint8' },
          { name: 'selfTradePrevention', type: 'uint8' },
          { name: 'isLiquidationAcquisitionOnly', type: 'bool' },
          { name: 'delegatedPublicKey', type: 'address' },
          { name: 'clientOrderId', type: 'string' },
        ],
      },
      primaryType: 'Order',
      message: {
        nonce: uuidToUint128(nonce),
        wallet: wallet.toLowerCase(),
        marketSymbol: market, // marketSymbol in signature
        orderType: type, // orderType in signature (same value as API type)
        orderSide: side, // orderSide in signature (same value as API side)
        quantity: formattedQuantity, // Use formatted quantity
        limitPrice: emptyPipString, // Required even for market orders
        triggerPrice: emptyPipString,
        triggerType: 0, // 0 = none
        callbackRate: emptyPipString,
        conditionalOrderId: 0,
        isReduceOnly: false,
        timeInForce: 0, // 0 = GTC (Good Till Cancel)
        selfTradePrevention: 0, // 0 = DC (Decrement and Cancel)
        isLiquidationAcquisitionOnly: false,
        delegatedPublicKey: '0x0000000000000000000000000000000000000000', // Zero address
        clientOrderId: '',
      },
    };

    return NextResponse.json({
      nonce, // Return original UUID for API submission
      typedData,
      formattedQuantity, // Return formatted quantity so client knows what will be used
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error in get-order-typed-data API route:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
