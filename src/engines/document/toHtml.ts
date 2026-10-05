import { marked } from "marked";
import * as mammoth from "mammoth/mammoth.browser";
import type { FormatId } from "@/features/formats/types";
import { ConversionError } from "../errors";
import { textToHtml } from "./text";

/**
 * Brings any document input to HTML, which is the common ground for all the
 * outputs. Markdown goes through marked, Word through mammoth, and plain text
 * is just escaped and split into paragraphs.
 */
export async function toHtml(file: File, from: FormatId): Promise<string> {
  if (from === "docx") {
    try {
      return (await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() })).value;
    } catch {
      throw new ConversionError("This Word file could not be read. It may be damaged or protected.", "corrupt");
    }
  }
  const text = (await file.text()).replace(/^﻿/, "");
  if (from === "md") return marked.parse(text, { async: false });
  if (from === "html") return text;
  return textToHtml(text);
}
