"use client";

import { useState, useCallback } from "react";
import {
  VanityAddressGenerator,
  VanityResult,
  VanityOptions,
} from "../lib/vanity-generator";

export default function Home() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<VanityResult[]>([]);
  const [currentAttempts, setCurrentAttempts] = useState(0);
  const [options, setOptions] = useState<VanityOptions>({
    startsWith: "",
    endsWith: "",
    contains: "",
    maxAttempts: 1000000,
    maxTime: 30000,
  });

  const generator = new VanityAddressGenerator();

  const handleGenerate = useCallback(async () => {
    if (isGenerating) return;

    setIsGenerating(true);
    setCurrentAttempts(0);
    setResults([]);

    try {
      const result = await generator.generateVanityAddress(options);

      if (result) {
        setResults([result]);
      } else {
        alert(
          "Could not generate vanity address within the specified limits. Try adjusting your criteria or increasing the time/attempt limits."
        );
      }
    } catch (error) {
      console.error("Error generating vanity address:", error);
      alert("An error occurred while generating the vanity address.");
    } finally {
      setIsGenerating(false);
      setCurrentAttempts(0);
    }
  }, [options, isGenerating]);

  const handleStop = useCallback(() => {
    generator.stop();
    setIsGenerating(false);
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  const estimateAttempts = () => {
    const probability = generator.estimateProbability({
      startsWith: options.startsWith,
      endsWith: options.endsWith,
      contains: options.contains,
    });
    return generator.estimateExpectedAttempts({
      startsWith: options.startsWith,
      endsWith: options.endsWith,
      contains: options.contains,
    });
  };

  return (
    <div className="gradient-bg">
      <div className="container">
        <div className="text-center mb-8">
          <h1
            className="text-white mb-4"
            style={{ fontSize: "2.5rem", fontWeight: "bold" }}
          >
            Solana Vanity Address Generator
          </h1>
          <p className="text-white-80" style={{ fontSize: "1.125rem" }}>
            Generate custom Solana addresses with specific patterns
          </p>
        </div>

        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          {/* Input Form */}
          <div className="card">
            <h2
              className="text-white mb-6"
              style={{ fontSize: "1.5rem", fontWeight: "600" }}
            >
              Generation Criteria
            </h2>

            <div className="grid grid-cols-2 mb-6">
              <div>
                <label className="text-white mb-2" style={{ display: "block" }}>
                  Starts With
                </label>
                <input
                  type="text"
                  value={options.startsWith}
                  onChange={(e) =>
                    setOptions({ ...options, startsWith: e.target.value })
                  }
                  placeholder="e.g., ABC"
                />
              </div>

              <div>
                <label className="text-white mb-2" style={{ display: "block" }}>
                  Ends With
                </label>
                <input
                  type="text"
                  value={options.endsWith}
                  onChange={(e) =>
                    setOptions({ ...options, endsWith: e.target.value })
                  }
                  placeholder="e.g., XYZ"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="text-white mb-2" style={{ display: "block" }}>
                Contains
              </label>
              <input
                type="text"
                value={options.contains}
                onChange={(e) =>
                  setOptions({ ...options, contains: e.target.value })
                }
                placeholder="e.g., SOL"
              />
            </div>

            <div className="grid grid-cols-2 mb-6">
              <div>
                <label className="text-white mb-2" style={{ display: "block" }}>
                  Max Attempts
                </label>
                <input
                  type="number"
                  value={options.maxAttempts}
                  onChange={(e) =>
                    setOptions({
                      ...options,
                      maxAttempts: parseInt(e.target.value) || 1000000,
                    })
                  }
                />
              </div>

              <div>
                <label className="text-white mb-2" style={{ display: "block" }}>
                  Max Time (seconds)
                </label>
                <input
                  type="number"
                  value={(options.maxTime || 30000) / 1000}
                  onChange={(e) =>
                    setOptions({
                      ...options,
                      maxTime: (parseInt(e.target.value) || 30) * 1000,
                    })
                  }
                />
              </div>
            </div>

            {/* Probability Estimate */}
            <div
              className="mb-6"
              style={{
                padding: "16px",
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
              }}
            >
              <h3 className="text-white mb-2" style={{ fontWeight: "600" }}>
                Difficulty Estimate
              </h3>
              <p className="text-white-80">
                Expected attempts: {estimateAttempts().toLocaleString()}
              </p>
              <p className="text-white-80">
                Probability:{" "}
                {(
                  generator.estimateProbability({
                    startsWith: options.startsWith,
                    endsWith: options.endsWith,
                    contains: options.contains,
                  }) * 100
                ).toFixed(6)}
                %
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex">
              {!isGenerating ? (
                <button onClick={handleGenerate} className="btn-primary">
                  Generate Vanity Address
                </button>
              ) : (
                <button onClick={handleStop} className="btn-danger">
                  Stop Generation
                </button>
              )}
            </div>
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div className="card">
              <h2
                className="text-white mb-6"
                style={{ fontSize: "1.5rem", fontWeight: "600" }}
              >
                Generated Addresses
              </h2>

              {results.map((result, index) => (
                <div key={index} className="result-card">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3
                        style={{
                          fontWeight: "600",
                          color: "#374151",
                          marginBottom: "8px",
                        }}
                      >
                        Public Key
                      </h3>
                      <div className="flex items-center gap-2">
                        <code>{result.publicKey}</code>
                        <button
                          onClick={() => copyToClipboard(result.publicKey)}
                          className="btn-copy"
                        >
                          Copy
                        </button>
                      </div>
                    </div>

                    <div>
                      <h3
                        style={{
                          fontWeight: "600",
                          color: "#374151",
                          marginBottom: "8px",
                        }}
                      >
                        Private Key
                      </h3>
                      <div className="flex items-center gap-2">
                        <code>{result.privateKey}</code>
                        <button
                          onClick={() => copyToClipboard(result.privateKey)}
                          className="btn-copy btn-copy-red"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: "16px",
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "16px",
                      fontSize: "14px",
                      color: "#6b7280",
                    }}
                  >
                    <div>
                      <strong>Attempts:</strong>{" "}
                      {result.attempts.toLocaleString()}
                    </div>
                    <div>
                      <strong>Time:</strong>{" "}
                      {(result.timeElapsed / 1000).toFixed(2)}s
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Loading State */}
          {isGenerating && (
            <div className="card text-center">
              <div className="loading-spinner"></div>
              <p className="text-white">Generating vanity address...</p>
              <p
                className="text-white-80"
                style={{ fontSize: "14px", marginTop: "8px" }}
              >
                This may take a while depending on your criteria
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
