import { describe, expect, it } from "vitest";
import { detectFromBytes } from "./detect";

const enc = (text: string) => new TextEncoder().encode(text);
const bytes = (...values: number[]) => new Uint8Array(values);

/** Builds an ISO media header: size, "ftyp", major brand, minor version, compatible brands. */
function ftyp(major: string, ...compat: string[]): Uint8Array {
  const body = [major, "\0\0\0\0", ...compat].join("");
  const size = 8 + body.length;
  const out = new Uint8Array(size);
  new DataView(out.buffer).setUint32(0, size);
  out.set(enc("ftyp" + body), 4);
  return out;
}

const detect = (head: Uint8Array, name = "file", mime = "") =>
  detectFromBytes({ head, name, mime, size: head.length });

describe("binary signatures", () => {
  it("reads PNG and JPEG headers", () => {
    expect(detect(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0))).toBe("png");
    expect(detect(bytes(0xff, 0xd8, 0xff, 0xe0, 0))).toBe("jpg");
  });

  it("identifies a file with the wrong extension by content", () => {
    expect(detect(bytes(0xff, 0xd8, 0xff, 0xe0), "photo.png", "image/png")).toBe("jpg");
  });

  it("separates RIFF containers", () => {
    expect(detect(enc("RIFF\0\0\0\0WEBPVP8 "))).toBe("webp");
    expect(detect(enc("RIFF\0\0\0\0WAVEfmt "))).toBe("wav");
    expect(detect(enc("RIFF\0\0\0\0AVI LIST"))).toBe("avi");
  });

  it("separates ISO media brands", () => {
    expect(detect(ftyp("isom", "mp42"))).toBe("mp4");
    expect(detect(ftyp("qt  "))).toBe("mov");
    expect(detect(ftyp("M4A "))).toBe("m4a");
    expect(detect(ftyp("heic", "mif1"))).toBe("heic");
    expect(detect(ftyp("mif1", "avif"))).toBe("avif");
  });

  it("prefers the m4a extension for ambiguous MP4 containers", () => {
    expect(detect(ftyp("isom"), "memo.m4a")).toBe("m4a");
  });

  it("separates WebM from MKV", () => {
    const webm = new Uint8Array(64);
    webm.set([0x1a, 0x45, 0xdf, 0xa3]);
    webm.set(enc("webm"), 20);
    const mkv = new Uint8Array(64);
    mkv.set([0x1a, 0x45, 0xdf, 0xa3]);
    mkv.set(enc("matroska"), 20);
    expect(detect(webm)).toBe("webm");
    expect(detect(mkv)).toBe("mkv");
  });

  it("tells DOCX and XLSX apart from a plain zip", () => {
    const zip = (entry: string) => enc("PK\x03\x04\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0" + entry);
    expect(detect(zip("word/document.xml"))).toBe("docx");
    expect(detect(zip("xl/workbook.xml"))).toBe("xlsx");
    expect(detect(zip("readme.txt"))).toBe("zip");
  });

  it("separates MP3 from AAC frames and finds ID3 tags", () => {
    expect(detect(bytes(0xff, 0xfb, 0x90, 0x00))).toBe("mp3");
    expect(detect(bytes(0xff, 0xf1, 0x50, 0x80))).toBe("aac");
    expect(detect(enc("ID3\x04\0\0"))).toBe("mp3");
  });

  it("finds a PDF header even after leading junk", () => {
    expect(detect(enc("\n\n%PDF-1.7\n"))).toBe("pdf");
  });
});

describe("text formats", () => {
  it("detects SVG, XML and HTML from their opening tags", () => {
    expect(detect(enc('<svg xmlns="http://www.w3.org/2000/svg"></svg>'), "x.txt")).toBe("svg");
    expect(detect(enc('<?xml version="1.0"?><root/>'), "x.txt")).toBe("xml");
    expect(detect(enc("<!DOCTYPE html><html></html>"), "x.txt")).toBe("html");
  });

  it("detects JSON by parsing it, even with a .txt name", () => {
    expect(detect(enc('{"a": [1, 2]}'), "data.txt", "text/plain")).toBe("json");
  });

  it("does not mistake Markdown links for JSON", () => {
    expect(detect(enc("[link](http://x.test)\n\n# Title\n"), "n.md")).toBe("md");
  });

  it("uses the extension for ambiguous text", () => {
    expect(detect(enc("a,b\n1,2\n"), "sheet.csv")).toBe("csv");
    expect(detect(enc("name: a\nage: 3\n"), "cfg.yml")).toBe("yaml");
  });

  it("detects consistent comma tables without help", () => {
    expect(detect(enc("a,b,c\n1,2,3\n4,5,6\n"), "export")).toBe("csv");
  });

  it("falls back to txt for plain prose", () => {
    expect(detect(enc("Hello, world. Just a note."), "note")).toBe("txt");
  });
});

describe("fallbacks", () => {
  it("uses MIME then extension for unknown binary headers", () => {
    const junk = bytes(1, 2, 3, 0, 4, 5);
    expect(detect(junk, "a.mp3", "audio/mpeg")).toBe("mp3");
    expect(detect(junk, "clip.mov")).toBe("mov");
  });

  it("returns null when nothing matches", () => {
    expect(detect(bytes(1, 2, 3, 0, 4, 5), "mystery.bin")).toBeNull();
  });
});
