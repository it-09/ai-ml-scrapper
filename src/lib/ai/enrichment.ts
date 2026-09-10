import { Actor, log } from "apify";
import type { ClassifiedJob } from "../jobs/types.js";
import type { AIEnrichment, AIProvider } from "./types.js";
import type { ApifyInput } from "../input-schema.js";
import { GroqProvider } from "./groq-provider.js";
import { OpenRouterProvider } from "./openrouter-provider.js";

const HIGH_CONFIDENCE_RELEVANCE = 40;
const HIGH_CONFIDENCE_SKILL_COUNT = 1;

function isHighConfidence(job: ClassifiedJob): boolean {
  return (
    job.aiRelevanceScore >= HIGH_CONFIDENCE_RELEVANCE &&
    (job.skills.length >= HIGH_CONFIDENCE_SKILL_COUNT ||
      job.aiFrameworks.length >= 1) &&
    job.experienceLevel !== null
  );
}

function createProvider(providerName: "groq" | "openrouter"): AIProvider {
  if (providerName === "groq") {
    return new GroqProvider();
  }
  return new OpenRouterProvider();
}

export type EnricherFn = (job: ClassifiedJob) => Promise<AIEnrichment | null>;

export function createEnricher(input: ApifyInput): EnricherFn {
  if (!input.classifyWithAI || input.classificationMode === "deterministic") {
    return async () => null;
  }

  let provider: AIProvider;
  try {
    provider = createProvider(input.llmProvider);
  } catch (err) {
    log.warning(
      "Could not initialize AI provider — falling back to deterministic mode",
      { err: String(err) },
    );
    return async () => null;
  }

  return async (job: ClassifiedJob): Promise<AIEnrichment | null> => {
    if (input.classificationMode === "hybrid" && isHighConfidence(job)) {
      return null;
    }

    try {
      const result = await provider.enrich(job);

      // PPE: charge for successful AI enrichment
      if (result) {
        const chargeResult = await Actor.charge({ eventName: "ai-enrichment" });
        if (chargeResult.eventChargeLimitReached) {
          log.info("AI enrichment spending limit reached", {});
        }
      }

      return result;
    } catch (err) {
      log.warning("AI enrichment failed — using deterministic result", {
        err: String(err),
        company: job.company,
        title: job.title,
      });
      return null;
    }
  };
}
