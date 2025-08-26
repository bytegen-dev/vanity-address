import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";

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
  maxTime?: number; // in milliseconds
  caseSensitive?: boolean; // Whether to use case sensitive matching
  onProgress?: (attempts: number) => void; // Callback for progress updates
}

export class VanityAddressGenerator {
  private isRunning = false;
  private startTime = 0;

  /**
   * Generate a vanity address that matches the specified criteria
   */
  async generateVanityAddress(
    options: VanityOptions = {}
  ): Promise<VanityResult | null> {
    const {
      startsWith = "",
      endsWith = "",
      contains = "",
      maxAttempts = 10000000, // 10 million attempts default
      maxTime = 300000, // 5 minutes default (300 seconds)
      caseSensitive = false, // Default to case insensitive for better UX
      onProgress,
    } = options;

    this.isRunning = true;
    this.startTime = Date.now();
    let attempts = 0;

    while (this.isRunning && attempts < maxAttempts) {
      attempts++;

      // Check if we've exceeded the time limit
      if (Date.now() - this.startTime > maxTime) {
        this.isRunning = false;
        return null;
      }

      // Generate a new keypair
      const keypair = Keypair.generate();
      const publicKey = keypair.publicKey.toString();

      // Check if the address matches our criteria
      if (
        this.matchesCriteria(publicKey, {
          startsWith,
          endsWith,
          contains,
          caseSensitive,
        })
      ) {
        this.isRunning = false;
        const timeElapsed = Date.now() - this.startTime;

        return {
          publicKey,
          privateKey: bs58.encode(keypair.secretKey),
          attempts,
          timeElapsed,
        };
      }

      // Yield control to prevent blocking the UI and report progress
      if (attempts % 1000 === 0) {
        if (onProgress) {
          onProgress(attempts);
        }
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }

    this.isRunning = false;
    return null;
  }

  /**
   * Stop the generation process
   */
  stop(): void {
    this.isRunning = false;
  }

  /**
   * Check if a public key matches the specified criteria
   * Supports both case sensitive and case insensitive matching
   */
  private matchesCriteria(
    publicKey: string,
    criteria: {
      startsWith?: string;
      endsWith?: string;
      contains?: string;
      caseSensitive?: boolean;
    }
  ): boolean {
    const { startsWith, endsWith, contains, caseSensitive = false } = criteria;

    if (caseSensitive) {
      // Case sensitive matching
      if (startsWith && !publicKey.startsWith(startsWith)) {
        return false;
      }
      if (endsWith && !publicKey.endsWith(endsWith)) {
        return false;
      }
      if (contains && !publicKey.includes(contains)) {
        return false;
      }
    } else {
      // Case insensitive matching (default)
      if (
        startsWith &&
        !publicKey.toLowerCase().startsWith(startsWith.toLowerCase())
      ) {
        return false;
      }
      if (
        endsWith &&
        !publicKey.toLowerCase().endsWith(endsWith.toLowerCase())
      ) {
        return false;
      }
      if (
        contains &&
        !publicKey.toLowerCase().includes(contains.toLowerCase())
      ) {
        return false;
      }
    }

    return true;
  }

  /**
   * Generate multiple vanity addresses
   */
  async generateMultipleVanityAddresses(
    count: number,
    options: VanityOptions = {}
  ): Promise<VanityResult[]> {
    const results: VanityResult[] = [];

    for (let i = 0; i < count; i++) {
      const result = await this.generateVanityAddress(options);
      if (result) {
        results.push(result);
      } else {
        break; // Stop if we can't generate more
      }
    }

    return results;
  }

  /**
   * Estimate the probability of finding a vanity address
   */
  estimateProbability(criteria: {
    startsWith?: string;
    endsWith?: string;
    contains?: string;
    caseSensitive?: boolean;
  }): number {
    const { startsWith, endsWith, contains, caseSensitive = false } = criteria;
    let probability = 1;

    // Base58 alphabet has 58 characters
    const alphabetSize = 58;

    if (startsWith) {
      // For each character in the prefix, probability is 1/58
      probability *= Math.pow(1 / alphabetSize, startsWith.length);

      // If case insensitive, multiply by number of case variations
      if (!caseSensitive) {
        // For case insensitive, we need to account for all possible case combinations
        // This is a rough estimate - actual probability is higher due to case variations
        const caseVariations = Math.pow(2, startsWith.length); // Each character can be upper or lower
        probability *= Math.min(caseVariations, alphabetSize); // Cap at alphabet size
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
      // This is a rough estimate - actual probability depends on position
      probability *= Math.pow(1 / alphabetSize, contains.length);

      if (!caseSensitive) {
        const caseVariations = Math.pow(2, contains.length);
        probability *= Math.min(caseVariations, alphabetSize);
      }
    }

    return probability;
  }

  /**
   * Estimate expected attempts for a given criteria
   */
  estimateExpectedAttempts(criteria: {
    startsWith?: string;
    endsWith?: string;
    contains?: string;
    caseSensitive?: boolean;
  }): number {
    const probability = this.estimateProbability(criteria);
    return probability > 0 ? Math.ceil(1 / probability) : Infinity;
  }

  /**
   * Estimate expected time for a given criteria (in milliseconds)
   * Based on real-world testing: ~1000-5000 attempts per second in browser
   */
  estimateExpectedTime(criteria: {
    startsWith?: string;
    endsWith?: string;
    contains?: string;
    caseSensitive?: boolean;
  }): number {
    const expectedAttempts = this.estimateExpectedAttempts(criteria);
    if (expectedAttempts === Infinity) return Infinity;

    // More realistic estimate: ~2000 attempts per second in browser environment
    // Based on actual performance testing
    const attemptsPerSecond = 2000;
    return (expectedAttempts / attemptsPerSecond) * 1000;
  }

  /**
   * Format time duration in a human-readable format
   */
  formatTimeDuration(milliseconds: number): string {
    if (milliseconds === Infinity) return "∞ (impossible)";
    if (milliseconds < 1000) return "< 1 second";
    if (milliseconds < 60000)
      return `${Math.ceil(milliseconds / 1000)} seconds`;
    if (milliseconds < 3600000)
      return `${Math.ceil(milliseconds / 60000)} minutes`;
    if (milliseconds < 86400000)
      return `${Math.ceil(milliseconds / 3600000)} hours`;
    return `${Math.ceil(milliseconds / 86400000)} days`;
  }
}
