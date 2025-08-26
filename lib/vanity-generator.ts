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
      maxAttempts = 1000000,
      maxTime = 30000, // 30 seconds default
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
      if (this.matchesCriteria(publicKey, { startsWith, endsWith, contains })) {
        this.isRunning = false;
        const timeElapsed = Date.now() - this.startTime;

        return {
          publicKey,
          privateKey: bs58.encode(keypair.secretKey),
          attempts,
          timeElapsed,
        };
      }

      // Yield control to prevent blocking the UI
      if (attempts % 1000 === 0) {
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
   */
  private matchesCriteria(
    publicKey: string,
    criteria: {
      startsWith?: string;
      endsWith?: string;
      contains?: string;
    }
  ): boolean {
    const { startsWith, endsWith, contains } = criteria;

    if (startsWith && !publicKey.startsWith(startsWith)) {
      return false;
    }

    if (endsWith && !publicKey.endsWith(endsWith)) {
      return false;
    }

    if (contains && !publicKey.includes(contains)) {
      return false;
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
  }): number {
    const { startsWith, endsWith, contains } = criteria;
    let probability = 1;

    // Base58 alphabet has 58 characters
    const alphabetSize = 58;

    if (startsWith) {
      // For each character in the prefix, probability is 1/58
      probability *= Math.pow(1 / alphabetSize, startsWith.length);
    }

    if (endsWith) {
      probability *= Math.pow(1 / alphabetSize, endsWith.length);
    }

    if (contains) {
      // This is a rough estimate - actual probability depends on position
      probability *= Math.pow(1 / alphabetSize, contains.length);
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
  }): number {
    const probability = this.estimateProbability(criteria);
    return probability > 0 ? Math.ceil(1 / probability) : Infinity;
  }
}
