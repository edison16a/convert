import * as pdfjs from "pdfjs-dist";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { ConversionError } from "../errors";

let configured = false;

/** Resolves a path in public/ against the worker's own origin. */
const publicUrl = (path: string) => new URL(path, self.location.href).href;

/**
 * Points pdf.js at its helper files. They live in public/pdfjs (copied from
 * node_modules at build time) so no font or codec is fetched from a CDN.
 */
function configure() {
  if (configured) return;
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
  configured = true;
}

/** Opens a PDF and turns pdf.js exceptions into messages a person can use. */
export async function openPdf(file: File): Promise<PDFDocumentProxy> {
  configure();
  try {
    return await pdfjs.getDocument({
      data: new Uint8Array(await file.arrayBuffer()),
      standardFontDataUrl: publicUrl("/pdfjs/standard_fonts/"),
      cMapUrl: publicUrl("/pdfjs/cmaps/"),
      cMapPacked: true,
      iccUrl: publicUrl("/pdfjs/iccs/"),
      wasmUrl: publicUrl("/pdfjs/wasm/"),
    }).promise;
  } catch (error) {
    if (error instanceof Error && error.name === "PasswordException") {
      throw new ConversionError("This PDF is password protected.", "encrypted");
    }
    throw new ConversionError("This PDF could not be read. It may be damaged.", "corrupt");
  }
}
