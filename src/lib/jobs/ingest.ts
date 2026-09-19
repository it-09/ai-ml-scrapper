import { Actor, log } from "apify";
import { randomUUID } from "crypto";
import { classifyJob } from "./classify.js";
import { adapterRegistry } from "./adapters/registry.js";
import { createEnricher } from "../ai/enrichment.js";
import { createFetcher, type Fetcher } from "../fetcher.js";
import { withRetry } from "../retry.js";
import type { ApifyInput } from "../input-schema.js";
import type { ClassifiedJob, SourceName } from "./types.js";
import type { AIEnrichment } from "../ai/types.js";

export type { SourceName };

const BATCH_SIZE = 100;
const AI_CONCURRENCY = 5;
const MEMORY_WARNING_THRESHOLD_MB = 400;
const MAX_RUNTIME_SECONDS = 240;

export interface IngestionSummary {
  runId: string;
  jobsFound: number;
  jobsNew: number;
  jobsUpdated: number;
  jobsRemoved: number;
  jobsFiltered: number;
  jobsOutput: number;
  startedAt: string;
  completedAt: string;
  sources: SourceName[];
}

export interface AnalyticsSummary {
  totalJobs: number;
  topCompanies: Array<{ name: string; count: number }>;
  topSkills: Array<{ skill: string; count: number }>;
  salaryRanges: { min: number; max: number; median: number } | null;
  remotePercentage: number;
  sourceBreakdown: Record<string, number>;
  experienceLevelBreakdown: Record<string, number>;
  averageAiRelevanceScore: number;
}

interface StateEntry {
  hash: string;
  company: string;
  title: string;
  sources: string[];
  firstSeen: string;
  lastSeen: string;
  status: "active" | "removed";
}

type StateMap = Record<string, StateEntry>;

const STATE_KEY = "STATE";
const ANALYTICS_KEY = "ANALYTICS";
const MIN_AI_RELEVANCE_SCORE = 8;

function getMemoryUsageMB(): number {
  const mem = process.memoryUsage();
  return Math.round(mem.heapUsed / 1024 / 1024);
}

function checkMemory(): boolean {
  const usedMB = getMemoryUsageMB();
  if (usedMB > MEMORY_WARNING_THRESHOLD_MB) {
    log.warning("High memory usage detected", { usedMB, threshold: MEMORY_WARNING_THRESHOLD_MB });
    return false;
  }
  return true;
}

type Tier = "free" | "starter" | "pro" | "enterprise";

const TIER_LIMITS: Record<Tier, number> = {
  free: 100,
  starter: 500,
  pro: 2000,
  enterprise: 10000,
};

const TIER_SOURCES: Record<Tier, SourceName[]> = {
  free: ["greenhouse", "remoteok"],
  starter: ["greenhouse", "lever", "remoteok", "weworkremotely", "yc", "otta", "ashby"],
  pro: ["greenhouse", "lever", "remoteok", "weworkremotely", "yc", "otta", "ashby"],
  enterprise: ["greenhouse", "lever", "remoteok", "weworkremotely", "yc", "otta", "ashby"],
};

async function fetchSourceJobs(
  source: SourceName,
  fetcher: Fetcher,
  input: ApifyInput,
): Promise<ClassifiedJob[]> {
  const adapter = adapterRegistry[source];
  if (!adapter) {
    throw new Error(`Unknown source: ${source}`);
  }
  const rawJobs = await adapter.fetch({
    fetcher,
    customGreenhouseTokens: input.customGreenhouseTokens,
    customLeverSlugs: input.customLeverSlugs,
    customAshbySlugs: input.customAshbySlugs,
    customOttaSlugs: input.customOttaSlugs,
  });
  return rawJobs.map(classifyJob);
}

function applyFilters(
  jobs: ClassifiedJob[],
  input: ApifyInput,
): ClassifiedJob[] {
  let result = jobs;

  if (input.keywords.length > 0) {
    const kwLower = input.keywords.map((k) => k.toLowerCase());
    result = result.filter((j) => {
      const haystack = `${j.title} ${j.description}`.toLowerCase();
      return kwLower.some((kw) => haystack.includes(kw));
    });
  }

  if (input.companies.length > 0) {
    const compLower = input.companies.map((c) => c.toLowerCase());
    result = result.filter((j) =>
      compLower.some(
        (c) =>
          j.company.toLowerCase().includes(c) ||
          (c.length >= 3 && c.includes(j.company.toLowerCase())),
      ),
    );
  }

  if (input.experienceLevels.length > 0) {
    result = result.filter(
      (j) =>
        j.experienceLevel !== null &&
        input.experienceLevels.includes(
          j.experienceLevel as (typeof input.experienceLevels)[number],
        ),
    );
  }

  return result;
}

function computeAnalytics(jobs: ClassifiedJob[]): AnalyticsSummary {
  const companyCounts = new Map<string, number>();
  const skillCounts = new Map<string, number>();
  const salaries: number[] = [];
  let remoteCount = 0;
  const sourceCounts = new Map<string, number>();
  const experienceCounts = new Map<string, number>();
  let totalAiScore = 0;

  for (const job of jobs) {
    // Company counts
    companyCounts.set(job.company, (companyCounts.get(job.company) ?? 0) + 1);

    // Skill counts
    for (const skill of job.skills) {
      skillCounts.set(skill, (skillCounts.get(skill) ?? 0) + 1);
    }
    for (const fw of job.aiFrameworks) {
      skillCounts.set(fw, (skillCounts.get(fw) ?? 0) + 1);
    }

    // Salary
    if (job.salaryMax) salaries.push(job.salaryMax);
    else if (job.salaryMin) salaries.push(job.salaryMin);

    // Remote
    if (job.remote) remoteCount++;

    // Source
    sourceCounts.set(
      job.source,
      (sourceCounts.get(job.source) ?? 0) + 1,
    );

    // Experience
    const level = job.experienceLevel ?? "unknown";
    experienceCounts.set(level, (experienceCounts.get(level) ?? 0) + 1);

    // AI score
    totalAiScore += job.aiRelevanceScore;
  }

  const sortedCompanies = Array.from(companyCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([name, count]) => ({ name, count }));

  const sortedSkills = Array.from(skillCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([skill, count]) => ({ skill, count }));

  const salaryRanges =
    salaries.length > 0
      ? {
          min: Math.min(...salaries),
          max: Math.max(...salaries),
          median: [...salaries].sort((a, b) => a - b)[
            Math.floor(salaries.length / 2)
          ],
        }
      : null;

  const sourceBreakdown: Record<string, number> = {};
  for (const [source, count] of sourceCounts) {
    sourceBreakdown[source] = count;
  }

  const experienceLevelBreakdown: Record<string, number> = {};
  for (const [level, count] of experienceCounts) {
    experienceLevelBreakdown[level] = count;
  }

  return {
    totalJobs: jobs.length,
    topCompanies: sortedCompanies,
    topSkills: sortedSkills,
    salaryRanges,
    remotePercentage:
      jobs.length > 0 ? Math.round((remoteCount / jobs.length) * 100) : 0,
    sourceBreakdown,
    experienceLevelBreakdown,
    averageAiRelevanceScore:
      jobs.length > 0 ? Math.round(totalAiScore / jobs.length) : 0,
  };
}

function isPrivateUrl(url: string): boolean {
  try {
    const hostname = new URL(url).hostname;
    return /^(localhost|127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|192\.168\.\d+\.\d+|169\.254\.\d+\.\d+)$/i.test(hostname);
  } catch {
    return true;
  }
}

async function sendWebhook(
  webhookUrl: string,
  job: ClassifiedJob,
  alertKeywords: string[],
  alertMinSalary: number,
): Promise<void> {
  if (isPrivateUrl(webhookUrl)) {
    log.warning("Webhook URL points to private network — skipping", { url: webhookUrl });
    return;
  }

  const matchesKeywords =
    alertKeywords.length === 0 ||
    alertKeywords.some((kw) => {
      const haystack = `${job.title} ${job.description}`.toLowerCase();
      return haystack.includes(kw.toLowerCase());
    });

  const matchesSalary =
    alertMinSalary === 0 ||
    (job.salaryMax !== null && job.salaryMax !== undefined && job.salaryMax >= alertMinSalary) ||
    (job.salaryMin !== null && job.salaryMin !== undefined && job.salaryMin >= alertMinSalary);

  if (!matchesKeywords || !matchesSalary) return;

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `New AI Job: ${job.title} at ${job.company}`,
        job: {
          title: job.title,
          company: job.company,
          location: job.location,
          remote: job.remote,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
          skills: job.skills,
          aiFrameworks: job.aiFrameworks,
          experienceLevel: job.experienceLevel,
          applyUrl: job.applyUrl,
          source: job.source,
        },
      }),
    });
  } catch (err) {
    log.warning("Webhook delivery failed", { err: String(err) });
  }
}

function buildOutputRecord(
  job: ClassifiedJob,
  meta: {
    aiEnrichment: AIEnrichment | null;
    changeType: "created" | "updated" | "unchanged";
    firstSeen: string;
    lastSeen: string;
    runId: string;
  },
): Record<string, unknown> {
  return {
    hash: job.hash,
    externalId: job.externalId,
    source: job.source,
    company: job.company,
    companyWebsite: job.companyWebsite ?? null,
    companyIndustry: job.companyIndustry,
    title: job.title,
    department: job.department ?? null,
    employmentType: job.employmentType ?? null,
    location: job.location ?? null,
    remote: job.remote,
    salaryMin: job.salaryMin ?? null,
    salaryMax: job.salaryMax ?? null,
    salaryCurrency: job.salaryCurrency ?? null,
    equity: job.equity ?? null,
    skills: job.skills,
    aiFrameworks: job.aiFrameworks,
    llmTech: job.llmTech,
    vectorDbs: job.vectorDbs,
    agentTooling: job.agentTooling,
    cloudProviders: job.cloudProviders,
    educationRequirement: job.educationRequirement,
    visaSponsorship: job.visaSponsorship,
    experienceLevel: job.experienceLevel,
    description: job.description,
    applyUrl: job.applyUrl,
    postedDate: job.postedDate?.toISOString() ?? null,
    aiRelevanceScore: job.aiRelevanceScore,
    remoteScore: job.remoteScore,
    salaryScore: job.salaryScore,
    skillDensityScore: job.skillDensityScore,
    companyQualityScore: job.companyQualityScore,
    aiEnrichment: meta.aiEnrichment,
    classificationSource: meta.aiEnrichment?.enrichedBy ?? "deterministic",
    changeType: meta.changeType,
    firstSeen: meta.firstSeen,
    lastSeen: meta.lastSeen,
    runId: meta.runId,
    scrapedAt: new Date().toISOString(),
  };
}

export async function runIngestion(options: {
  input: ApifyInput;
  proxyUrl?: string;
}): Promise<IngestionSummary> {
  const { input, proxyUrl } = options;
  const startedAt = new Date().toISOString();
  const runId = `run-${Date.now()}-${randomUUID().slice(0, 8)}`;
  const fetcher = createFetcher(proxyUrl);

  // Apply tier limits
  const tierMaxItems = TIER_LIMITS[input.tier] ?? input.maxItems;
  let effectiveMaxItems = input.parseAllResults
    ? tierMaxItems
    : Math.min(input.maxItems, tierMaxItems);
  if (input.parseAllResults) {
    log.info("parseAllResults enabled — capped at tier limit", {
      tier: input.tier,
      maxItems: effectiveMaxItems,
    });
  }
  const tierSources = TIER_SOURCES[input.tier] ?? input.sources;
  const effectiveSources = input.sources.filter((s) =>
    tierSources.includes(s),
  ) as SourceName[];

  let kv: Awaited<ReturnType<typeof Actor.openKeyValueStore>> | null = null;
  try {
    kv = await withRetry(() => Actor.openKeyValueStore(), {
      maxAttempts: 3,
      baseDelayMs: 1000,
    });
  } catch (err) {
    log.warning("Failed to open KeyValueStore after retries — running without state persistence", {
      err: String(err),
    });
  }
  const previousState: StateMap =
    input.detectChanges && kv
      ? ((await kv.getValue<StateMap>(STATE_KEY)) ?? {})
      : {};
  const currentState: StateMap = {};

  log.info("Starting ingestion run", {
    runId,
    sources: effectiveSources,
    maxItems: effectiveMaxItems,
    tier: input.tier,
    detectChanges: input.detectChanges,
    classificationMode: input.classificationMode,
  });

  await Actor.setStatusMessage("Fetching and processing jobs from sources...");

  // Process sources sequentially to reduce peak memory usage
  // Each source's results are flushed to dataset before fetching the next
  const seenHashes = new Set<string>();
  const enricher = createEnricher(input);
  let dataset: Awaited<ReturnType<typeof Actor.openDataset>> | null = null;
  try {
    dataset = await withRetry(() => Actor.openDataset(), {
      maxAttempts: 3,
      baseDelayMs: 1000,
    });
  } catch (err) {
    log.warning("Failed to open Dataset after retries — running without output persistence", {
      err: String(err),
    });
  }

  let jobsNew = 0;
  let jobsUpdated = 0;
  let jobsOutput = 0;
  let totalFound = 0;
  let jobsFiltered = 0;
  const outputJobs: ClassifiedJob[] = [];
  let processedCount = 0;
  const startTime = Date.now();
  const buffer: Record<string, unknown>[] = [];

  for (const source of effectiveSources) {
    const elapsedSeconds = (Date.now() - startTime) / 1000;
    if (elapsedSeconds > MAX_RUNTIME_SECONDS) {
      log.warning("Approaching runtime limit — stopping source fetching", {
        elapsed: Math.round(elapsedSeconds),
        source,
      });
      break;
    }

    await Actor.setStatusMessage(`Fetching ${source}...`);

    let rawJobs: ClassifiedJob[];
    try {
      rawJobs = await withRetry(
        () =>
          fetchSourceJobs(
            source,
            fetcher,
            input,
          ),
        { maxAttempts: 3, baseDelayMs: 1500 },
      );
    } catch (err) {
      log.warning(`Source ${source} failed after all retries — skipping`, {
        err: String(err),
      });
      continue;
    }

    log.info(`Source ${source} fetched`, { count: rawJobs.length });
    totalFound += rawJobs.length;

    // Apply AI relevance filter
    const relevant = rawJobs.filter(
      (j) => j.aiRelevanceScore >= MIN_AI_RELEVANCE_SCORE,
    );
    jobsFiltered += rawJobs.length - relevant.length;

    // Apply user filters
    const afterFilters = applyFilters(relevant, input);

    // Deduplicate within source and across previous sources
    const unique: ClassifiedJob[] = [];
    for (const job of afterFilters) {
      if (!seenHashes.has(job.hash)) {
        seenHashes.add(job.hash);
        unique.push(job);
      }
    }

    log.info(`Source ${source} after filters`, {
      raw: rawJobs.length,
      relevant: relevant.length,
      filtered: afterFilters.length,
      unique: unique.length,
    });

    // Process and stream to dataset
    for (const job of unique) {
      const elapsedSeconds2 = (Date.now() - startTime) / 1000;
      if (elapsedSeconds2 > MAX_RUNTIME_SECONDS) {
        log.warning("Approaching runtime limit — stopping processing", {
          elapsed: Math.round(elapsedSeconds2),
          processed: processedCount,
        });
        break;
      }

      if (processedCount % 100 === 0 && !checkMemory()) {
        log.warning("Memory limit reached — flushing buffer", {});
        if (buffer.length > 0 && dataset) {
          try {
            await dataset.pushData(buffer);
            jobsOutput += buffer.length;
          } catch (err) {
            log.warning("Failed to push batch to dataset", { err: String(err) });
          }
          try {
            await Actor.charge({ eventName: "apify-default-dataset-item", count: buffer.length });
          } catch (err) {
            log.warning("Dataset item charge failed", { err: String(err) });
          }
          buffer.length = 0;
        }
      }

      try {
        const previous = previousState[job.hash];
        let changeType: "created" | "updated" | "unchanged";
        const now = new Date().toISOString();

        if (!previous || previous.status === "removed") {
          changeType = "created";
        } else if (previous.title !== job.title) {
          changeType = "updated";
        } else {
          changeType = "unchanged";
        }

        const aiEnrichment = await enricher(job);

        const record = buildOutputRecord(job, {
          aiEnrichment,
          changeType,
          firstSeen: previous?.firstSeen ?? now,
          lastSeen: now,
          runId,
        });

        if (
          changeType === "created" &&
          input.webhookUrl &&
          (input.alertKeywords.length > 0 || input.alertMinSalary > 0)
        ) {
          await sendWebhook(
            input.webhookUrl,
            job,
            input.alertKeywords,
            input.alertMinSalary,
          );
        }

        currentState[job.hash] = {
          hash: job.hash,
          company: job.company,
          title: job.title,
          sources: [job.source],
          firstSeen: previous?.firstSeen ?? now,
          lastSeen: now,
          status: "active",
        };

        if (changeType === "created") jobsNew++;
        else if (changeType === "updated") jobsUpdated++;

        outputJobs.push(job);
        buffer.push(record);

        if (buffer.length >= BATCH_SIZE && dataset) {
          try {
            await dataset.pushData(buffer);
            jobsOutput += buffer.length;
          } catch (err) {
            log.warning("Failed to push batch to dataset", { err: String(err) });
          }
          try {
            await Actor.charge({ eventName: "apify-default-dataset-item", count: buffer.length });
          } catch (err) {
            log.warning("Dataset item charge failed", { err: String(err) });
          }
          buffer.length = 0;
        }

        processedCount++;
        if (processedCount % 50 === 0) {
          await Actor.setStatusMessage(`Processing jobs: ${processedCount} (${jobsNew} new, ${jobsUpdated} updated)`);
        }
      } catch (err) {
        log.warning("Failed to process job", { err: String(err), company: job.company, title: job.title });
        processedCount++;
      }
    }
  }

  // Flush remaining buffer
  if (buffer.length > 0 && dataset) {
    try {
      await dataset.pushData(buffer);
      jobsOutput += buffer.length;
    } catch (err) {
      log.warning("Failed to push final batch to dataset", { err: String(err) });
    }
    try {
      await Actor.charge({ eventName: "apify-default-dataset-item", count: buffer.length });
    } catch (err) {
      log.warning("Dataset item charge failed", { err: String(err) });
    }
  }

  if (!dataset) {
    log.warning("Dataset unavailable — skipping output persistence", { recordsSkipped: processedCount });
  }

  await Actor.setStatusMessage("Saving state and analytics...");

  let jobsRemoved = 0;
  if (input.detectChanges) {
    const requestedSources = new Set<string>(effectiveSources);
    for (const [hash, entry] of Object.entries(previousState)) {
      if (currentState[hash]) continue;

      const coveredByThisRun = entry.sources.every((s) =>
        requestedSources.has(s),
      );

      if (entry.status === "active" && coveredByThisRun) {
        jobsRemoved++;
        currentState[hash] = {
          ...entry,
          status: "removed",
          lastSeen: new Date().toISOString(),
        };
      } else {
        currentState[hash] = entry;
      }
    }

    if (kv) {
      try {
        await kv.setValue(STATE_KEY, currentState);
        log.info("State persisted to KeyValueStore", {
          totalTracked: Object.keys(currentState).length,
        });
      } catch (err) {
        log.warning("Failed to persist state to KeyValueStore", { err: String(err) });
      }
    } else {
      log.warning("KV unavailable — skipping state persistence", {
        totalTracked: Object.keys(currentState).length,
      });
    }
  }

  // Compute and save analytics
  const analytics = computeAnalytics(outputJobs);
  if (kv) {
    try {
      await kv.setValue(ANALYTICS_KEY, {
        ...analytics,
        runId,
        timestamp: new Date().toISOString(),
      });
      log.info("Analytics summary saved", {
        totalJobs: analytics.totalJobs,
        topCompanies: analytics.topCompanies.slice(0, 5).map((c) => c.name),
        remotePercentage: analytics.remotePercentage,
      });
    } catch (err) {
      log.warning("Failed to save analytics to KeyValueStore", { err: String(err) });
    }
  }

  const summary: IngestionSummary = {
    runId,
    jobsFound: totalFound,
    jobsNew,
    jobsUpdated,
    jobsRemoved,
    jobsFiltered,
    jobsOutput,
    startedAt,
    completedAt: new Date().toISOString(),
    sources: effectiveSources,
  };

  await Actor.setStatusMessage(`Completed: ${jobsOutput} jobs output (${jobsNew} new, ${jobsUpdated} updated, ${jobsRemoved} removed)`);
  log.info("Ingestion complete", summary);
  return summary;
}
