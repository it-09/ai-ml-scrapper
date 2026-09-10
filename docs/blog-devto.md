# I Built an AI Job Scraper That Tracks 150+ Companies — Here's How

The AI job market is booming, but there's no single place to track all openings. I found myself checking OpenAI's careers page, then Anthropic's, then Google's, then scrolling through LinkedIn... and still missing roles at smaller companies.

So I built a tool that scrapes AI and ML job listings from 150+ companies in one run.

## The Problem

Every AI company posts jobs on their own career page. Some use Greenhouse, some use Lever, some have custom boards. If you're job hunting or doing market research, you're checking 50+ tabs daily.

I wanted one tool that:
1. Scrapes all major AI job boards in parallel
2. Extracts structured data (skills, salary, experience level)
3. Tracks changes between runs (new jobs, removed jobs)
4. Sends alerts when matching jobs appear

## The Architecture

The actor runs on [Apify](https://apify.com/store) — a platform for web scraping and automation. Here's how it works:

```
┌─────────────────────────────────────────────┐
│              Input Configuration            │
│  sources, keywords, companies, AI settings  │
└─────────────────┬───────────────────────────┘
                  │
    ┌─────────────┼─────────────┐
    ▼             ▼             ▼
┌────────┐  ┌────────┐  ┌────────┐
│Greenhouse│ │ Lever  │  │RemoteOK│  ... (5 sources)
│  API    │  │  API   │  │  JSON  │
└────┬───┘  └────┬───┘  └────┬───┘
     │           │           │
     └───────────┼───────────┘
                 ▼
    ┌────────────────────────┐
    │   Classification       │
    │  Skills, Frameworks,   │
    │  Experience, Salary    │
    └───────────┬────────────┘
                │
    ┌───────────┼───────────┐
    ▼           ▼           ▼
┌────────┐ ┌────────┐ ┌────────┐
│Dataset │ │  KV    │ │Webhook │
│ Results│ │Analytics│ │ Alerts │
└────────┘ └────────┘ └────────┘
```

## Key Technical Decisions

### 1. Parallel Scraping

All 5 sources run concurrently using `Promise.all()`. If one source fails, the others continue. Each source has its own adapter with retry logic:

```typescript
// src/lib/jobs/adapters/greenhouse.ts
export async function fetchGreenhouseJobs(
  customTokens?: string[],
  fetcher: Fetcher = fetch,
): Promise<RawJob[]> {
  const tokens = customTokens ?? GREENHOUSE_COMPANY_TOKENS;
  const results: RawJob[] = [];

  await Promise.all(
    tokens.map(async (token) => {
      try {
        const url = `https://boards-api.greenhouse.io/v1/boards/${token}/jobs`;
        const response = await fetcher(url, {
          headers: { "User-Agent": "ai-jobs-intelligence-actor/1.0" },
        });
        // ... parse and return jobs
      } catch (err) {
        logger.warn("Greenhouse adapter failed", { token, err: String(err) });
      }
    }),
  );

  return results;
}
```

### 2. Deterministic Classification

Before using any LLM, I built a keyword-based classifier that runs instantly and costs nothing. It matches job descriptions against a taxonomy of 200+ skills:

```typescript
// src/lib/jobs/classify.ts
const SKILL_TAXONOMY: Record<SkillCategory, string[]> = {
  languages: ["python", "typescript", "rust", "go", "java", "c++"],
  frameworks: ["pytorch", "tensorflow", "jax", "langchain", "llamaindex"],
  llmTech: ["gpt", "claude", "llama", "fine-tuning", "rag", "embeddings"],
  // ... 200+ entries
};
```

This handles 60-80% of jobs accurately. Only uncertain jobs go to the LLM (hybrid mode).

### 3. Change Detection

The actor persists a state map in the key-value store. On each run, it compares current jobs against previous state:

```typescript
// New job: not in previous state
if (!previous || previous.status === "removed") {
  changeType = "created";
}
// Updated job: same hash, different title
else if (previous.title !== job.title) {
  changeType = "updated";
}
// Removed job: in previous state but not in current
else if (!currentState[hash]) {
  jobsRemoved++;
}
```

### 4. AI Enrichment (Optional)

When enabled, each job gets sent to Groq's LLM (free tier, ~30ms response). The LLM extracts:
- Job category (ML Engineer, Data Scientist, etc.)
- Programming languages required
- AI frameworks needed
- Experience level
- Salary normalization to USD

## The Numbers

After running it for a week:
- **1,247 unique AI jobs** tracked across 150+ companies
- **Top skills:** Python (890), PyTorch (567), TensorFlow (345)
- **Salary range:** $80k – $450k, median $185k
- **Remote percentage:** 62%
- **Top hirers:** OpenAI (45), Anthropic (32), Google (28)

## What I Learned

1. **Greenhouse and Lever have public APIs** — most companies using these boards expose their jobs via JSON endpoints. No scraping HTML needed.

2. **Keyword classification is underrated** — a simple keyword matcher handles most jobs. LLMs are only needed for ambiguous cases.

3. **Change detection is the killer feature** — users don't want to browse 1,000 jobs. They want to know "what's new since yesterday."

4. **Pricing matters** — at $1 per 1,000 jobs, the tool is accessible to individual job seekers, not just enterprises.

## Try It Out

The actor is live on [Apify Store](https://apify.com/lissome_dancer/ai-jobs-intelligence). Free tier includes 100 jobs.

**Quick start:**
1. Go to the actor page
2. Click "Try for free"
3. Configure your sources and keywords
4. Hit "Run"

**Pro tip:** Set up a schedule to run every 6 hours and add a Slack webhook for alerts. You'll never miss an AI job opening again.

---

**Tags:** #webdev #api #automation #machinelearning
