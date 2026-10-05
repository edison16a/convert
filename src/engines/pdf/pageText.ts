/** The part of a pdf.js text item we need. Marked items (like marked content) have no `str`. */
export interface TextPiece {
  str?: string;
  hasEOL?: boolean;
}

/**
 * Joins the pieces of one page into readable text. pdf.js splits a line into
 * many chunks and flags where a line really ends, so we only add a newline
 * there instead of between every chunk.
 */
export function joinTextPieces(pieces: readonly TextPiece[]): string {
  let out = "";
  for (const piece of pieces) {
    if (typeof piece.str !== "string") continue;
    out += piece.str;
    if (piece.hasEOL) out += "\n";
  }
  return out.replace(/[ \t]+\n/g, "\n").trim();
}
