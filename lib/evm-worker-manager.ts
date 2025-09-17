import { EVMVanityResult, EVMVanityOptions } from "./evm-vanity-generator";

export interface EVMWorkerMessage {
  success: boolean;
  result?: EVMVanityResult;
  progress?: {
    attempts: number;
    timeElapsed: number;
  };
  error?: string;
  reason?: string;
}

export class EVMWorkerManager {
  private worker: Worker | null = null;
  private isRunning = false;

  async generateVanityAddress(
    options: EVMVanityOptions
  ): Promise<EVMVanityResult | null> {
    return new Promise((resolve, reject) => {
      if (this.isRunning) {
        reject(new Error("Generation already in progress"));
        return;
      }

      this.isRunning = true;
      this.worker = new Worker('/evm-worker.js');

      const { startsWith, endsWith, contains, maxAttempts, maxTime, caseSensitive, onProgress } = options;

      // Set up message handler
      this.worker.onmessage = (e: MessageEvent<EVMWorkerMessage>) => {
        const { success, result, progress, error, reason } = e.data;

        if (error) {
          this.cleanup();
          this.isRunning = false;
          reject(new Error(error));
          return;
        }

        if (success && result) {
          this.cleanup();
          this.isRunning = false;
          resolve(result);
          return;
        }

        if (progress && onProgress) {
          onProgress(progress.attempts);
        }

        if (!success && reason) {
          this.cleanup();
          this.isRunning = false;
          resolve(null);
          return;
        }
      };

      // Set up error handler
      this.worker.onerror = (error) => {
        this.cleanup();
        this.isRunning = false;
        reject(error);
      };

      // Start generation
      this.worker.postMessage({
        criteria: { startsWith, endsWith, contains },
        maxAttempts,
        maxTime,
        caseSensitive,
        onProgress: !!onProgress
      });
    });
  }

  stop() {
    if (this.worker) {
      this.worker.terminate();
      this.cleanup();
      this.isRunning = false;
    }
  }

  private cleanup() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }

  get running() {
    return this.isRunning;
  }
}
