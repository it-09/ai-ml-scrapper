import { describe, it, expect } from "vitest";
import { getCompanyUrl } from "./company-urls.js";

describe("company-urls", () => {
  describe("getCompanyUrl", () => {
    it("returns correct URL for known companies", () => {
      expect(getCompanyUrl("openai")).toBe("https://openai.com");
      expect(getCompanyUrl("anthropic")).toBe("https://anthropic.com");
      expect(getCompanyUrl("netflix")).toBe("https://netflix.com");
      expect(getCompanyUrl("spotify")).toBe("https://spotify.com");
      expect(getCompanyUrl("google")).toBe("https://google.com");
    });

    it("returns fallback URL for unknown companies", () => {
      expect(getCompanyUrl("unknowncompany")).toBe("https://unknowncompany.com");
    });

    it("normalizes company names to lowercase", () => {
      expect(getCompanyUrl("OpenAI")).toBe("https://openai.com");
      expect(getCompanyUrl("ANTHROPIC")).toBe("https://anthropic.com");
    });
  });
});
