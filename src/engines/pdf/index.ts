import { zipSync } from "fflate";
import type { Converter } from "../types";
import { ConversionError } from "../errors";
import { openPdf } from "./load";
import { joinTextPieces, type TextPiece } from "./pageText";
import { renderPage } from "./render";

const baseName = (name: string) => name.replace(/\.[^.]+$/, "") || name;

/**
 * PDF to text keeps page order and separates pages with a blank line. A scan
 * has no text layer, so we say so instead of returning an empty file.
 */
const convertToText: Converter = async ({ file, report }) => {
  const doc = await openPdf(file);
  try {
    const pages: string[] = [];
    for (let n = 1; n <= doc.numPages; n++) {
      const page = await doc.getPage(n);
      const content = await page.getTextContent();
      pages.push(joinTextPieces(content.items as TextPiece[]));
      page.cleanup();
      report(n / doc.numPages);
    }
    const text = pages.filter(Boolean).join("\n\n");
    if (!text) throw new ConversionError("This PDF has no selectable text. It may be a scan.", "unsupported");
    return { blob: new Blob([text + "\n"], { type: "text/plain;charset=utf-8" }), extension: "txt" };
  } finally {
    await doc.loadingTask.destroy();
  }
};

/**
 * PDF to images gives one image per page. A single page returns that image.
 * Several pages come back as a zip, because one conversion yields one file.
 */
const convertToImages: Converter = async ({ file, to, report }) => {
  const type = to === "jpg" ? "image/jpeg" : "image/png";
  const doc = await openPdf(file);
  try {
    const images: Blob[] = [];
    for (let n = 1; n <= doc.numPages; n++) {
      const page = await doc.getPage(n);
      images.push(await renderPage(page, type));
      page.cleanup();
      report(n / doc.numPages);
    }
    if (images.length === 1) return { blob: images[0], extension: to };

    const digits = String(images.length).length;
    const entries: Record<string, Uint8Array> = {};
    for (const [i, image] of images.entries()) {
      const name = `${baseName(file.name)}-page-${String(i + 1).padStart(digits, "0")}.${to}`;
      entries[name] = new Uint8Array(await image.arrayBuffer());
    }
    // Images are already compressed, so store them as is.
    const zip = zipSync(entries, { level: 0 });
    return { blob: new Blob([zip as BlobPart], { type: "application/zip" }), extension: "zip" };
  } finally {
    await doc.loadingTask.destroy();
  }
};

export const convertPdf: Converter = (request) =>
  request.to === "txt" ? convertToText(request) : convertToImages(request);
