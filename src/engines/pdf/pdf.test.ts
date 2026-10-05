import { describe, expect, it } from "vitest";
import { joinTextPieces } from "./pageText";
import { scaleFor } from "./render";

describe("pdf text", () => {
  it("adds a newline only where pdf.js marks the end of a line", () => {
    const text = joinTextPieces([{ str: "Hello " }, { str: "world", hasEOL: true }, { str: "Next line" }]);
    expect(text).toBe("Hello world\nNext line");
  });

  it("skips marked content items and trims trailing spaces", () => {
    expect(joinTextPieces([{}, { str: "a  ", hasEOL: true }, { str: "b" }])).toBe("a\nb");
  });
});

describe("pdf render scale", () => {
  it("renders at 2x for normal pages", () => {
    expect(scaleFor(595, 842)).toBe(2);
  });

  it("caps very large pages", () => {
    expect(scaleFor(5000, 3000)).toBeLessThan(1);
    expect(5000 * scaleFor(5000, 3000)).toBeLessThanOrEqual(4096);
  });
});
