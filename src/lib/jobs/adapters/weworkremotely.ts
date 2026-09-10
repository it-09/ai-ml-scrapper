import { logger } from "../../logger.js";
import type { Fetcher } from "../../fetcher.js";
import type { RawJob } from "../types.js";

const FEED_URLS = [
  "https://weworkremotely.com/categories/remote-programming-jobs.rss",
  "https://weworkremotely.com/categories/remote-data-jobs.rss",
];

function extractTag(xml: string, tag: string): string | null {
  const match = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i").exec(xml);
  if (!match) return null;
  return (match[1] ?? "")
    .replace(/^<!\[CDATA\[/, "")
    .replace(/\]\]>$/, "")
    .trim();
}

function parseItems(xml: string): string[] {
  const items: string[] = [];
  const regex = /<item>([\s\S]*?)<\/item>/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(xml)) !== null) {
    const item = match[1];
    if (item) items.push(item);
  }
  return items;
}

export async function fetchWeWorkRemotelyJobs(
  fetcher: Fetcher = fetch,
): Promise<RawJob[]> {
  const results: RawJob[] = [];

  await Promise.all(
    FEED_URLS.map(async (url) => {
      try {
        const response = await fetcher(url, {
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
