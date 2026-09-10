# AI/ML Job Scraper

[![Version](https://img.shields.io/badge/version-2.5.1-blue)](https://github.com/it-09/ai-ml-scrapper)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)
[![Build](https://img.shields.io/badge/build-passing-brightgreen)](https://apify.com/lissome_dancer/ai-ml-jobs-scraper)

Scrape AI and ML job listings from 200+ companies including OpenAI, Anthropic, Google, Meta, Stripe, and Vercel. This machine learning job tracker scrapes Greenhouse, Lever, RemoteOK, WeWorkRemotely, YC Work at a Startup, Otta, and Ashby in parallel. Get structured data with skills, frameworks, salary ranges, experience levels, and optional AI-powered enrichment — all in one run.

---

## How to Scrape AI and ML Job Listings

1. **Configure inputs** — select sources, add keyword filters, enable AI enrichment
2. **Run the actor** — scrapes all sources in parallel, classifies every job
3. **Get results** — structured JSON with company, title, skills, salary, apply URL
4. **Set up alerts** — webhook notifications for new matching jobs

---

## What You Get

- **200+ companies** — OpenAI, Anthropic, Google, Meta, Stripe, Vercel, and 200+ more
- **7 sources** — Greenhouse, Lever, RemoteOK, WeWorkRemotely, YC, Otta, Ashby
- **AI-powered classification** — skills, AI frameworks, LLM technologies, experience level, visa sponsorship
- **Change detection** — track new, updated, and removed jobs between runs
- **Webhook alerts** — get notified on Slack/Discord when matching jobs appear
- **Analytics summary** — top companies, skills, salary ranges, remote percentage

---

## Sample Output

```json
{
  "hash": "a1b2c3d4...",
  "source": "greenhouse",
  "company": "Anthropic",
  "companyWebsite": "https://anthropic.com",
  "title": "Research Engineer, Interpretability",
  "department": "Research",
  "location": "San Francisco, CA",
  "remote": false,
  "salaryMin": 200000,
  "salaryMax": 350000,
  "skills": ["Python", "PyTorch", "JAX"],
  "aiFrameworks": ["PyTorch", "JAX"],
  "llmTech": ["LLM", "fine-tuning", "embeddings"],
  "experienceLevel": "senior",
  "aiRelevanceScore": 88,
  "changeType": "created",
  "applyUrl": "https://boards.greenhouse.io/anthropic/jobs/12345"
}
```

---

## AI Job Market Data and Analytics

Every run generates an analytics summary stored in the key-value store:

```json
{
  "totalJobs": 1247,
  "topCompanies": [
    { "name": "OpenAI", "count": 45 },
    { "name": "Anthropic", "count": 32 },
    { "name": "Google", "count": 28 }
  ],
  "topSkills": [
    { "skill": "Python", "count": 890 },
    { "skill": "PyTorch", "count": 567 },
    { "skill": "TensorFlow", "count": 345 }
  ],
  "salaryRanges": { "min": 80000, "max": 450000, "median": 185000 },
  "remotePercentage": 62
}
```

---

## Track Machine Learning Engineer Salaries

The actor detects salary ranges from job descriptions and normalizes them to USD. Filter by minimum salary to find high-paying roles:

```json
{
  "alertMinSalary": 200000,
  "sources": ["greenhouse", "lever"],
  "webhookUrl": "https://hooks.slack.com/services/..."
}
```

---

## How Much Does It Cost?

**Pay per event pricing:**

| What You Pay For | Price |
|------------------|-------|
| **Per 1,000 jobs scraped** | $1.00 |
| **Per 1,000 AI-enriched jobs** | $2.00 |
| **Actor start** | $0.05 (infrequent) |

**Example:** Scraping 500 jobs with AI enrichment costs ~$1.50 total.

**Free tier includes:** 100 jobs, 2 sources (Greenhouse + RemoteOK), no AI enrichment.

---

## Input Configuration

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `sources` | `string[]` | All 7 | Which job boards to scrape |
| `keywords` | `string[]` | `[]` | Filter by keywords (e.g., "Python", "LLM") |
| `companies` | `string[]` | `[]` | Filter by company name |
| `experienceLevels` | `string[]` | `[]` | Filter by level: `intern`, `entry`, `mid`, `senior`, `staff`, `lead`, `executive` |
| `parseAllResults` | `boolean` | `false` | Ignore maxItems and scrape all available jobs |
| `classifyWithAI` | `boolean` | `false` | Enable LLM enrichment |
| `classificationMode` | `string` | `"hybrid"` | `deterministic`, `hybrid`, or `ai` |
| `tier` | `string` | `"starter"` | `free`, `starter`, `pro`, or `enterprise` |
| `maxItems` | `integer` | `1000` | Max jobs per run |
| `detectChanges` | `boolean` | `true` | Track changes between runs |
| `proxy` | `boolean` | `false` | Use Apify Proxy for large runs |
| `customGreenhouseTokens` | `string[]` | `[]` | Add custom Greenhouse company tokens |
| `customLeverSlugs` | `string[]` | `[]` | Add custom Lever company slugs |
| `alertKeywords` | `string[]` | `[]` | Trigger webhook on jobs matching these keywords |
| `alertMinSalary` | `integer` | `0` | Trigger webhook on jobs above this salary |
| `webhookUrl` | `string` | `""` | Slack/Discord webhook for alerts |

---

## Classification Modes

| Mode | API Calls | Speed | Best For |
|------|-----------|-------|----------|
| **Deterministic** | 0 | Fast | High-frequency scheduled runs |
| **Hybrid** | ~20-40% of jobs | Medium | Most use cases (recommended) |
| **AI** | Every job | Slow | Deep market analysis |

---

## What Data Gets Classified

- **Skills** — Python, TypeScript, PyTorch, TensorFlow, etc.
- **AI Frameworks** — PyTorch, JAX, Hugging Face, LangChain, etc.
- **LLM Technologies** — GPT, Claude, Llama, fine-tuning, RAG, etc.
- **Experience Level** — entry, mid, senior, lead, principal
- **Salary Range** — min/max in USD
- **Remote Status** — fully remote, hybrid, on-site
- **Visa Sponsorship** — detected from job descriptions

---

## Webhook Alerts

Set `webhookUrl` to get notified when new jobs match your criteria:

```json
{
  "sources": ["greenhouse", "lever"],
  "keywords": ["Python", "LLM"],
  "alertKeywords": ["senior", "staff"],
  "alertMinSalary": 200000,
  "webhookUrl": "https://hooks.slack.com/services/..."
}
```

**Supported:** Slack, Discord, or any HTTP endpoint accepting JSON.

---

## Filtering

Combine multiple filters to narrow results:

```json
{
  "keywords": ["machine learning", "LLM"],
  "companies": ["OpenAI", "Anthropic"],
  "experienceLevels": ["senior", "staff", "lead"],
  "alertMinSalary": 200000
}
```

**Experience levels available:**

| Level | Matches |
|-------|---------|
| `intern` | Intern, internship |
| `entry` | Entry-level, junior, associate |
| `mid` | Mid-level |
| `senior` | Senior, Sr., III, IV |
| `staff` | Staff, Principal |
| `lead` | Lead, Manager, Head of, Director |
| `executive` | VP, Chief, CTO |

**Filter behavior:** Inclusive (OR) — selecting `senior` + `staff` shows jobs matching either level. Jobs with no detected level are excluded when filter is active.

---

## Use Cases

- **Job seekers** — find AI/ML roles across all major companies in one search
- **Recruiters** — monitor competitor hiring and track open positions
- **Market researchers** — analyze AI job trends, salary benchmarks, skill demand
- **AI teams** — track which companies are hiring for specific AI specializations

---

## Scheduling

Schedule recurring runs to track the AI job market:

| Use Case | Frequency | Tier |
|----------|-----------|------|
| Job seeker | Every 6 hours | Starter |
| Recruiter | Every 12 hours | Pro |
| Market researcher | Weekly | Enterprise |
| Real-time alerts | Every 1 hour | Enterprise |

---

## API Access

Every run generates a dataset accessible via the Apify API:

```bash
# Get results
curl "https://api.apify.com/v2/datasets/{DATASET_ID}/items?format=json"

# Get analytics
curl "https://api.apify.com/v2/key-value-stores/{KV_ID}/records/ANALYTICS"
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | Optional | For AI enrichment (fast, free tier available) |
| `OPENROUTER_API_KEY` | Optional | For AI enrichment (flexible model selection) |

---

## FAQ

**Is this legal?**
Yes. This actor only accesses publicly available job postings from official APIs (Greenhouse, Lever) and public job boards. No authentication or login is required.

**How fresh is the data?**
Each run scrapes the latest listings from all sources. For real-time tracking, schedule runs every 1-6 hours.

**Can I add my own companies?**
Yes. Use `customGreenhouseTokens` and `customLeverSlugs` to add companies not in the built-in list.

**What if a source fails?**
One source failing doesn't crash the actor. You'll get a warning in the logs and results from the remaining sources.

**How does AI enrichment work?**
When enabled, the actor sends each job description to an LLM (Groq or OpenRouter) which extracts structured data: skills, frameworks, experience level, salary normalization, and more. This adds ~$0.002 per job.

**Is there input validation?**
Yes. Keywords and company names are limited to 200 characters each, with a maximum of 50 items per array. Webhook URLs are validated and blocked from pointing to private/internal networks (SSRF protection).

---

## Security

- **SSRF protection** — Webhook URLs pointing to localhost or private IPs are blocked
- **Input validation** — Max 200 chars per string, 50 items per array
- **No secrets logged** — API keys and proxy credentials are never exposed in logs
- **Concurrency limits** — API requests are throttled (15 concurrent) to prevent rate limiting

---

## Changelog

- **v2.5.1** (2026-09): Fix TypeScript errors from type changes
- **v2.5.0** (2026-09): Critical fixes, performance, security, monetization — 53 issues resolved
- **v2.4.0** (2026-09): Added Otta and Ashby sources (200+ companies, 7 sources)
- **v2.1.0** (2026-09): Output schema, dataset schema, PPE monetization, SEO optimization
- **v2.0.0** (2026-09): AI enrichment, change detection, webhook alerts, batch processing
- **v1.0.0** (2026-08): Initial release with 5 sources, deterministic classification

---

## Development

### Prerequisites

- Node.js >= 22
- npm or yarn
- Apify account (for deployment)

### Setup

```bash
git clone https://github.com/it-09/ai-ml-scrapper.git
cd ai-ml-scrapper/apify-actor
npm install
```

### Commands

```bash
npm run build      # Compile TypeScript
npm test           # Run tests (vitest)
npm run typecheck  # Type checking
npm run dev        # Run locally with Apify CLI
```

### Testing

```bash
npm test           # Run all tests
npm test -- --watch  # Watch mode
```

### Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'Add my feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

---

## License

MIT — see [LICENSE](./LICENSE) for details.
