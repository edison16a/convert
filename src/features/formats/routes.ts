import type { Route } from "./types";

/**
 * The whole conversion graph in one place. The UI only reads this through
 * registry.ts. To add a format, add it to definitions.ts, list it here under
 * the engine that can handle it, and write the converter function.
 */
export const ROUTES: readonly Route[] = [
  {
    engine: "image",
    from: ["png", "jpg", "webp", "avif", "gif", "bmp", "svg", "heic"],
    to: ["png", "jpg", "webp", "avif", "gif", "bmp", "ico"],
  },
  {
    engine: "ffmpeg",
    from: ["mp3", "wav", "flac", "ogg", "m4a", "aac"],
    to: ["mp3", "wav", "flac", "ogg", "m4a"],
  },
  {
    engine: "ffmpeg",
    from: ["mp4", "mov", "webm", "mkv", "avi"],
    // mp3 here means "pull the audio track out".
    to: ["mp4", "webm", "gif", "mp3"],
  },
  {
    engine: "document",
    from: ["md", "html", "txt", "docx"],
    to: ["md", "html", "txt", "pdf"],
  },
  {
    engine: "pdf",
    from: ["pdf"],
    to: ["png", "jpg", "txt"],
  },
  {
    engine: "data",
    from: ["csv", "json", "xlsx", "yaml", "xml"],
    to: ["csv", "json", "xlsx", "yaml"],
  },
];
