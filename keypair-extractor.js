const { Keypair } = require("@solana/web3.js");
const fs = require("fs");
const bs58 = require("bs58");

/**
 * Extract private key and public key from a Solana keypair byte array
 * @param {number[]} keypairBytes - Array of bytes representing the keypair
 * @returns {Object} Object containing privateKey and publicKey
 */
function extractKeypair(keypairBytes) {
  try {
    // Convert byte array to Uint8Array
    const uint8Array = new Uint8Array(keypairBytes);

    // Create Keypair from the byte array
    const keypair = Keypair.fromSecretKey(uint8Array);

    // Extract private key in multiple formats
    const privateKeyBase64 = Buffer.from(keypair.secretKey).toString("base64");
    const privateKeyHex = Buffer.from(keypair.secretKey).toString("hex");
    const privateKeyBase58 = bs58.encode(keypair.secretKey);

    // Extract public key as base58 string
    const publicKey = keypair.publicKey.toString();

    return {
      privateKey: privateKeyBase64, // Keep base64 as default for backward compatibility
      privateKeyBase64,
      privateKeyHex,
      privateKeyBase58,
      publicKey,
      secretKey: Array.from(keypair.secretKey), // Full secret key as array
      keypairBytes: Array.from(uint8Array), // Original bytes
    };
  } catch (error) {
    console.error("Error extracting keypair:", error.message);
    return null;
  }
}

/**
 * Load keypair from JSON file
 * @param {string} filePath - Path to the JSON file containing keypair bytes
 * @returns {Object} Object containing privateKey and publicKey
 */
function loadKeypairFromFile(filePath) {
  try {
    // Read the JSON file
    const fileContent = fs.readFileSync(filePath, "utf8");
    const keypairBytes = JSON.parse(fileContent);

    return extractKeypair(keypairBytes);
  } catch (error) {
    console.error("Error loading keypair from file:", error.message);
    return null;
  }
}

/**
 * Generate a new random keypair
 * @returns {Object} Object containing privateKey and publicKey
 */
function generateNewKeypair() {
  try {
    const keypair = Keypair.generate();

    const privateKeyBase64 = Buffer.from(keypair.secretKey).toString("base64");
    const privateKeyHex = Buffer.from(keypair.secretKey).toString("hex");
    const privateKeyBase58 = bs58.encode(keypair.secretKey);
    const publicKey = keypair.publicKey.toString();

    return {
      privateKey: privateKeyBase64, // Keep base64 as default for backward compatibility
      privateKeyBase64,
      privateKeyHex,
      privateKeyBase58,
      publicKey,
      secretKey: Array.from(keypair.secretKey),
      keypairBytes: Array.from(keypair.secretKey),
    };
  } catch (error) {
    console.error("Error generating keypair:", error.message);
    return null;
  }
}

// Example usage
if (require.main === module) {
  // Example 1: Extract from your existing file
  console.log("=== Extracting from existing file ===");
  const result = loadKeypairFromFile(
    "swcLzUS6sYQKBXq6fDAsnPxUGXhBXCK99nn2K1oEc7Z.json"
  );
  if (result) {
    console.log("Public Key:", result.publicKey);
    console.log("Private Key (base64):", result.privateKey);
    console.log("Secret Key Length:", result.secretKey.length);
  }

  console.log("\n=== Generating new keypair ===");
  const newKeypair = generateNewKeypair();
  if (newKeypair) {
    console.log("New Public Key:", newKeypair.publicKey);
    console.log("New Private Key (base64):", newKeypair.privateKey);
    console.log("New Secret Key Length:", newKeypair.secretKey.length);
  }

  // Example 2: Extract from byte array directly
  console.log("\n=== Extracting from byte array ===");
  const sampleBytes = [
    210, 129, 134, 18, 168, 103, 206, 121, 44, 2, 230, 26, 158, 161, 0, 162,
    129, 32, 195, 252, 86, 155, 46, 106, 64, 199, 210, 0, 75, 22, 161, 198, 13,
    12, 201, 152, 222, 224, 214, 206, 55, 26, 152, 54, 223, 166, 190, 183, 8,
    104, 187, 66, 38, 68, 59, 247, 26, 128, 238, 127, 159, 150, 148, 80,
  ];
  const directResult = extractKeypair(sampleBytes);
  if (directResult) {
    console.log("Direct Public Key:", directResult.publicKey);
    console.log("Direct Private Key (base64):", directResult.privateKey);
  }
}

module.exports = {
  extractKeypair,
  loadKeypairFromFile,
  generateNewKeypair,
};
