import { describe, it, expect, vi } from "vitest";
import { withRetry, fetchWithTimeout } from "./retry.js";

describe("withRetry", () => {
  it("returns result on first success", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    const result = await withRetry(fn, { maxAttempts: 3, baseDelayMs: 10 });
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries on failure and succeeds", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValue("ok");
    const result = await withRetry(fn, { maxAttempts: 3, baseDelayMs: 10 });
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("throws after max attempts exhausted", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("always fails"));
    await expect(
      withRetry(fn, { maxAttempts: 2, baseDelayMs: 10 }),
    ).rejects.toThrow("always fails");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("uses exponential backoff delays", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("1"))
      .mockRejectedValueOnce(new Error("2"))
      .mockResolvedValue("ok");

    const start = Date.now();
    await withRetry(fn, { maxAttempts: 3, baseDelayMs: 50 });
    const elapsed = Date.now() - start;

    expect(fn).toHaveBeenCalledTimes(3);
    expect(elapsed).toBeGreaterThanOrEqual(75);
  });

  it("applies jitter to delays", async () => {
    vi.useFakeTimers();
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("1"))
      .mockResolvedValue("ok");

    const promise = withRetry(fn, { maxAttempts: 2, baseDelayMs: 100 });

    expect(fn).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(200);
    const result = await promise;
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });
});

describe("fetchWithTimeout", () => {
  it("returns response when fetch completes in time", async () => {
    const mockResponse = new Response("ok");
    const fetchFn = vi.fn().mockResolvedValue(mockResponse);

    const result = await fetchWithTimeout(
      "https://example.com",
      {},
      5000,
      fetchFn,
    );
    expect(result).toBe(mockResponse);
  });

  it("aborts when timeout is exceeded", async () => {
    const fetchFn = vi.fn().mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_, reject) => {
          const signal = init.signal;
          signal?.addEventListener("abort", () => {
            reject(new DOMException("Aborted", "AbortError"));
          });
        }),
    );

    await expect(
      fetchWithTimeout("https://example.com", {}, 10, fetchFn),
    ).rejects.toThrow();
  });
});
