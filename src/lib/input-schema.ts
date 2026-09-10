import { z } from "zod";

export const InputSchema = z.object({
  sources: z
    .array(z.enum(["greenhouse", "lever", "remoteok", "weworkremotely", "yc", "otta", "ashby"]))
    .min(1)
    .default(["greenhouse", "lever", "remoteok", "weworkremotely", "yc", "otta", "ashby"]),
  keywords: z.array(z.string().max(200)).max(50).default([]),
  companies: z.array(z.string().max(100)).max(50).default([]),
  experienceLevels: z
    .array(
      z.enum(["intern", "entry", "mid", "senior", "staff", "lead", "executive"]),
    )
    .max(7)
    .default([]),
  customGreenhouseTokens: z.array(z.string().max(100)).max(100).default([]),
  customLeverSlugs: z.array(z.string().max(100)).max(100).default([]),
  parseAllResults: z.boolean().default(false),
  classifyWithAI: z.boolean().default(false),
  classificationMode: z
    .enum(["deterministic", "hybrid", "ai"])
    .default("hybrid"),
  llmProvider: z.enum(["groq", "openrouter"]).default("groq"),
  tier: z.enum(["free", "starter", "pro", "enterprise"]).default("starter"),
  maxItems: z.number().int().min(1).max(50_000).default(1000),
  detectChanges: z.boolean().default(true),
  proxy: z.boolean().default(false),
  alertKeywords: z.array(z.string().max(200)).max(50).default([]),
  alertMinSalary: z.number().int().min(0).default(0),
  webhookUrl: z.string().url().or(z.literal("")).default(""),
});

export type ApifyInput = z.infer<typeof InputSchema>;
