import { logger } from "../../logger.js";
import type { Fetcher } from "../../fetcher.js";
import type { RawJob } from "../types.js";

interface RemoteOkJob {
  id?: string;
  slug?: string;
  company?: string;
  position?: string;
  tags?: string[];
  description?: string;
  url?: string;
  apply_url?: string;
  date?: string;
  location?: string;
  salary_min?: number;
  salary_max?: number;
}

export async function fetchRemoteOkJobs(
  fetcher: Fetcher = fetch,
): Promise<RawJob[]> {
  try {
    const response = await fetcher("https://remoteok.com/api", {
      headers: { "User-Agent": "ai-jobs-intelligence-actor/1.0" },
    });
    if (!response.ok) {
      logger.warn("RemoteOK adapter received non-OK response", {
        status: response.status,
      });
      return [];
    }
    const data = (await response.json()) as RemoteOkJob[];
    const results: RawJob[] = [];

    for (const job of data) {
      if (!job.id || !job.position || !job.company) continue;
      const description = [job.description, (job.tags ?? []).join(", ")]
        .filter(Boolean)
        .join("\n\n");
      results.push({
        source: "remoteok",
        externalId: String(job.id),
        company: job.company,
        companyWebsite: null,
        title: job.position,
        department: null,
        employmentType: null,
        location: job.location ?? "Remote",
        remote: true,
        salaryMin: job.salary_min ?? null,
        salaryMax: job.salary_max ?? null,
        salaryCurrency: job.salary_min ?? job.salary_max ? "USD" : null,
        description,
        applyUrl: job.apply_url ?? job.url ?? "https://remoteok.com",
        postedDate: job.date ? new Date(job.date) : null,
      });
    }

    return results;
  } catch (err) {
    logger.warn("RemoteOK adapter failed", { err: String(err) });
    return [];
  }
}
