import { FORMATS, FORMAT_LIST } from "./definitions";
import { ROUTES } from "./routes";
import { CATEGORIES, type Category, type EngineId, type FormatDef, type FormatId } from "./types";

/**
 * Outputs the current browser cannot produce, found by probing at startup.
 * Passing it in (instead of reading a global) keeps these functions pure and
 * easy to test.
 */
export type Unavailable = ReadonlySet<FormatId>;

const NONE: Unavailable = new Set();

/** Every output a file of this type can reach, minus its own format. */
export function outputsFor(from: FormatId, unavailable: Unavailable = NONE): FormatId[] {
  const seen = new Set<FormatId>();
  for (const route of ROUTES) {
    if (!route.from.includes(from)) continue;
    for (const to of route.to) {
      if (to !== from && !unavailable.has(to)) seen.add(to);
    }
  }
  return [...seen];
}

/** The engine that handles one specific pair, or null when no route exists. */
export function findEngine(from: FormatId, to: FormatId): EngineId | null {
  const route = ROUTES.find((r) => r.from.includes(from) && r.to.includes(to));
  return route && from !== to ? route.engine : null;
}

export function canConvert(from: FormatId, to: FormatId, unavailable: Unavailable = NONE): boolean {
  return !unavailable.has(to) && findEngine(from, to) !== null;
}

/**
 * Outputs reachable by at least one of the given inputs. This is what the
 * global picker shows, so a format nobody in the batch can reach stays hidden.
 */
export function reachableOutputs(inputs: Iterable<FormatId>, unavailable: Unavailable = NONE): FormatId[] {
  const union = new Set<FormatId>();
  for (const input of new Set(inputs)) {
    outputsFor(input, unavailable).forEach((to) => union.add(to));
  }
  return [...union];
}

/** True when we have any route that reads this format at all. */
export function isReadable(from: FormatId): boolean {
  return ROUTES.some((route) => route.from.includes(from));
}

/** Groups output ids by category in picker order, dropping empty groups. */
export function groupByCategory(ids: readonly FormatId[]): { category: Category; formats: FormatDef[] }[] {
  const order = new Map(FORMAT_LIST.map((def, index) => [def.id, index]));
  return CATEGORIES.map((category) => ({
    category,
    formats: ids
      .map((id) => FORMATS[id])
      .filter((def) => def.category === category)
      .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0)),
  })).filter((group) => group.formats.length > 0);
}

/**
 * A sensible default output for a file, used so a dropped file already has a
 * choice. Prefers the most common web friendly target of its category.
 */
export function defaultOutput(from: FormatId, unavailable: Unavailable = NONE): FormatId | null {
  const options = outputsFor(from, unavailable);
  const preferred: Partial<Record<Category, FormatId[]>> = {
    image: ["jpg", "png", "webp"],
    audio: ["mp3", "wav"],
    video: ["mp4", "webm"],
    document: ["pdf", "md", "txt"],
    data: ["csv", "json"],
  };
  const hints = preferred[FORMATS[from].category] ?? [];
  return hints.find((id) => options.includes(id)) ?? options[0] ?? null;
}
