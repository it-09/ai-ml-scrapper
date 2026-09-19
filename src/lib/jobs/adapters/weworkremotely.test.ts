import { describe, it, expect, vi } from "vitest";
import { fetchWeWorkRemotelyJobs } from "./weworkremotely.js";

function mockFetch(xml: string, ok = true): typeof fetch {
  return vi.fn().mockResolvedValue({
    ok,
    text: () => Promise.resolve(xml),
  }) as unknown as typeof fetch;
}

const SAMPLE_RSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <item>
    <title>Acme Corp: Senior ML Engineer</title>
    <link>https://weworkremotely.com/jobs/1</link>
    <description>Build AI systems with Python</description>
    <pubDate>Mon, 01 Jan 2024 00:00:00 GMT</pubDate>
    <guid>https://weworkremotely.com/jobs/1</guid>
  </item>
  <item>
    <title>Globex: Data Scientist</title>
    <link>https://weworkremotely.com/jobs/2</link>
    <description>Analyze data with ML</description>
    <pubDate>Tue, 02 Jan 2024 00:00:00 GMT</pubDate>
    <guid>https://weworkremotely.com/jobs/2</guid>
  </item>
</channel>
</rss>`;

describe("fetchWeWorkRemotelyJobs", () => {
  it("parses jobs from RSS feed (2 feeds x 2 items = 4 results)", async () => {
    const fetchFn = mockFetch(SAMPLE_RSS);
    const jobs = await fetchWeWorkRemotelyJobs(fetchFn);

    expect(jobs).toHaveLength(4);
    expect(jobs[0]).toMatchObject({
      source: "weworkremotely",
      company: "Acme Corp",
      title: "Senior ML Engineer",
      remote: true,
      location: "Remote",
    });
    expect(jobs[1]).toMatchObject({
      source: "weworkremotely",
      company: "Globex",
      title: "Data Scientist",
    });
  });

  it("parses pubDate into postedDate", async () => {
    const fetchFn = mockFetch(SAMPLE_RSS);
    const jobs = await fetchWeWorkRemotelyJobs(fetchFn);
    expect(jobs[0].postedDate).toBeInstanceOf(Date);
  });

  it("uses guid as externalId", async () => {
    const fetchFn = mockFetch(SAMPLE_RSS);
    const jobs = await fetchWeWorkRemotelyJobs(fetchFn);
    expect(jobs[0].externalId).toBe("https://weworkremotely.com/jobs/1");
  });

  it("handles non-OK response", async () => {
    const fetchFn = mockFetch("", false);
    const jobs = await fetchWeWorkRemotelyJobs(fetchFn);
    expect(jobs).toEqual([]);
  });

  it("handles network errors", async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error("timeout"));
    const jobs = await fetchWeWorkRemotelyJobs(fetchFn);
    expect(jobs).toEqual([]);
  });

  it("handles empty RSS feed", async () => {
    const emptyRss = `<?xml version="1.0"?>
<rss version="2.0">
<channel>
</channel>
</rss>`;
    const fetchFn = mockFetch(emptyRss);
    const jobs = await fetchWeWorkRemotelyJobs(fetchFn);
    expect(jobs).toEqual([]);
  });

  it("handles items with Company: prefix in title", async () => {
    const rss = `<?xml version="1.0"?>
<rss version="2.0">
<channel>
  <item>
    <title>Unknown Company: Backend Engineer</title>
    <link>https://example.com/3</link>
    <description>Build backends</description>
  </item>
</channel>
</rss>`;
    const fetchFn = mockFetch(rss);
    const jobs = await fetchWeWorkRemotelyJobs(fetchFn);
    expect(jobs).toHaveLength(2);
    expect(jobs[0].company).toBe("Unknown Company");
    expect(jobs[0].title).toBe("Backend Engineer");
  });

  it("handles CDATA in description", async () => {
    const rss = `<?xml version="1.0"?>
<rss version="2.0">
<channel>
  <item>
    <title>Co: Dev</title>
    <link>https://example.com</link>
    <description><![CDATA[<p>Hello <b>world</b></p>]]></description>
  </item>
</channel>
</rss>`;
    const fetchFn = mockFetch(rss);
    const jobs = await fetchWeWorkRemotelyJobs(fetchFn);
    expect(jobs).toHaveLength(2);
  });
});
