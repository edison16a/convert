import { describe, expect, it } from "vitest";
import { filesFromDataTransfer } from "./readDropped";

const file = (name: string) => new File(["x"], name);

/** Minimal stand-ins for the browser's FileSystemEntry types. */
const fileEntry = (name: string) => ({
  isFile: true,
  isDirectory: false,
  file: (ok: (f: File) => void) => ok(file(name)),
});

const dirEntry = (children: unknown[]) => ({
  isFile: false,
  isDirectory: true,
  createReader: () => {
    let sent = false;
    return {
      readEntries: (ok: (e: unknown[]) => void) => {
        ok(sent ? [] : children);
        sent = true;
      },
    };
  },
});

const transfer = (entries: unknown[], files: File[] = []) =>
  ({
    items: entries.map((entry) => ({ kind: "file", webkitGetAsEntry: () => entry })),
    files,
  }) as unknown as DataTransfer;

describe("filesFromDataTransfer", () => {
  it("flattens nested folders and skips OS junk files", async () => {
    const drop = transfer([
      dirEntry([fileEntry("a.png"), fileEntry(".DS_Store"), dirEntry([fileEntry("b.csv")])]),
      fileEntry("c.mp3"),
    ]);
    const names = (await filesFromDataTransfer(drop)).map((f) => f.name);
    expect(names).toEqual(["a.png", "b.csv", "c.mp3"]);
  });

  it("falls back to the plain file list when entries are unavailable", async () => {
    const drop = transfer([null], [file("x.txt"), file("Thumbs.db")]);
    expect((await filesFromDataTransfer(drop)).map((f) => f.name)).toEqual(["x.txt"]);
  });
});
