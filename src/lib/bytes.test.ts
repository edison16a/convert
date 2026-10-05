import { describe, expect, it } from "vitest";
import { formatBytes } from "./bytes";

describe("formatBytes", () => {
  it("matches the mockup style", () => {
    expect(formatBytes(2.4 * 1024 * 1024)).toBe("2.4 MB");
    expect(formatBytes(380 * 1024)).toBe("380 KB");
    expect(formatBytes(96 * 1024 * 1024)).toBe("96 MB");
    expect(formatBytes(41 * 1024)).toBe("41 KB");
  });

  it("handles tiny and empty values", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(512)).toBe("512 B");
  });
});
