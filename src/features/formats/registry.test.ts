import { describe, expect, it } from "vitest";
import { formatFromExtension, formatFromMime } from "./definitions";
import {
  canConvert,
  defaultOutput,
  findEngine,
  groupByCategory,
  isReadable,
  outputsFor,
  reachableOutputs,
} from "./registry";

describe("format lookups", () => {
  it("maps extensions case-insensitively and with a leading dot", () => {
    expect(formatFromExtension(".JPEG")).toBe("jpg");
    expect(formatFromExtension("heif")).toBe("heic");
    expect(formatFromExtension("nope")).toBeNull();
  });

  it("ignores MIME parameters", () => {
    expect(formatFromMime("text/csv; charset=utf-8")).toBe("csv");
  });
});

describe("outputsFor", () => {
  it("never offers a file its own format", () => {
    expect(outputsFor("png")).not.toContain("png");
    expect(outputsFor("png")).toContain("jpg");
  });

  it("keeps PDF input limited to images and text", () => {
    expect(outputsFor("pdf").sort()).toEqual(["jpg", "png", "txt"]);
  });

  it("lets video reach mp3 for audio extraction", () => {
    expect(outputsFor("mov")).toContain("mp3");
  });

  it("hides outputs the browser cannot encode", () => {
    expect(outputsFor("png", new Set(["avif"]))).not.toContain("avif");
    expect(canConvert("png", "avif", new Set(["avif"]))).toBe(false);
  });
});

describe("routing", () => {
  it("finds the engine for a pair", () => {
    expect(findEngine("heic", "jpg")).toBe("image");
    expect(findEngine("docx", "pdf")).toBe("document");
    expect(findEngine("pdf", "png")).toBe("pdf");
    expect(findEngine("xlsx", "csv")).toBe("data");
  });

  it("returns null for pairs we do not support", () => {
    expect(findEngine("png", "mp3")).toBeNull();
    expect(findEngine("zip", "png")).toBeNull();
    expect(isReadable("zip")).toBe(false);
  });
});

describe("batch helpers", () => {
  it("shows only outputs some file in the batch can reach", () => {
    const reachable = reachableOutputs(["csv", "mp3"]);
    expect(reachable).toContain("json");
    expect(reachable).toContain("wav");
    expect(reachable).not.toContain("png");
  });

  it("groups by category in picker order", () => {
    const groups = groupByCategory(["csv", "png", "mp3"]);
    expect(groups.map((g) => g.category)).toEqual(["image", "audio", "data"]);
  });

  it("picks a sensible default", () => {
    expect(defaultOutput("heic")).toBe("jpg");
    expect(defaultOutput("jpg")).toBe("png");
    expect(defaultOutput("docx")).toBe("pdf");
    expect(defaultOutput("xlsx")).toBe("csv");
    expect(defaultOutput("pdf")).toBe("txt");
    expect(defaultOutput("zip")).toBeNull();
  });
});
