export type WorkerChain = "solana" | "evm";

export interface SolanaWorkerResult {
  publicKey: string;
  privateKey: string;
  attempts: number;
  timeElapsed: number;
}

export interface EvmWorkerResult {
  address: string;
  privateKey: string;
  publicKey: string;
  attempts: number;
  timeElapsed: number;
}

export interface WorkerGenerateOptions {
  startsWith?: string;
  endsWith?: string;
  contains?: string;
  caseSensitive?: boolean;
  maxAttempts: number;
  maxTime: number;
  onProgress?: (attempts: number) => void;
}

function createWorker(chain: WorkerChain): Worker {
  if (chain === "solana") {
    return new Worker(
      new URL("./workers/solana-vanity.worker.ts", import.meta.url),
      { type: "module" }
    );
  }

  return new Worker(new URL("./workers/evm-vanity.worker.ts", import.meta.url), {
    type: "module",
  });
}

export class VanityWorkerSession<T> {
  private worker: Worker | null = null;

  stop(): void {
    if (!this.worker) return;
    this.worker.postMessage({ type: "stop" });
    this.worker.terminate();
    this.worker = null;
  }

  run(chain: WorkerChain, options: WorkerGenerateOptions): Promise<T | null> {
    this.stop();

    return new Promise((resolve, reject) => {
      const worker = createWorker(chain);
      this.worker = worker;

      worker.onmessage = (event: MessageEvent) => {
        const { type } = event.data;

        if (type === "progress") {
          options.onProgress?.(event.data.attempts);
          return;
        }

        if (type === "error") {
          this.stop();
          reject(new Error(event.data.message));
          return;
        }

        if (type === "result") {
          this.stop();
          resolve(event.data.result as T);
          return;
        }

        if (type === "done") {
          this.stop();
          resolve(null);
        }
      };

      worker.onerror = (error) => {
        this.stop();
        reject(error);
      };

      worker.postMessage({
        type: "generate",
        payload: {
          startsWith: options.startsWith,
          endsWith: options.endsWith,
          contains: options.contains,
          caseSensitive: options.caseSensitive,
          maxAttempts: options.maxAttempts,
          maxTime: options.maxTime,
        },
      });
    });
  }
}
