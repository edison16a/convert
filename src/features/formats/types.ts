/** Groups shown in the format picker, in display order. */
export const CATEGORIES = ["image", "audio", "video", "document", "data"] as const;

/** "archive" only exists for detection (a zip we cannot open yet), never in the picker. */
export type Category = (typeof CATEGORIES)[number] | "archive";

/**
 * Every format the app can recognize. Ids are lowercase and double as the
 * file extension we write, so "jpg" is used for both .jpg and .jpeg input.
 */
export type FormatId =
  | "png" | "jpg" | "webp" | "avif" | "gif" | "bmp" | "svg" | "heic" | "ico"
  | "mp3" | "wav" | "flac" | "ogg" | "m4a" | "aac"
  | "mp4" | "mov" | "webm" | "mkv" | "avi"
  | "md" | "html" | "txt" | "docx" | "pdf"
  | "csv" | "json" | "xlsx" | "yaml" | "xml"
  | "zip";

/** Static facts about one format. Behaviour lives in the engines, not here. */
export interface FormatDef {
  id: FormatId;
  /** Short uppercase name for chips and menus, for example "JPG". */
  label: string;
  category: Category;
  /** Lowercase extensions without the dot. The first one is the canonical output extension. */
  extensions: string[];
  /** MIME types browsers report for this format, used as a detection fallback. */
  mimes: string[];
}

/** The in-browser engine that does the work. Each one loads on demand. */
export type EngineId = "image" | "ffmpeg" | "document" | "pdf" | "data";

/**
 * One conversion capability: an engine that can turn any of `from` into any
 * of `to`. The registry flattens these into per-file output lists.
 */
export interface Route {
  engine: EngineId;
  from: readonly FormatId[];
  to: readonly FormatId[];
}
