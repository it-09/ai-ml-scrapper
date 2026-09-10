import { logger } from "../../logger.js";
import type { Fetcher } from "../../fetcher.js";
import type { RawJob } from "../types.js";
import { getCompanyUrl } from "../company-urls.js";
import { runWithConcurrency, handleRateLimit } from "./concurrency.js";

const OTTA_CONCURRENCY = 15;

export const OTTA_COMPANY_SLUGS = [
  // AI/ML Companies
  "stripe",
  "monzo",
  "anthropic",
  "revolut",
  "anduril",
  "checkout",
  "n26",
  "wise",
  "deliveroo",

  // Big Tech / Scale
  "spotify",
  "notion",
  "figma",
  "discord",
  "reddit",
  "cloudflare",
  "gitlab",
  "datadog",
  "snowflake",
  "hashicorp",
  "mongodb",

  // Fintech
  "plaid",
  "brex",
  "ramp",
  "carta",
  "deel",
  "remote",
  "nubank",
  "chime",
  "coinbase",
  "robinhood",

  // DevTools / Infrastructure
  "vercel",
  "netlify",
  "supabase",
  "railway",
  "postman",
  "snyk",
  "linear",
  "height",
  "shortcut",
  "miro",
  "loom",
  "calendly",
  "airtable",
  "canva",
  "asana",

  // SaaS / Enterprise
  "rippling",
  "segment",
  "amplitude",
  "mixpanel",
  "fullstory",
  "hotjar",
  "clari",
  "hubspot",
  "salesforce",
];

interface OttaRequirement {
  value: string;
  isDesirable: boolean;
}

interface OttaJob {
  id: string;
  title: string;
  subtitle: string;
  functionName: string;
  subFunctionName: string;
  companyName: string;
  companyAlias: string;
  salaryMin: number;
  salaryMax: number;
  salaryCurrency: string;
  oteSalaryMin: number;
  oteSalaryMax: number;
  minYearsExperience: number;
  maxYearsExperience: number;
  locations: string[];
  locationCodes: string[];
  remoteOnly: boolean;
  minDaysInOffice: number;
  maxDaysInOffice: number;
  technologies: string[];
  involves: string[];
  requirements: OttaRequirement[];
  applyUrl: string;
  url: string;
  jobExternalId: string;
  firstLiveAt: string;
  lastSeen: string;
  daysSincePosted: number;
  activelyHiring: boolean;
}

interface OttaResponse {
  results: OttaJob[];
}

export async function fetchOttaJobs(
  companySlugs: string[] = OTTA_COMPANY_SLUGS,
  fetcher: Fetcher = fetch,
): Promise<RawJob[]> {
  const results: RawJob[] = [];

  await runWithConcurrency(companySlugs, OTTA_CONCURRENCY, async (slug) => {
    try {
      const response = await fetcher(
        `https://app.welcometothejungle.com/api/v1/companies/${slug}/jobs`,
      );
      if (await handleRateLimit(response)) return;
      if (!response.ok) return;
      const data = (await response.json()) as OttaResponse;
      for (const job of data.results ?? []) {
        const location = job.locations?.[0] ?? null;
        results.push({
          source: "otta",
          externalId: job.jobExternalId ?? job.id,
          company: job.companyName ?? slug,
          companyWebsite: getCompanyUrl(slug),
          title: job.title,
          department: job.functionName ?? null,
          employmentType: null,
          location,
          remote:
            job.remoteOnly ||
            /remote/i.test(location ?? ""),
          salaryMin: job.salaryMin ?? null,
          salaryMax: job.salaryMax ?? null,
          salaryCurrency: job.salaryCurrency ?? null,
          description: job.involves?.join("\n") ?? "",
          applyUrl: job.applyUrl ?? job.url,
          postedDate: job.firstLiveAt ? new Date(job.firstLiveAt) : null,
        });
      }
    } catch (err) {
      logger.warn("Otta adapter failed for company slug", {
        err: String(err),
        slug,
      });
    }
  });

  return results;
}
