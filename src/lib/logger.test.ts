import { describe, it, expect, vi, beforeEach } from "vitest";
import { logger } from "./logger.js";

vi.mock("apify", () => ({
  log: {
    info: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

import { log } from "apify";

describe("logger", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("info calls log.info with (msg, data)", () => {
    logger.info("test message", { key: "value" });
    expect(log.info).toHaveBeenCalledWith("test message", { key: "value" });
  });

  it("info calls log.info with msg only", () => {
    logger.info("test message");
    expect(log.info).toHaveBeenCalledWith("test message", undefined);
  });

  it("warn calls log.warning", () => {
    logger.warn("warning message", { key: "value" });
    expect(log.warning).toHaveBeenCalledWith("warning message", {
      key: "value",
    });
  });

  it("error calls log.error", () => {
    logger.error("error message", { key: "value" });
    expect(log.error).toHaveBeenCalledWith("error message", { key: "value" });
  });

  it("debug calls log.debug", () => {
    logger.debug("debug message", { key: "value" });
    expect(log.debug).toHaveBeenCalledWith("debug message", { key: "value" });
  });
});
