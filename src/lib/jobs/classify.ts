import {
  AGENT_TOOLING,
  AI_FRAMEWORKS,
  AI_RELEVANCE_KEYWORDS,
  CLOUD_PROVIDERS,
  findMatches,
  LLM_TECH,
  PROGRAMMING_LANGUAGES,
  SENIORITY_PATTERNS,
  VECTOR_DBS,
  VISA_SPONSORSHIP_NEGATIVE,
  VISA_SPONSORSHIP_POSITIVE,
} from "./taxonomy.js";
import type { ClassifiedJob, RawJob } from "./types.js";
import { computeHash } from "./dedupe.js";

function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function stripHtml(html: string): string {
  let text = decodeEntities(html);
  text = text
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ");
  text = decodeEntities(text);
  return text.replace(/\s+/g, " ").trim();
}

function detectExperienceLevel(text: string, title: string): string | null {
  const haystack = `${title} ${text}`;
  for (const { level, patterns } of SENIORITY_PATTERNS) {
    if (patterns.some((p) => p.test(haystack))) {
      return level;
    }
  }
  return null;
}

function detectVisaSponsorship(text: string): boolean | null {
  if (VISA_SPONSORSHIP_NEGATIVE.some((p) => p.test(text))) return false;
  if (VISA_SPONSORSHIP_POSITIVE.some((p) => p.test(text))) return true;
  return null;
}

function detectEducation(text: string): string | null {
  if (/\bph\.?d\b/i.test(text)) return "PhD";
  if (/\bmaster'?s?\b/i.test(text)) return "Master's";
  if (/\bbachelor'?s?\b/i.test(text) || /\bb\.?s\.?\b/i.test(text))
    return "Bachelor's";
  if (/no degree required|degree not required/i.test(text))
    return "None required";
  return null;
}

function detectRemote(rawRemote: boolean | undefined, text: string): boolean {
  if (rawRemote) return true;
  if (/\bremote\b/i.test(text) && !/\bhybrid\b/i.test(text)) return true;
  return false;
}

function computeAiRelevanceScore(
  plainText: string,
  title: string,
  aiFrameworks: string[],
  llmTech: string[],
): number {
  const haystack = `${title} ${plainText}`.toLowerCase();
  const keywordHits = findMatches(haystack, AI_RELEVANCE_KEYWORDS).length;
  let score = keywordHits * 12 + aiFrameworks.length * 6 + llmTech.length * 6;
  if (
    /\b(ai|ml)\b/i.test(title) ||
    /machine learning|artificial intelligence/i.test(title)
  ) {
    score += 20;
  }
  return Math.max(0, Math.min(100, score));
}

function computeRemoteScore(remote: boolean, text: string): number {
  if (!remote) return 0;
  if (/fully remote|remote[- ]first|remote anywhere/i.test(text)) return 100;
  return 70;
}

function computeSalaryScore(
  min: number | null | undefined,
  max: number | null | undefined,
): number {
  const value = max ?? min;
  if (!value) return 0;
  return Math.max(0, Math.min(100, Math.round((value / 350000) * 100)));
}

function computeSkillDensityScore(totalSkillCount: number): number {
  return Math.max(0, Math.min(100, totalSkillCount * 8));
}

function computeCompanyQualityScore(rawJob: RawJob): number {
  let score = 40;
  if (rawJob.companyWebsite) score += 10;
  if (rawJob.salaryMin || rawJob.salaryMax) score += 20;
  if (rawJob.source === "greenhouse" || rawJob.source === "lever") score += 15;
  return Math.max(0, Math.min(100, score));
}

export function classifyJob(rawJob: RawJob): ClassifiedJob {
  const plainText = stripHtml(rawJob.description ?? "");
  const haystack = `${rawJob.title} ${plainText}`;

  const aiFrameworks = findMatches(haystack, AI_FRAMEWORKS);
  const llmTech = findMatches(haystack, LLM_TECH);
  const vectorDbs = findMatches(haystack, VECTOR_DBS);
  const agentTooling = findMatches(haystack, AGENT_TOOLING);
  const cloudProviders = findMatches(haystack, CLOUD_PROVIDERS);
  const languages = findMatches(haystack, PROGRAMMING_LANGUAGES);

  const skills = Array.from(new Set([...languages, ...aiFrameworks]));
  const remote = detectRemote(rawJob.remote, haystack);
  const totalSkillCount =
    skills.length +
    llmTech.length +
    vectorDbs.length +
    agentTooling.length +
    cloudProviders.length;

  const classified: ClassifiedJob = {
    ...rawJob,
    hash: computeHash(rawJob.company, rawJob.title, rawJob.location ?? ""),
    companyIndustry: null,
    skills,
    aiFrameworks,
    llmTech,
    vectorDbs,
    agentTooling,
    cloudProviders,
    educationRequirement: detectEducation(haystack),
    visaSponsorship: detectVisaSponsorship(haystack),
    experienceLevel: detectExperienceLevel(plainText, rawJob.title),
    remote,
    description: plainText,
    aiRelevanceScore: computeAiRelevanceScore(
      plainText,
      rawJob.title,
      aiFrameworks,
      llmTech,
    ),
    remoteScore: computeRemoteScore(remote, haystack),
    salaryScore: computeSalaryScore(rawJob.salaryMin, rawJob.salaryMax),
    skillDensityScore: computeSkillDensityScore(totalSkillCount),
    companyQualityScore: computeCompanyQualityScore(rawJob),
  };

  return classified;
}
