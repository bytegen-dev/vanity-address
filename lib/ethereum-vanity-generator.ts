import { ethers } from "ethers";

export interface EthereumVanityResult {
  address: string;
  privateKey: string;
  publicKey: string;
  attempts: number;
  timeElapsed: number;
}

export interface EthereumVanityOptions {
  startsWith?: string;
  endsWith?: string;
  contains?: string;
  maxAttempts?: number;
  maxTime?: number; // in milliseconds
  caseSensitive?: boolean; // Whether to use case sensitive matching
  onProgress?: (attempts: number) => void; // Callback for progress updates
}

export class EthereumVanityAddressGenerator {
  private shouldStop = false;

  stop() {
    this.shouldStop = true;
  }

  async generateVanityAddress(
    options: EthereumVanityOptions = {}
  ): Promise<EthereumVanityResult | null> {
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
    const startTime = Date.now();
    let attempts = 0;

    // Validate criteria
    if (!startsWith && !endsWith && !contains) {
      throw new Error("At least one criteria must be specified");
    }

    // Validate hex characters for Ethereum addresses
    const hexPattern = /^[0-9a-fA-F]*$/;
    if (startsWith && !hexPattern.test(startsWith)) {
      throw new Error("Starts with must contain only valid hex characters (0-9, a-f, A-F)");
    }
    if (endsWith && !hexPattern.test(endsWith)) {
      throw new Error("Ends with must contain only valid hex characters (0-9, a-f, A-F)");
    }
    if (contains && !hexPattern.test(contains)) {
      throw new Error("Contains must contain only valid hex characters (0-9, a-f, A-F)");
    }

    while (attempts < maxAttempts && !this.shouldStop) {
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

      // Progress callback and yield control
      if (attempts % 1000 === 0) {
        if (onProgress) {
          onProgress(attempts);
        }
        await new Promise((resolve) => setTimeout(resolve, 0));
      }

      // Check timeout
      if (Date.now() - startTime > maxTime) {
        break;
      }
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

    if (caseSensitive) {
      // Case sensitive matching
      if (startsWith && !address.startsWith(startsWith)) {
        return false;
      }
      if (endsWith && !address.endsWith(endsWith)) {
        return false;
      }
      if (contains && !address.includes(contains)) {
        return false;
      }
    } else {
      // Case insensitive matching (default)
      if (startsWith && !address.toLowerCase().startsWith(startsWith.toLowerCase())) {
        return false;
      }
      if (endsWith && !address.toLowerCase().endsWith(endsWith.toLowerCase())) {
        return false;
      }
      if (contains && !address.toLowerCase().includes(contains.toLowerCase())) {
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
      const addressLength = 40; // Ethereum addresses are 40 hex characters (excluding 0x)
      const possiblePositions = addressLength - contains.length + 1;
      probability *= Math.pow(1 / alphabetSize, contains.length) * possiblePositions;
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
