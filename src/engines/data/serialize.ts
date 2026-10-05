import Papa from "papaparse";
import { dump as dumpYaml } from "js-yaml";
import * as XLSX from "xlsx";
import { ConversionError } from "../errors";
import type { FormatId } from "@/features/formats/types";
import { columnsOf, isSheetMap, toRows } from "./rows";

export interface Serialized {
  blob: Blob;
  extension: string;
}

const text = (body: string, type: string, extension: string): Serialized => ({
  blob: new Blob([body], { type: `${type};charset=utf-8` }),
  extension,
});

function toCsv(value: unknown): Serialized {
  const rows = toRows(value);
  // Papa only reads columns from the first row, so we list them ourselves.
  const csv = Papa.unparse({ fields: columnsOf(rows), data: rows.map((row) => columnsOf(rows).map((c) => row[c] ?? "")) });
  return text(csv, "text/csv", "csv");
}

/** One sheet per key for multi-sheet data, otherwise a single "Sheet1". */
function toXlsx(value: unknown): Serialized {
  const book = XLSX.utils.book_new();
  const sheets = isSheetMap(value) ? Object.entries(value) : [["Sheet1", toRows(value)] as const];
  for (const [name, content] of sheets) {
    const rows = toRows(content);
    XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(rows), name.slice(0, 31) || "Sheet1");
  }
  const bytes: Uint8Array = XLSX.write(book, { type: "array", bookType: "xlsx" });
  return {
    blob: new Blob([bytes as BlobPart], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    extension: "xlsx",
  };
}

/** Writes parsed data in the requested format. */
export function serializeData(value: unknown, to: FormatId): Serialized {
  switch (to) {
    case "csv":
      return toCsv(value);
    case "json":
      return text(JSON.stringify(value, null, 2), "application/json", "json");
    case "yaml":
      return text(dumpYaml(value, { lineWidth: -1, noRefs: true }), "application/yaml", "yaml");
    case "xlsx":
      return toXlsx(value);
    default:
      throw new ConversionError(`Cannot write ${to.toUpperCase()} from data.`, "unsupported");
  }
}
