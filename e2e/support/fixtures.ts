import { strToU8, zipSync } from "fflate";
import { PDFDocument, StandardFonts } from "pdf-lib";
import * as XLSX from "xlsx";

/** A file in the shape Playwright's file chooser accepts. */
export interface Fixture {
  name: string;
  mimeType: string;
  buffer: Buffer;
}

const make = (name: string, mimeType: string, data: string | Uint8Array): Fixture => ({
  name,
  mimeType,
  buffer: Buffer.from(typeof data === "string" ? data : data),
});

/** A real 1x1 PNG, small enough to keep in source. */
export const png = (name = "photo.png") =>
  make(
    name,
    "image/png",
    Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      "base64",
    ),
  );

export const csv = (name = "people.csv") => make(name, "text/csv", "name,age\nAda,36\nLin,29\n");

export const markdown = (name = "report.md") => make(name, "text/markdown", "# Report\n\nSome **bold** text.\n\n- one\n- two\n");

export const svg = (name = "dot.svg") =>
  make(name, "image/svg+xml", '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><circle cx="32" cy="32" r="28" fill="#3b4cf5"/></svg>');

/** Half a second of an 8 kHz sine as 8 bit mono WAV. Tiny, but a real audio file. */
export function wav(name = "tone.wav"): Fixture {
  const rate = 8000;
  const samples = rate / 2;
  const out = Buffer.alloc(44 + samples);
  out.write("RIFF", 0);
  out.writeUInt32LE(36 + samples, 4);
  out.write("WAVEfmt ", 8);
  out.writeUInt32LE(16, 16);
  out.writeUInt16LE(1, 20);
  out.writeUInt16LE(1, 22);
  out.writeUInt32LE(rate, 24);
  out.writeUInt32LE(rate, 28);
  out.writeUInt16LE(1, 32);
  out.writeUInt16LE(8, 34);
  out.write("data", 36);
  out.writeUInt32LE(samples, 40);
  for (let i = 0; i < samples; i++) out[44 + i] = 128 + Math.round(60 * Math.sin((2 * Math.PI * 440 * i) / rate));
  return { name, mimeType: "audio/wav", buffer: out };
}

/** The smallest valid Word file: one heading and one paragraph. */
export function docx(name = "Q3-report.docx"): Fixture {
  const zip = zipSync({
    "[Content_Types].xml": strToU8(
      '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
    ),
    "_rels/.rels": strToU8(
      '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
    ),
    "word/document.xml": strToU8(
      '<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Revenue grew across every region.</w:t></w:r></w:p></w:body></w:document>',
    ),
  });
  return make(name, "application/vnd.openxmlformats-officedocument.wordprocessingml.document", zip);
}

export function xlsx(name = "budget.xlsx"): Fixture {
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet([{ item: "Rent", cost: 1200 }, { item: "Food", cost: 430 }]), "Budget");
  const bytes: Buffer = XLSX.write(book, { type: "buffer", bookType: "xlsx" });
  return make(name, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", bytes);
}

/** A PDF with the given number of pages, each with a line of text. */
export async function pdf(name = "brief.pdf", pages = 2): Promise<Fixture> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let n = 1; n <= pages; n++) {
    doc.addPage([400, 300]).drawText(`Page ${n} of the sample`, { x: 40, y: 240, size: 22, font });
  }
  return make(name, "application/pdf", await doc.save());
}
