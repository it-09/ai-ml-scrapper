import { BaseLlmProvider } from "./base-provider.js";

export class GroqProvider extends BaseLlmProvider {
  constructor() {
    super({
      name: "groq",
      baseUrl: "https://api.groq.com/openai/v1",
      model: "llama-3.1-8b-instant",
      apiKeyEnvVar: "GROQ_API_KEY",
    });
  }
}
