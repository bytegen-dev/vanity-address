"use client";

import { useMemo } from "react";
import type { AddressType } from "../../lib/unified-vanity-generator";
import { UnifiedVanityAddressGenerator } from "../../lib/unified-vanity-generator";

export interface GenerationOptions {
  startsWith: string;
  endsWith: string;
  contains: string;
  maxAttempts: number;
  maxTime: number;
  caseSensitive: boolean;
}

interface GenerationFormProps {
  addressType: AddressType;
  options: GenerationOptions;
  isGenerating: boolean;
  generator: UnifiedVanityAddressGenerator;
  onOptionsChange: (options: GenerationOptions) => void;
  onGenerate: () => void;
  onStop: () => void;
}

export default function GenerationForm({
  addressType,
  options,
  isGenerating,
  generator,
  onOptionsChange,
  onGenerate,
  onStop,
}: GenerationFormProps) {
  const criteria = useMemo(
    () =>
      generator.validateCriteria({
        addressType,
        startsWith: options.startsWith,
        endsWith: options.endsWith,
        contains: options.contains,
      }),
    [
      generator,
      addressType,
      options.startsWith,
      options.endsWith,
      options.contains,
    ]
  );

  const estimates = useMemo(() => {
    const base = {
      addressType,
      startsWith: options.startsWith,
      endsWith: options.endsWith,
      contains: options.contains,
      caseSensitive: options.caseSensitive,
    };
    return {
      attempts: generator.estimateExpectedAttempts(base),
      probability: generator.estimateProbability(base),
      time: generator.estimateExpectedTime(base),
    };
  }, [generator, addressType, options]);

  const hasInvalidCriteria = criteria.length > 0;
  const canGenerate = !hasInvalidCriteria && !isGenerating;

  const update = (patch: Partial<GenerationOptions>) => {
    onOptionsChange({ ...options, ...patch });
  };

  return (
    <section className="card generation-form">
      <div className="card-heading">
        <h2>Pattern</h2>
        <p>Shorter prefixes finish faster — 2–3 characters is the sweet spot.</p>
      </div>

      <div className="field-grid field-grid-2">
        <label className="field">
          <span>Starts with</span>
          <input
            type="text"
            value={options.startsWith}
            onChange={(e) => update({ startsWith: e.target.value })}
            placeholder={addressType === "solana" ? "e.g. BYTE" : "e.g. dead"}
            disabled={isGenerating}
            autoComplete="off"
            spellCheck={false}
          />
        </label>
        <label className="field">
          <span>Ends with</span>
          <input
            type="text"
            value={options.endsWith}
            onChange={(e) => update({ endsWith: e.target.value })}
            placeholder={addressType === "solana" ? "e.g. gen" : "e.g. beef"}
            disabled={isGenerating}
            autoComplete="off"
            spellCheck={false}
          />
        </label>
      </div>

      <label className="field">
        <span>Contains</span>
        <input
          type="text"
          value={options.contains}
          onChange={(e) => update({ contains: e.target.value })}
          placeholder={addressType === "solana" ? "e.g. SOL" : "e.g. cafe"}
          disabled={isGenerating}
          autoComplete="off"
          spellCheck={false}
        />
      </label>

      <div className="field-grid field-grid-2">
        <label className="field">
          <span>Max attempts</span>
          <input
            type="number"
            min={1000}
            step={1000}
            value={options.maxAttempts}
            onChange={(e) =>
              update({ maxAttempts: parseInt(e.target.value, 10) || 1_000_000 })
            }
            disabled={isGenerating}
          />
        </label>
        <label className="field">
          <span>Max time (seconds)</span>
          <input
            type="number"
            min={5}
            value={Math.round(options.maxTime / 1000)}
            onChange={(e) =>
              update({
                maxTime: (parseInt(e.target.value, 10) || 30) * 1000,
              })
            }
            disabled={isGenerating}
          />
        </label>
      </div>

      <label className="checkbox-field">
        <input
          type="checkbox"
          checked={options.caseSensitive}
          onChange={(e) => update({ caseSensitive: e.target.checked })}
          disabled={isGenerating}
        />
        <span>Case-sensitive matching</span>
      </label>

      {hasInvalidCriteria && (
        <div className="notice notice-error" role="alert">
          <strong>Invalid pattern</strong>
          <ul>
            {criteria.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="estimate-panel">
        <h3>Difficulty</h3>
        <dl className="estimate-stats">
          <div>
            <dt>Expected tries</dt>
            <dd>{estimates.attempts.toLocaleString()}</dd>
          </div>
          <div>
            <dt>Hit rate</dt>
            <dd>{(estimates.probability * 100).toFixed(6)}%</dd>
          </div>
          <div>
            <dt>Est. time</dt>
            <dd>{generator.formatTimeDuration(estimates.time)}</dd>
          </div>
        </dl>
      </div>

      <div className="form-actions">
        {!isGenerating ? (
          <button
            type="button"
            className="btn btn-primary"
            onClick={onGenerate}
            disabled={!canGenerate}
          >
            Generate vanity address
          </button>
        ) : (
          <button type="button" className="btn btn-danger" onClick={onStop}>
            Stop
          </button>
        )}
      </div>
    </section>
  );
}
