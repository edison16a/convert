import type { FormatDef, FormatId } from "./types";

/** Shorthand so the table below stays readable. */
const f = (
  id: FormatId,
  category: FormatDef["category"],
  extensions: string[],
  mimes: string[],
): FormatDef => ({ id, label: id.toUpperCase(), category, extensions, mimes });

export const FORMAT_LIST: readonly FormatDef[] = [
  f("png", "image", ["png"], ["image/png"]),
  f("jpg", "image", ["jpg", "jpeg", "jpe"], ["image/jpeg"]),
  f("webp", "image", ["webp"], ["image/webp"]),
  f("avif", "image", ["avif"], ["image/avif"]),
  f("gif", "image", ["gif"], ["image/gif"]),
  f("bmp", "image", ["bmp"], ["image/bmp", "image/x-ms-bmp"]),
  f("svg", "image", ["svg"], ["image/svg+xml"]),
  f("heic", "image", ["heic", "heif"], ["image/heic", "image/heif"]),
  f("ico", "image", ["ico"], ["image/x-icon", "image/vnd.microsoft.icon"]),

  f("mp3", "audio", ["mp3"], ["audio/mpeg", "audio/mp3"]),
  f("wav", "audio", ["wav"], ["audio/wav", "audio/x-wav", "audio/wave"]),
  f("flac", "audio", ["flac"], ["audio/flac", "audio/x-flac"]),
  f("ogg", "audio", ["ogg", "oga"], ["audio/ogg"]),
  f("m4a", "audio", ["m4a"], ["audio/mp4", "audio/x-m4a"]),
  f("aac", "audio", ["aac"], ["audio/aac"]),

  f("mp4", "video", ["mp4", "m4v"], ["video/mp4"]),
  f("mov", "video", ["mov", "qt"], ["video/quicktime"]),
  f("webm", "video", ["webm"], ["video/webm"]),
  f("mkv", "video", ["mkv"], ["video/x-matroska"]),
  f("avi", "video", ["avi"], ["video/x-msvideo", "video/avi"]),

  f("md", "document", ["md", "markdown"], ["text/markdown"]),
  f("html", "document", ["html", "htm"], ["text/html"]),
  f("txt", "document", ["txt", "text"], ["text/plain"]),
  f("docx", "document", ["docx"], [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ]),
  f("pdf", "document", ["pdf"], ["application/pdf"]),

  f("csv", "data", ["csv"], ["text/csv"]),
  f("json", "data", ["json"], ["application/json"]),
  f("xlsx", "data", ["xlsx"], [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ]),
  f("yaml", "data", ["yaml", "yml"], ["application/yaml", "text/yaml", "application/x-yaml"]),
  f("xml", "data", ["xml"], ["application/xml", "text/xml"]),

  f("zip", "archive", ["zip"], ["application/zip", "application/x-zip-compressed"]),
];

export const FORMATS: Readonly<Record<FormatId, FormatDef>> = Object.fromEntries(
  FORMAT_LIST.map((def) => [def.id, def]),
) as Record<FormatId, FormatDef>;

const byExtension = new Map<string, FormatId>();
const byMime = new Map<string, FormatId>();
for (const def of FORMAT_LIST) {
  def.extensions.forEach((ext) => byExtension.set(ext, def.id));
  def.mimes.forEach((mime) => byMime.set(mime, def.id));
}

/** Looks a format up by extension, with or without the dot, any case. */
export function formatFromExtension(ext: string): FormatId | null {
  return byExtension.get(ext.replace(/^\./, "").toLowerCase()) ?? null;
}

/** Looks a format up by MIME type, ignoring parameters like "; charset=utf-8". */
export function formatFromMime(mime: string): FormatId | null {
  return byMime.get(mime.split(";")[0].trim().toLowerCase()) ?? null;
}
