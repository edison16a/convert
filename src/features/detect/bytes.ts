/** Small helpers for reading file headers without pulling in a library. */

/** True when `bytes` contains `pattern` starting exactly at `offset`. */
export function hasBytesAt(bytes: Uint8Array, offset: number, pattern: readonly number[]): boolean {
  if (bytes.length < offset + pattern.length) return false;
  return pattern.every((value, index) => bytes[offset + index] === value);
}

/** Reads `length` bytes as Latin-1 text. Good enough for four-letter tags. */
export function asciiAt(bytes: Uint8Array, offset: number, length: number): string {
  let out = "";
  for (let i = offset; i < Math.min(bytes.length, offset + length); i++) {
    out += String.fromCharCode(bytes[i]);
  }
  return out;
}

/** True when the ASCII `needle` appears anywhere in the first `limit` bytes. */
export function containsAscii(bytes: Uint8Array, needle: string, limit = bytes.length): boolean {
  const end = Math.min(bytes.length, limit) - needle.length;
  const first = needle.charCodeAt(0);
  for (let i = 0; i <= end; i++) {
    if (bytes[i] !== first) continue;
    let match = true;
    for (let j = 1; j < needle.length; j++) {
      if (bytes[i + j] !== needle.charCodeAt(j)) {
        match = false;
        break;
      }
    }
    if (match) return true;
  }
  return false;
}
