import { NodeHtmlMarkdown } from "node-html-markdown";
import type { Converter } from "../types";
import { htmlToBlocks } from "./blocks";
import { blocksToPdf } from "./pdfWriter";
import { blocksToText, wrapHtml } from "./text";
import { toHtml } from "./toHtml";

const baseName = (name: string) => name.replace(/\.[^.]+$/, "") || name;

/**
 * Documents pivot through HTML. Input becomes HTML once, then each output
 * reads from it: Markdown by translation, text and PDF through the block model.
 * Plain text to Markdown skips the trip because the text already is Markdown.
 */
export const convertDocument: Converter = async ({ file, from, to, report }) => {
  if (from === "txt" && to === "md") {
    const text = (await file.text()).replace(/^﻿/, "");
    return { blob: new Blob([text], { type: "text/markdown;charset=utf-8" }), extension: "md" };
  }
  const html = await toHtml(file, from);
  report(0.5);

  switch (to) {
    case "html":
      return { blob: new Blob([wrapHtml(html, baseName(file.name))], { type: "text/html;charset=utf-8" }), extension: "html" };
    case "md":
      return { blob: new Blob([NodeHtmlMarkdown.translate(html)], { type: "text/markdown;charset=utf-8" }), extension: "md" };
    case "txt":
      return { blob: new Blob([blocksToText(htmlToBlocks(html))], { type: "text/plain;charset=utf-8" }), extension: "txt" };
    default: {
      const bytes = await blocksToPdf(htmlToBlocks(html), baseName(file.name));
      return { blob: new Blob([bytes as BlobPart], { type: "application/pdf" }), extension: "pdf" };
    }
  }
};
