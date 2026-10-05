import { zipSync, strToU8 } from "fflate";
import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { htmlToBlocks } from "./blocks";
import { convertDocument } from "./index";
import { blocksToText, textToHtml } from "./text";
import { toWinAnsi } from "./winansi";

const run = async (body: BlobPart, name: string, from: string, to: string) => {
  const out = await convertDocument({ file: new File([body], name), from: from as never, to: to as never, report: () => {} });
  return { blob: out.blob, ext: out.extension, text: () => out.blob.text() };
};

/** The smallest valid .docx: a content types file, the package rels and one paragraph. */
function tinyDocx(text: string): Uint8Array {
  return zipSync({
    "[Content_Types].xml": strToU8(
      '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
        '<Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
    ),
    "_rels/.rels": strToU8(
      '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
    ),
    "word/document.xml": strToU8(
      '<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>' +
        `<w:p><w:r><w:t>${text}</w:t></w:r></w:p></w:body></w:document>`,
    ),
  });
}

describe("block model", () => {
  it("reads headings, paragraphs and nested lists", () => {
    const blocks = htmlToBlocks("<h1>Title</h1><p>Hello <b>world</b></p><ul><li>One<ul><li>Inner</li></ul></li><li>Two</li></ul>");
    expect(blocks).toEqual([
      { kind: "heading", level: 1, text: "Title" },
      { kind: "paragraph", text: "Hello world" },
      { kind: "item", text: "One", depth: 0, marker: "-" },
      { kind: "item", text: "Inner", depth: 1, marker: "-" },
      { kind: "item", text: "Two", depth: 0, marker: "-" },
    ]);
  });

  it("numbers ordered lists and flattens tables", () => {
    const blocks = htmlToBlocks("<ol><li>a</li><li>b</li></ol><table><tr><th>x</th><th>y</th></tr><tr><td>1</td><td>2</td></tr></table>");
    expect(blocks.map((b) => ("marker" in b ? b.marker : b.kind === "paragraph" ? b.text : b.kind))).toEqual(["1.", "2.", "x | y", "1 | 2"]);
  });

  it("ignores scripts, styles and the head", () => {
    const blocks = htmlToBlocks("<html><head><title>t</title><style>p{}</style></head><body><script>x()</script><p>Hi</p></body></html>");
    expect(blocks).toEqual([{ kind: "paragraph", text: "Hi" }]);
  });

  it("collects loose text inside containers", () => {
    expect(htmlToBlocks("<div>Loose <em>text</em><p>Para</p></div>")).toEqual([
      { kind: "paragraph", text: "Loose text" },
      { kind: "paragraph", text: "Para" },
    ]);
  });
});

describe("text helpers", () => {
  it("renders blocks as readable text", () => {
    const text = blocksToText(htmlToBlocks("<h2>Plan</h2><ul><li>a</li><li>b</li></ul><p>Done.</p>"));
    expect(text).toBe("Plan\n\n- a\n- b\n\nDone.\n");
  });

  it("escapes plain text into paragraphs", () => {
    expect(textToHtml("a < b\nsecond line\n\nnext")).toBe("<p>a &lt; b<br>second line</p>\n<p>next</p>");
  });

  it("swaps punctuation the PDF fonts cannot draw", () => {
    expect(toWinAnsi("“quote” — ok 中")).toBe('"quote" - ok ?');
  });
});

describe("conversions", () => {
  it("converts Markdown to a full HTML page", async () => {
    const out = await run("# Hi\n\nSome *text*.", "n.md", "md", "html");
    const html = await out.text();
    expect(html).toContain("<!doctype html>");
    expect(html).toContain("<h1>Hi</h1>");
    expect(html).toContain("<em>text</em>");
  });

  it("converts HTML to Markdown", async () => {
    const out = await run("<h1>Hi</h1><p>A <strong>bold</strong> move</p>", "n.html", "html", "md");
    const md = await out.text();
    expect(md).toContain("# Hi");
    expect(md).toContain("**bold**");
  });

  it("passes plain text to Markdown unchanged", async () => {
    expect(await (await run("just text", "n.txt", "txt", "md")).text()).toBe("just text");
  });

  it("strips Markdown syntax when writing text", async () => {
    const out = await run("# Title\n\n- one\n- two\n", "n.md", "md", "txt");
    expect(await out.text()).toBe("Title\n\n- one\n- two\n");
  });

  it("reads a Word file", async () => {
    const out = await run(tinyDocx("Hello from Word") as BlobPart, "d.docx", "docx", "txt");
    expect(await out.text()).toBe("Hello from Word\n");
  });

  it("writes a valid multi-page PDF", async () => {
    const long = Array.from({ length: 120 }, (_, i) => `<p>Paragraph ${i} ${"word ".repeat(30)}</p>`).join("");
    const out = await run(`<h1>Report</h1>${long}`, "r.html", "html", "pdf");
    const pdf = await PDFDocument.load(await out.blob.arrayBuffer());
    expect(pdf.getPageCount()).toBeGreaterThan(1);
    expect(out.ext).toBe("pdf");
  });

  it("names a damaged Word file in plain language", async () => {
    await expect(run("not a zip", "d.docx", "docx", "txt")).rejects.toThrow(/could not be read/);
  });
});
