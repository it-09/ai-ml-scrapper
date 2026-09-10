import { describe, it, expect, vi } from "vitest";
import { fetchYCJobs } from "./yc.js";

function mockFetch(response: unknown, ok = true): typeof fetch {
  return vi.fn().mockResolvedValue({
    ok,
    json: () => Promise.resolve(response),
  }) as unknown as typeof fetch;
}

describe("fetchYCJobs", () => {
  it("parses jobs from YC API", async () => {
    const mockResponse = {
      jobs: [
        {
          id: "yc-001",
          title: "ML Engineer",
          company_name: "YC Startup AI",
          company_url: "https://ycstartupai.com",
          description: "Build ML models for our platform",
          location: "San Francisco, CA",
          remote: true,
          salary_min: 150000,
          salary_max: 250000,
          salary_currency: "USD",
          employment_type: "Full-time",
          url: "https://workatastartup.com/companies/yc-startup-ai",
          created_at: "2024-01-15T00:00:00Z",
        },
      ],
    };
    const fetchFn = mockFetch(mockResponse);
    const jobs = await fetchYCJobs(fetchFn);

    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      source: "yc",
      externalId: "yc-001",
      company: "YC Startup AI",
      title: "ML Engineer",
      remote: true,
      salaryMin: 150000,
      salaryMax: 250000,
      salaryCurrency: "USD",
    });
  });

  it("skips entries missing required fields", async () => {
    const mockResponse = {
      jobs: [
        { id: "1" },
        { title: "Engineer" },
        { company_name: "Corp" },
        { id: "4", title: "ML Engineer", company_name: "Good" },
      ],
    };
    const fetchFn = mockFetch(mockResponse);
    const jobs = await fetchYCJobs(fetchFn);
    expect(jobs).toHaveLength(1);
    expect(jobs[0].externalId).toBe("4");
  });

  it("handles non-OK response", async () => {
    const fetchFn = vi.fn().mockResolvedValue({ ok: false, status: 429 });
    const jobs = await fetchYCJobs(fetchFn);
    expect(jobs).toEqual([]);
  });

  it("handles network errors", async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error("connection refused"));
    const jobs = await fetchYCJobs(fetchFn);
    expect(jobs).toEqual([]);
  });

  it("handles empty jobs array", async () => {
    const mockResponse = { jobs: [] };
    const fetchFn = mockFetch(mockResponse);
    const jobs = await fetchYCJobs(fetchFn);
    expect(jobs).toEqual([]);
  });

  it("handles missing jobs field", async () => {
    const mockResponse = {};
    const fetchFn = mockFetch(mockResponse);
    const jobs = await fetchYCJobs(fetchFn);
    expect(jobs).toEqual([]);
  });

  it("uses apply_url or url as applyUrl", async () => {
    const mockResponse = {
      jobs: [
        {
          id: "1",
          title: "Engineer",
          company_name: "Co",
          url: "https://example.com/apply",
        },
      ],
    };
    const fetchFn = mockFetch(mockResponse);
    const jobs = await fetchYCJobs(fetchFn);
    expect(jobs[0].applyUrl).toBe("https://example.com/apply");
  });

  it("defaults location to null when not provided", async () => {
    const mockResponse = {
      jobs: [
        {
          id: "1",
          title: "Engineer",
          company_name: "Co",
        },
      ],
    };
    const fetchFn = mockFetch(mockResponse);
    const jobs = await fetchYCJobs(fetchFn);
    expect(jobs[0].location).toBeNull();
  });
});
