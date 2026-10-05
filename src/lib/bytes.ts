const UNITS = ["B", "KB", "MB", "GB", "TB"];

/** Formats a byte count the way the mockups show it: "2.4 MB", "380 KB", "96 MB". */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const exponent = Math.min(UNITS.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / 1024 ** exponent;
  // Whole numbers once there are three digits or more, one decimal below that.
  const text = value >= 100 || exponent === 0 ? Math.round(value).toString() : value.toFixed(1).replace(/\.0$/, "");
  return `${text} ${UNITS[exponent]}`;
}
