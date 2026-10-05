import type { FormatId } from "@/features/formats/types";
import { hasBytesAt } from "./bytes";
import { sniffEbml, sniffIsoBmff, sniffRiff, sniffZip } from "./containers";

/** Fixed-offset signatures that are enough on their own. */
const SIMPLE: { format: FormatId; offset: number; bytes: readonly number[] }[] = [
  { format: "png", offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { format: "jpg", offset: 0, bytes: [0xff, 0xd8, 0xff] },
  { format: "gif", offset: 0, bytes: [0x47, 0x49, 0x46, 0x38] },
  { format: "ico", offset: 0, bytes: [0x00, 0x00, 0x01, 0x00] },
  { format: "flac", offset: 0, bytes: [0x66, 0x4c, 0x61, 0x43] },
  { format: "ogg", offset: 0, bytes: [0x4f, 0x67, 0x67, 0x53] },
  { format: "mp3", offset: 0, bytes: [0x49, 0x44, 0x33] },
];

/** A raw audio frame header: 11 bits of sync, then a layer that tells MP3 from AAC. */
function sniffAudioFrame(bytes: Uint8Array): FormatId | null {
  if (bytes.length < 2 || bytes[0] !== 0xff || (bytes[1] & 0xe0) !== 0xe0) return null;
  const layer = bytes[1] & 0x06;
  return layer === 0 ? "aac" : "mp3";
}

/** BMP starts with "BM" and has four reserved zero bytes, which cuts false hits. */
function sniffBmp(bytes: Uint8Array): FormatId | null {
  return hasBytesAt(bytes, 0, [0x42, 0x4d]) && hasBytesAt(bytes, 6, [0, 0, 0, 0]) ? "bmp" : null;
}

/** PDFs may have junk before the header, so look in the first kilobyte. */
function sniffPdf(bytes: Uint8Array): FormatId | null {
  const head = bytes.subarray(0, 1024);
  for (let i = 0; i + 4 <= head.length; i++) {
    if (hasBytesAt(head, i, [0x25, 0x50, 0x44, 0x46])) return "pdf";
  }
  return null;
}

/**
 * Identifies a binary format from its first bytes, or returns null when the
 * header is unknown (which includes every plain text format).
 */
export function sniffBinary(bytes: Uint8Array): FormatId | null {
  for (const sig of SIMPLE) {
    if (hasBytesAt(bytes, sig.offset, sig.bytes)) return sig.format;
  }
  return (
    sniffRiff(bytes) ??
    sniffIsoBmff(bytes) ??
    sniffEbml(bytes) ??
    sniffZip(bytes) ??
    sniffBmp(bytes) ??
    sniffPdf(bytes) ??
    sniffAudioFrame(bytes)
  );
}
