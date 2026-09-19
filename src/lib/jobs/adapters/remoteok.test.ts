import { describe, it, expect, vi } from "vitest";
import { fetchRemoteOkJobs } from "./remoteok.js";

function mockFetch(response: unknown, ok = true): typeof fetch {
  return vi.fn().mockResolvedValue({
    ok,
    json: () => Promise.resolve(response),
  }) as unknown as typeof fetch;
}

describe("fetchRemoteOkJobs", () => {
  it("parses jobs from the API", async () => {
    const mockResponse = [
      {
        id: "1001",
        position: "ML Engineer",
        company: "AITech",
        description: "Build ML models",
        tags: ["python", "pytorch"],
        url: "https://remoteok.com/ml-engineer-1001",
        apply_url: "https://aitech.com/apply",
        date: "2024-01-01",
        location: "Remote",
        salary_min: 120000,
        salary_max: 180000,
      },
    ];
    const fetchFn = mockFetch(mockResponse);
    const jobs = await fetchRemoteOkJobs(fetchFn);

    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      source: "remoteok",
      externalId: "1001",
      company: "AITech",
      title: "ML Engineer",
      remote: true,
      salaryMin: 120000,
      salaryMax: 180000,
      salaryCurrency: "USD",
    });
  });

  it("skips entries missing required fields", async () => {
    const mockResponse = [
      { id: "1", position: "Engineer" },
      { id: "2", company: "Corp" },
      { position: "Dev", company: "Inc" },
      {
        id: "4",
        position: "ML Engineer",
        company: "Good",
        description: "test",
      },
    ];
    const fetchFn = mockFetch(mockResponse);
    const jobs = await fetchRemoteOkJobs(fetchFn);
    expect(jobs).toHaveLength(1);
    expect(jobs[0].externalId).toBe("4");
  });

  it("handles non-OK response", async () => {
    const fetchFn = vi.fn().mockResolvedValue({ ok: false, status: 429 });
    const jobs = await fetchRemoteOkJobs(fetchFn);
    expect(jobs).toEqual([]);
  });

  it("handles network errors", async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error("connection refused"));
    const jobs = await fetchRemoteOkJobs(fetchFn);
    expect(jobs).toEqual([]);
  });

  it("combines description and tags", async () => {
    const mockResponse = [
      {
        id: "1",
        position: "Dev",
        company: "Co",
        description: "Main description",
        tags: ["python", "ml"],
      },
    ];
    const fetchFn = mockFetch(mockResponse);
    const jobs = await fetchRemoteOkJobs(fetchFn);
    expect(jobs[0].description).toContain("Main description");
    expect(jobs[0].description).toContain("python, ml");
  });

  it("defaults location to Remote", async () => {
    const mockResponse = [
      {
        id: "1",
        position: "Dev",
        company: "Co",
        description: "test",
      },
    ];
    const fetchFn = mockFetch(mockResponse);
    const jobs = await fetchRemoteOkJobs(fetchFn);
    expect(jobs[0].location).toBe("Remote");
  });

  it("sets salaryCurrency to USD when salary is present", async () => {
    const mockResponse = [
      {
        id: "1",
        position: "Dev",
        company: "Co",
        salary_min: 100000,
      },
    ];
    const fetchFn = mockFetch(mockResponse);
    const jobs = await fetchRemoteOkJobs(fetchFn);
    expect(jobs[0].salaryCurrency).toBe("USD");
  });

  it("falls back to url when apply_url is missing", async () => {
    const mockResponse = [
      {
        id: "1",
        position: "Dev",
        company: "Co",
        url: "https://example.com/job",
      },
    ];
    const fetchFn = mockFetch(mockResponse);
    const jobs = await fetchRemoteOkJobs(fetchFn);
    expect(jobs[0].applyUrl).toBe("https://example.com/job");
  });
});
