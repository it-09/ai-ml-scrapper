import { describe, it, expect, vi } from "vitest";
import { fetchGreenhouseJobs, GREENHOUSE_BOARD_TOKENS } from "./greenhouse.js";

function mockFetch(response: unknown, ok = true): typeof fetch {
  return vi.fn().mockResolvedValue({
    ok,
    json: () => Promise.resolve(response),
  }) as unknown as typeof fetch;
}

describe("fetchGreenhouseJobs", () => {
  it("parses jobs from a single board token", async () => {
    const mockResponse = {
      jobs: [
        {
          id: 1,
          title: "ML Engineer",
          absolute_url: "https://boards.greenhouse.io/openai/jobs/1",
          location: { name: "San Francisco, CA" },
          content: "<p>Build AI systems</p>",
          departments: [{ name: "Engineering" }],
          updated_at: "2024-01-01T00:00:00Z",
        },
      ],
    };
    const fetchFn = mockFetch(mockResponse);
    const jobs = await fetchGreenhouseJobs(["openai"], fetchFn);

    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      source: "greenhouse",
      externalId: "1",
      company: "openai",
      title: "ML Engineer",
      location: "San Francisco, CA",
      department: "Engineering",
      remote: false,
    });
  });

  it("fetches from multiple board tokens in parallel", async () => {
    const fetchFn = mockFetch({ jobs: [] });
    await fetchGreenhouseJobs(["openai", "anthropic"], fetchFn);
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it("skips tokens that return non-OK response", async () => {
    const fetchFn = vi.fn().mockResolvedValue({ ok: false, status: 404 });
    const jobs = await fetchGreenhouseJobs(["nonexistent"], fetchFn);
    expect(jobs).toEqual([]);
  });

  it("handles tokens that throw errors", async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error("network error"));
    const jobs = await fetchGreenhouseJobs(["openai"], fetchFn);
    expect(jobs).toEqual([]);
  });

  it("sets remote=true when location contains 'remote'", async () => {
    const mockResponse = {
      jobs: [
        {
          id: 2,
          title: "Data Scientist",
          absolute_url: "https://example.com/2",
          location: { name: "Remote" },
          content: "",
          departments: [],
        },
      ],
    };
    const fetchFn = mockFetch(mockResponse);
    const jobs = await fetchGreenhouseJobs(["openai"], fetchFn);
    expect(jobs[0].remote).toBe(true);
  });

  it("uses default board tokens when none provided", async () => {
    const fetchFn = mockFetch({ jobs: [] });
    await fetchGreenhouseJobs(undefined, fetchFn);
    expect(fetchFn).toHaveBeenCalledTimes(GREENHOUSE_BOARD_TOKENS.length);
  });

  it("handles missing location gracefully", async () => {
    const mockResponse = {
      jobs: [
        {
          id: 3,
          title: "Engineer",
          absolute_url: "https://example.com/3",
          content: "",
        },
      ],
    };
    const fetchFn = mockFetch(mockResponse);
    const jobs = await fetchGreenhouseJobs(["openai"], fetchFn);
    expect(jobs[0].location).toBeNull();
  });
});
