import { describe, it, expect, vi } from "vitest";
import { fetchLeverJobs, LEVER_COMPANY_SLUGS } from "./lever.js";

function mockFetch(response: unknown, ok = true): typeof fetch {
  return vi.fn().mockResolvedValue({
    ok,
    json: () => Promise.resolve(response),
  }) as unknown as typeof fetch;
}

describe("fetchLeverJobs", () => {
  it("parses jobs from a single company slug", async () => {
    const mockResponse = [
      {
        id: "abc123",
        text: "Senior ML Engineer",
        hostedUrl: "https://jobs.lever.co/netflix/abc123",
        categories: {
          location: "Los Angeles, CA",
          team: "Machine Learning",
          commitment: "Full-time",
        },
        descriptionPlain: "Build recommendation systems",
        createdAt: 1704067200000,
        salaryRange: { min: 150000, max: 200000, currency: "USD" },
      },
    ];
    const fetchFn = mockFetch(mockResponse);
    const jobs = await fetchLeverJobs(["netflix"], fetchFn);

    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      source: "lever",
      externalId: "abc123",
      company: "netflix",
      title: "Senior ML Engineer",
      location: "Los Angeles, CA",
      department: "Machine Learning",
      employmentType: "Full-time",
      salaryMin: 150000,
      salaryMax: 200000,
      salaryCurrency: "USD",
    });
  });

  it("fetches from multiple company slugs", async () => {
    const fetchFn = mockFetch([]);
    await fetchLeverJobs(["netflix", "palantir"], fetchFn);
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it("skips companies that return non-OK", async () => {
    const fetchFn = vi.fn().mockResolvedValue({ ok: false, status: 404 });
    const jobs = await fetchLeverJobs(["nonexistent"], fetchFn);
    expect(jobs).toEqual([]);
  });

  it("handles companies that throw errors", async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error("timeout"));
    const jobs = await fetchLeverJobs(["netflix"], fetchFn);
    expect(jobs).toEqual([]);
  });

  it("detects remote location", async () => {
    const mockResponse = [
      {
        id: "xyz",
        text: "Data Engineer",
        hostedUrl: "https://jobs.lever.co/palantir/xyz",
        categories: { location: "Remote - US" },
        descriptionPlain: "Build data pipelines",
      },
    ];
    const fetchFn = mockFetch(mockResponse);
    const jobs = await fetchLeverJobs(["palantir"], fetchFn);
    expect(jobs[0].remote).toBe(true);
  });

  it("uses default slugs when none provided", async () => {
    const fetchFn = mockFetch([]);
    await fetchLeverJobs(undefined, fetchFn);
    expect(fetchFn).toHaveBeenCalledTimes(LEVER_COMPANY_SLUGS.length);
  });

  it("handles missing salary range", async () => {
    const mockResponse = [
      {
        id: "no-salary",
        text: "Engineer",
        hostedUrl: "https://example.com",
        categories: { location: "NYC" },
        descriptionPlain: "Build things",
      },
    ];
    const fetchFn = mockFetch(mockResponse);
    const jobs = await fetchLeverJobs(["test"], fetchFn);
    expect(jobs[0].salaryMin).toBeNull();
    expect(jobs[0].salaryMax).toBeNull();
  });
});
