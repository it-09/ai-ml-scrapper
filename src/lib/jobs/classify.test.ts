import { describe, it, expect } from "vitest";
import { classifyJob } from "./classify.js";
import type { RawJob } from "./types.js";

function makeRawJob(overrides: Partial<RawJob> = {}): RawJob {
  return {
    source: "greenhouse",
    externalId: "123",
    company: "TestCorp",
    title: "ML Engineer",
    description: "<p>We build AI systems with Python and PyTorch.</p>",
    applyUrl: "https://example.com/apply",
    postedDate: null,
    ...overrides,
  };
}

describe("classifyJob", () => {
  it("strips HTML from description", () => {
    const job = makeRawJob({
      description: "<p>Hello <b>world</b></p>",
    });
    const classified = classifyJob(job);
    expect(classified.description).toBe("Hello world");
  });

  it("decodes HTML entities", () => {
    const job = makeRawJob({
      description: "A &amp; B",
    });
    const classified = classifyJob(job);
    expect(classified.description).toBe("A & B");
  });

  it("detects programming languages", () => {
    const job = makeRawJob({
      description: "We use Python and TypeScript for our ML pipeline",
    });
    const classified = classifyJob(job);
    expect(classified.skills).toContain("Python");
    expect(classified.skills).toContain("TypeScript");
  });

  it("detects AI frameworks", () => {
    const job = makeRawJob({
      description: "Experience with PyTorch and TensorFlow required",
    });
    const classified = classifyJob(job);
    expect(classified.aiFrameworks).toContain("PyTorch");
    expect(classified.aiFrameworks).toContain("TensorFlow");
  });

  it("detects LLM technologies", () => {
    const job = makeRawJob({
      description: "Work with GPT-4 and RAG pipelines",
    });
    const classified = classifyJob(job);
    expect(classified.llmTech).toContain("GPT-4");
    expect(classified.llmTech).toContain("RAG");
  });

  it("detects vector databases", () => {
    const job = makeRawJob({
      description: "Experience with Pinecone or Weaviate",
    });
    const classified = classifyJob(job);
    expect(classified.vectorDbs).toContain("Pinecone");
    expect(classified.vectorDbs).toContain("Weaviate");
  });

  it("detects cloud providers", () => {
    const job = makeRawJob({
      description: "Deploy on AWS and Kubernetes",
    });
    const classified = classifyJob(job);
    expect(classified.cloudProviders).toContain("AWS");
    expect(classified.cloudProviders).toContain("Kubernetes");
  });

  it("detects experience level - senior", () => {
    const job = makeRawJob({
      title: "Senior ML Engineer",
      description: "We are looking for a senior engineer",
    });
    const classified = classifyJob(job);
    expect(classified.experienceLevel).toBe("senior");
  });

  it("detects experience level - entry", () => {
    const job = makeRawJob({
      title: "Junior Data Scientist",
      description: "Entry level position",
    });
    const classified = classifyJob(job);
    expect(classified.experienceLevel).toBe("entry");
  });

  it("detects experience level - intern", () => {
    const job = makeRawJob({
      title: "ML Intern",
      description: "Summer internship program",
    });
    const classified = classifyJob(job);
    expect(classified.experienceLevel).toBe("intern");
  });

  it("detects visa sponsorship - positive", () => {
    const job = makeRawJob({
      description: "Visa sponsorship is available for this role",
    });
    const classified = classifyJob(job);
    expect(classified.visaSponsorship).toBe(true);
  });

  it("detects visa sponsorship - negative", () => {
    const job = makeRawJob({
      description: "No visa sponsorship available",
    });
    const classified = classifyJob(job);
    expect(classified.visaSponsorship).toBe(false);
  });

  it("detects education - PhD", () => {
    const job = makeRawJob({
      description: "PhD in Computer Science preferred",
    });
    const classified = classifyJob(job);
    expect(classified.educationRequirement).toBe("PhD");
  });

  it("detects education - Master's", () => {
    const job = makeRawJob({
      description: "Master's degree required",
    });
    const classified = classifyJob(job);
    expect(classified.educationRequirement).toBe("Master's");
  });

  it("detects education - Bachelor's", () => {
    const job = makeRawJob({
      description: "Bachelor's degree in CS",
    });
    const classified = classifyJob(job);
    expect(classified.educationRequirement).toBe("Bachelor's");
  });

  it("detects remote flag from title", () => {
    const job = makeRawJob({
      title: "Remote ML Engineer",
      description: "Work from anywhere",
    });
    const classified = classifyJob(job);
    expect(classified.remote).toBe(true);
  });

  it("detects remote from description", () => {
    const job = makeRawJob({
      description: "This is a remote position",
    });
    const classified = classifyJob(job);
    expect(classified.remote).toBe(true);
  });

  it("does not mark hybrid as remote", () => {
    const job = makeRawJob({
      description: "Hybrid position with 3 days in office",
    });
    const classified = classifyJob(job);
    expect(classified.remote).toBe(false);
  });

  it("computes aiRelevanceScore > 0 for AI-related jobs", () => {
    const job = makeRawJob({
      title: "Machine Learning Engineer",
      description: "Deep learning, neural networks, PyTorch",
    });
    const classified = classifyJob(job);
    expect(classified.aiRelevanceScore).toBeGreaterThan(0);
  });

  it("computes aiRelevanceScore = 0 for non-AI jobs", () => {
    const job = makeRawJob({
      title: "Frontend Developer",
      description: "React, CSS, HTML",
    });
    const classified = classifyJob(job);
    expect(classified.aiRelevanceScore).toBe(0);
  });

  it("computes remoteScore for remote jobs", () => {
    const job = makeRawJob({
      description: "Fully remote position",
    });
    const classified = classifyJob(job);
    expect(classified.remoteScore).toBe(100);
  });

  it("computes salaryScore when salary is provided", () => {
    const job = makeRawJob({
      salaryMin: 100000,
      salaryMax: 150000,
    });
    const classified = classifyJob(job);
    expect(classified.salaryScore).toBeGreaterThan(0);
  });

  it("computes salaryScore = 0 when no salary", () => {
    const job = makeRawJob({});
    const classified = classifyJob(job);
    expect(classified.salaryScore).toBe(0);
  });

  it("generates a hash", () => {
    const job = makeRawJob({});
    const classified = classifyJob(job);
    expect(classified.hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("sets companyIndustry to null (deterministic mode)", () => {
    const job = makeRawJob({});
    const classified = classifyJob(job);
    expect(classified.companyIndustry).toBeNull();
  });
});
