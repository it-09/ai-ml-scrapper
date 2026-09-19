import { describe, it, expect, vi, beforeEach } from "vitest";
import { BaseLlmProvider } from "./base-provider.js";

vi.mock("../retry.js", () => ({
  withRetry: vi.fn((fn: () => Promise<unknown>) => fn()),
  fetchWithTimeout: vi.fn(),
}));

vi.mock("./prompt.js", () => ({
  buildEnrichmentPrompt: vi.fn(() => "test prompt"),
}));

vi.mock("./parse.js", () => ({
  parseEnrichmentResponse: vi.fn(() => ({
    aiJobCategory: "ML Engineer",
    programmingLanguages: ["Python"],
    frameworks: [],
    llmTechnologies: [],
    mcpUsage: false,
    langchainUsage: false,
    langGraphUsage: false,
    vectorDatabases: [],
    cloudProviders: [],
    infrastructureTools: [],
    experienceLevelAI: "senior",
    salaryNormalizedUSD: null,
    visaSponsorshipAI: null,
    remoteConfidence: 50,
    employmentTypeAI: null,
    industry: null,
    jobSummary: null,
    skillImportance: {},
    aiConfidenceScore: 0,
    enrichedBy: "llm" as const,
  })),
}));

import { fetchWithTimeout } from "../retry.js";

const mockFetch = fetchWithTimeout as ReturnType<typeof vi.fn>;

function makeClassifiedJob() {
  return {
    hash: "abc123",
    externalId: "1",
    source: "greenhouse" as const,
    company: "TestCorp",
    companyWebsite: null,
    companyIndustry: null,
    title: "ML Engineer",
    department: null,
    employmentType: null,
    location: "Remote",
    remote: true,
    salaryMin: null,
    salaryMax: null,
    salaryCurrency: null,
    equity: null,
    skills: ["Python"],
    aiFrameworks: [],
    llmTech: [],
    vectorDbs: [],
    agentTooling: [],
    cloudProviders: [],
    educationRequirement: null,
    visaSponsorship: null,
    experienceLevel: null,
    description: "ML engineer role",
    applyUrl: "https://example.com",
    postedDate: null,
    aiRelevanceScore: 80,
    remoteScore: 80,
    salaryScore: 50,
    skillDensityScore: 70,
    companyQualityScore: 60,
    departmentScores: {},
  };
}

describe("BaseLlmProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.TEST_API_KEY = "test-key-123";
  });

  it("throws if API key env var is missing", () => {
    delete process.env.TEST_API_KEY;
    expect(
      () =>
        new BaseLlmProvider({
          name: "test",
          baseUrl: "https://api.test.com/v1",
          model: "test-model",
          apiKeyEnvVar: "TEST_API_KEY",
        }),
    ).toThrow("TEST_API_KEY environment variable is not set");
  });

  it("makes correct API request", async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ message: { content: '{"aiJobCategory":"ML Engineer"}' } }],
      }),
    };
    mockFetch.mockResolvedValue(mockResponse);

    const provider = new BaseLlmProvider({
      name: "test",
      baseUrl: "https://api.test.com/v1",
      model: "test-model",
      apiKeyEnvVar: "TEST_API_KEY",
    });

    const result = await provider.enrich(makeClassifiedJob());
    expect(result.aiJobCategory).toBe("ML Engineer");
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.test.com/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-key-123",
        }),
      }),
      expect.any(Number),
    );
  });

  it("includes extra headers when provided", async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ message: { content: '{"aiJobCategory":"Data Scientist"}' } }],
      }),
    };
    mockFetch.mockResolvedValue(mockResponse);

    const provider = new BaseLlmProvider({
      name: "test",
      baseUrl: "https://api.test.com/v1",
      model: "test-model",
      apiKeyEnvVar: "TEST_API_KEY",
      extraHeaders: { "X-Custom": "value" },
    });

    await provider.enrich(makeClassifiedJob());
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.test.com/v1/chat/completions",
      expect.objectContaining({
        headers: expect.objectContaining({ "X-Custom": "value" }),
      }),
      expect.any(Number),
    );
  });

  it("throws on non-OK response", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    });

    const provider = new BaseLlmProvider({
      name: "test",
      baseUrl: "https://api.test.com/v1",
      model: "test-model",
      apiKeyEnvVar: "TEST_API_KEY",
    });

    await expect(provider.enrich(makeClassifiedJob())).rejects.toThrow(
      "test API error: 500 Internal Server Error",
    );
  });
});
