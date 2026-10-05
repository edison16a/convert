/** A spreadsheet cell. Nested data is flattened or stringified before it gets here. */
export type Cell = string | number | boolean | null;
export type Row = Record<string, Cell>;

const PLAIN_NUMBER = /^-?(0|[1-9]\d*)(\.\d+)?$/;

/**
 * Turns CSV text into a typed value. Numbers and booleans become real ones so
 * JSON and spreadsheets look right, but anything with a leading zero ("007",
 * zip codes, phone numbers) stays a string because converting it would lose data.
 */
export function coerceCell(raw: string): Cell {
  const text = raw.trim();
  if (PLAIN_NUMBER.test(text)) return Number(text);
  if (text === "true") return true;
  if (text === "false") return false;
  return raw;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Flattens one record into a single level. Nested objects become dotted keys
 * ("address.city") and arrays become JSON text, so every value fits in a cell.
 */
export function flattenRecord(value: Record<string, unknown>, prefix = "", out: Row = {}): Row {
  for (const [key, inner] of Object.entries(value)) {
    const name = prefix ? `${prefix}.${key}` : key;
    if (isRecord(inner)) flattenRecord(inner, name, out);
    else if (Array.isArray(inner)) out[name] = JSON.stringify(inner);
    else out[name] = (inner ?? null) as Cell;
  }
  return out;
}

/** Normalizes the items of an array into rows, whatever shape they came in. */
function rowsFromArray(items: unknown[]): Row[] {
  return items.map((item) => {
    if (isRecord(item)) return flattenRecord(item);
    if (Array.isArray(item)) return Object.fromEntries(item.map((cell, i) => [String(i + 1), cell as Cell]));
    return { value: (item ?? null) as Cell };
  });
}

/** True for { Sheet1: [...], Sheet2: [...] }, which is how we hold multi-sheet workbooks. */
export function isSheetMap(value: unknown): value is Record<string, unknown[]> {
  if (!isRecord(value)) return false;
  const values = Object.values(value);
  return values.length > 1 && values.every(Array.isArray);
}

/**
 * Finds the table inside any parsed value. XML and JSON often wrap the list
 * of records in one or two single-key objects (<root><item>...</item></root>),
 * so we walk down through those until we hit an array.
 */
export function toRows(value: unknown): Row[] {
  let current = value;
  while (true) {
    if (Array.isArray(current)) return rowsFromArray(current);
    if (isSheetMap(current)) return rowsFromArray(Object.values(current)[0]);
    if (isRecord(current)) {
      const keys = Object.keys(current);
      const only = keys.length === 1 ? current[keys[0]] : undefined;
      if (only !== undefined && (isRecord(only) || Array.isArray(only))) {
        current = only;
        continue;
      }
      return [flattenRecord(current)];
    }
    return [{ value: (current ?? null) as Cell }];
  }
}

/** Every column that appears in any row, in first-seen order. */
export function columnsOf(rows: readonly Row[]): string[] {
  const seen = new Set<string>();
  for (const row of rows) Object.keys(row).forEach((key) => seen.add(key));
  return [...seen];
}
