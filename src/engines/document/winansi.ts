/** Typographic characters that PDF's built-in fonts lack, mapped to safe stand-ins. */
const REPLACEMENTS: Record<string, string> = {
  "\u2018": "'", "\u2019": "'", "\u201C": '"', "\u201D": '"',
  "\u2013": "-", "\u2014": "-", "\u2212": "-", "\u2026": "...", "\u00A0": " ",
  "\u2192": "->", "\u2190": "<-", "\u2713": "x", "\u2022": "\u2022",
};

/**
 * PDF's standard fonts only cover Latin-1 plus a few extras. Embedding a full
 * Unicode font would add megabytes, so we swap known punctuation and replace
 * the rest with "?". This is the one place the PDF output loses fidelity.
 */
export function toWinAnsi(text: string): string {
  let out = "";
  for (const char of text) {
    const mapped = REPLACEMENTS[char] ?? char;
    out += /^[\x09\x0A\x20-\x7E\xA1-\xFF\u2022]*$/.test(mapped) ? mapped : "?";
  }
  return out;
}
