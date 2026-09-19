import type { ClassifiedJob } from "../jobs/types.js";

export type ClassificationMode = "deterministic" | "hybrid" | "ai";
export type LlmProviderName = "groq" | "openrouter";

export interface AIEnrichment {
  aiJobCategory: string | null;
  programmingLanguages: string[];
  frameworks: string[];
  llmTechnologies: string[];
  mcpUsage: boolean;
  langchainUsage: boolean;
  langGraphUsage: boolean;
  vectorDatabases: string[];
  cloudProviders: string[];
  infrastructureTools: string[];
  experienceLevelAI: string | null;
  salaryNormalizedUSD: { min: number | null; max: number | null } | null;
  visaSponsorshipAI: boolean | null;
  remoteConfidence: number;
  employmentTypeAI: string | null;
  industry: string | null;
  jobSummary: string | null;
  skillImportance: Record<string, "must-have" | "nice-to-have">;
  aiConfidenceScore: number;
  enrichedBy: "deterministic" | "llm";
}

export interface AIProvider {
  readonly name: string;
  enrich(job: ClassifiedJob): Promise<AIEnrichment>;
}
