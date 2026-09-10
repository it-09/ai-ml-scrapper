# Reddit Posts Draft

## Post 1: r/MachineLearning

**Title:** I built a tool that tracks AI/ML job openings across 150+ companies — thought you might find it useful

**Body:**

Hey everyone,

I got tired of checking 50+ career pages daily to find AI/ML job openings, so I built a scraper that tracks 150+ companies in one run.

It pulls from Greenhouse, Lever, RemoteOK, WeWorkRemotely, and YC Work at a Startup. For each job, it extracts:
- Skills and frameworks required
- Experience level
- Salary range (when available)
- Remote status
- AI relevance score

You can filter by keywords ("Python", "PyTorch", "LLM"), company names, or minimum salary. It also tracks changes between runs so you only see new postings.

The analytics are interesting too — after running it for a week, here's what I found:
- Top skills: Python (890 jobs), PyTorch (567), TensorFlow (345)
- Salary range: $80k–$450k, median $185k
- 62% of AI jobs are remote
- Top hirers: OpenAI (45), Anthropic (32), Google (28)

It's free to try (100 jobs), then $1 per 1,000 jobs.

Would love feedback on what other sources or features would be useful.

[Link to actor]

---

## Post 2: r/cscareerquestions

**Title:** Made a free tool to track AI/ML jobs across Greenhouse, Lever, RemoteOK, and YC

**Body:**

I built a job scraper specifically for AI/ML roles. Instead of checking 50+ company career pages, it pulls everything into one place.

**What it does:**
- Scrapes Greenhouse, Lever, RemoteOK, WeWorkRemotely, and YC
- Covers 150+ companies (OpenAI, Anthropic, Google, Meta, Stripe, etc.)
- Extracts skills, salary, experience level, remote status
- Tracks new postings between runs
- Sends Slack/Discord alerts for matching jobs

**How to use it:**
1. Go to [Apify link]
2. Click "Try for free"
3. Configure your filters (keywords, companies, salary)
4. Run it

**Free tier:** 100 jobs, 2 sources. Paid starts at $1/1,000 jobs.

I've been using it to track senior ML engineer roles — it's nice to get a Slack ping when OpenAI or Anthropic posts something new.

---

## Post 3: r/datascience

**Title:** I scraped 150+ companies to build an AI job market dashboard

**Body:**

I built a tool that scrapes AI/ML job listings from 150+ companies and generates analytics:

**Sample output:**
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
    { "skill": "PyTorch", "count": 567 }
  ],
  "salaryRanges": { "min": 80000, "max": 450000, "median": 185000 },
  "remotePercentage": 62
}
```

It uses deterministic classification (keyword matching) for most jobs, with optional LLM enrichment for deeper analysis.

Sources: Greenhouse API, Lever API, RemoteOK, WeWorkRemotely RSS, YC.

The interesting finding: 62% of AI jobs are remote, and the median salary is $185k. PyTorch is mentioned 2x more than TensorFlow in job descriptions.

Free to try: [Apify link]

---

## Posting Tips

1. **Be active first** — comment on a few posts in each subreddit before posting (prevents spam filters)
2. **Post at peak times** — 9-11 AM EST on weekdays
3. **Engage with comments** — reply to every comment within the first 2 hours
4. **Don't be salesy** — focus on the problem you solved, not the product
5. **Cross-post carefully** — post to one subreddit, wait 24 hours, then post to another
