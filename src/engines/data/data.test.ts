import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { convertData } from "./index";
import { coerceCell, flattenRecord, toRows } from "./rows";

const file = (body: BlobPart, name: string) => new File([body], name);
const noop = () => {};

async function run(body: BlobPart, name: string, from: string, to: string) {
  const out = await convertData({ file: file(body, name), from: from as never, to: to as never, report: noop, phase: noop });
  return { text: await out.blob.text(), blob: out.blob, ext: out.extension };
}

describe("cell typing", () => {
  it("types plain numbers and booleans but keeps leading zeros", () => {
    expect(coerceCell("42")).toBe(42);
    expect(coerceCell("3.5")).toBe(3.5);
    expect(coerceCell("007")).toBe("007");
    expect(coerceCell("true")).toBe(true);
    expect(coerceCell("hello")).toBe("hello");
  });
});

describe("row helpers", () => {
  it("flattens nested objects with dotted keys and stringifies arrays", () => {
    expect(flattenRecord({ a: 1, b: { c: 2 }, d: [1, 2] })).toEqual({ a: 1, "b.c": 2, d: "[1,2]" });
  });

  it("descends through single-key wrappers like XML roots", () => {
    expect(toRows({ root: { item: [{ id: 1 }, { id: 2 }] } })).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it("uses the first sheet of a multi-sheet map", () => {
    expect(toRows({ A: [{ x: 1 }], B: [{ y: 2 }] })).toEqual([{ x: 1 }]);
  });
});

describe("csv", () => {
  it("converts CSV to JSON with typed values", async () => {
    const out = await run("name,age\nAda,36\nLin,29\n", "p.csv", "csv", "json");
    expect(JSON.parse(out.text)).toEqual([
      { name: "Ada", age: 36 },
      { name: "Lin", age: 29 },
    ]);
    expect(out.ext).toBe("json");
  });

  it("writes every column even when rows differ", async () => {
    const out = await run(JSON.stringify([{ a: 1 }, { a: 2, b: 3 }]), "x.json", "json", "csv");
    expect(out.text.trim().split(/\r?\n/)).toEqual(["a,b", "1,", "2,3"]);
  });

  it("rejects an empty CSV with a plain message", async () => {
    await expect(run("", "e.csv", "csv", "json")).rejects.toThrow(/no rows/);
  });
});

describe("json and yaml", () => {
  it("round trips through YAML", async () => {
    const yaml = await run('{"a":1,"b":["x","y"]}', "d.json", "json", "yaml");
    expect(yaml.text).toContain("a: 1");
    const back = await run(yaml.text, "d.yaml", "yaml", "json");
    expect(JSON.parse(back.text)).toEqual({ a: 1, b: ["x", "y"] });
  });

  it("explains invalid JSON", async () => {
    await expect(run("{oops", "d.json", "json", "csv")).rejects.toThrow(/not valid/);
  });
});

describe("xml", () => {
  it("reads repeated elements as rows", async () => {
    const xml = '<?xml version="1.0"?><people><p id="1"><n>Ada</n></p><p id="2"><n>Lin</n></p></people>';
    const out = await run(xml, "p.xml", "xml", "csv");
    expect(out.text.trim().split(/\r?\n/)).toEqual(["n,@_id", "Ada,1", "Lin,2"]);
  });

  it("flags malformed XML", async () => {
    await expect(run("<a><b></a>", "bad.xml", "xml", "json")).rejects.toThrow(/well formed/);
  });
});

describe("xlsx", () => {
  it("round trips CSV through a workbook", async () => {
    const xlsx = await run("a,b\n1,two\n", "t.csv", "csv", "xlsx");
    const buffer = await xlsx.blob.arrayBuffer();
    const sheet = XLSX.read(buffer, { type: "array" });
    expect(sheet.SheetNames).toEqual(["Sheet1"]);
    const back = await run(buffer, "t.xlsx", "xlsx", "csv");
    expect(back.text.trim().split(/\r?\n/)).toEqual(["a,b", "1,two"]);
  });

  it("keeps every sheet when writing JSON", async () => {
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet([{ a: 1 }]), "One");
    XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet([{ b: 2 }]), "Two");
    const bytes: Uint8Array = XLSX.write(book, { type: "array", bookType: "xlsx" });
    const out = await run(bytes as BlobPart, "w.xlsx", "xlsx", "json");
    expect(JSON.parse(out.text)).toEqual({ One: [{ a: 1 }], Two: [{ b: 2 }] });
  });
});
