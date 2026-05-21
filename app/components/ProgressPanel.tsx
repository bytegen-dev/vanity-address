"use client";

interface ProgressPanelProps {
  elapsedMs: number;
  attempts: number;
  attemptsPerSecond: number;
  expectedAttempts: number;
}

function formatElapsed(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

export default function ProgressPanel({
  elapsedMs,
  attempts,
  attemptsPerSecond,
  expectedAttempts,
}: ProgressPanelProps) {
  const progress =
    expectedAttempts > 0 && expectedAttempts !== Infinity
      ? Math.min(100, (attempts / expectedAttempts) * 100)
      : 0;

  return (
    <section className="card progress-panel" aria-live="polite">
      <div className="progress-ring" aria-hidden="true" />
      <div className="progress-copy">
        <h2>Searching…</h2>
        <p>Worker thread is grinding through keypairs off the main UI thread.</p>
      </div>

      <div
        className="progress-bar"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
      >
        <span className="progress-bar-fill" style={{ width: `${progress}%` }} />
      </div>

      <dl className="progress-stats">
        <div>
          <dt>Elapsed</dt>
          <dd>{formatElapsed(elapsedMs)}</dd>
        </div>
        <div>
          <dt>Attempts</dt>
          <dd>{attempts.toLocaleString()}</dd>
        </div>
        <div>
          <dt>Speed</dt>
          <dd>{attemptsPerSecond.toLocaleString()}/s</dd>
        </div>
      </dl>
    </section>
  );
}
