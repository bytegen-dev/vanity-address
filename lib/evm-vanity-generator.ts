import { Wallet } from "ethers";
import {
  compilePattern,
  hasActivePattern,
  matchesPattern,
} from "./pattern-matcher";
import { EvmWorkerResult, VanityWorkerSession } from "./vanity-worker-client";

export interface EVMVanityResult {
  address: string;
  privateKey: string;
  publicKey: string;
  attempts: number;
  timeElapsed: number;
}

export interface EVMVanityOptions {
  startsWith?: string;
  endsWith?: string;
  contains?: string;
  maxAttempts?: number;
  maxTime?: number;
  caseSensitive?: boolean;
  onProgress?: (attempts: number) => void;
}

const MAIN_THREAD_BATCH = 2000;
const MAIN_THREAD_PROGRESS = 2000;

export class EVMVanityAddressGenerator {
  private workerSession = new VanityWorkerSession<EvmWorkerResult>();
  private shouldStop = false;

  stop(): void {
    this.shouldStop = true;
    this.workerSession.stop();
  }

  async generateVanityAddress(
    options: EVMVanityOptions = {}
  ): Promise<EVMVanityResult | null> {
    const {
      startsWith = "",
      endsWith = "",
      contains = "",
      maxAttempts = 10_000_000,
      maxTime = 300_000,
      caseSensitive = false,
      onProgress,
    } = options;

    this.shouldStop = false;

    if (!startsWith && !endsWith && !contains) {
      throw new Error("At least one criteria must be specified");
    }

    const hexPattern = /^[0-9a-fA-F]*$/;
    if (startsWith && !hexPattern.test(startsWith)) {
      throw new Error(
        "Starts with must contain only valid hex characters (0-9, a-f, A-F)"
      );
    }
    if (endsWith && !hexPattern.test(endsWith)) {
      throw new Error(
        "Ends with must contain only valid hex characters (0-9, a-f, A-F)"
      );
    }
    if (contains && !hexPattern.test(contains)) {
      throw new Error(
        "Contains must contain only valid hex characters (0-9, a-f, A-F)"
      );
    }

    try {
      const workerResult = await this.workerSession.run("evm", {
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

  private async generateOnMainThread(
    options: Required<
      Pick<
        EVMVanityOptions,
        | "startsWith"
        | "endsWith"
        | "contains"
        | "maxAttempts"
        | "maxTime"
        | "caseSensitive"
      >
    > & { onProgress?: (attempts: number) => void }
  ): Promise<EVMVanityResult | null> {
    const pattern = compilePattern(options);
    if (!hasActivePattern(pattern)) {
      return null;
    }

    this.shouldStop = false;
    const startTime = Date.now();
    let attempts = 0;
    let lastProgress = 0;

    while (attempts < options.maxAttempts && !this.shouldStop) {
      for (let i = 0; i < MAIN_THREAD_BATCH && !this.shouldStop; i++) {
        attempts++;
        const wallet = Wallet.createRandom();

        if (matchesPattern(wallet.address, pattern, true)) {
          return {
            address: wallet.address,
            privateKey: wallet.privateKey,
            publicKey: wallet.publicKey,
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
    const alphabetSize = 16;

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
      const addressLength = 40;
      const possiblePositions = addressLength - contains.length + 1;
      probability *=
        Math.pow(1 / alphabetSize, contains.length) * possiblePositions;
      if (!caseSensitive) {
        const caseVariations = Math.pow(2, contains.length);
        probability *= Math.min(caseVariations, alphabetSize);
      }
    }

    return Math.min(probability, 1);
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

    const attemptsPerSecond = 12_000;
    return (expectedAttempts / attemptsPerSecond) * 1000;
  }

  formatTimeDuration(milliseconds: number): string {
    if (milliseconds === Infinity) return "∞";

    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  }
}
