import type { FormatId } from "@/features/formats/types";
import { asciiAt, containsAscii, hasBytesAt } from "./bytes";

/** Brands in an ISO base media "ftyp" box that mean a HEIC still image. */
const HEIC_BRANDS = new Set(["heic", "heix", "hevc", "hevx", "heim", "heis", "mif1", "msf1"]);
const AVIF_BRANDS = new Set(["avif", "avis"]);

/**
 * MP4, MOV, M4A, HEIC and AVIF all share one container layout and differ only
 * in the brand written after "ftyp". We also read the compatible brands,
 * because HEIC and AVIF files often lead with the generic "mif1".
 */
export function sniffIsoBmff(bytes: Uint8Array): FormatId | null {
  if (asciiAt(bytes, 4, 4) !== "ftyp") return null;
  const boxSize = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(0);
  const brands = [asciiAt(bytes, 8, 4)];
  for (let at = 16; at + 4 <= Math.min(boxSize, bytes.length); at += 4) {
    brands.push(asciiAt(bytes, at, 4));
  }
  if (brands.some((b) => AVIF_BRANDS.has(b))) return "avif";
  if (brands.some((b) => HEIC_BRANDS.has(b))) return "heic";
  const major = brands[0];
  if (major === "M4A " || major === "M4B ") return "m4a";
  if (major === "qt  ") return "mov";
  return "mp4";
}

/** RIFF wraps WebP, WAV and AVI. The form type at byte 8 says which. */
export function sniffRiff(bytes: Uint8Array): FormatId | null {
  if (asciiAt(bytes, 0, 4) !== "RIFF") return null;
  const form = asciiAt(bytes, 8, 4);
  if (form === "WEBP") return "webp";
  if (form === "WAVE") return "wav";
  if (form === "AVI ") return "avi";
  return null;
}

/** WebM and MKV share the EBML header and differ in the DocType string. */
export function sniffEbml(bytes: Uint8Array): FormatId | null {
  if (!hasBytesAt(bytes, 0, [0x1a, 0x45, 0xdf, 0xa3])) return null;
  return containsAscii(bytes, "webm", 64) ? "webm" : "mkv";
}

/**
 * DOCX and XLSX are zip files. Their entry names sit in the local headers
 * near the start, so a quick scan tells them apart from a plain zip.
 */
export function sniffZip(bytes: Uint8Array): FormatId | null {
  if (!hasBytesAt(bytes, 0, [0x50, 0x4b, 0x03, 0x04])) return null;
  if (containsAscii(bytes, "word/")) return "docx";
  if (containsAscii(bytes, "xl/")) return "xlsx";
  return "zip";
}
