/// <reference lib="webworker" />

import nacl from "tweetnacl";
import bs58 from "bs58";
import {
  compilePattern,
  hasActivePattern,
  matchesPattern,
} from "../pattern-matcher";

const BATCH_SIZE = 8000;
const PROGRESS_INTERVAL = 8000;

interface GeneratePayload {
  startsWith?: string;
  endsWith?: string;
  contains?: string;
  caseSensitive?: boolean;
  maxAttempts: number;
  maxTime: number;
}

let shouldStop = false;

self.onmessage = (event: MessageEvent) => {
  const { type } = event.data;

  if (type === "stop") {
    shouldStop = true;
    return;
  }

  if (type !== "generate") return;

  shouldStop = false;
  const payload = event.data.payload as GeneratePayload;
  const pattern = compilePattern(payload);
  const startTime = Date.now();
  let attempts = 0;
  let lastProgress = 0;

  if (!hasActivePattern(pattern)) {
    self.postMessage({
      type: "error",
      message: "At least one pattern criterion is required.",
    });
    return;
  }

  while (!shouldStop && attempts < payload.maxAttempts) {
    for (let i = 0; i < BATCH_SIZE && !shouldStop; i++) {
      attempts++;

      const keyPair = nacl.sign.keyPair();
      const publicKey = bs58.encode(keyPair.publicKey);

      if (matchesPattern(publicKey, pattern)) {
        self.postMessage({
          type: "result",
          result: {
            publicKey,
            privateKey: bs58.encode(keyPair.secretKey),
            attempts,
            timeElapsed: Date.now() - startTime,
          },
        });
        return;
      }
    }

    if (Date.now() - startTime > payload.maxTime) {
      break;
    }

    if (attempts - lastProgress >= PROGRESS_INTERVAL) {
      lastProgress = attempts;
      self.postMessage({ type: "progress", attempts });
    }
  }

  self.postMessage({ type: "done", result: null });
};

export {};
