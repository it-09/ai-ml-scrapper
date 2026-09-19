import { describe, it, expect } from "vitest";
import { parseEnrichmentResponse } from "./parse.js";

describe("parseEnrichmentResponse", () => {
  it("parses a complete valid JSON response", () => {
    const json = JSON.stringify({
      aiJobCategory: "ML Engineer",
      programmingLanguages: ["Python", "TypeScript"],
      frameworks: ["PyTorch"],
      llmTechnologies: ["GPT-4", "RAG"],
      mcpUsage: true,
      langchainUsage: false,
      langGraphUsage: false,
      vectorDatabases: ["Pinecone"],
      cloudProviders: ["AWS"],
      infrastructureTools: ["Docker"],
      experienceLevelAI: "senior",
      salaryNormalizedUSD: { min: 150000, max: 200000 },
      visaSponsorshipAI: true,
      remoteConfidence: 90,
      employmentTypeAI: "full-time",
      industry: "Technology",
      jobSummary: "Senior ML Engineer role",
      skillImportance: { Python: "must-have", PyTorch: "nice-to-have" },
      aiConfidenceScore: 85,
    });

    const result = parseEnrichmentResponse(json, "llm");
    expect(result.aiJobCategory).toBe("ML Engineer");
    expect(result.programmingLanguages).toEqual(["Python", "TypeScript"]);
    expect(result.frameworks).toEqual(["PyTorch"]);
    expect(result.mcpUsage).toBe(true);
    expect(result.salaryNormalizedUSD).toEqual({ min: 150000, max: 200000 });
    expect(result.remoteConfidence).toBe(90);
    expect(result.aiConfidenceScore).toBe(85);
    expect(result.enrichedBy).toBe("llm");
  });

  it("fills defaults for missing optional fields", () => {
    const json = JSON.stringify({});
    const result = parseEnrichmentResponse(json, "deterministic");
    expect(result.aiJobCategory).toBeNull();
    expect(result.programmingLanguages).toEqual([]);
    expect(result.frameworks).toEqual([]);
    expect(result.mcpUsage).toBe(false);
    expect(result.remoteConfidence).toBe(50);
    expect(result.aiConfidenceScore).toBe(0);
    expect(result.enrichedBy).toBe("deterministic");
  });

  it("throws on invalid JSON", () => {
    expect(() => parseEnrichmentResponse("not json", "llm")).toThrow();
  });

  it("throws on JSON that fails schema validation", () => {
    const json = JSON.stringify({ remoteConfidence: 200 });
    expect(() => parseEnrichmentResponse(json, "llm")).toThrow();
  });

  it("passes through extra fields (passthrough)", () => {
    const json = JSON.stringify({
      customField: "value",
      anotherField: 42,
    });
    const result = parseEnrichmentResponse(json, "llm");
    expect(result).toHaveProperty("enrichedBy", "llm");
  });

  it("handles null salaryNormalizedUSD", () => {
    const json = JSON.stringify({ salaryNormalizedUSD: null });
    const result = parseEnrichmentResponse(json, "llm");
    expect(result.salaryNormalizedUSD).toBeNull();
  });

  it("handles null visaSponsorshipAI", () => {
    const json = JSON.stringify({ visaSponsorshipAI: null });
    const result = parseEnrichmentResponse(json, "llm");
    expect(result.visaSponsorshipAI).toBeNull();
  });

  it("clamps remoteConfidence to 0-100", () => {
    const json = JSON.stringify({ remoteConfidence: 150 });
    expect(() => parseEnrichmentResponse(json, "llm")).toThrow();
  });

  it("strips ```json code fences", () => {
    const json = JSON.stringify({ aiJobCategory: "ML Engineer" });
    const fenced = "```json\n" + json + "\n```";
    const result = parseEnrichmentResponse(fenced, "llm");
    expect(result.aiJobCategory).toBe("ML Engineer");
  });

  it("strips ``` code fences without language tag", () => {
    const json = JSON.stringify({ aiJobCategory: "Data Scientist" });
    const fenced = "```\n" + json + "\n```";
    const result = parseEnrichmentResponse(fenced, "llm");
    expect(result.aiJobCategory).toBe("Data Scientist");
  });

  it("handles already-clean JSON without fences", () => {
    const json = JSON.stringify({ aiJobCategory: "MLOps" });
    const result = parseEnrichmentResponse(json, "llm");
    expect(result.aiJobCategory).toBe("MLOps");
  });
});
