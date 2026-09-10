import { describe, it, expect } from "vitest";
import {
  findMatches,
  AI_FRAMEWORKS,
  LLM_TECH,
  VECTOR_DBS,
  CLOUD_PROVIDERS,
  PROGRAMMING_LANGUAGES,
} from "./taxonomy.js";

describe("findMatches", () => {
  it("finds exact matches case-insensitively", () => {
    const text = "We use PyTorch and TensorFlow for deep learning";
    const matches = findMatches(text, AI_FRAMEWORKS);
    expect(matches).toContain("PyTorch");
    expect(matches).toContain("TensorFlow");
  });

  it("finds short terms (<=3 chars) using word boundaries", () => {
    const text = "Experience with R and Go is required";
    const matches = findMatches(text, PROGRAMMING_LANGUAGES);
    expect(matches).toContain("R");
    expect(matches).toContain("Go");
  });

  it("does not match partial words for short terms", () => {
    const text = "React is a great library";
    const matches = findMatches(text, PROGRAMMING_LANGUAGES);
    expect(matches).not.toContain("R");
  });

  it("finds long terms using substring match", () => {
    const text = "We use retrieval-augmented generation for RAG";
    const matches = findMatches(text, LLM_TECH);
    expect(matches).toContain("retrieval-augmented generation");
  });

  it("returns empty array when no matches found", () => {
    const text = "We build websites with HTML and CSS";
    const matches = findMatches(text, AI_FRAMEWORKS);
    expect(matches).toEqual([]);
  });

  it("returns unique matches", () => {
    const text = "AWS and AWS and Amazon Web Services";
    const matches = findMatches(text, CLOUD_PROVIDERS);
    const awsCount = matches.filter((m) => m === "AWS").length;
    expect(awsCount).toBe(1);
  });

  it("handles empty text", () => {
    const matches = findMatches("", AI_FRAMEWORKS);
    expect(matches).toEqual([]);
  });

  it("handles empty terms array", () => {
    const matches = findMatches("PyTorch TensorFlow", []);
    expect(matches).toEqual([]);
  });

  it("finds multiple match types", () => {
    const text =
      "We use Python, TypeScript, Pinecone, and AWS for our ML pipeline";
    const langs = findMatches(text, PROGRAMMING_LANGUAGES);
    const vdb = findMatches(text, VECTOR_DBS);
    const cloud = findMatches(text, CLOUD_PROVIDERS);
    expect(langs).toContain("Python");
    expect(langs).toContain("TypeScript");
    expect(vdb).toContain("Pinecone");
    expect(cloud).toContain("AWS");
  });

  it("matches case-insensitively for long terms", () => {
    const text = "Experience with LANGCHAIN is a plus";
    const matches = findMatches(text, AI_FRAMEWORKS);
    expect(matches).toContain("LangChain");
  });
});
