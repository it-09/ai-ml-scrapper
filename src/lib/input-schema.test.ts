import { describe, it, expect } from "vitest";
import { InputSchema } from "./input-schema.js";

describe("InputSchema", () => {
  it("applies defaults for empty input", () => {
    const result = InputSchema.safeParse({});
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.sources).toEqual([
      "greenhouse",
      "lever",
      "remoteok",
      "weworkremotely",
      "yc",
      "otta",
      "ashby",
    ]);
    expect(result.data.keywords).toEqual([]);
    expect(result.data.companies).toEqual([]);
    expect(result.data.experienceLevels).toEqual([]);
    expect(result.data.customGreenhouseTokens).toEqual([]);
    expect(result.data.customLeverSlugs).toEqual([]);
    expect(result.data.classifyWithAI).toBe(false);
    expect(result.data.classificationMode).toBe("hybrid");
    expect(result.data.llmProvider).toBe("groq");
    expect(result.data.tier).toBe("starter");
    expect(result.data.maxItems).toBe(1000);
    expect(result.data.detectChanges).toBe(true);
    expect(result.data.proxy).toBe(false);
    expect(result.data.alertKeywords).toEqual([]);
    expect(result.data.alertMinSalary).toBe(0);
  });

  it("accepts valid custom input", () => {
    const result = InputSchema.safeParse({
      sources: ["greenhouse", "yc"],
      keywords: ["python", "ml"],
      companies: ["openai"],
      customGreenhouseTokens: ["my-company"],
      customLeverSlugs: ["my-startup"],
      classifyWithAI: true,
      classificationMode: "ai",
      llmProvider: "openrouter",
      tier: "pro",
      maxItems: 5000,
      detectChanges: false,
      proxy: true,
      alertKeywords: ["ML Engineer"],
      alertMinSalary: 150000,
      webhookUrl: "https://hooks.slack.com/test",
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.sources).toEqual(["greenhouse", "yc"]);
    expect(result.data.keywords).toEqual(["python", "ml"]);
    expect(result.data.customGreenhouseTokens).toEqual(["my-company"]);
    expect(result.data.customLeverSlugs).toEqual(["my-startup"]);
    expect(result.data.classifyWithAI).toBe(true);
    expect(result.data.llmProvider).toBe("openrouter");
    expect(result.data.tier).toBe("pro");
    expect(result.data.alertKeywords).toEqual(["ML Engineer"]);
    expect(result.data.alertMinSalary).toBe(150000);
    expect(result.data.webhookUrl).toBe("https://hooks.slack.com/test");
  });

  it("rejects empty sources array", () => {
    const result = InputSchema.safeParse({ sources: [] });
    expect(result.success).toBe(false);
  });

  it("rejects invalid source name", () => {
    const result = InputSchema.safeParse({ sources: ["invalid"] });
    expect(result.success).toBe(false);
  });

  it("accepts yc as a valid source", () => {
    const result = InputSchema.safeParse({ sources: ["yc"] });
    expect(result.success).toBe(true);
  });

  it("rejects maxItems below minimum", () => {
    const result = InputSchema.safeParse({ maxItems: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects maxItems above maximum", () => {
    const result = InputSchema.safeParse({ maxItems: 50001 });
    expect(result.success).toBe(false);
  });

  it("rejects invalid classificationMode", () => {
    const result = InputSchema.safeParse({ classificationMode: "invalid" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid llmProvider", () => {
    const result = InputSchema.safeParse({ llmProvider: "invalid" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid tier", () => {
    const result = InputSchema.safeParse({ tier: "invalid" });
    expect(result.success).toBe(false);
  });

  it("accepts all experience level values", () => {
    for (const level of [
      "intern",
      "entry",
      "mid",
      "senior",
      "staff",
      "lead",
      "executive",
    ]) {
      const result = InputSchema.safeParse({ experienceLevels: [level] });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid experience level", () => {
    const result = InputSchema.safeParse({ experienceLevels: ["invalid"] });
    expect(result.success).toBe(false);
  });

  it("accepts all tier values", () => {
    for (const tier of ["free", "starter", "pro", "enterprise"]) {
      const result = InputSchema.safeParse({ tier });
      expect(result.success).toBe(true);
    }
  });

  it("rejects null input", () => {
    const result = InputSchema.safeParse(null);
    expect(result.success).toBe(false);
  });

  it("rejects undefined input", () => {
    const result = InputSchema.safeParse(undefined);
    expect(result.success).toBe(false);
  });

  it("rejects invalid webhookUrl", () => {
    const result = InputSchema.safeParse({ webhookUrl: "not-a-url" });
    expect(result.success).toBe(false);
  });

  it("accepts valid webhookUrl", () => {
    const result = InputSchema.safeParse({
      webhookUrl: "https://hooks.slack.com/services/test",
    });
    expect(result.success).toBe(true);
  });

  it("rejects negative alertMinSalary", () => {
    const result = InputSchema.safeParse({ alertMinSalary: -1 });
    expect(result.success).toBe(false);
  });
});
