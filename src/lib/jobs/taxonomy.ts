export const AI_FRAMEWORKS = [
  "TensorFlow",
  "PyTorch",
  "JAX",
  "Keras",
  "scikit-learn",
  "Hugging Face",
  "Transformers",
  "LangChain",
  "LangGraph",
  "LlamaIndex",
  "Haystack",
  "MCP",
  "AutoGen",
  "CrewAI",
  "Ray",
  "MLflow",
  "Kubeflow",
  "Triton",
  "ONNX",
  "spaCy",
  "XGBoost",
  "LightGBM",
  "CatBoost",
  "Dask",
  "Spark ML",
  "NVIDIA CUDA",
];

export const LLM_TECH = [
  "GPT-4",
  "GPT-5",
  "OpenAI",
  "Anthropic",
  "Claude",
  "Gemini",
  "Llama",
  "Mistral",
  "Cohere",
  "RAG",
  "retrieval-augmented generation",
  "fine-tuning",
  "prompt engineering",
  "LLM",
  "generative AI",
  "diffusion model",
  "embeddings",
  "vector search",
  "agentic",
  "AI agents",
];

export const VECTOR_DBS = [
  "Pinecone",
  "Weaviate",
  "Milvus",
  "Qdrant",
  "Chroma",
  "pgvector",
  "FAISS",
  "Elasticsearch",
  "Redis Vector",
];

export const AGENT_TOOLING = [
  "MCP",
  "Model Context Protocol",
  "LangGraph",
  "AutoGen",
  "CrewAI",
  "Semantic Kernel",
  "function calling",
  "tool use",
  "agent orchestration",
  "n8n",
  "Zapier",
];

export const CLOUD_PROVIDERS = [
  "AWS",
  "Amazon Web Services",
  "GCP",
  "Google Cloud",
  "Azure",
  "Snowflake",
  "Databricks",
  "Vercel",
  "Cloudflare",
  "Kubernetes",
  "Docker",
];

export const PROGRAMMING_LANGUAGES = [
  "Python",
  "TypeScript",
  "JavaScript",
  "Go",
  "Rust",
  "Java",
  "C++",
  "Scala",
  "SQL",
  "R",
  "Julia",
  "MATLAB",
  "Swift",
  "Bash",
  "Shell",
];

export const AI_RELEVANCE_KEYWORDS = [
  "machine learning",
  "artificial intelligence",
  "deep learning",
  "neural network",
  "llm",
  "large language model",
  "generative ai",
  "genai",
  "nlp",
  "natural language processing",
  "computer vision",
  "ml engineer",
  "ai engineer",
  "ai research",
  "data scientist",
  "mlops",
];

export const SENIORITY_PATTERNS: Array<{
  level: string;
  patterns: RegExp[];
}> = [
  { level: "intern", patterns: [/\bintern(ship)?\b/i] },
  {
    level: "entry",
    patterns: [/\bentry[- ]level\b/i, /\bjunior\b/i, /\bassociate\b/i],
  },
  {
    level: "senior",
    patterns: [/\bsenior\b/i, /\bsr\.?\b/i, /\biii\b/i, /\biv\b/i],
  },
  { level: "staff", patterns: [/\bstaff\b/i, /\bprincipal\b/i] },
  {
    level: "lead",
    patterns: [/\blead\b/i, /\bmanager\b/i, /\bhead of\b/i, /\bdirector\b/i],
  },
  {
    level: "executive",
    patterns: [/\bvp\b/i, /\bvice president\b/i, /\bchief\b/i, /\bcto\b/i],
  },
  { level: "mid", patterns: [/\bmid[- ]level\b/i, /\bmid\b/i] },
];

export const VISA_SPONSORSHIP_POSITIVE = [
  /visa sponsorship (is |)available/i,
  /we (sponsor|do sponsor)/i,
  /sponsorship available/i,
  /h-?1b sponsorship/i,
  /able to sponsor/i,
];

export const VISA_SPONSORSHIP_NEGATIVE = [
  /no (visa )?sponsorship/i,
  /unable to sponsor/i,
  /not (able|eligible) to sponsor/i,
  /must be authorized to work/i,
  /without sponsorship/i,
];

export function findMatches(text: string, terms: string[]): string[] {
  const found = new Set<string>();
  const lower = text.toLowerCase();
  for (const term of terms) {
    const termLower = term.toLowerCase();
    if (termLower.length <= 3) {
      const re = new RegExp(`\\b${escapeRegExp(termLower)}\\b`, "i");
      if (re.test(text)) found.add(term);
    } else if (lower.includes(termLower)) {
      found.add(term);
    }
  }
  return Array.from(found);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
