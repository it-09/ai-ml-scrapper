import type { ClassifiedJob } from "../jobs/types.js";

const MAX_DESCRIPTION_CHARS = 2500;

export function buildEnrichmentPrompt(job: ClassifiedJob): string {
  const description = job.description.slice(0, MAX_DESCRIPTION_CHARS);
  return `You are an expert AI job market analyst. Analyze this job listing and return ONLY a valid JSON object — no markdown, no explanation, no code fences.

Job title: ${job.title}
Company: ${job.company}
Location: ${job.location ?? "Not specified"}
Salary: ${job.salaryMin ? `${job.salaryCurrency ?? "USD"} ${job.salaryMin}–${job.salaryMax}` : "Not specified"}
Description:
${description}

Return JSON with exactly these fields:
{
  "aiJobCategory": string or null — one of: "ML Engineer", "AI Research", "MLOps", "Data Scientist", "AI Product Manager", "AI Infrastructure", "AI Application Developer", "Computer Vision", "NLP Engineer", "AI Safety", "Other AI",
  "programmingLanguages": string[],
  "frameworks": string[],
  "llmTechnologies": string[],
  "mcpUsage": boolean,
  "langchainUsage": boolean,
  "langGraphUsage": boolean,
  "vectorDatabases": string[],
  "cloudProviders": string[],
  "infrastructureTools": string[],
  "experienceLevelAI": string or null — one of: "intern", "entry", "mid", "senior", "staff", "lead", "executive",
  "salaryNormalizedUSD": { "min": number or null, "max": number or null } or null,
  "visaSponsorshipAI": boolean or null,
  "remoteConfidence": number 0–100,
  "employmentTypeAI": string or null — e.g. "full-time", "contract", "part-time",
  "industry": string or null,
  "jobSummary": string — 2–3 sentence summary of the role,
  "skillImportance": object mapping skill names to "must-have" or "nice-to-have",
  "aiConfidenceScore": number 0–100 — how confident you are in your analysis
}`;
}
