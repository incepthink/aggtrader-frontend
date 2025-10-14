export function formatCompact(input: number | string, maxDecimals = 2): string {
  let n = typeof input === "string" ? parseFloat(input) : input;
  if (!Number.isFinite(n)) return "–";

  const sign = n < 0 ? "-" : "";
  n = Math.abs(n);

  const units = [
    { v: 1e12, s: "T" },
    { v: 1e9, s: "B" },
    { v: 1e6, s: "M" },
    { v: 1e3, s: "K" },
  ];

  for (const { v, s } of units) {
    if (n >= v) {
      return sign + trimZeros((n / v).toFixed(maxDecimals)) + s;
    }
  }

  return sign + trimZeros(n.toFixed(maxDecimals));
}

function trimZeros(x: string): string {
  return x.replace(/\.0+$|(\.\d*?[1-9])0+$/, "$1");
}