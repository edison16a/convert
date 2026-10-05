import { afterEach, describe, expect, it, vi } from "vitest";
import { removeFromOpfs, spillToOpfs } from "./opfs";

/** A tiny in-memory stand-in for the Origin Private File System. */
function fakeStorage() {
  const files = new Map<string, number[]>();
  const log: string[] = [];
  const dir = {
    getFileHandle: async (name: string) => ({
      createSyncAccessHandle: async () => ({
        truncate: () => files.set(name, []),
        write: (chunk: Uint8Array, { at }: { at: number }) => {
          const bytes = files.get(name) ?? [];
          bytes.splice(at, chunk.length, ...chunk);
          files.set(name, bytes);
        },
        flush: () => void log.push("flush"),
        close: () => void log.push("close"),
      }),
      getFile: async () => new File([new Uint8Array(files.get(name) ?? [])], name),
    }),
    removeEntry: async (name: string) => void files.delete(name),
  };
  vi.stubGlobal("navigator", { storage: { getDirectory: async () => ({ getDirectoryHandle: async () => dir }) } });
  return { files, log };
}

afterEach(() => vi.unstubAllGlobals());

describe("spillToOpfs", () => {
  it("writes the blob to disk and returns a file with the same bytes", async () => {
    const { files, log } = fakeStorage();
    const file = await spillToOpfs(new Blob([new Uint8Array([1, 2, 3, 4, 5])]), "job-out.bin");
    expect(files.get("job-out.bin")).toEqual([1, 2, 3, 4, 5]);
    expect([...new Uint8Array(await file!.arrayBuffer())]).toEqual([1, 2, 3, 4, 5]);
    expect(log).toEqual(["flush", "close"]);
  });

  it("returns null when OPFS is unavailable so the caller keeps the in-memory blob", async () => {
    vi.stubGlobal("navigator", {});
    expect(await spillToOpfs(new Blob(["x"]), "a.bin")).toBeNull();
  });
});

describe("removeFromOpfs", () => {
  it("deletes a spilled result and ignores missing ones", async () => {
    const { files } = fakeStorage();
    await spillToOpfs(new Blob(["abc"]), "gone.bin");
    await removeFromOpfs("gone.bin");
    expect(files.has("gone.bin")).toBe(false);
    vi.stubGlobal("navigator", {});
    await expect(removeFromOpfs("missing.bin")).resolves.toBeUndefined();
  });
});
