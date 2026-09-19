import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchAshbyJobs } from "./ashby.js";
import type { Fetcher } from "../../fetcher.js";

describe("fetchAshbyJobs", () => {
  const mockFetcher: Fetcher = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch jobs from Ashby API", async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        apiVersion: "1",
        jobs: [
          {
            id: "job-123",
            title: "Senior ML Engineer",
            location: "San Francisco, CA",
            secondaryLocations: [],
            department: "Engineering",
            team: "ML Platform",
            workplaceType: "Hybrid",
            isRemote: false,
            employmentType: "FullTime",
            publishedAt: "2025-01-15T10:00:00.000Z",
            descriptionHtml: "<p>We are looking for...</p>",
            descriptionPlain: "We are looking for...",
            jobUrl: "https://jobs.ashbyhq.com/openai/job-123",
            applyUrl: "https://jobs.ashbyhq.com/openai/job-123/apply",
            isListed: true,
            compensation: {
              compensationTierSummary: "$180K – $250K",
              scrapeableCompensationSalarySummary: "$180K – $250K",
              summaryComponents: [
                {
                  compensationType: "Salary",
                  interval: "1 YEAR",
                  minValue: 180000,
                  maxValue: 250000,
                  currencyCode: "USD",
                },
              ],
            },
          },
        ],
      }),
    };

    (mockFetcher as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

    const jobs = await fetchAshbyJobs(["openai"], mockFetcher);

    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      source: "ashby",
      externalId: "job-123",
      company: "openai",
      title: "Senior ML Engineer",
      department: "Engineering",
      location: "San Francisco, CA",
      remote: false,
      salaryMin: 180000,
      salaryMax: 250000,
      salaryCurrency: "USD",
      applyUrl: "https://jobs.ashbyhq.com/openai/job-123/apply",
    });
  });

  it("should skip unlisted jobs", async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        apiVersion: "1",
        jobs: [
          {
            id: "job-unlisted",
            title: "Unlisted Job",
            location: "Remote",
            secondaryLocations: [],
            department: null,
            team: null,
            workplaceType: "Remote",
            isRemote: true,
            employmentType: "FullTime",
            publishedAt: "2025-01-15T10:00:00.000Z",
            descriptionHtml: "",
            descriptionPlain: "",
            jobUrl: "https://jobs.ashbyhq.com/openai/job-unlisted",
            applyUrl: "https://jobs.ashbyhq.com/openai/job-unlisted/apply",
            isListed: false,
          },
        ],
      }),
    };

    (mockFetcher as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

    const jobs = await fetchAshbyJobs(["openai"], mockFetcher);

    expect(jobs).toHaveLength(0);
  });

  it("should handle remote jobs", async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        apiVersion: "1",
        jobs: [
          {
            id: "job-remote",
            title: "Remote ML Engineer",
            location: "Remote - US",
            secondaryLocations: [],
            department: "Engineering",
            team: null,
            workplaceType: "Remote",
            isRemote: true,
            employmentType: "FullTime",
            publishedAt: "2025-01-15T10:00:00.000Z",
            descriptionHtml: "",
            descriptionPlain: "Remote position",
            jobUrl: "https://jobs.ashbyhq.com/openai/job-remote",
            applyUrl: "https://jobs.ashbyhq.com/openai/job-remote/apply",
            isListed: true,
          },
        ],
      }),
    };

    (mockFetcher as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

    const jobs = await fetchAshbyJobs(["openai"], mockFetcher);

    expect(jobs[0].remote).toBe(true);
  });

  it("should handle API errors gracefully", async () => {
    (mockFetcher as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 404,
    });

    const jobs = await fetchAshbyJobs(["nonexistent"], mockFetcher);

    expect(jobs).toHaveLength(0);
  });

  it("should handle network errors gracefully", async () => {
    (mockFetcher as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Network error"),
    );

    const jobs = await fetchAshbyJobs(["openai"], mockFetcher);

    expect(jobs).toHaveLength(0);
  });
});
