import { logger } from "../../logger.js";
import type { Fetcher } from "../../fetcher.js";
import type { RawJob } from "../types.js";
import { getCompanyUrl } from "../company-urls.js";
import { runWithConcurrency, handleRateLimit } from "./concurrency.js";

const ASHBY_CONCURRENCY = 15;

export const ASHBY_BOARD_SLUGS = [
  // AI/ML Companies
  "openai",
  "anthropic",
  "scaleai",
  "databricks",
  "huggingface",
  "stabilityai",
  "cohere",
  "runway",
  "inflection",
  "character-ai",
  "jasper",
  "copy-ai",
  "groq",
  "together-ai",
  "fireworks-ai",
  "modal",
  "weightsandbiases",
  "snorkelai",

  // Big Tech / Scale
  "stripe",
  "figma",
  "notion",
  "discord",
  "reddit",
  "cloudflare",
  "twilio",
  "gitlab",
  "grafana",
  "elastic",
  "datadog",
  "snowflake",
  "hashicorp",
  "confluent",
  "mongodb",
  "splunk",
  "dynatrace",

  // Fintech
  "plaid",
  "square",
  "coinbase",
  "robinhood",
  "revolut",
  "wise",
  "nubank",
  "chime",
  "brex",
  "ramp",
  "carta",
  "deel",
  "remote",

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
  "asana",
  "canva",

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

  // Robotics / Hardware
  "nuro",
  "zoox",
  "waymo",
  "cruise",
  "figure",
  "apptronik",
];

interface AshbyCompensationComponent {
  compensationType: string;
  interval: string;
  minValue: number;
  maxValue: number;
  currencyCode: string;
}

interface AshbyCompensation {
  compensationTierSummary: string;
  scrapeableCompensationSalarySummary: string;
  summaryComponents: AshbyCompensationComponent[];
}

interface AshbyJob {
  id: string;
  title: string;
  location: string;
  secondaryLocations: Array<{ location: string }>;
  department: string;
  team: string;
  workplaceType: "OnSite" | "Remote" | "Hybrid";
  isRemote: boolean;
  employmentType: string;
  publishedAt: string;
  descriptionHtml: string;
  descriptionPlain: string;
  jobUrl: string;
  applyUrl: string;
  isListed: boolean;
  compensation?: AshbyCompensation;
}

interface AshbyResponse {
  apiVersion: string;
  jobs: AshbyJob[];
}

export async function fetchAshbyJobs(
  boardSlugs: string[] = ASHBY_BOARD_SLUGS,
  fetcher: Fetcher = fetch,
): Promise<RawJob[]> {
  const results: RawJob[] = [];

  await runWithConcurrency(boardSlugs, ASHBY_CONCURRENCY, async (slug) => {
    try {
      const response = await fetcher(
        `https://api.ashbyhq.com/posting-api/job-board/${slug}?includeCompensation=true`,
      );
      if (await handleRateLimit(response)) return;
      if (!response.ok) return;
      const data = (await response.json()) as AshbyResponse;
      for (const job of data.jobs ?? []) {
        if (!job.isListed) continue;

        const salary = job.compensation?.summaryComponents?.find(
          (c) => c.compensationType === "Salary",
        );

        const location =
          job.location ||
          job.secondaryLocations?.[0]?.location ||
          null;

        results.push({
          source: "ashby",
          externalId: job.id,
          company: slug,
          companyWebsite: getCompanyUrl(slug),
          title: job.title,
          department: job.department ?? job.team ?? null,
          employmentType: job.employmentType ?? null,
          location,
          remote:
            job.isRemote ||
            job.workplaceType === "Remote" ||
            /remote/i.test(location ?? ""),
          salaryMin: salary?.minValue ?? null,
          salaryMax: salary?.maxValue ?? null,
          salaryCurrency: salary?.currencyCode ?? null,
          description: job.descriptionPlain ?? job.descriptionHtml ?? "",
          applyUrl: job.applyUrl ?? job.jobUrl,
          postedDate: job.publishedAt ? new Date(job.publishedAt) : null,
        });
      }
    } catch (err) {
      logger.warn("Ashby adapter failed for board slug", {
        err: String(err),
        slug,
      });
    }
  });

  return results;
}
