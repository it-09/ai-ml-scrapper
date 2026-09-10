import { z } from "zod";
import type { AIEnrichment } from "./types.js";

const AIEnrichmentSchema = z
  .object({
    aiJobCategory: z.string().nullable().optional(),
    programmingLanguages: z.array(z.string()).optional(),
    frameworks: z.array(z.string()).optional(),
    llmTechnologies: z.array(z.string()).optional(),
    mcpUsage: z.boolean().optional(),
    langchainUsage: z.boolean().optional(),
    langGraphUsage: z.boolean().optional(),
    vectorDatabases: z.array(z.string()).optional(),
    cloudProviders: z.array(z.string()).optional(),
    infrastructureTools: z.array(z.string()).optional(),
    experienceLevelAI: z.string().nullable().optional(),
    salaryNormalizedUSD: z
      .object({
        min: z.number().nullable(),
        max: z.number().nullable(),
      })
      .nullable()
      .optional(),
    visaSponsorshipAI: z.boolean().nullable().optional(),
    remoteConfidence: z.number().min(0).max(100).optional(),
    employmentTypeAI: z.string().nullable().optional(),
    industry: z.string().nullable().optional(),
    jobSummary: z.string().nullable().optional(),
    skillImportance: z
      .record(z.enum(["must-have", "nice-to-have"]))
      .optional(),
    aiConfidenceScore: z.number().min(0).max(100).optional(),
  })
  .passthrough();

export function parseEnrichmentResponse(
  content: string,
  enrichedBy: "llm" | "deterministic",
): AIEnrichment {
  // Strip markdown code fences if present
  let cleaned = content.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.slice(0, -3);
  }
  cleaned = cleaned.trim();

  const raw: unknown = JSON.parse(cleaned);
  const result = AIEnrichmentSchema.safeParse(raw);

  if (!result.success) {
    throw new Error(`LLM response failed schema validation: ${result.error.message}`);
  }

  const d = result.data;

  return {
    aiJobCategory: d.aiJobCategory ?? null,
    programmingLanguages: d.programmingLanguages ?? [],
    frameworks: d.frameworks ?? [],
    llmTechnologies: d.llmTechnologies ?? [],
    mcpUsage: d.mcpUsage ?? false,
    langchainUsage: d.langchainUsage ?? false,
    langGraphUsage: d.langGraphUsage ?? false,
    vectorDatabases: d.vectorDatabases ?? [],
    cloudProviders: d.cloudProviders ?? [],
    infrastructureTools: d.infrastructureTools ?? [],
    experienceLevelAI: d.experienceLevelAI ?? null,
    salaryNormalizedUSD: d.salaryNormalizedUSD ?? null,
    visaSponsorshipAI: d.visaSponsorshipAI ?? null,
    remoteConfidence: d.remoteConfidence ?? 50,
    employmentTypeAI: d.employmentTypeAI ?? null,
    industry: d.industry ?? null,
    jobSummary: d.jobSummary ?? null,
    skillImportance: d.skillImportance ?? {},
    aiConfidenceScore: d.aiConfidenceScore ?? 0,
    enrichedBy,
  };
}
