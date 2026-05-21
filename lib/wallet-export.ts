import type { UnifiedVanityResult } from "./unified-vanity-generator";

export function formatWalletTxt(result: UnifiedVanityResult): string {
  const generatedAt = new Date().toISOString();
  const isSolana = result.addressType === "solana";
  const displayAddress = isSolana ? result.publicKey : result.address;

  const lines = [
    "Vanity Forge — Wallet Export",
    "===========================",
    "",
    `Generated: ${generatedAt}`,
    `Chain: ${result.addressType}`,
    "",
    isSolana ? `Public Key: ${result.publicKey}` : `Address: ${result.address}`,
    `Private Key: ${result.privateKey}`,
  ];

  if (!isSolana && result.publicKey) {
    lines.push(`Public Key: ${result.publicKey}`);
  }

  lines.push(
    "",
    "---",
    `Attempts: ${result.attempts.toLocaleString()}`,
    `Time: ${(result.timeElapsed / 1000).toFixed(2)}s`,
    "",
    "WARNING: Keep this file private. Anyone with the private key controls the wallet."
  );

  return lines.join("\n");
}

export function walletExportFilename(result: UnifiedVanityResult): string {
  const address = result.addressType === "solana" ? result.publicKey : result.address;
  const slug = address.replace(/^0x/i, "").slice(0, 8);
  return `vanity-${result.addressType}-${slug}.txt`;
}

export function downloadWalletTxt(result: UnifiedVanityResult): void {
  const content = formatWalletTxt(result);
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = walletExportFilename(result);
  link.click();
  URL.revokeObjectURL(url);
}
