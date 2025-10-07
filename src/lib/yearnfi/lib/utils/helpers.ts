import type { TYDaemonVault } from "@/lib/yearnfi/lib/utils/schemas/yDaemonVaultsSchemas";

export function getVaultName(vault: TYDaemonVault): string {
  const baseName = vault.name;
  if (baseName.includes(" yVault")) {
    return baseName.replace(" yVault", "");
  }
  return baseName;
}

export function copyToClipboard(value: string): void {
  navigator.clipboard.writeText(value);
  // We'll add toast notifications in Phase 10
  console.log("Copied to clipboard:", value);
}