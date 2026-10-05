import { describe, expect, it } from "vitest";
import { isHeavy, pickNext, poolSize } from "./scheduler";

const job = (id: string, heavy = false) => ({ id, heavy });

describe("poolSize", () => {
  it("leaves one core free and clamps to 1..4", () => {
    expect(poolSize(1)).toBe(1);
    expect(poolSize(2)).toBe(1);
    expect(poolSize(4)).toBe(3);
    expect(poolSize(16)).toBe(4);
    expect(poolSize(undefined)).toBe(1);
  });
});

describe("pickNext", () => {
  const limits = { workers: 3, heavy: 1 };

  it("fills free slots in queue order", () => {
    expect(pickNext([job("a"), job("b"), job("c"), job("d")], [job("x")], limits)).toEqual(["a", "b"]);
  });

  it("starts nothing when the pool is full", () => {
    expect(pickNext([job("a")], [job("x"), job("y"), job("z")], limits)).toEqual([]);
  });

  it("runs one video at a time without blocking images behind it", () => {
    const queued = [job("v1", true), job("v2", true), job("i1"), job("i2")];
    expect(pickNext(queued, [], limits)).toEqual(["v1", "i1", "i2"]);
  });

  it("holds videos while one is already running", () => {
    expect(pickNext([job("v2", true), job("i1")], [job("v1", true)], limits)).toEqual(["i1"]);
  });
});

describe("isHeavy", () => {
  it("treats only video as heavy", () => {
    expect(isHeavy("mov")).toBe(true);
    expect(isHeavy("mp3")).toBe(false);
    expect(isHeavy("png")).toBe(false);
  });
});
