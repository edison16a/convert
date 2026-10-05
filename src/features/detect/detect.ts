import { formatFromExtension, formatFromMime } from "@/features/formats/definitions";
import type { FormatId } from "@/features/formats/types";
import { sniffBinary } from "./signatures";
import { SNIFF_BYTES, decodeText, sniffStrongText, sniffWeakText } from "./text";

/** Everything detection needs, so the logic can be tested without a File. */
export interface DetectInput {
  /** The first bytes of the file. */
  head: Uint8Array;
  name: string;
  /** The MIME type the browser reported, often empty. */
  mime: string;
  size: number;
}

/** Text formats where the extension is a trustworthy tiebreaker. */
const TEXT_FORMATS = new Set<FormatId>(["csv", "json", "yaml", "xml", "md", "html", "txt", "svg"]);

function extensionOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(dot + 1) : "";
}

/**
 * Container sniffing cannot always tell an .m4a from an .mp4 (both are ISO
 * media). When the header says "mp4" and the name says audio, believe the name.
 */
function refineWithExtension(sniffed: FormatId, ext: FormatId | null): FormatId {
  if (sniffed === "mp4" && ext === "m4a") return "m4a";
  if (sniffed === "aac" && ext === "mp3") return "mp3";
  return sniffed;
}

/**
 * Identifies a file. Order matters and follows the product rules: magic bytes
 * first, then strong text content, then MIME type, then extension, then a
 * weak guess for plain text. Returns null for anything we cannot place.
 */
export function detectFromBytes({ head, name, mime, size }: DetectInput): FormatId | null {
  const byExt = formatFromExtension(extensionOf(name));
  const sniffed = sniffBinary(head);
  if (sniffed) return refineWithExtension(sniffed, byExt);

  const text = decodeText(head);
  if (text !== null) {
    const strong = sniffStrongText(text, size > head.length);
    if (strong) return strong;
    const byMime = formatFromMime(mime);
    // text/plain is what browsers say when they have no idea, so it never beats a real extension.
    if (byMime && byMime !== "txt" && TEXT_FORMATS.has(byMime)) return byMime;
    if (byExt && TEXT_FORMATS.has(byExt)) return byExt;
    return sniffWeakText(text);
  }

  // Binary with an unknown header: trust the browser, then the name.
  return formatFromMime(mime) ?? byExt;
}

/** Reads the head of a File and detects its format. Cheap even for multi-gigabyte files. */
export async function detectFormat(file: File): Promise<FormatId | null> {
  const head = new Uint8Array(await file.slice(0, SNIFF_BYTES).arrayBuffer());
  return detectFromBytes({ head, name: file.name, mime: file.type, size: file.size });
}
