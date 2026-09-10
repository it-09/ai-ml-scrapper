import { withRetry, fetchWithTimeout } from "../retry.js";
import { buildEnrichmentPrompt } from "./prompt.js";
import { parseEnrichmentResponse } from "./parse.js";
import type { ClassifiedJob } from "../jobs/types.js";
import type { AIEnrichment, AIProvider } from "./types.js";

const TIMEOUT_MS = 30_000;

interface ChatCompletionResponse {
  choices: Array<{
    message: { content: string };
  }>;
}

export interface LlmProviderConfig {
  name: string;
  baseUrl: string;
  model: string;
  apiKeyEnvVar: string;
  extraHeaders?: Record<string, string>;
}

export class BaseLlmProvider implements AIProvider {
  readonly name: string;
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly extraHeaders: Record<string, string>;

  constructor(config: LlmProviderConfig) {
    this.name = config.name;
    this.baseUrl = config.baseUrl;
    this.model = config.model;
    this.extraHeaders = config.extraHeaders ?? {};

    const key = process.env[config.apiKeyEnvVar];
    if (!key) throw new Error(`${config.apiKeyEnvVar} environment variable is not set`);
    this.apiKey = key;
  }

  async enrich(job: ClassifiedJob): Promise<AIEnrichment> {
    return withRetry(
      async () => {
        const response = await fetchWithTimeout(
          `${this.baseUrl}/chat/completions`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              "Content-Type": "application/json",
              ...this.extraHeaders,
            },
            body: JSON.stringify({
              model: this.model,
              messages: [{ role: "user", content: buildEnrichmentPrompt(job) }],
              response_format: { type: "json_object" },
              temperature: 0.1,
              max_tokens: 1200,
            }),
          },
          TIMEOUT_MS,
        );

        if (response.status === 429) {
          throw new Error(`${this.name} rate limit hit — will retry with backoff`);
        }
        if (!response.ok) {
          throw new Error(
            `${this.name} API error: ${response.status} ${response.statusText}`,
          );
        }

        const data = (await response.json()) as ChatCompletionResponse;
        const content = data.choices[0]?.message?.content;
        if (!content) throw new Error(`Empty response from ${this.name}`);

        return parseEnrichmentResponse(content, "llm");
      },
      { maxAttempts: 3, baseDelayMs: 2000 },
    );
  }
}
