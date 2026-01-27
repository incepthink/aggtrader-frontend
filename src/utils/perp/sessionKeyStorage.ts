/**
 * Session Key Storage Utility
 *
 * Manages perp trading session keys in localStorage with proper expiry handling.
 * Session keys allow users to stay logged in for up to 30 days without re-signing.
 */

export interface SessionKey {
  id: string;
  wallet: string;
  createdAt: string;
  expiresAt: string;
  client: string;
  signature: string;
}

const STORAGE_KEY = 'katana_perps_session_keys';

/**
 * Get browser/client info for session tracking
 */
function getClientInfo(): string {
  if (typeof window === 'undefined') return 'Unknown';

  const ua = navigator.userAgent;
  let browser = 'Unknown Browser';
  let os = 'Unknown OS';

  // Detect browser
  if (ua.includes('Chrome') && !ua.includes('Edg')) {
    const match = ua.match(/Chrome\/(\d+)/);
    browser = `Chrome ${match ? match[1] : ''}`;
  } else if (ua.includes('Firefox')) {
    const match = ua.match(/Firefox\/(\d+)/);
    browser = `Firefox ${match ? match[1] : ''}`;
  } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
    const match = ua.match(/Version\/(\d+)/);
    browser = `Safari ${match ? match[1] : ''}`;
  } else if (ua.includes('Edg')) {
    const match = ua.match(/Edg\/(\d+)/);
    browser = `Edge ${match ? match[1] : ''}`;
  }

  // Detect OS
  if (ua.includes('Windows')) {
    os = 'Windows';
  } else if (ua.includes('Mac')) {
    os = 'macOS';
  } else if (ua.includes('Linux')) {
    os = 'Linux';
  } else if (ua.includes('Android')) {
    os = 'Android';
  } else if (ua.includes('iPhone') || ua.includes('iPad')) {
    os = 'iOS';
  }

  return `${os} - ${browser}`;
}

/**
 * Generate a unique session key ID
 */
function generateSessionId(): string {
  return `sk_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Get all session keys from storage
 */
export function getAllSessionKeys(): SessionKey[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

/**
 * Get session keys for a specific wallet address
 */
export function getSessionKeysForWallet(wallet: string): SessionKey[] {
  const allKeys = getAllSessionKeys();
  const normalizedWallet = wallet.toLowerCase();
  return allKeys.filter(key => key.wallet.toLowerCase() === normalizedWallet);
}

/**
 * Get valid (non-expired) session key for a wallet
 */
export function getValidSessionKey(wallet: string): SessionKey | null {
  const keys = getSessionKeysForWallet(wallet);
  const now = new Date();

  // Find a valid (non-expired) session key
  const validKey = keys.find(key => new Date(key.expiresAt) > now);
  return validKey || null;
}

/**
 * Check if a wallet has a valid session key
 */
export function hasValidSessionKey(wallet: string): boolean {
  return getValidSessionKey(wallet) !== null;
}

/**
 * Create and store a new session key
 */
export function createSessionKey(
  wallet: string,
  signature: string,
  durationDays: number = 30
): SessionKey {
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + durationDays);

  const sessionKey: SessionKey = {
    id: generateSessionId(),
    wallet: wallet.toLowerCase(),
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    client: getClientInfo(),
    signature,
  };

  // Get existing keys and add the new one
  const allKeys = getAllSessionKeys();

  // Remove any existing keys for this wallet (one session per wallet)
  const filteredKeys = allKeys.filter(
    key => key.wallet.toLowerCase() !== wallet.toLowerCase()
  );

  filteredKeys.push(sessionKey);

  // Save to localStorage
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredKeys));

  return sessionKey;
}

/**
 * Remove a session key by ID
 */
export function removeSessionKey(sessionId: string): boolean {
  const allKeys = getAllSessionKeys();
  const filteredKeys = allKeys.filter(key => key.id !== sessionId);

  if (filteredKeys.length === allKeys.length) {
    return false; // Key not found
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredKeys));
  return true;
}

/**
 * Remove all session keys for a wallet
 */
export function removeSessionKeysForWallet(wallet: string): void {
  const allKeys = getAllSessionKeys();
  const normalizedWallet = wallet.toLowerCase();
  const filteredKeys = allKeys.filter(
    key => key.wallet.toLowerCase() !== normalizedWallet
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredKeys));
}

/**
 * Remove all session keys (invalidate all)
 */
export function removeAllSessionKeys(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Clean up expired session keys
 */
export function cleanupExpiredKeys(): void {
  const allKeys = getAllSessionKeys();
  const now = new Date();
  const validKeys = allKeys.filter(key => new Date(key.expiresAt) > now);

  if (validKeys.length !== allKeys.length) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(validKeys));
  }
}

/**
 * Calculate days until expiry
 */
export function getDaysUntilExpiry(expiresAt: string): number {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diffMs = expiry.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Format expiry for display (e.g., "in 25 days")
 */
export function formatExpiry(expiresAt: string): string {
  const days = getDaysUntilExpiry(expiresAt);

  if (days <= 0) {
    return 'Expired';
  } else if (days === 1) {
    return 'in 1 day';
  } else {
    return `in ${days} days`;
  }
}

/**
 * Format creation date for display
 */
export function formatCreatedAt(createdAt: string): string {
  const date = new Date(createdAt);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).replace(',', '');
}
