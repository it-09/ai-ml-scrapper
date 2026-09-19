import { logger } from "../../logger.js";
import type { Fetcher } from "../../fetcher.js";
import { withTimeout } from "../../with-timeout.js";
import type { RawJob } from "../types.js";

const FEED_URLS = [
  "https://weworkremotely.com/categories/remote-programming-jobs.rss",
  "https://weworkremotely.com/categories/remote-data-jobs.rss",
];

function extractTag(xml: string, tag: string): string | null {
  try {
    const match = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i").exec(xml);
    if (!match) return null;
    return (match[1] ?? "")
      .replace(/^<!\[CDATA\[/, "")
      .replace(/\]\]>$/, "")
      .replace(/<[^>]+>/g, "")
      .trim();
  } catch {
    return null;
  }
}

function parseItems(xml: string): string[] {
  const items: string[] = [];
  try {
    const regex = /<item>([\s\S]*?)<\/item>/gi;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(xml)) !== null) {
      const item = match[1];
      if (item) items.push(item);
    }
  } catch {
    logger.warn("WeWorkRemotely failed to parse RSS XML");
  }
  return items;
}

export async function fetchWeWorkRemotelyJobs(
  fetcher: Fetcher = fetch,
): Promise<RawJob[]> {
  const safeFetcher = withTimeout(fetcher);
  const results: RawJob[] = [];

  await Promise.all(
    FEED_URLS.map(async (url) => {
      try {
        const response = await safeFetcher(url, {
          headers: { "User-Agent": "ai-jobs-intelligence-actor/1.0" },
        });
        if (!response.ok) return;
        const xml = await response.text();
        const items = parseItems(xml);

        for (const item of items) {
          const title = extractTag(item, "title") ?? "";
          const link = extractTag(item, "link") ?? "";
          const description = extractTag(item, "description") ?? "";
          const pubDate = extractTag(item, "pubDate");
          const guid = extractTag(item, "guid") ?? link;

          if (!title || !link) continue;

          const titleMatch = /^(.*?):\s*(.*)$/.exec(title);
          const company = titleMatch ? (titleMatch[1] ?? "Unknown").trim() : "Unknown";
          const positionTitle = titleMatch ? (titleMatch[2] ?? title).trim() : title;

          if (!positionTitle) continue;

          results.push({
            source: "weworkremotely",
            externalId: guid,
            company,
            companyWebsite: null,
            title: positionTitle,
            department: null,
            employmentType: null,
            location: "Remote",
            remote: true,
            description,
            applyUrl: link,
            postedDate: pubDate ? new Date(pubDate) : null,
          });
        }
      } catch (err) {
        logger.warn("WeWorkRemotely adapter failed for feed", {
          err: String(err),
          url,
        });
      }
    }),
  );

  return results;
}
