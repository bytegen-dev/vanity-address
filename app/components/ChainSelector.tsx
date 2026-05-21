"use client";

import type { AddressType } from "../../lib/unified-vanity-generator";

interface ChainSelectorProps {
  addressType: AddressType;
  disabled: boolean;
  onChange: (type: AddressType) => void;
}

export default function ChainSelector({
  addressType,
  disabled,
  onChange,
}: ChainSelectorProps) {
  return (
    <section className="card chain-selector">
      <div className="card-heading">
        <h2>Chain</h2>
        <p>Switch networks — generation runs in a dedicated worker thread.</p>
      </div>

      <div className="chain-toggle" role="radiogroup" aria-label="Address type">
        <button
          type="button"
          role="radio"
          aria-checked={addressType === "solana"}
          className={`chain-pill ${addressType === "solana" ? "is-active" : ""}`}
          onClick={() => onChange("solana")}
          disabled={disabled}
        >
          <span className="chain-pill-label">Solana</span>
          <span className="chain-pill-meta">Base58</span>
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={addressType === "evm"}
          className={`chain-pill ${addressType === "evm" ? "is-active is-evm" : ""}`}
          onClick={() => onChange("evm")}
          disabled={disabled}
        >
          <span className="chain-pill-label">EVM</span>
          <span className="chain-pill-meta">Hex · 0x…</span>
        </button>
      </div>

      <p className="chain-hint">
        {addressType === "solana"
          ? "Base58 alphabet excludes 0, O, I, and l."
          : "Patterns match after the 0x prefix (hex only: 0-9, a-f)."}
      </p>

      {addressType === "evm" && (
        <div className="notice notice-warn" role="status">
          <strong>Experimental</strong>
          <span>EVM throughput is lower than Solana; use shorter patterns.</span>
        </div>
      )}
    </section>
  );
}
