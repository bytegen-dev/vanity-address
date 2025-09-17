import { VanityAddressGenerator, VanityResult, VanityOptions } from "./vanity-generator";
import { EVMVanityAddressGenerator, EVMVanityResult, EVMVanityOptions } from "./evm-vanity-generator";

export type AddressType = "solana" | "evm";

export interface UnifiedVanityResult {
  addressType: AddressType;
  address: string;
  privateKey: string;
  publicKey: string;
  attempts: number;
  timeElapsed: number;
}

export interface UnifiedVanityOptions {
  addressType: AddressType;
  startsWith?: string;
  endsWith?: string;
  contains?: string;
  maxAttempts?: number;
  maxTime?: number;
  caseSensitive?: boolean;
  onProgress?: (attempts: number) => void;
}

export class UnifiedVanityAddressGenerator {
  private solanaGenerator = new VanityAddressGenerator();
  private evmGenerator = new EVMVanityAddressGenerator();

  async generateVanityAddress(
    options: UnifiedVanityOptions
  ): Promise<UnifiedVanityResult | null> {
    const { addressType, ...baseOptions } = options;

    if (addressType === "solana") {
      const result = await this.solanaGenerator.generateVanityAddress(baseOptions as VanityOptions);
      if (!result) return null;
      
      return {
        addressType: "solana",
        address: result.publicKey,
        privateKey: result.privateKey,
        publicKey: result.publicKey,
        attempts: result.attempts,
        timeElapsed: result.timeElapsed,
      };
    } else if (addressType === "evm") {
      const result = await this.evmGenerator.generateVanityAddress(baseOptions as EVMVanityOptions);
      if (!result) return null;
      
      return {
        addressType: "evm",
        address: result.address,
        privateKey: result.privateKey,
        publicKey: result.publicKey,
        attempts: result.attempts,
        timeElapsed: result.timeElapsed,
      };
    }

    throw new Error(`Unsupported address type: ${addressType}`);
  }

  stop() {
    this.solanaGenerator.stop();
    this.evmGenerator.stop();
  }

  estimateExpectedAttempts(options: Omit<UnifiedVanityOptions, 'onProgress'>): number {
    const { addressType, ...baseOptions } = options;

    if (addressType === "solana") {
      return this.solanaGenerator.estimateExpectedAttempts(baseOptions);
    } else if (addressType === "evm") {
      return this.evmGenerator.estimateExpectedAttempts(baseOptions);
    }

    throw new Error(`Unsupported address type: ${addressType}`);
  }

  estimateExpectedTime(options: Omit<UnifiedVanityOptions, 'onProgress'>): number {
    const { addressType, ...baseOptions } = options;

    if (addressType === "solana") {
      return this.solanaGenerator.estimateExpectedTime(baseOptions);
    } else if (addressType === "evm") {
      return this.evmGenerator.estimateExpectedTime(baseOptions);
    }

    throw new Error(`Unsupported address type: ${addressType}`);
  }

  estimateProbability(options: Omit<UnifiedVanityOptions, 'onProgress'>): number {
    const { addressType, ...baseOptions } = options;

    if (addressType === "solana") {
      return this.solanaGenerator.estimateProbability(baseOptions);
    } else if (addressType === "evm") {
      return this.evmGenerator.estimateProbability(baseOptions);
    }

    throw new Error(`Unsupported address type: ${addressType}`);
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

  validateCriteria(options: Omit<UnifiedVanityOptions, 'onProgress'>): string[] {
    const { addressType, startsWith, endsWith, contains } = options;
    const issues: string[] = [];

    if (addressType === "solana") {
      // Solana uses Base58 - exclude: 0, O, I, l
      const invalidChars = ['0', 'O', 'I', 'l'];
      
      if (startsWith) {
        const invalidStart = invalidChars.find(char => startsWith.includes(char));
        if (invalidStart) {
          issues.push(`"Starts With" cannot contain: ${invalidStart} (not in Base58 alphabet)`);
        }
      }
      if (endsWith) {
        const invalidEnd = invalidChars.find(char => endsWith.includes(char));
        if (invalidEnd) {
          issues.push(`"Ends With" cannot contain: ${invalidEnd} (not in Base58 alphabet)`);
        }
      }
      if (contains) {
        const invalidContain = invalidChars.find(char => contains.includes(char));
        if (invalidContain) {
          issues.push(`"Contains" cannot contain: ${invalidContain} (not in Base58 alphabet)`);
        }
      }
    } else if (addressType === "evm") {
      // EVM uses hex - only 0-9, a-f, A-F
      const hexPattern = /^[0-9a-fA-F]*$/;
      
      if (startsWith && !hexPattern.test(startsWith)) {
        issues.push(`"Starts With" must contain only valid hex characters (0-9, a-f, A-F)`);
      }
      if (endsWith && !hexPattern.test(endsWith)) {
        issues.push(`"Ends With" must contain only valid hex characters (0-9, a-f, A-F)`);
      }
      if (contains && !hexPattern.test(contains)) {
        issues.push(`"Contains" must contain only valid hex characters (0-9, a-f, A-F)`);
      }
    }

    return issues;
  }
}
