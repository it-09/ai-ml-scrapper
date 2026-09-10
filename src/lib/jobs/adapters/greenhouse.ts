import { logger } from "../../logger.js";
import type { Fetcher } from "../../fetcher.js";
import type { RawJob } from "../types.js";
import { getCompanyUrl } from "../company-urls.js";
import { runWithConcurrency, handleRateLimit } from "./concurrency.js";

const GREENHOUSE_CONCURRENCY = 15;

export const GREENHOUSE_BOARD_TOKENS = [
  // AI/ML Companies
  "openai",
  "anthropic",
  "scaleai",
  "databricks",
  "huggingface",
  "stabilityai",
  "ai21",
  "cohere",
  "replicate",
  "runway",
  "inflection",
  "character-ai",
  "jasper",
  "copy-ai",
  "soundhound",
  "nuro",
  "zoox",
  "waymo",
  "cruise",
  "vectra",
  "labelbox",
  "snorkelai",
  "weightsandbiases",
  "modal",
  "together-ai",
  "fireworks-ai",
  "groq",

  // Big Tech / Scale
  "airbnb",
  "stripe",
  "figma",
  "notion",
  "brex",
  "ramp",
  "coinbase",
  "doordash",
  "robinhood",
  "gusto",
  "asana",
  "discord",
  "reddit",
  "affirm",
  "instacart",
  "cloudflare",
  "twilio",
  "sendgrid",
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
  "samsara",
  "fivetran",
  "dbt-labs",
  "sisense",
  "hex",
  "mode",

  // Fintech
  "plaid",
  "square",
  "adyen",
  "checkout",
  "revolut",
  "monzo",
  "n26",
  "wise",
  "nubank",
  "chime",
  "rally",
  "public",
  "alpaca",
  "carta",
  "deel",
  "remote",
  "oyster",

  // DevTools / Infrastructure
  "vercel",
  "netlify",
  "supabase",
  "planetscale",
  "neon",
  "railway",
  "render",
  "fly-io",
  "fly",
  "postman",
  "snyk",
  "socket",
  "linear",
  "height",
  "shortcut",
  "miro",
  "loom",
  "calendly",
  "coda",
  "airtable",

  // SaaS / Enterprise
  "rippling",
  "fivestars",
  "segment",
  "amplitude",
  "mixpanel",
  "heap",
  "fullstory",
  "hotjar",
  "logrocket",
  "clari",
  "gyant",
  "hims",
  "rome",
  "bungalow",
  "oakhouse",

  // Robotics / Hardware
  "beamery",
  "ashby",
  "lever",
  "greenhouse",
  "leap.ai",
  "eightfold",
  "phenom",
  "smartrecruiters",
];

interface GreenhouseJob {
  id: number;
  title: string;
  absolute_url: string;
  location?: { name?: string };
  content?: string;
  departments?: Array<{ name?: string }>;
  updated_at?: string;
}

interface GreenhouseResponse {
  jobs: GreenhouseJob[];
}

export async function fetchGreenhouseJobs(
  boardTokens: string[] = GREENHOUSE_BOARD_TOKENS,
  fetcher: Fetcher = fetch,
): Promise<RawJob[]> {
  const results: RawJob[] = [];

  await runWithConcurrency(boardTokens, GREENHOUSE_CONCURRENCY, async (token) => {
    try {
      const response = await fetcher(
        `https://boards-api.greenhouse.io/v1/boards/${token}/jobs?content=true`,
      );
      if (await handleRateLimit(response)) return;
      if (!response.ok) return;
      const data = (await response.json()) as GreenhouseResponse;
      for (const job of data.jobs ?? []) {
        results.push({
          source: "greenhouse",
          externalId: String(job.id),
          company: token,
          companyWebsite: getCompanyUrl(token),
          title: job.title,
          department: job.departments?.[0]?.name ?? null,
          employmentType: null,
          location: job.location?.name ?? null,
          remote: /remote/i.test(job.location?.name ?? ""),
          description: job.content ?? "",
          applyUrl: job.absolute_url,
          postedDate: job.updated_at ? new Date(job.updated_at) : null,
        });
      }
    } catch (err) {
      logger.warn("Greenhouse adapter failed for board token", {
        err: String(err),
        token,
      });
    }
  });

  return results;
}
