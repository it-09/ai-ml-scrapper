import { logger } from "../../logger.js";
import type { Fetcher } from "../../fetcher.js";
import type { RawJob } from "../types.js";
import { getCompanyUrl } from "../company-urls.js";
import { runWithConcurrency, handleRateLimit } from "./concurrency.js";

const LEVER_CONCURRENCY = 15;

export const LEVER_COMPANY_SLUGS = [
  // Entertainment / Media
  "netflix",
  "spotify",
  "disney",
  "hulu",
  "hbo",
  "paramount",
  "peacock",
  "roku",
  "twitch",
  "vimeo",
  "reddit",
  "quora",
  "medium",
  "substack",

  // AI / ML
  "palantir",
  "scale-ai",
  "Weights-Biases",
  "Cohere",
  "Stability-AI",
  "Runway",
  "Jasper",
  "Copy.ai",
  "Character.ai",
  "Inflection",

  // Fintech
  "plaid",
  "rippling",
  "flexport",
  "brex",
  "ramp",
  "chime",
  "public",
  "alpaca",
  "carta",
  "deel",
  "remote",
  "oyster",
  "wise",
  "nubank",
  "revolut",
  "monzo",
  "n26",

  // DevTools / Infra
  "canva",
  "figma",
  "notion",
  "linear",
  "height",
  "shortcut",
  "miro",
  "loom",
  "calendly",
  "postman",
  "snyk",
  "vercel",
  "netlify",
  "supabase",
  "railway",
  "render",

  // Enterprise SaaS
  "attentive",
  "eightsleep",
  "buildingsociety",
  "ashby",
  "beamery",
  "lever",
  "greenhouse",
  "smartrecruiters",
  "eightfold",
  "phenom",
  "clari",
  "gong",
  "chorus",
  "outreach",
  "salesloft",
  "hubspot",
  "salesforce",

  // Robotics / Hardware
  "nuro",
  "zoox",
  "waymo",
  "cruise",
  "bear-robotics",
  "sarcos",
  "boston-dynamics",
  "Agility-Robotics",
  "shadow-robot",
  "figure",
  "apptronik",
  "1X",
  "sanctuary-ai",
];

interface LeverJob {
  id: string;
  text: string;
  hostedUrl: string;
  categories?: { location?: string; team?: string; commitment?: string };
  descriptionPlain?: string;
  description?: string;
  createdAt?: number;
  salaryRange?: { min?: number; max?: number; currency?: string };
}

export async function fetchLeverJobs(
  companySlugs: string[] = LEVER_COMPANY_SLUGS,
  fetcher: Fetcher = fetch,
): Promise<RawJob[]> {
  const results: RawJob[] = [];

  await runWithConcurrency(companySlugs, LEVER_CONCURRENCY, async (slug) => {
    try {
      const response = await fetcher(
        `https://api.lever.co/v0/postings/${slug}?mode=json`,
      );
      if (await handleRateLimit(response)) return;
      if (!response.ok) return;
      const data = await response.json();
      if (!Array.isArray(data)) return;
      const jobs = data as LeverJob[];
      for (const job of jobs) {
        results.push({
          source: "lever",
          externalId: job.id,
          company: slug,
          companyWebsite: getCompanyUrl(slug),
          title: job.text,
          department: job.categories?.team ?? null,
          employmentType: job.categories?.commitment ?? null,
          location: job.categories?.location ?? null,
          remote: /remote/i.test(job.categories?.location ?? ""),
          salaryMin: job.salaryRange?.min ?? null,
          salaryMax: job.salaryRange?.max ?? null,
          salaryCurrency: job.salaryRange?.currency ?? null,
          description: job.descriptionPlain ?? job.description ?? "",
          applyUrl: job.hostedUrl,
          postedDate: job.createdAt ? new Date(job.createdAt) : null,
        });
      }
    } catch (err) {
      logger.warn("Lever adapter failed for company slug", {
        err: String(err),
        slug,
      });
    }
  });

  return results;
}
