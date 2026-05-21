import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import {
  compilePattern,
  hasActivePattern,
  matchesPattern,
} from "./pattern-matcher";
import {
  SolanaWorkerResult,
  VanityWorkerSession,
} from "./vanity-worker-client";

export interface VanityResult {
  publicKey: string;
  privateKey: string;
  attempts: number;
  timeElapsed: number;
}

export interface VanityOptions {
  startsWith?: string;
  endsWith?: string;
  contains?: string;
  maxAttempts?: number;
  maxTime?: number;
  caseSensitive?: boolean;
  onProgress?: (attempts: number) => void;
}

const MAIN_THREAD_BATCH = 5000;
const MAIN_THREAD_PROGRESS = 5000;

export class VanityAddressGenerator {
  private workerSession = new VanityWorkerSession<SolanaWorkerResult>();
  private isRunning = false;

  async generateVanityAddress(
    options: VanityOptions = {}
  ): Promise<VanityResult | null> {
    const {
      startsWith = "",
      endsWith = "",
      contains = "",
      maxAttempts = 10_000_000,
      maxTime = 300_000,
      caseSensitive = false,
      onProgress,
    } = options;

    this.isRunning = true;

    try {
      const workerResult = await this.workerSession.run("solana", {
        startsWith,
        endsWith,
        contains,
        caseSensitive,
        maxAttempts,
        maxTime,
        onProgress,
      });

      if (workerResult) {
        return workerResult;
      }
    } catch {
      // Fall back to main-thread generation if workers are unavailable.
    }

    return this.generateOnMainThread({
      startsWith,
      endsWith,
      contains,
      maxAttempts,
      maxTime,
      caseSensitive,
      onProgress,
    });
  }

  stop(): void {
    this.isRunning = false;
    this.workerSession.stop();
  }

  private async generateOnMainThread(
    options: Required<
      Pick<
        VanityOptions,
        | "startsWith"
        | "endsWith"
        | "contains"
        | "maxAttempts"
        | "maxTime"
        | "caseSensitive"
      >
    > & { onProgress?: (attempts: number) => void }
  ): Promise<VanityResult | null> {
    const pattern = compilePattern(options);
    if (!hasActivePattern(pattern)) {
      return null;
    }

    this.isRunning = true;
    const startTime = Date.now();
    let attempts = 0;
    let lastProgress = 0;

    while (this.isRunning && attempts < options.maxAttempts) {
      for (let i = 0; i < MAIN_THREAD_BATCH && this.isRunning; i++) {
        attempts++;
        const keypair = Keypair.generate();
        const publicKey = keypair.publicKey.toString();

        if (matchesPattern(publicKey, pattern)) {
          this.isRunning = false;
          return {
            publicKey,
            privateKey: bs58.encode(keypair.secretKey),
            attempts,
            timeElapsed: Date.now() - startTime,
          };
        }
      }

      if (Date.now() - startTime > options.maxTime) {
        break;
      }

      if (attempts - lastProgress >= MAIN_THREAD_PROGRESS) {
        lastProgress = attempts;
        options.onProgress?.(attempts);
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }

    this.isRunning = false;
    return null;
  }

  estimateProbability(criteria: {
    startsWith?: string;
    endsWith?: string;
    contains?: string;
    caseSensitive?: boolean;
  }): number {
    const { startsWith, endsWith, contains, caseSensitive = false } = criteria;
    let probability = 1;
    const alphabetSize = 58;

    if (startsWith) {
      probability *= Math.pow(1 / alphabetSize, startsWith.length);
      if (!caseSensitive) {
        const caseVariations = Math.pow(2, startsWith.length);
        probability *= Math.min(caseVariations, alphabetSize);
      }
    }

    if (endsWith) {
      probability *= Math.pow(1 / alphabetSize, endsWith.length);
      if (!caseSensitive) {
        const caseVariations = Math.pow(2, endsWith.length);
        probability *= Math.min(caseVariations, alphabetSize);
      }
    }

    if (contains) {
      probability *= Math.pow(1 / alphabetSize, contains.length);
      if (!caseSensitive) {
        const caseVariations = Math.pow(2, contains.length);
        probability *= Math.min(caseVariations, alphabetSize);
      }
    }

    return probability;
  }

  estimateExpectedAttempts(criteria: {
    startsWith?: string;
    endsWith?: string;
    contains?: string;
    caseSensitive?: boolean;
  }): number {
    const probability = this.estimateProbability(criteria);
    return probability > 0 ? Math.ceil(1 / probability) : Infinity;
  }

  estimateExpectedTime(criteria: {
    startsWith?: string;
    endsWith?: string;
    contains?: string;
    caseSensitive?: boolean;
  }): number {
    const expectedAttempts = this.estimateExpectedAttempts(criteria);
    if (expectedAttempts === Infinity) return Infinity;

    const attemptsPerSecond = 25_000;
    return (expectedAttempts / attemptsPerSecond) * 1000;
  }

  formatTimeDuration(milliseconds: number): string {
    if (milliseconds === Infinity) return "∞ (impossible)";
    if (milliseconds < 1000) return "< 1 second";
    if (milliseconds < 60_000) return `${Math.ceil(milliseconds / 1000)} seconds`;
    if (milliseconds < 3_600_000) return `${Math.ceil(milliseconds / 60_000)} minutes`;
    if (milliseconds < 86_400_000) {
      return `${Math.ceil(milliseconds / 3_600_000)} hours`;
    }
    return `${Math.ceil(milliseconds / 86_400_000)} days`;
  }
}
