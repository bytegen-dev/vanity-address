import { ethers } from "ethers";

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
  maxTime?: number; // in milliseconds
  caseSensitive?: boolean; // Whether to use case sensitive matching
  onProgress?: (attempts: number) => void; // Callback for progress updates
}

export class EVMVanityAddressGenerator {
  private shouldStop = false;

  stop() {
    this.shouldStop = true;
  }

  async generateVanityAddress(
    options: EVMVanityOptions = {}
  ): Promise<EVMVanityResult | null> {
    const {
      startsWith = "",
      endsWith = "",
      contains = "",
      maxAttempts = 10000000, // 10 million attempts default
      maxTime = 300000, // 5 minutes default (300 seconds)
      caseSensitive = false, // Default to case insensitive for better UX
      onProgress,
    } = options;

    this.shouldStop = false;

    // Validate criteria
    if (!startsWith && !endsWith && !contains) {
      throw new Error("At least one criteria must be specified");
    }

    // Validate hex characters for EVM addresses
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

    const startTime = Date.now();
    let attempts = 0;
    const BATCH_SIZE = 100; // Process 100 wallets per batch

    while (attempts < maxAttempts && !this.shouldStop) {
      // Process a batch of wallets
      for (let i = 0; i < BATCH_SIZE; i++) {
        attempts++;

        // Generate random wallet
        const wallet = ethers.Wallet.createRandom();
        const address = wallet.address;

        // Check if address matches criteria
        if (this.matchesCriteria(address, { startsWith, endsWith, contains, caseSensitive })) {
          const timeElapsed = Date.now() - startTime;
          return {
            address,
            privateKey: wallet.privateKey,
            publicKey: wallet.publicKey,
            attempts,
            timeElapsed,
          };
        }

        // Check timeout
        if (Date.now() - startTime > maxTime) {
          break;
        }
      }

      // Progress callback and yield control after each batch
      if (onProgress) {
        onProgress(attempts);
      }
      
      // Yield control to prevent blocking
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    return null;
  }

  private matchesCriteria(
    address: string,
    criteria: {
      startsWith?: string;
      endsWith?: string;
      contains?: string;
      caseSensitive?: boolean;
    }
  ): boolean {
    const { startsWith, endsWith, contains, caseSensitive = false } = criteria;

    // For EVM addresses, remove the "0x" prefix for pattern matching
    const addressWithoutPrefix = address.startsWith("0x")
      ? address.slice(2)
      : address;

    if (caseSensitive) {
      // Case sensitive matching
      if (startsWith && !addressWithoutPrefix.startsWith(startsWith)) {
        return false;
      }
      if (endsWith && !addressWithoutPrefix.endsWith(endsWith)) {
        return false;
      }
      if (contains && !addressWithoutPrefix.includes(contains)) {
        return false;
      }
    } else {
      // Case insensitive matching (default)
      if (
        startsWith &&
        !addressWithoutPrefix.toLowerCase().startsWith(startsWith.toLowerCase())
      ) {
        return false;
      }
      if (
        endsWith &&
        !addressWithoutPrefix.toLowerCase().endsWith(endsWith.toLowerCase())
      ) {
        return false;
      }
      if (
        contains &&
        !addressWithoutPrefix.toLowerCase().includes(contains.toLowerCase())
      ) {
        return false;
      }
    }

    return true;
  }

  estimateProbability(criteria: {
    startsWith?: string;
    endsWith?: string;
    contains?: string;
    caseSensitive?: boolean;
  }): number {
    const { startsWith, endsWith, contains, caseSensitive = false } = criteria;
    let probability = 1;
    const alphabetSize = 16; // Hex characters: 0-9, a-f

    if (startsWith) {
      probability *= Math.pow(1 / alphabetSize, startsWith.length);
      if (!caseSensitive) {
        // For case insensitive, we have 2 options per character (lowercase/uppercase)
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
      // For contains, we need to consider all possible positions
      // This is a simplified calculation - in reality it's more complex
      const addressLength = 40; // EVM addresses are 40 hex characters (excluding 0x)
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
    const attemptsPerSecond = 2000; // More realistic estimate for Ethereum
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
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
}
