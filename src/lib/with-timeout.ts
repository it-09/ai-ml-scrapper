import type { Fetcher } from "./fetcher.js";

const DEFAULT_TIMEOUT_MS = 30_000;

export function withTimeout(fetcher: Fetcher, ms = DEFAULT_TIMEOUT_MS): Fetcher {
  return async (url, init) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    const outerSignal = init?.signal;
    let mergedSignal: AbortSignal;
    if (outerSignal) {
      mergedSignal = AbortSignal.any([controller.signal, outerSignal]);
    } else {
      mergedSignal = controller.signal;
    }
    try {
      return await fetcher(url, { ...init, signal: mergedSignal });
    } finally {
      clearTimeout(timer);
    }
  };
}
