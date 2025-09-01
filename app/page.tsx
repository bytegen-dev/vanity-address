"use client";

import { useState, useCallback, useEffect } from "react";
import {
  VanityAddressGenerator,
  VanityResult,
  VanityOptions,
} from "../lib/vanity-generator";
import { toast } from "react-toastify";
import Aurora from "./Aurora";

export default function Home() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<VanityResult[]>([]);
  const [currentAttempts, setCurrentAttempts] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [options, setOptions] = useState<VanityOptions>({
    startsWith: "",
    endsWith: "",
    contains: "",
    maxAttempts: 10000000, // Increased to 10 million attempts
    maxTime: 300000, // Increased to 5 minutes (300 seconds)
    caseSensitive: false, // Default to case insensitive
  });

  const generator = new VanityAddressGenerator();

  // Timer effect for tracking elapsed time
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isGenerating) {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1000); // Update every second
      }, 1000);
    } else {
      setElapsedTime(0); // Reset when not generating
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isGenerating]);

  const handleGenerate = useCallback(async () => {
    if (isGenerating) return;

    setIsGenerating(true);
    setCurrentAttempts(0);
    setResults([]);

    try {
      const result = await generator.generateVanityAddress({
        ...options,
        onProgress: (attempts) => {
          setCurrentAttempts(attempts);
        },
      });

      if (result) {
        setResults([result]);
        toast.success("Vanity address generated successfully!", {
          position: "top-right",
          autoClose: 3000,
        });
      } else {
        toast.error(
          "Could not generate vanity address within the specified limits. Try adjusting your criteria or increasing the time/attempt limits.",
          {
            position: "top-right",
            autoClose: 5000,
          }
        );
      }
    } catch (error) {
      console.error("Error generating vanity address:", error);
      toast.error("An error occurred while generating the vanity address.", {
        position: "top-right",
        autoClose: 5000,
      });
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
    toast.success("Copied to clipboard!", {
      position: "top-right",
      autoClose: 2000,
    });
  };

  const estimateAttempts = () => {
    return generator.estimateExpectedAttempts({
      startsWith: options.startsWith,
      endsWith: options.endsWith,
      contains: options.contains,
      caseSensitive: options.caseSensitive,
    });
  };

  const estimateTime = () => {
    return generator.estimateExpectedTime({
      startsWith: options.startsWith,
      endsWith: options.endsWith,
      contains: options.contains,
      caseSensitive: options.caseSensitive,
    });
  };

  const estimateProbability = () => {
    return generator.estimateProbability({
      startsWith: options.startsWith,
      endsWith: options.endsWith,
      contains: options.contains,
      caseSensitive: options.caseSensitive,
    });
  };

  const validateCriteria = () => {
    const invalidChars = ["0", "O", "I", "l"];
    const issues = [];

    if (options.startsWith) {
      const invalidStart = invalidChars.find((char) =>
        options.startsWith?.includes(char)
      );
      if (invalidStart) {
        issues.push(
          `"Starts With" cannot contain: ${invalidStart} (not in Base58 alphabet)`
        );
      }
    }

    if (options.endsWith) {
      const invalidEnd = invalidChars.find((char) =>
        options.endsWith?.includes(char)
      );
      if (invalidEnd) {
        issues.push(
          `"Ends With" cannot contain: ${invalidEnd} (not in Base58 alphabet)`
        );
      }
    }

    if (options.contains) {
      const invalidContain = invalidChars.find((char) =>
        options.contains?.includes(char)
      );
      if (invalidContain) {
        issues.push(
          `"Contains" cannot contain: ${invalidContain} (not in Base58 alphabet)`
        );
      }
    }

    return issues;
  };

  const formatElapsedTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  return (
    <div className="gradient-bg">
      <Aurora
        colorStops={["#5227FF", "#7cff67", "#5227FF"]}
        amplitude={1.0}
        blend={0.5}
        processing={isGenerating}
      />
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
                  placeholder="e.g., ABC (recommended 2-3 chars)"
                  disabled={isGenerating}
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
                  placeholder="e.g., XYZ (recommended 2-3 chars)"
                  disabled={isGenerating}
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
                placeholder="e.g., SOL (recommended 2-3 chars)"
                disabled={isGenerating}
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
                  disabled={isGenerating}
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
                  disabled={isGenerating}
                />
              </div>
            </div>

            {/* Case Sensitivity Option */}
            <div className="mb-6">
              <label className="flex items-center text-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.caseSensitive}
                  onChange={(e) =>
                    setOptions({ ...options, caseSensitive: e.target.checked })
                  }
                  disabled={isGenerating}
                  style={{
                    marginRight: "8px",
                    width: "16px",
                    height: "16px",
                    accentColor: "#fff",
                  }}
                />
                <span style={{ fontSize: "14px" }}>
                  Case sensitive matching (unchecked = case insensitive)
                </span>
              </label>
            </div>

            {/* Validation Messages */}
            {validateCriteria().length > 0 && (
              <div
                className="mb-6"
                style={{
                  padding: "16px",
                  backgroundColor: "rgba(255, 0, 0, 0.1)",
                  border: "1px solid rgba(255, 0, 0, 0.3)",
                  borderRadius: "8px",
                }}
              >
                <h3
                  className="text-white mb-2"
                  style={{ fontWeight: "600", color: "#ff6b6b" }}
                >
                  ⚠️ Invalid Characters
                </h3>
                {validateCriteria().map((issue, index) => (
                  <p
                    key={index}
                    style={{
                      color: "#ff6b6b",
                      fontSize: "14px",
                      marginBottom: "4px",
                    }}
                  >
                    {issue}
                  </p>
                ))}
                <p
                  style={{
                    color: "#ff6b6b",
                    fontSize: "12px",
                    marginTop: "8px",
                  }}
                >
                  Solana addresses use Base58 encoding which excludes: 0, O, I,
                  l
                </p>
              </div>
            )}

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
                Probability: {(estimateProbability() * 100).toFixed(6)}%
              </p>
              <p className="text-white-80">
                Estimated time: {generator.formatTimeDuration(estimateTime())}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex">
              {!isGenerating ? (
                <button
                  onClick={handleGenerate}
                  className="btn-primary"
                  disabled={validateCriteria().length > 0}
                  style={{
                    opacity: validateCriteria().length > 0 ? 0.4 : 1,
                    cursor:
                      validateCriteria().length > 0 ? "not-allowed" : "pointer",
                  }}
                >
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
                          color: "#fff",
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
                          color: "#fff",
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
                      color: "#00ff00",
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
              <div style={{ marginTop: "16px" }}>
                <p
                  className="text-white-80"
                  style={{ fontSize: "14px", marginBottom: "8px" }}
                >
                  Time elapsed:{" "}
                  <strong>{formatElapsedTime(elapsedTime)}</strong>
                </p>
                <p
                  className="text-white-80"
                  style={{ fontSize: "14px", marginBottom: "8px" }}
                >
                  Attempts: <strong>{currentAttempts.toLocaleString()}</strong>
                </p>
                <p className="text-white-80" style={{ fontSize: "14px" }}>
                  This may take a while depending on your criteria
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
