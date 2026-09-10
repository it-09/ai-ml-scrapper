import { BaseLlmProvider } from "./base-provider.js";

export class OpenRouterProvider extends BaseLlmProvider {
  constructor() {
    super({
      name: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      model: "meta-llama/llama-3.1-8b-instruct:free",
      apiKeyEnvVar: "OPENROUTER_API_KEY",
      extraHeaders: {
        "HTTP-Referer": "https://apify.com/store",
        "X-Title": "AI Jobs Intelligence",
      },
    });
  }
}
