import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchOttaJobs } from "./otta.js";
import type { Fetcher } from "../../fetcher.js";

describe("fetchOttaJobs", () => {
  const mockFetcher: Fetcher = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch jobs from Otta API", async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        results: [
          {
            id: "otta-123",
            title: "Senior ML Engineer",
            subtitle: "Build AI systems",
            functionName: "Software Engineering",
            subFunctionName: "Machine Learning",
            companyName: "Stripe",
            companyAlias: "stripe",
            salaryMin: 150000,
            salaryMax: 220000,
            salaryCurrency: "USD",
            oteSalaryMin: null,
            oteSalaryMax: null,
            minYearsExperience: 5,
            maxYearsExperience: 10,
            locations: ["London, UK"],
            locationCodes: ["GB-LDN"],
            remoteOnly: false,
            minDaysInOffice: 2,
            maxDaysInOffice: 3,
            technologies: ["Python", "PyTorch", "TensorFlow"],
            involves: ["Build ML models", "Deploy to production"],
            requirements: [
              { value: "5+ years ML experience", isDesirable: false },
              { value: "PhD in CS", isDesirable: true },
            ],
            applyUrl: "https://stripe.com/jobs/123",
            url: "https://app.welcometothejungle.com/jobs/123",
            jobExternalId: "EXT-123",
            firstLiveAt: "2025-01-15T10:00:00.000Z",
            lastSeen: "2025-01-20T10:00:00.000Z",
            daysSincePosted: 5,
            activelyHiring: true,
          },
        ],
      }),
    };

    (mockFetcher as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

    const jobs = await fetchOttaJobs(["stripe"], mockFetcher);

    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      source: "otta",
      externalId: "EXT-123",
      company: "Stripe",
      title: "Senior ML Engineer",
      department: "Software Engineering",
      location: "London, UK",
      remote: false,
      salaryMin: 150000,
      salaryMax: 220000,
      salaryCurrency: "USD",
      applyUrl: "https://stripe.com/jobs/123",
    });
  });

  it("should handle remote jobs", async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        results: [
          {
            id: "otta-remote",
            title: "Remote ML Engineer",
            subtitle: "Work from anywhere",
            functionName: "Software Engineering",
            subFunctionName: null,
            companyName: "Spotify",
            companyAlias: "spotify",
            salaryMin: 120000,
            salaryMax: 180000,
            salaryCurrency: "USD",
            oteSalaryMin: null,
            oteSalaryMax: null,
            minYearsExperience: 3,
            maxYearsExperience: 7,
            locations: ["Remote"],
            locationCodes: [],
            remoteOnly: true,
            minDaysInOffice: 0,
            maxDaysInOffice: 0,
            technologies: ["Python", "Spark"],
            involves: ["Build data pipelines"],
            requirements: [],
            applyUrl: "https://spotify.com/jobs/remote",
            url: "https://app.welcometothejungle.com/jobs/remote",
            jobExternalId: "EXT-remote",
            firstLiveAt: "2025-01-15T10:00:00.000Z",
            lastSeen: "2025-01-20T10:00:00.000Z",
            daysSincePosted: 5,
            activelyHiring: true,
          },
        ],
      }),
    };

    (mockFetcher as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

    const jobs = await fetchOttaJobs(["spotify"], mockFetcher);

    expect(jobs[0].remote).toBe(true);
  });

  it("should handle API errors gracefully", async () => {
    (mockFetcher as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 404,
    });

    const jobs = await fetchOttaJobs(["nonexistent"], mockFetcher);

    expect(jobs).toHaveLength(0);
  });

  it("should handle network errors gracefully", async () => {
    (mockFetcher as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Network error"),
    );

    const jobs = await fetchOttaJobs(["stripe"], mockFetcher);

    expect(jobs).toHaveLength(0);
  });

  it("should handle missing salary data", async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        results: [
          {
            id: "otta-nosalary",
            title: "ML Engineer",
            subtitle: null,
            functionName: "Engineering",
            subFunctionName: null,
            companyName: "Revolut",
            companyAlias: "revolut",
            salaryMin: null,
            salaryMax: null,
            salaryCurrency: null,
            oteSalaryMin: null,
            oteSalaryMax: null,
            minYearsExperience: null,
            maxYearsExperience: null,
            locations: ["Remote"],
            locationCodes: [],
            remoteOnly: true,
            minDaysInOffice: 0,
            maxDaysInOffice: 0,
            technologies: ["Python"],
            involves: ["Build ML models"],
            requirements: [],
            applyUrl: "https://revolut.com/jobs/nosalary",
            url: "https://app.welcometothejungle.com/jobs/nosalary",
            jobExternalId: "EXT-nosalary",
            firstLiveAt: "2025-01-15T10:00:00.000Z",
            lastSeen: "2025-01-20T10:00:00.000Z",
            daysSincePosted: 5,
            activelyHiring: true,
          },
        ],
      }),
    };

    (mockFetcher as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

    const jobs = await fetchOttaJobs(["revolut"], mockFetcher);

    expect(jobs[0].salaryMin).toBeNull();
    expect(jobs[0].salaryMax).toBeNull();
    expect(jobs[0].salaryCurrency).toBeNull();
  });
});
