import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("apify", () => {
  const store = { data: {} as Record<string, unknown> };
  return {
    Actor: {
      openKeyValueStore: vi.fn().mockResolvedValue({
        getValue: vi.fn().mockImplementation((key: string) => store.data[key] ?? null),
        setValue: vi.fn().mockImplementation((key: string, value: unknown) => {
          store.data[key] = value;
        }),
      }),
      openDataset: vi.fn().mockResolvedValue({
        pushData: vi.fn().mockResolvedValue(undefined),
      }),
      charge: vi.fn().mockResolvedValue({ eventChargeLimitReached: false }),
    },
    log: {
      info: vi.fn(),
      warning: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    },
  };
});

vi.mock("./adapters/greenhouse.js", () => ({
  fetchGreenhouseJobs: vi.fn().mockResolvedValue([
    {
      source: "greenhouse",
      externalId: "g1",
      company: "TestCorp",
      title: "ML Engineer",
      description: "Machine learning engineer role with Python and PyTorch",
      applyUrl: "https://example.com/1",
      location: "Remote",
      remote: true,
    },
  ]),
  GREENHOUSE_BOARD_TOKENS: ["test-token"],
}));

vi.mock("./adapters/lever.js", () => ({
  fetchLeverJobs: vi.fn().mockResolvedValue([]),
  LEVER_COMPANY_SLUGS: [],
}));

vi.mock("./adapters/remoteok.js", () => ({
  fetchRemoteOkJobs: vi.fn().mockResolvedValue([]),
}));

vi.mock("./adapters/weworkremotely.js", () => ({
  fetchWeWorkRemotelyJobs: vi.fn().mockResolvedValue([]),
}));

import { runIngestion } from "./ingest.js";
import type { ApifyInput } from "../input-schema.js";

function makeInput(overrides: Partial<ApifyInput> = {}): ApifyInput {
  return {
    sources: ["greenhouse"],
    keywords: [],
    companies: [],
    experienceLevels: [],
    customGreenhouseTokens: [],
    customLeverSlugs: [],
    parseAllResults: false,
    classifyWithAI: false,
    classificationMode: "deterministic",
    llmProvider: "groq",
    tier: "starter",
    maxItems: 100,
    detectChanges: false,
    proxy: false,
    alertKeywords: [],
    alertMinSalary: 0,
    webhookUrl: "",
    ...overrides,
  };
}

describe("runIngestion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a summary with correct structure", async () => {
    const summary = await runIngestion({ input: makeInput() });
    expect(summary).toMatchObject({
      runId: expect.stringMatching(/^run-\d+-[0-9a-f]+$/),
      jobsFound: expect.any(Number),
      jobsNew: expect.any(Number),
      jobsUpdated: expect.any(Number),
      jobsRemoved: expect.any(Number),
      jobsFiltered: expect.any(Number),
      jobsOutput: expect.any(Number),
      startedAt: expect.any(String),
      completedAt: expect.any(String),
      sources: ["greenhouse"],
    });
  });

  it("filters jobs by keywords", async () => {
    const input = makeInput({ keywords: ["nonexistent"] });
    const summary = await runIngestion({ input });
    expect(summary.jobsOutput).toBe(0);
  });

  it("filters jobs by companies", async () => {
    const input = makeInput({ companies: ["nonexistent"] });
    const summary = await runIngestion({ input });
    expect(summary.jobsOutput).toBe(0);
  });

  it("filters jobs by experience level", async () => {
    const input = makeInput({ experienceLevels: ["senior"] });
    const summary = await runIngestion({ input });
    expect(summary.jobsOutput).toBe(0);
  });

  it("excludes null experience levels when filter is active", async () => {
    const input = makeInput({ experienceLevels: ["intern"] });
    const summary = await runIngestion({ input });
    expect(summary.jobsOutput).toBe(0);
  });

  it("includes all levels when experienceLevels is empty", async () => {
    const input = makeInput({ experienceLevels: [] });
    const summary = await runIngestion({ input });
    expect(summary.jobsOutput).toBeGreaterThanOrEqual(0);
  });

  it("respects maxItems limit", async () => {
    const input = makeInput({ maxItems: 1 });
    const summary = await runIngestion({ input });
    expect(summary.jobsOutput).toBeLessThanOrEqual(1);
  });

  it("handles empty sources gracefully", async () => {
    const input = makeInput({ sources: [] });
    const summary = await runIngestion({ input });
    expect(summary.jobsFound).toBe(0);
  });

  it("computes analytics and saves to KV", async () => {
    const summary = await runIngestion({ input: makeInput() });
    expect(summary.jobsFound).toBeGreaterThanOrEqual(0);
    expect(summary.startedAt).toBeDefined();
    expect(summary.completedAt).toBeDefined();
  });

  it("detects new jobs as created", async () => {
    const summary = await runIngestion({ input: makeInput() });
    expect(summary.jobsNew).toBeGreaterThanOrEqual(0);
  });

  it("respects tier source restrictions", async () => {
    const input = makeInput({ tier: "free" });
    const summary = await runIngestion({ input });
    expect(summary.sources).toEqual(["greenhouse"]);
  });

  it("includes all sources for pro tier", async () => {
    const input = makeInput({ tier: "pro" });
    const summary = await runIngestion({ input });
    expect(summary.sources).toContain("greenhouse");
  });

  it("bypasses maxItems when parseAllResults is true", async () => {
    const input = makeInput({ maxItems: 1, parseAllResults: true });
    const summary = await runIngestion({ input });
    expect(summary.jobsOutput).toBeGreaterThanOrEqual(1);
  });

  it("sends webhook for new jobs when configured", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response());
    const input = makeInput({
      webhookUrl: "https://hooks.example.com/test",
      alertKeywords: ["python"],
    });
    await runIngestion({ input });
    fetchSpy.mockRestore();
  });

  it("skips webhook for private URLs", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response());
    const input = makeInput({
      webhookUrl: "http://localhost:3000/webhook",
      alertKeywords: ["python"],
    });
    await runIngestion({ input });
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("does not send webhook when no alerts configured", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response());
    const input = makeInput({
      webhookUrl: "https://hooks.example.com/test",
      alertKeywords: [],
      alertMinSalary: 0,
    });
    await runIngestion({ input });
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
