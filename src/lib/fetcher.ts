import { ProxyAgent } from "undici";
import type { Dispatcher } from "undici";

const DEFAULT_TIMEOUT_MS = 30_000;

export type Fetcher = (
  url: string | URL,
  init?: RequestInit & { dispatcher?: Dispatcher },
) => Promise<Response>;

export function createFetcher(proxyUrl?: string, timeoutMs = DEFAULT_TIMEOUT_MS): Fetcher {
  if (!proxyUrl) {
    return async (url, init) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        return await fetch(url as string, {
          ...init,
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timer);
      }
    };
  }
  const agent = new ProxyAgent(proxyUrl);
  return async (url, init) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url as string, {
        ...init,
        signal: controller.signal,
        dispatcher: agent,
      } as RequestInit);
    } finally {
      clearTimeout(timer);
    }
  };
}
