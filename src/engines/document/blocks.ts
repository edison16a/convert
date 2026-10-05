import { HTMLElement, NodeType, parse, type Node } from "node-html-parser";

/**
 * A deliberately small document model. Both the plain text writer and the
 * PDF writer read it, so layout rules live in one place and neither needs a
 * real DOM (workers do not have one).
 */
export type Block =
  | { kind: "heading"; level: number; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "item"; text: string; depth: number; marker: string }
  | { kind: "code"; text: string }
  | { kind: "rule" };

const SKIP = new Set(["head", "script", "style", "noscript", "template", "title"]);
const INLINE = new Set([
  "a", "abbr", "b", "big", "cite", "code", "em", "i", "kbd", "mark", "q", "s", "small",
  "span", "strong", "sub", "sup", "u", "br", "img", "label", "del", "ins",
]);

/** Collapses whitespace the way a browser would when it lays out a paragraph. */
const squash = (text: string) => text.replace(/\s+/g, " ").trim();

/** Text of an inline subtree. A <br> becomes a real line break. */
function inlineText(node: Node): string {
  if (node.nodeType === NodeType.TEXT_NODE) return node.text;
  if (!(node instanceof HTMLElement) || SKIP.has(node.tagName.toLowerCase())) return "";
  if (node.tagName.toLowerCase() === "br") return "\n";
  return node.childNodes.map(inlineText).join("");
}

/** Squashes spaces but keeps the line breaks that came from <br>. */
const cleanInline = (text: string) =>
  text.split("\n").map(squash).join("\n").replace(/^\n+|\n+$/g, "");

/** Walks an element and appends blocks. `flush` empties pending inline text into a paragraph. */
function walk(node: Node, out: Block[], depth = 0): void {
  let pending = "";
  const flush = () => {
    const text = cleanInline(pending);
    if (text) out.push({ kind: "paragraph", text });
    pending = "";
  };

  for (const child of node.childNodes) {
    if (child.nodeType === NodeType.TEXT_NODE) {
      pending += child.text;
      continue;
    }
    if (!(child instanceof HTMLElement)) continue;
    const tag = child.tagName.toLowerCase();
    if (SKIP.has(tag)) continue;
    if (INLINE.has(tag)) {
      pending += inlineText(child);
      continue;
    }
    flush();
    block(child, tag, out, depth);
  }
  flush();
}

function block(el: HTMLElement, tag: string, out: Block[], depth: number): void {
  if (/^h[1-6]$/.test(tag)) {
    const text = cleanInline(inlineText(el));
    if (text) out.push({ kind: "heading", level: Number(tag[1]), text });
  } else if (tag === "pre") {
    out.push({ kind: "code", text: inlineText(el).replace(/\n+$/, "") });
  } else if (tag === "hr") {
    out.push({ kind: "rule" });
  } else if (tag === "ul" || tag === "ol") {
    list(el, tag === "ol", out, depth);
  } else if (tag === "table") {
    el.querySelectorAll("tr").forEach((row) => {
      const cells = row.querySelectorAll("th,td").map((cell) => squash(inlineText(cell)));
      if (cells.some(Boolean)) out.push({ kind: "paragraph", text: cells.join(" | ") });
    });
  } else if (tag === "p" || tag === "blockquote") {
    const text = cleanInline(inlineText(el));
    if (text) out.push({ kind: "paragraph", text });
  } else {
    walk(el, out, depth);
  }
}

/** Lists keep their depth so nested items indent. Item text excludes nested lists. */
function list(el: HTMLElement, ordered: boolean, out: Block[], depth: number): void {
  let index = 1;
  for (const item of el.childNodes) {
    if (!(item instanceof HTMLElement) || item.tagName.toLowerCase() !== "li") continue;
    const own = item.childNodes.filter(
      (n) => !(n instanceof HTMLElement && ["ul", "ol"].includes(n.tagName.toLowerCase())),
    );
    const text = cleanInline(own.map(inlineText).join(""));
    if (text) out.push({ kind: "item", text, depth, marker: ordered ? `${index}.` : "-" });
    index++;
    item.childNodes.forEach((n) => {
      if (n instanceof HTMLElement && ["ul", "ol"].includes(n.tagName.toLowerCase())) {
        list(n, n.tagName.toLowerCase() === "ol", out, depth + 1);
      }
    });
  }
}

/** Reduces an HTML string to the block model. Unknown tags are treated as plain containers. */
export function htmlToBlocks(html: string): Block[] {
  const out: Block[] = [];
  walk(parse(html), out);
  return out;
}
