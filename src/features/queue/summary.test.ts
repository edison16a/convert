import { describe, expect, it } from "vitest";
import { describeSummary } from "./summary";

const MB = 1024 * 1024;

describe("describeSummary", () => {
  it("shows how much smaller the output is", () => {
    expect(describeSummary({ done: 6, failed: 0, total: 6, inputBytes: 10 * MB, outputBytes: 6 * MB })).toBe(
      "6 files converted, 6 MB total (40% smaller)",
    );
  });

  it("says larger when output grew and uses the singular", () => {
    expect(describeSummary({ done: 1, failed: 0, total: 1, inputBytes: 1 * MB, outputBytes: 2 * MB })).toBe(
      "1 file converted, 2 MB total (100% larger)",
    );
  });

  it("mentions failures", () => {
    expect(describeSummary({ done: 2, failed: 1, total: 3, inputBytes: MB, outputBytes: MB })).toBe(
      "2 files converted, 1 MB total (same size), 1 failed",
    );
  });

  it("copes with nothing converted", () => {
    expect(describeSummary({ done: 0, failed: 2, total: 2, inputBytes: 0, outputBytes: 0 })).toBe(
      "0 files converted, 2 failed",
    );
  });
});
