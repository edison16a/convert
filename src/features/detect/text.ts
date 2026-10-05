import type { FormatId } from "@/features/formats/types";

/** How many bytes of a file we read to classify it. Plenty for any header. */
export const SNIFF_BYTES = 64 * 1024;

/**
 * Decodes the head of a file as UTF-8, or returns null when it looks binary.
 * A NUL byte or a pile of control characters means "not text", which is how
 * we avoid labelling a corrupt MP3 as a text file.
 */
export function decodeText(bytes: Uint8Array): string | null {
  let controls = 0;
  for (const byte of bytes) {
    if (byte === 0) return null;
    if (byte < 9 || (byte > 13 && byte < 32)) controls++;
  }
  if (bytes.length > 0 && controls / bytes.length > 0.02) return null;
  return new TextDecoder("utf-8").decode(bytes).replace(/^﻿/, "");
}

/** Reads JSON from a prefix. A truncated file cannot be parsed, so we judge the opening instead. */
function looksLikeJson(text: string, truncated: boolean): boolean {
  const trimmed = text.trim();
  if (!/^[[{]/.test(trimmed)) return false;
  if (!truncated) {
    try {
      JSON.parse(trimmed);
      return true;
    } catch {
      return false;
    }
  }
  return /^[[{]\s*(["{[\d\]}]|true|false|null|-)/.test(trimmed);
}

/** Comma separated data: at least three lines with the same, non-zero comma count. */
function looksLikeCsv(text: string): boolean {
  const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "").slice(0, 8);
  if (lines.length < 3) return false;
  const counts = lines.map((line) => line.split(",").length - 1);
  return counts[0] >= 2 && counts.every((count) => count === counts[0]);
}

/** Two or more Markdown-only markers, so ordinary prose with a dash does not count. */
function looksLikeMarkdown(text: string): boolean {
  const markers = [/^#{1,6}\s\S/m, /^```/m, /\[[^\]]+\]\([^)]+\)/, /\*\*[^*]+\*\*/, /^>\s\S/m];
  return markers.filter((re) => re.test(text)).length >= 2;
}

/**
 * Content signals strong enough to override the filename: markup prologs and
 * valid JSON. Returns null when the text could be several things.
 */
export function sniffStrongText(text: string, truncated: boolean): FormatId | null {
  const head = text.trimStart().slice(0, 2048).toLowerCase();
  if (head.startsWith("<svg") || (head.startsWith("<?xml") && head.includes("<svg"))) return "svg";
  if (head.startsWith("<?xml")) return "xml";
  if (head.startsWith("<!doctype html") || head.startsWith("<html")) return "html";
  // A leading "---" is also Markdown front matter, so only the explicit directive counts here.
  if (head.startsWith("%yaml")) return "yaml";
  if (looksLikeJson(text, truncated)) return "json";
  return null;
}

/** Last resort for text with no useful extension or MIME type. */
export function sniffWeakText(text: string): FormatId {
  if (looksLikeCsv(text)) return "csv";
  if (looksLikeMarkdown(text)) return "md";
  return "txt";
}
