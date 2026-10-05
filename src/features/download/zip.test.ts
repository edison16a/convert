import { strFromU8, unzipSync } from "fflate";
import { describe, expect, it } from "vitest";
import { zipToBlob } from "./zip";

describe("zipToBlob", () => {
  it("writes entries that unzip to the original bytes", async () => {
    const blob = await zipToBlob([
      { name: "notes.txt", blob: new Blob(["hello hello hello hello"]) },
      { name: "pic.jpg", blob: new Blob([new Uint8Array([1, 2, 3, 4])]) },
    ]);
    const files = unzipSync(new Uint8Array(await blob.arrayBuffer()));
    expect(Object.keys(files).sort()).toEqual(["notes.txt", "pic.jpg"]);
    expect(strFromU8(files["notes.txt"])).toBe("hello hello hello hello");
    expect([...files["pic.jpg"]]).toEqual([1, 2, 3, 4]);
  });

  it("handles an empty file", async () => {
    const blob = await zipToBlob([{ name: "empty.bin", blob: new Blob([]) }]);
    const files = unzipSync(new Uint8Array(await blob.arrayBuffer()));
    expect(files["empty.bin"].length).toBe(0);
  });
});
