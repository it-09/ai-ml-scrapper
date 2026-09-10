import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ApifyInput } from "../input-schema.js";
import type { ClassifiedJob } from "../jobs/types.js";
import type { AIEnrichment } from "./types.js";

vi.mock("apify", () => ({
  log: {
    info: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
  Actor: {
    charge: vi.fn().mockResolvedValue({ eventChargeLimitReached: false }),
  },
}));

const mockEnrichment: AIEnrichment = {
  aiJobCategory: "ML Engineer",
  programmingLanguages: ["Python"],
  frameworks: ["PyTorch"],
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
  remoteConfidence: 80,
  employmentTypeAI: "full-time",
  industry: "Technology",
  jobSummary: "ML Engineer role",
  skillImportance: { Python: "must-have" },
  aiConfidenceScore: 75,
  enrichedBy: "llm",
};

const mockEnrichFn = vi.fn();

vi.mock("./groq-provider.js", () => ({
  GroqProvider: vi.fn().mockImplementation(() => ({
    enrich: mockEnrichFn,
  })),
}));

vi.mock("./openrouter-provider.js", () => ({
  OpenRouterProvider: vi.fn().mockImplementation(() => ({
    enrich: mockEnrichFn,
  })),
}));

import { createEnricher } from "./enrichment.js";

function makeClassifiedJob(
  overrides: Partial<ClassifiedJob> = {},
): ClassifiedJob {
  return {
    source: "greenhouse",
    externalId: "1",
    company: "TestCorp",
    title: "ML Engineer",
    description: "Build AI systems with Python",
    applyUrl: "https://example.com",
    postedDate: null,
    hash: "abc123",
    companyIndustry: null,
    skills: ["Python"],
    aiFrameworks: ["PyTorch"],
    llmTech: [],
    vectorDbs: [],
    agentTooling: [],
    cloudProviders: [],
    educationRequirement: null,
    visaSponsorship: null,
    experienceLevel: "senior",
    remote: true,
    aiRelevanceScore: 50,
    remoteScore: 70,
    salaryScore: 0,
    skillDensityScore: 20,
    companyQualityScore: 40,
    ...overrides,
  };
}

function makeInput(overrides: Partial<ApifyInput> = {}): ApifyInput {
  return {
    sources: ["greenhouse"],
    keywords: [],
    companies: [],
    experienceLevels: [],
    customGreenhouseTokens: [],
    customLeverSlugs: [],
    parseAllResults: false,
    classifyWithAI: true,
    classificationMode: "hybrid",
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

describe("createEnricher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEnrichFn.mockResolvedValue(mockEnrichment);
    delete process.env.GROQ_API_KEY;
    delete process.env.OPENROUTER_API_KEY;
  });

  it("returns null enricher when classifyWithAI is false", async () => {
    const input = makeInput({ classifyWithAI: false });
    const enricher = createEnricher(input);
    const job = makeClassifiedJob();
    const result = await enricher(job);
    expect(result).toBeNull();
  });

  it("returns null enricher when classificationMode is deterministic", async () => {
    const input = makeInput({ classificationMode: "deterministic" });
    const enricher = createEnricher(input);
    const job = makeClassifiedJob();
    const result = await enricher(job);
    expect(result).toBeNull();
  });

  it("returns null enricher when API key is missing", async () => {
    const input = makeInput({ llmProvider: "groq" });
    const enricher = createEnricher(input);
    const job = makeClassifiedJob();
    const result = await enricher(job);
    expect(result).toBeNull();
  });

  it("skips high-confidence jobs in hybrid mode", async () => {
    process.env.GROQ_API_KEY = "test-key";
    const input = makeInput({ classificationMode: "hybrid" });
    const enricher = createEnricher(input);

    const highConfidenceJob = makeClassifiedJob({
      aiRelevanceScore: 50,
      skills: ["Python"],
      aiFrameworks: ["PyTorch"],
      experienceLevel: "senior",
    });

    const result = await enricher(highConfidenceJob);
    expect(result).toBeNull();
  });

  it("enriches low-confidence jobs in hybrid mode", async () => {
    process.env.GROQ_API_KEY = "test-key";

    const input = makeInput({ classificationMode: "hybrid" });
    const enricher = createEnricher(input);

    const lowConfidenceJob = makeClassifiedJob({
      aiRelevanceScore: 5,
      skills: [],
      aiFrameworks: [],
      experienceLevel: null,
    });

    const result = await enricher(lowConfidenceJob);
    expect(result).toEqual(mockEnrichment);
    expect(mockEnrichFn).toHaveBeenCalledWith(lowConfidenceJob);
  });

  it("enriches all jobs in ai mode", async () => {
    process.env.GROQ_API_KEY = "test-key";

    const input = makeInput({ classificationMode: "ai" });
    const enricher = createEnricher(input);

    const highConfJob = makeClassifiedJob({
      aiRelevanceScore: 80,
      skills: ["Python"],
      aiFrameworks: ["PyTorch"],
      experienceLevel: "senior",
    });

    const result = await enricher(highConfJob);
    expect(result).toEqual(mockEnrichment);
    expect(mockEnrichFn).toHaveBeenCalledWith(highConfJob);
  });

  it("returns null when provider initialization fails", async () => {
    delete process.env.GROQ_API_KEY;
    delete process.env.OPENROUTER_API_KEY;
    const input = makeInput({ llmProvider: "openrouter" });
    const enricher = createEnricher(input);
    const job = makeClassifiedJob();
    const result = await enricher(job);
    expect(result).toBeNull();
  });
});
