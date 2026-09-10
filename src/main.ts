import { Actor, log } from "apify";
import { InputSchema } from "./lib/input-schema.js";
import { runIngestion } from "./lib/jobs/ingest.js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pkg = JSON.parse(readFileSync(join(__dirname, "..", "package.json"), "utf-8"));

await Actor.main(async () => {
  try {
    await Actor.charge({ eventName: "apify-actor-start" });
  } catch (err) {
    log.warning("Actor start charge failed — continuing", { err: String(err) });
  }

  const rawInput = await Actor.getInput<unknown>();
  const parseResult = InputSchema.safeParse(rawInput ?? {});

  if (!parseResult.success) {
    const message = `Invalid input: ${parseResult.error.message}`;
    log.error(message, { issues: parseResult.error.issues });
    throw new Error(message);
  }

  const input = parseResult.data;

  let classifyWithAI = input.classifyWithAI;
  if (classifyWithAI && input.classificationMode !== "deterministic") {
    const envKey =
      input.llmProvider === "groq"
        ? process.env["GROQ_API_KEY"]
        : process.env["OPENROUTER_API_KEY"];
    if (!envKey) {
      const keyName =
        input.llmProvider === "groq" ? "GROQ_API_KEY" : "OPENROUTER_API_KEY";
      log.warning(
        `AI enrichment enabled but ${keyName} not set — switching to deterministic mode`,
        {},
      );
      classifyWithAI = false;
    }
  }

  log.info("Actor started", {
    sources: input.sources,
    maxItems: input.maxItems,
    classifyWithAI,
    classificationMode: input.classificationMode,
    llmProvider: classifyWithAI ? input.llmProvider : "none",
    detectChanges: input.detectChanges,
    proxy: input.proxy,
  });

  let proxyUrl: string | undefined;
  if (input.proxy) {
    try {
      const proxyConfiguration = await Actor.createProxyConfiguration();
      proxyUrl = proxyConfiguration
        ? await proxyConfiguration.newUrl()
        : undefined;
      if (proxyUrl) log.info("Proxy configured successfully", {});
    } catch (err) {
      log.warning("Proxy setup failed — running without proxy", {
        err: String(err),
      });
    }
  }

  const summary = await runIngestion({
    input: { ...input, classifyWithAI },
    proxyUrl,
  });

  try {
    const kv = await Actor.openKeyValueStore();
    await kv.setValue("LAST_RUN_SUMMARY", {
      ...summary,
      actorVersion: pkg.version,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    log.warning("Failed to save run summary to KV", { err: String(err) });
  }

  log.info("Actor completed successfully.", {
    jobsOutput: summary.jobsOutput,
    jobsNew: summary.jobsNew,
    jobsUpdated: summary.jobsUpdated,
    jobsRemoved: summary.jobsRemoved,
  });
});
