import { describe, it, expect } from "vitest";
import { createFetcher } from "./fetcher.js";

describe("createFetcher", () => {
  it("returns a fetcher function when no proxyUrl", () => {
    const fetcher = createFetcher();
    expect(typeof fetcher).toBe("function");
  });

  it("returns a fetcher function when proxyUrl is undefined", () => {
    const fetcher = createFetcher(undefined);
    expect(typeof fetcher).toBe("function");
  });

  it("returns a custom fetcher when proxyUrl is provided", () => {
    const fetcher = createFetcher("http://proxy:8080");
    expect(typeof fetcher).toBe("function");
  });

  it("supports custom timeout", () => {
    const fetcher = createFetcher(undefined, 5000);
    expect(typeof fetcher).toBe("function");
  });
});
