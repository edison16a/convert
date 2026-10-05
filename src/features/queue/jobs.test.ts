import { describe, expect, it } from "vitest";
import {
  applyDetection,
  applyGlobalTarget,
  createJob,
  skippedByGlobal,
  stageOf,
  summarize,
  unsupportedReason,
} from "./jobs";
import type { Job } from "./types";

const NONE = new Set<never>();
const make = (name: string, patch: Partial<Job> = {}): Job => ({ ...createJob(new File(["x"], name)), ...patch });

describe("detection", () => {
  it("gives a detected file its default target", () => {
    const job = applyDetection(make("a.heic"), "heic", null, NONE);
    expect(job.detected).toBe("heic");
    expect(job.target).toBe("jpg");
  });

  it("prefers the global target when the file can reach it", () => {
    expect(applyDetection(make("a.png"), "png", "webp", NONE).target).toBe("webp");
    expect(applyDetection(make("a.csv"), "csv", "webp", NONE).target).toBe("json");
  });

  it("marks unknown files without a target", () => {
    const job = applyDetection(make("a.bin"), null, null, NONE);
    expect(job.detected).toBeNull();
    expect(job.target).toBeNull();
    expect(unsupportedReason(job)).toBe("Unrecognized file type");
  });

  it("explains files we recognize but cannot read yet", () => {
    expect(unsupportedReason(applyDetection(make("a.zip"), "zip", null, NONE))).toMatch(/not supported yet/);
  });
});

describe("global format", () => {
  it("updates compatible rows and leaves the others alone", () => {
    const jobs = [
      applyDetection(make("a.png"), "png", null, NONE),
      applyDetection(make("b.csv"), "csv", null, NONE),
    ];
    const next = applyGlobalTarget(jobs, "webp", NONE);
    expect(next.map((j) => j.target)).toEqual(["webp", "json"]);
    expect(skippedByGlobal(next[1], "webp", NONE)).toBe("Cannot convert to WEBP");
    expect(skippedByGlobal(next[0], "webp", NONE)).toBeNull();
  });

  it("does not touch rows that already started", () => {
    const running = { ...applyDetection(make("a.png"), "png", null, NONE), status: "running" as const };
    expect(applyGlobalTarget([running], "webp", NONE)[0].target).toBe("jpg");
  });
});

describe("stage", () => {
  const ready = () => applyDetection(make("a.png"), "png", null, NONE);

  it("moves through the four screens", () => {
    expect(stageOf([])).toBe("empty");
    expect(stageOf([ready()])).toBe("queued");
    expect(stageOf([{ ...ready(), status: "running" }])).toBe("converting");
    expect(stageOf([{ ...ready(), status: "done" }])).toBe("done");
  });

  it("returns to queued when new files join a finished batch", () => {
    expect(stageOf([{ ...ready(), status: "done" }, ready()])).toBe("queued");
  });

  it("counts errors as finished work", () => {
    expect(stageOf([{ ...ready(), status: "error" }])).toBe("done");
  });
});

describe("summary", () => {
  it("compares input and output size of finished files only", () => {
    const done = {
      ...applyDetection(make("a.png"), "png", null, NONE),
      status: "done" as const,
      result: { blob: new Blob(["y"]), name: "a.jpg", size: 1, opfsName: null },
    };
    const failed = { ...make("b.png"), status: "error" as const };
    expect(summarize([done, failed])).toEqual({ done: 1, failed: 1, total: 2, inputBytes: 1, outputBytes: 1 });
  });
});
