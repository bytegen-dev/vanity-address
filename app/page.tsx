"use client";

import dynamic from "next/dynamic";
import { useState, useCallback, useEffect, useRef, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  UnifiedVanityAddressGenerator,
  UnifiedVanityResult,
  AddressType,
} from "../lib/unified-vanity-generator";
import { toast } from "react-toastify";
import VanityHeader from "./components/VanityHeader";
import ChainSelector from "./components/ChainSelector";
import GenerationForm, {
  GenerationOptions,
} from "./components/GenerationForm";
import ProgressPanel from "./components/ProgressPanel";
import ResultsPanel from "./components/ResultsPanel";

const Aurora = dynamic(() => import("./Aurora"), {
  ssr: false,
  loading: () => <div className="aurora-placeholder" aria-hidden="true" />,
});

const DEFAULT_OPTIONS: GenerationOptions = {
  startsWith: "",
  endsWith: "",
  contains: "",
  maxAttempts: 10_000_000,
  maxTime: 300_000,
  caseSensitive: false,
};

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const generatorRef = useRef(new UnifiedVanityAddressGenerator());

  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<UnifiedVanityResult[]>([]);
  const [currentAttempts, setCurrentAttempts] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [addressType, setAddressType] = useState<AddressType | null>(null);
  const [options, setOptions] = useState<GenerationOptions>(DEFAULT_OPTIONS);

  const progressRef = useRef({ attempts: 0, lastReported: 0 });
  const startTimeRef = useRef(0);

  useEffect(() => {
    const mode = searchParams.get("mode");
    if (mode === "evm" || mode === "solana") {
      setAddressType(mode);
    } else {
      setAddressType("solana");
    }
  }, [searchParams]);

  useEffect(() => {
    if (!isGenerating) return;

    const interval = setInterval(() => {
      setElapsedTime(Date.now() - startTimeRef.current);
    }, 250);

    return () => clearInterval(interval);
  }, [isGenerating]);

  const expectedAttempts = useMemo(() => {
    if (!addressType) return 0;
    return generatorRef.current.estimateExpectedAttempts({
      addressType,
      startsWith: options.startsWith,
      endsWith: options.endsWith,
      contains: options.contains,
      caseSensitive: options.caseSensitive,
    });
  }, [addressType, options]);

  const attemptsPerSecond = useMemo(() => {
    if (elapsedTime < 500 || currentAttempts === 0) return 0;
    return Math.round(currentAttempts / (elapsedTime / 1000));
  }, [elapsedTime, currentAttempts]);

  const auroraColors =
    addressType === "evm"
      ? ["#ff5c33", "#ff9f6b", "#3d1210"]
      : ["#14f195", "#9945ff", "#0b1020"];

  const handleGenerate = useCallback(async () => {
    if (isGenerating || !addressType) return;

    setIsGenerating(true);
    setCurrentAttempts(0);
    setResults([]);
    progressRef.current = { attempts: 0, lastReported: 0 };
    startTimeRef.current = Date.now();
    setElapsedTime(0);

    try {
      const result = await generatorRef.current.generateVanityAddress({
        addressType,
        ...options,
        onProgress: (attempts) => {
          progressRef.current.attempts = attempts;
          if (attempts - progressRef.current.lastReported >= 4000) {
            progressRef.current.lastReported = attempts;
            setCurrentAttempts(attempts);
          }
        },
      });

      setCurrentAttempts(progressRef.current.attempts);

      if (result) {
        setResults([result]);
        toast.success("Vanity address generated!");
      } else {
        toast.error(
          "No match within your limits. Try a shorter pattern or raise time/attempt caps."
        );
      }
    } catch (error) {
      console.error(error);
      toast.error("Generation failed. Check your pattern and try again.");
    } finally {
      setIsGenerating(false);
      setElapsedTime(Date.now() - startTimeRef.current);
    }
  }, [addressType, options, isGenerating]);

  const handleStop = useCallback(() => {
    generatorRef.current.stop();
    setIsGenerating(false);
  }, []);

  const handleAddressTypeChange = useCallback(
    (newAddressType: AddressType) => {
      if (isGenerating) return;
      setAddressType(newAddressType);
      const params = new URLSearchParams(searchParams.toString());
      params.set("mode", newAddressType);
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [searchParams, router, isGenerating]
  );

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  }, []);

  return (
    <div className={`app-shell chain-${addressType ?? "loading"}`}>
      <Aurora
        colorStops={auroraColors}
        amplitude={addressType === "evm" ? 0.85 : 1.1}
        blend={0.45}
        processing={isGenerating || addressType === null}
      />

      <main className="app-main">
        <VanityHeader addressType={addressType} />

        <div className="app-grid">
          {addressType === null ? (
            <section className="card loading-card">
              <div className="loading-spinner" />
              <p>Booting worker…</p>
            </section>
          ) : (
            <>
              <ChainSelector
                addressType={addressType}
                disabled={isGenerating}
                onChange={handleAddressTypeChange}
              />

              <GenerationForm
                addressType={addressType}
                options={options}
                isGenerating={isGenerating}
                generator={generatorRef.current}
                onOptionsChange={setOptions}
                onGenerate={handleGenerate}
                onStop={handleStop}
              />

              {isGenerating && (
                <ProgressPanel
                  elapsedMs={elapsedTime}
                  attempts={currentAttempts}
                  attemptsPerSecond={attemptsPerSecond}
                  expectedAttempts={expectedAttempts}
                />
              )}

              <ResultsPanel results={results} onCopy={copyToClipboard} />
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="app-shell">
          <main className="app-main">
            <p className="boot-text">_</p>
          </main>
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
