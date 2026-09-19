# Changelog

All notable changes to the AI Jobs Intelligence Platform are documented here.

---

## [2.7.0] — 2026-09-19

### Fixed

- **Per-request timeout protection** — all 7 adapters now wrap fetcher calls with `withTimeout()` (30s AbortController), preventing individual hung API requests from blocking the entire run.
- **`parseEnrichmentResponse` crash** — wrapped `JSON.parse()` in try/catch with descriptive error message for malformed LLM responses.
- **Top-level error handling** — ingestion pipeline errors in `main.ts` now caught and logged with context before re-throwing.
- **Memory optimization** — sources processed sequentially instead of `Promise.all()`, reducing peak memory by ~70%. Buffer flushed between sources on high memory.
- **`fetchSourceJobs` parameter gap** — now passes `customAshbySlugs` and `customOttaSlugs` to adapter context.

### Added

- `withTimeout()` utility (`src/lib/with-timeout.ts`) — wraps any `Fetcher` with per-request AbortController timeout, supports merged outer signals via `AbortSignal.any()`.
- `customAshbySlugs` and `customOttaSlugs` input fields — allows users to specify custom Ashby and Otta company slugs via the Apify input schema.
- `with-timeout.test.ts` — unit tests for the timeout wrapper.

### Changed

- Sequential source processing pipeline replaces parallel `Promise.all()` — each source is fetched, filtered, deduplicated, enriched, and streamed to dataset before the next source begins.
- Adapter `fetcher` default parameter still `fetch` but always wrapped with `withTimeout()` as defense-in-depth.

---

## [2.6.0] — 2026-09-18

### Added

- Memory monitoring with `getMemoryUsageMB()` and `MEMORY_WARNING_THRESHOLD_MB` (400 MB).
- `MAX_RUNTIME_SECONDS = 240` — hard limit prevents runaway runs from consuming excess compute.
- Buffer-based dataset writes with `BATCH_SIZE = 100`.
- `Actor.setStatusMessage()` calls throughout pipeline for real-time progress visibility.
- `withRetry()` wrapping `Actor.openDataset()` and `Actor.openKeyValueStore()` for transient failures.
- PPE billing: `Actor.charge()` for `apify-actor-start` and `apify-default-dataset-item` events.

---

## [2.5.1] — 2026-09-08

### Fixed

- TypeScript build errors caused by Phase 8 type changes (`postedDate`, `parseAllResults`, `webhookUrl` required fields).
- Added missing fields to test fixtures in `enrichment.test.ts`, `classify.test.ts`, and `ingest.test.ts`.

---

## [2.5.0] — 2026-09-08

### Fixed

- `rawJobs` exhaustive switch — no silent drops on unknown sources.
- Batch flushing race condition — collect per-worker, flush sequentially.
- `parseAllResults` feature — ignore maxItems and scrape all available jobs.
- Version mismatches synced across `package.json`, `actor.json`, `main.ts`.
- RunId collision — use `randomUUID()` instead of fixed prefix.

### Added

- Concurrency limits (15) for Greenhouse, Lever, Ashby, and Otta adapters.
- Shared `concurrency.ts` utility for parallel adapter execution.
- SSRF protection for webhook URLs — blocks localhost and private IPs.
- Input length validation — max 200 chars per string, 50 items per array.
- `Actor.charge()` for actor start (`apify-actor-start`) and dataset items (`apify-default-dataset-item`).
- Adapter registry pattern (`adapterRegistry` in `registry.ts`).
- `fetchSourceJobs()` simplified to use registry.

### Changed

- Otta adapter converted from sequential to parallel fetching.
- `stripHtml` do-while loop removed — single-pass implementation.
- ProxyAgent created once and reused (was per-request).
- `computeAnalytics` sort on copy to avoid mutating input.

---

## [2.4.0] — 2026-09-08

### Added — Otta (Welcome to the Jungle) source

- `src/lib/jobs/adapters/otta.ts` — New adapter fetching from Otta's public API. Includes salary data (84% of listings), tech stack, experience levels, and company intel.
- 50+ companies tracked: Stripe, Monzo, Anthropic, Revolut, Spotify, and more.

### Added — Ashby source

- `src/lib/jobs/adapters/ashby.ts` — New adapter fetching from Ashby's official Job Posting API. Includes compensation data when companies publish salary bands.
- 80+ companies tracked: OpenAI, Linear, Ramp, Notion, Vercel, and more.

### Changed — Source count increased from 5 to 7

- Updated `SourceName` type to include `"otta"` and `"ashby"`.
- Updated `InputSchema` to include new sources in the sources enum.
- Updated `TIER_SOURCES` to include new sources for all tiers.

### Changed — Company coverage expanded to 200+

- Added 100+ new company URLs to `company-urls.ts`.
- New companies include: Checkout, N26, Monzo, Anduril, Deliveroo, Height, Shortcut, and more.

---

## [2.0.0] — 2026-09-05

### Added — YC Work at a Startup source

- `src/lib/jobs/adapters/yc.ts` — New adapter fetching from YC Work at a Startup API (`workatastartup.com/api/jobs`). Includes salary data and apply URLs.

### Added — AI enrichment layer

- Three classification modes: `deterministic` (free, keyword-only), `hybrid` (LLM for uncertain jobs), `ai` (LLM for every job).
- LLM providers: Groq (`llama-3.1-8b-instant`) and OpenRouter (`meta-llama/llama-3.1-8b-instruct:free`).
- Structured enrichment with 19 fields: skills, frameworks, experience level, salary estimate, etc.

### Added — Pay-per-event monetization

- PPE pricing with `apify-actor-start` and `apify-default-dataset-item` synthetic events.
- Custom `ai-enrichment` event for LLM-enriched jobs.

### Added — Change detection

- Incremental runs with state persisted in Key-Value Store.
- Jobs tagged as `created`, `updated`, `unchanged`, or `removed` between runs.

### Added — Webhook alerts

- Slack/Discord webhook notifications for new matching jobs.
- Configurable alert keywords and minimum salary thresholds.

### Added — Tiered access

- Free (100 jobs, 2 sources), Starter (1K jobs), Pro (5K jobs, AI), Enterprise (50K jobs).

### Changed — Complete rewrite from Express server to Apify Actor

- Migrated from Drizzle ORM + PostgreSQL to Apify Dataset + Key-Value Store.
- All source adapters now accept proxy-aware fetcher injection.
- Input validation via Zod schema.

---

## [1.0.0] — 2026-07-05

### Added — Apify Actor structure

- `src/main.ts` — Apify Actor entrypoint using `Actor.main()`. Reads typed input via Zod schema, validates configuration, sets up proxy, runs ingestion pipeline, and persists run summary to Key-Value Store.
- `INPUT_SCHEMA.json` — Apify platform input schema with UI field definitions, select editors, and defaults.
- `.actor/actor.json` — Actor manifest with build tag, environment variable declarations, and file references.
- `Dockerfile` — Production container image using `apify/actor-node:22` base image.

### Added — AI enrichment layer

- `src/lib/ai/types.ts` — `AIProvider` interface and `AIEnrichment` type. Defines the enrichment contract that both providers implement.
- `src/lib/ai/groq-provider.ts` — `GroqProvider` class using Groq's OpenAI-compatible chat completions API (`llama-3.1-8b-instant` model). Includes retry, timeout, and JSON response validation.
- `src/lib/ai/openrouter-provider.ts` — `OpenRouterProvider` class using OpenRouter API. Same interface as Groq, allowing providers to be swapped via input config.
- `src/lib/ai/prompt.ts` — Structured LLM prompt builder. Requests a JSON object with 19 enrichment fields. Description truncated to 2500 characters to control token usage.
- `src/lib/ai/parse.ts` — `parseEnrichmentResponse()` using Zod for LLM output validation. All fields are optional to handle partial/malformed LLM responses gracefully.
- `src/lib/ai/enrichment.ts` — `createEnricher()` factory implementing three classification modes:
  - `deterministic`: always returns `null` (no LLM calls)
  - `hybrid`: skips LLM for high-confidence jobs (aiRelevanceScore ≥ 40, skills detected, experience level detected)
  - `ai`: sends every job to the LLM
  - Wraps all LLM calls in try/catch — LLM failure never propagates to the caller.

### Changed — Ingestion pipeline (DB → Apify native)

- `src/lib/jobs/ingest.ts` — Complete rewrite removing all Drizzle ORM / PostgreSQL dependencies. Key changes:
  - Change detection now uses `Actor.openKeyValueStore()` with a `STATE` key storing a hash-map of `StateEntry` objects between runs.
  - Job persistence uses `Actor.openDataset()` → `dataset.pushData()` instead of SQL INSERT/UPDATE.
  - Per-source fetching wrapped in `withRetry()` — one source failing after 3 attempts is skipped with a warning, not a crash.
  - Partial-source run protection preserved: only marks jobs as `removed` if all their known sources were part of this run.
  - Added `applyFilters()` for keyword and company input filters.
  - Added `buildOutputRecord()` producing flat, schema-consistent dataset records.
  - Run summary includes `jobsFiltered`, `jobsOutput` fields in addition to existing counts.

### Added — Infrastructure utilities

- `src/lib/retry.ts` — `withRetry<T>()` with exponential backoff, jitter, and configurable max attempts. `fetchWithTimeout()` using `AbortController` for per-request timeout enforcement.
- `src/lib/fetcher.ts` — `createFetcher(proxyUrl?)` returning a proxy-aware fetch wrapper. Uses `undici.ProxyAgent` when a proxy URL is provided; falls back to global `fetch` otherwise.
- `src/lib/logger.ts` — Thin wrapper mapping pino-style `(data, msg)` calls to `Actor.log.info/warning/error/debug()` calls. Preserves the existing adapter calling convention.
- `src/lib/input-schema.ts` — Zod schema and inferred `ApifyInput` type. Single source of truth for input validation used by both `main.ts` and `ingest.ts`.

### Migrated — Source adapters (unchanged logic)

All four source adapters are functionally identical to the previous Express-server versions. Only changes:
- Logger import updated from `pino` singleton to `Actor.log` wrapper (`src/lib/logger.ts`).
- Each adapter now accepts an optional `fetcher: Fetcher` parameter (defaults to global `fetch`) enabling proxy injection.
- `err` objects cast to `String(err)` for serialization compatibility with `Actor.log`.

### Migrated — Classification pipeline (unchanged logic)

- `src/lib/jobs/classify.ts` — No logic changes. Import paths updated for NodeNext ESM resolution.
- `src/lib/jobs/taxonomy.ts` — Identical to previous version.
- `src/lib/jobs/dedupe.ts` — Identical to previous version.
- `src/lib/jobs/types.ts` — `SourceName` type moved here from `ingest.ts` to avoid circular imports.

### Removed

- `artifacts/jobs-dashboard/` — React + Vite frontend dashboard (replaced by Apify Dataset as the data delivery mechanism).
- `artifacts/api-server/` — Express 5 REST API server (replaced by `Actor.main()` entrypoint).
- `lib/db/` — Drizzle ORM + PostgreSQL schema (replaced by Apify KeyValueStore for state and Dataset for output).
- `lib/api-spec/` — OpenAPI 3.1 specification (no longer applicable — Actor uses structured dataset output).
- `lib/api-zod/` — Generated Zod schemas from OpenAPI spec (removed with api-spec).
- `lib/api-client-react/` — Generated React Query hooks (removed with dashboard).

### Changed — Build system

- Package moved to `apify-actor/` as a standalone workspace package (`@workspace/ai-jobs-actor`).
- TypeScript compiled with `tsc` directly (NodeNext module resolution, ESM output) instead of esbuild.
- `package.json` type set to `"module"` for native ESM compatibility with Apify SDK v3.
