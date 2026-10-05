import { PDFDocument, StandardFonts, type PDFFont } from "pdf-lib";
import type { Block } from "./blocks";
import { toWinAnsi } from "./winansi";

const PAGE = { width: 595.28, height: 841.89, margin: 56 };
const HEADING_SIZES = [24, 20, 17, 15, 13, 12];

interface Style {
  font: PDFFont;
  size: number;
  indent: number;
  before: number;
  after: number;
}

/** Breaks text into lines that fit `width`. Words longer than a line are split by character. */
function wrap(text: string, font: PDFFont, size: number, width: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    let line = "";
    for (const word of paragraph.split(/(?<= )/)) {
      const attempt = line + word;
      if (font.widthOfTextAtSize(attempt.trimEnd(), size) <= width) {
        line = attempt;
        continue;
      }
      if (line) lines.push(line.trimEnd());
      line = "";
      let rest = word;
      while (font.widthOfTextAtSize(rest.trimEnd(), size) > width && rest.length > 1) {
        let cut = rest.length - 1;
        while (cut > 1 && font.widthOfTextAtSize(rest.slice(0, cut), size) > width) cut--;
        lines.push(rest.slice(0, cut));
        rest = rest.slice(cut);
      }
      line = rest;
    }
    lines.push(line.trimEnd());
  }
  return lines;
}

/**
 * Lays blocks out on A4 pages with the built-in Helvetica and Courier fonts.
 * It is plain on purpose: readable text with headings, lists and code, not a
 * pixel match of the source document.
 */
export async function blocksToPdf(blocks: readonly Block[], title: string): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(toWinAnsi(title));
  doc.setCreator("Convert");
  const [regular, bold, mono] = await Promise.all([
    doc.embedFont(StandardFonts.Helvetica),
    doc.embedFont(StandardFonts.HelveticaBold),
    doc.embedFont(StandardFonts.Courier),
  ]);

  let page = doc.addPage([PAGE.width, PAGE.height]);
  let y = PAGE.height - PAGE.margin;

  const styleOf = (block: Block): Style => {
    switch (block.kind) {
      case "heading":
        return { font: bold, size: HEADING_SIZES[block.level - 1], indent: 0, before: 10, after: 6 };
      case "code":
        return { font: mono, size: 10, indent: 8, before: 2, after: 10 };
      case "item":
        return { font: regular, size: 11.5, indent: 14 + block.depth * 16, before: 0, after: 3 };
      default:
        return { font: regular, size: 11.5, indent: 0, before: 0, after: 9 };
    }
  };

  for (const block of blocks) {
    if (block.kind === "rule") {
      y -= 8;
      page.drawLine({ start: { x: PAGE.margin, y }, end: { x: PAGE.width - PAGE.margin, y }, thickness: 0.6 });
      y -= 12;
      continue;
    }
    const style = styleOf(block);
    const raw = block.kind === "item" ? `${block.marker === "-" ? "\u2022" : block.marker} ${block.text}` : block.text;
    const width = PAGE.width - PAGE.margin * 2 - style.indent;
    const lead = style.size * 1.4;
    y -= style.before;
    for (const line of wrap(toWinAnsi(raw), style.font, style.size, width)) {
      if (y - lead < PAGE.margin) {
        page = doc.addPage([PAGE.width, PAGE.height]);
        y = PAGE.height - PAGE.margin;
      }
      y -= lead;
      page.drawText(line, { x: PAGE.margin + style.indent, y, font: style.font, size: style.size });
    }
    y -= style.after;
  }
  return doc.save();
}
