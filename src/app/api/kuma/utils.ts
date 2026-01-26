/**
 * Edge-compatible utilities for Kuma API authentication
 * Uses Web Crypto API instead of Node.js crypto module
 */

/**
 * Generate HMAC-SHA256 signature using Web Crypto API
 * Compatible with Edge Runtime
 */
export async function generateHmacSignature(
  apiSecret: string,
  message: string
): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(apiSecret);
  const messageData = encoder.encode(message);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);

  // Convert ArrayBuffer to hex string
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Generate a UUID v4 using Web Crypto API
 * Compatible with Edge Runtime
 */
export function generateUUID(): string {
  return crypto.randomUUID();
}

/**
 * Get Kuma API configuration from environment
 */
export function getKumaConfig() {
  const sandbox = process.env.NEXT_PUBLIC_KATANA_PERPS_SANDBOX === 'true';
  const apiKey = sandbox
    ? process.env.NEXT_PUBLIC_KATANA_PERPS_API_KEY_TESTNET
    : process.env.NEXT_PUBLIC_KATANA_PERPS_API_KEY;
  const apiSecret = sandbox
    ? process.env.NEXT_PUBLIC_KATANA_PERPS_API_SECRET_TESTNET
    : process.env.NEXT_PUBLIC_KATANA_PERPS_API_SECRET;
  const baseUrl = sandbox
    ? 'https://api-perps-sandbox.katana.network'
    : 'https://api-perps.katana.network';

  return { sandbox, apiKey, apiSecret, baseUrl };
}
