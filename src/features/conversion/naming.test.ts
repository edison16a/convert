import { describe, expect, it } from "vitest";
import { outputName } from "./naming";

describe("outputName", () => {
  it("swaps the extension and keeps the rest", () => {
    expect(outputName("IMG_4021.HEIC", "jpg")).toBe("IMG_4021.jpg");
    expect(outputName("report.final.docx", "pdf")).toBe("report.final.pdf");
  });

  it("appends when there is no extension", () => {
    expect(outputName("notes", "txt")).toBe("notes.txt");
    expect(outputName(".env", "txt")).toBe(".env.txt");
  });
});
