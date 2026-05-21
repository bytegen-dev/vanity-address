"use client";

import type { UnifiedVanityResult } from "../../lib/unified-vanity-generator";

interface ResultsPanelProps {
  results: UnifiedVanityResult[];
  onCopy: (text: string) => void;
}

export default function ResultsPanel({ results, onCopy }: ResultsPanelProps) {
  if (results.length === 0) return null;

  return (
    <section className="card results-panel">
      <div className="card-heading">
        <h2>Match found</h2>
        <p>Store your private key offline — never share it.</p>
      </div>

      {results.map((result, index) => {
        const displayAddress =
          result.addressType === "solana" ? result.publicKey : result.address;

        return (
          <article key={index} className="result-block">
            <div className="result-row">
              <div className="result-field">
                <span className="result-label">
                  {result.addressType === "solana" ? "Public key" : "Address"}
                </span>
                <code>{displayAddress}</code>
              </div>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => onCopy(displayAddress)}
              >
                Copy
              </button>
            </div>

            <div className="result-row result-row-private">
              <div className="result-field">
                <span className="result-label">Private key</span>
                <code>{result.privateKey}</code>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-ghost-warn"
                onClick={() => onCopy(result.privateKey)}
              >
                Copy
              </button>
            </div>

            <dl className="result-meta">
              <div>
                <dt>Attempts</dt>
                <dd>{result.attempts.toLocaleString()}</dd>
              </div>
              <div>
                <dt>Time</dt>
                <dd>{(result.timeElapsed / 1000).toFixed(2)}s</dd>
              </div>
              <div>
                <dt>Chain</dt>
                <dd className="result-chain">{result.addressType}</dd>
              </div>
            </dl>
          </article>
        );
      })}
    </section>
  );
}
