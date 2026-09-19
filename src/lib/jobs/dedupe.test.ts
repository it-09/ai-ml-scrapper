import { describe, it, expect } from "vitest";
import { computeHash } from "./dedupe.js";

describe("computeHash", () => {
  it("returns a sha256 hex string", () => {
    const hash = computeHash("OpenAI", "ML Engineer", "San Francisco");
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("is deterministic for same inputs", () => {
    const h1 = computeHash("Acme", "Dev", "NYC");
    const h2 = computeHash("Acme", "Dev", "NYC");
    expect(h1).toBe(h2);
  });

  it("produces different hashes for different companies", () => {
    const h1 = computeHash("Acme", "Dev", "NYC");
    const h2 = computeHash("Globex", "Dev", "NYC");
    expect(h1).not.toBe(h2);
  });

  it("produces different hashes for different titles", () => {
    const h1 = computeHash("Acme", "Dev", "NYC");
    const h2 = computeHash("Acme", "ML Engineer", "NYC");
    expect(h1).not.toBe(h2);
  });

  it("produces different hashes for different locations", () => {
    const h1 = computeHash("Acme", "Dev", "NYC");
    const h2 = computeHash("Acme", "Dev", "SF");
    expect(h1).not.toBe(h2);
  });

  it("normalizes whitespace", () => {
    const h1 = computeHash("Acme", "ML  Engineer", "San  Francisco");
    const h2 = computeHash("Acme", "ML Engineer", "San Francisco");
    expect(h1).toBe(h2);
  });

  it("normalizes case", () => {
    const h1 = computeHash("acme", "ml engineer", "san francisco");
    const h2 = computeHash("ACME", "ML ENGINEER", "SAN FRANCISCO");
    expect(h1).toBe(h2);
  });

  it("strips non-alphanumeric characters except +, #, .", () => {
    const h1 = computeHash("Acme Inc!", "ML Engineer?", "San Francisco, CA");
    const h2 = computeHash("Acme Inc", "ML Engineer", "San Francisco CA");
    expect(h1).toBe(h2);
  });

  it("handles empty strings", () => {
    const hash = computeHash("", "", "");
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("preserves +, #, and . characters in normalization", () => {
    const h1 = computeHash("Acme", "C++ Engineer", "San Francisco");
    const h2 = computeHash("Acme", "C++ Engineer", "San Francisco");
    expect(h1).toBe(h2);

    const h3 = computeHash("Acme", "C++ Engineer", "San Francisco");
    const h4 = computeHash("Acme", "C Engineer", "San Francisco");
    expect(h3).not.toBe(h4);
  });

  it("preserves # in job titles", () => {
    const h1 = computeHash("Acme", "Engineer #12345", "Remote");
    const h2 = computeHash("Acme", "Engineer 12345", "Remote");
    expect(h1).not.toBe(h2);
  });

  it("preserves . in company names", () => {
    const h1 = computeHash("Dr.", "ML Engineer", "Remote");
    const h2 = computeHash("Dr", "ML Engineer", "Remote");
    expect(h1).not.toBe(h2);
  });
});
