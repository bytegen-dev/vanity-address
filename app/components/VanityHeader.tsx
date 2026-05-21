"use client";

import type { AddressType } from "../../lib/unified-vanity-generator";

interface VanityHeaderProps {
  addressType: AddressType | null;
}

export default function VanityHeader({ addressType }: VanityHeaderProps) {
  const chainLabel =
    addressType === "solana"
      ? "Solana"
      : addressType === "evm"
        ? "EVM"
        : null;

  return (
    <header className="vanity-header">
      <p className="vanity-eyebrow">Client-side · Keys never leave your browser</p>
      <h1 className="vanity-title">
        {chainLabel ? (
          <>
            <span className="vanity-title-accent">{chainLabel}</span> Vanity Forge
          </>
        ) : (
          "Vanity Forge"
        )}
      </h1>
      <p className="vanity-subtitle">
        {chainLabel
          ? `Mint a ${chainLabel} address that starts, ends, or contains your pattern.`
          : "Choose a chain and sculpt your custom wallet address."}
      </p>
    </header>
  );
}
