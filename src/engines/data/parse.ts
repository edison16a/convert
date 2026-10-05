import Papa from "papaparse";
import { XMLParser, XMLValidator } from "fast-xml-parser";
import { load as loadYaml } from "js-yaml";
import * as XLSX from "xlsx";
import { ConversionError } from "../errors";
import type { FormatId } from "@/features/formats/types";
import { coerceCell, type Row } from "./rows";

/** Reads a text file, dropping the byte order mark some editors add. */
async function readText(file: File): Promise<string> {
  return (await file.text()).replace(/^﻿/, "");
}

function parseCsv(text: string): Row[] {
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (header) => header.trim(),
  });
  if (result.data.length === 0) throw new ConversionError("This CSV file has no rows to convert.", "corrupt");
  return result.data.map((record) =>
    Object.fromEntries(Object.entries(record).map(([key, raw]) => [key, coerceCell(String(raw ?? ""))])),
  );
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    throw new ConversionError("This JSON file is not valid. Check for a missing comma or quote.", "corrupt");
  }
}

function parseYaml(text: string): unknown {
  try {
    return loadYaml(text) ?? [];
  } catch {
    throw new ConversionError("This YAML file is not valid. Check the indentation.", "corrupt");
  }
}

function parseXml(text: string): unknown {
  if (XMLValidator.validate(text) !== true) {
    throw new ConversionError("This XML file is not well formed.", "corrupt");
  }
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    trimValues: true,
    ignoreDeclaration: true,
  });
  return parser.parse(text);
}

/**
 * Reads every sheet of a workbook. One sheet gives plain rows. Several give a
 * map keyed by sheet name so JSON and YAML keep all of the data.
 */
async function parseXlsx(file: File): Promise<unknown> {
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
  } catch {
    throw new ConversionError("This spreadsheet could not be opened. It may be damaged or protected.", "corrupt");
  }
  const sheets = Object.fromEntries(
    workbook.SheetNames.map((name) => [name, XLSX.utils.sheet_to_json<Row>(workbook.Sheets[name], { defval: null })]),
  );
  const names = Object.keys(sheets);
  return names.length === 1 ? sheets[names[0]] : sheets;
}

/** Parses any supported data file into plain JavaScript values. */
export async function parseData(file: File, from: FormatId): Promise<unknown> {
  if (from === "xlsx") return parseXlsx(file);
  const text = await readText(file);
  switch (from) {
    case "csv":
      return parseCsv(text);
    case "json":
      return parseJson(text);
    case "yaml":
      return parseYaml(text);
    case "xml":
      return parseXml(text);
    default:
      throw new ConversionError(`Cannot read ${from.toUpperCase()} as data.`, "unsupported");
  }
}
