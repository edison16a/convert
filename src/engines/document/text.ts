import type { Block } from "./blocks";

export function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Plain text rendering of the block model. Blank lines separate blocks, lists stay compact. */
export function blocksToText(blocks: readonly Block[]): string {
  const lines: string[] = [];
  blocks.forEach((block, index) => {
    const next = blocks[index + 1];
    switch (block.kind) {
      case "item":
        lines.push(`${"  ".repeat(block.depth)}${block.marker} ${block.text}`);
        if (next?.kind !== "item") lines.push("");
        break;
      case "rule":
        lines.push("---", "");
        break;
      default:
        lines.push(block.text, "");
    }
  });
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

/** Wraps plain text as HTML: blank lines split paragraphs, single newlines become <br>. */
export function textToHtml(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .split(/\n{2,}/)
    .filter((chunk) => chunk.trim() !== "")
    .map((chunk) => `<p>${escapeHtml(chunk.trim()).replace(/\n/g, "<br>")}</p>`)
    .join("\n");
}

const STYLE = `body{font:16px/1.65 system-ui,-apple-system,"Segoe UI",sans-serif;max-width:46rem;margin:3rem auto;padding:0 1.25rem;color:#111}
pre,code{font-family:ui-monospace,Menlo,monospace;background:#f4f4f5;border-radius:6px}pre{padding:1rem;overflow:auto}code{padding:.1em .3em}
table{border-collapse:collapse}td,th{border:1px solid #ddd;padding:.4rem .7rem}img{max-width:100%}`;

/** A complete, self-contained HTML page so the result opens correctly on its own. */
export function wrapHtml(body: string, title: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>${STYLE}</style>
</head>
<body>
${body}
</body>
</html>
`;
}
