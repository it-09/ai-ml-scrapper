import { logger } from "../../logger.js";
import type { Fetcher } from "../../fetcher.js";
import type { RawJob } from "../types.js";

interface YCJob {
  id: string | number;
  title: string;
  company_name: string;
  company_url?: string;
  description?: string;
  location?: string;
  remote?: boolean;
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  employment_type?: string;
  url?: string;
  apply_url?: string;
  created_at?: string;
  updated_at?: string;
}

interface YCResponse {
  jobs?: YCJob[];
}

const YC_API_URL = "https://www.workatastartup.com/api/jobs";

export async function fetchYCJobs(
  fetcher: Fetcher = fetch,
): Promise<RawJob[]> {
  const results: RawJob[] = [];

  try {
    const response = await fetcher(YC_API_URL, {
      headers: {
        "User-Agent": "ai-jobs-intelligence-actor/1.0",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      logger.warn("YC adapter received non-OK response", {
        status: response.status,
      });
      return [];
    }

    const data = (await response.json()) as YCResponse;
    const jobs = data.jobs ?? [];

    for (const job of jobs) {
      if (!job.title || !job.company_name) continue;

      const description = [job.description].filter(Boolean).join("\n\n");

      results.push({
        source: "yc",
        externalId: String(job.id),
        company: job.company_name,
        companyWebsite: job.company_url ?? null,
        title: job.title,
        department: null,
        employmentType: job.employment_type ?? null,
        location: job.location ?? null,
        remote: job.remote ?? false,
        salaryMin: job.salary_min ?? null,
        salaryMax: job.salary_max ?? null,
        salaryCurrency: job.salary_currency ?? null,
        description,
        applyUrl: job.apply_url ?? job.url ?? "https://www.workatastartup.com",
        postedDate: job.created_at ? new Date(job.created_at) : null,
      });
    }

    logger.info("YC adapter fetched jobs", { total: results.length });
  } catch (err) {
    logger.warn("YC adapter failed", { err: String(err) });
  }

  return results;
}
