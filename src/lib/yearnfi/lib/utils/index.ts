// Copy from yearn.fi/lib/utils/index.ts
// For now, let's create minimal versions:

export function cl(...classes: (string | boolean | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatAmount(
  value: string | number,
  minDecimals: number = 2,
  maxDecimals: number = 2
): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0.00';
  
  // Clamp maxDecimals to valid range (0-20)
  const safeMaxDecimals = Math.min(Math.max(0, maxDecimals), 20);
  const safeMinDecimals = Math.min(Math.max(0, minDecimals), safeMaxDecimals);
  
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: safeMinDecimals,
    maximumFractionDigits: safeMaxDecimals,
  }).format(num);
}


export function isZero(value: any): boolean {
  if (value === 0 || value === '0') return true;
  // Handle BigInt without literal
  if (typeof value === 'bigint' && value === BigInt(0)) return true;
  if (!value) return true;
  return false;
}

export function toNormalizedBN(
  raw: bigint | number,
  decimals: number = 18
): { raw: bigint; normalized: number } {
  const bigintValue = typeof raw === 'bigint' ? raw : BigInt(raw);
  const normalized = Number(bigintValue) / Math.pow(10, decimals);
  
  return {
    raw: bigintValue,
    normalized,
  };
}