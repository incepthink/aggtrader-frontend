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
 * Generate a UUID v1 (time-based) compatible with Edge Runtime
 *
 * UUID v1 structure:
 * - time_low: 4 bytes (32 bits) - low 32 bits of timestamp
 * - time_mid: 2 bytes (16 bits) - middle 16 bits of timestamp
 * - time_hi_and_version: 2 bytes - high 12 bits of timestamp + 4 version bits (0001)
 * - clock_seq_hi_and_reserved: 1 byte - clock sequence high + variant bits
 * - clock_seq_low: 1 byte - clock sequence low
 * - node: 6 bytes - node ID (random in our case since we don't have MAC access)
 *
 * IMPORTANT: Katana Perps API requires UUID v1 for nonces
 * See: https://en.wikipedia.org/wiki/Universally_unique_identifier#Version_1_(date-time_and_MAC_address)
 */
export function generateUUID(): string {
  // UUID epoch: October 15, 1582 00:00:00
  // JavaScript epoch: January 1, 1970 00:00:00
  // Difference in 100-nanosecond intervals
  const UUID_EPOCH_OFFSET = BigInt('122192928000000000');

  // Get current time in 100-nanosecond intervals since UUID epoch
  const now = BigInt(Date.now()) * BigInt(10000) + UUID_EPOCH_OFFSET;

  // Extract time components
  const timeLow = now & BigInt(0xffffffff);
  const timeMid = (now >> BigInt(32)) & BigInt(0xffff);
  const timeHiAndVersion = ((now >> BigInt(48)) & BigInt(0x0fff)) | BigInt(0x1000); // Version 1

  // Generate random clock sequence (14 bits) and node (48 bits)
  const randomBytes = new Uint8Array(8);
  crypto.getRandomValues(randomBytes);

  // Clock sequence with variant bits (10xx)
  const clockSeqHiAndReserved = (randomBytes[0] & 0x3f) | 0x80;
  const clockSeqLow = randomBytes[1];

  // Node ID (6 bytes) - use random values
  const node = randomBytes.slice(2, 8);

  // Format as UUID string
  const hex = (n: bigint | number, len: number) => n.toString(16).padStart(len, '0');
  const byteToHex = (b: number) => b.toString(16).padStart(2, '0');

  return [
    hex(timeLow, 8),
    hex(timeMid, 4),
    hex(timeHiAndVersion, 4),
    byteToHex(clockSeqHiAndReserved) + byteToHex(clockSeqLow),
    Array.from(node).map(byteToHex).join('')
  ].join('-');
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
