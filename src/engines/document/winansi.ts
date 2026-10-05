/** Typographic characters that PDF's built-in fonts lack, mapped to safe stand-ins. */
const REPLACEMENTS: Record<string, string> = {
  "‘": "'", "’": "'", "“": '"', "”": '"',
  "–": "-", "—": "-", "−": "-", "…": "...", " ": " ",
  "→": "->", "←": "<-", "✓": "x", "•": "•",
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
    out += /^[\x09\x0A\x20-\x7E\xA1-\xFF•]*$/.test(mapped) ? mapped : "?";
  }
  return out;
}
