/**
 * Makes file names unique inside one archive: "photo.jpg", "photo (1).jpg",
 * "photo (2).jpg". Comparison ignores case because macOS and Windows treat
 * "Photo.jpg" and "photo.jpg" as the same file when the zip is extracted.
 */
export function dedupeNames(names: readonly string[]): string[] {
  const used = new Set<string>();
  return names.map((name) => {
    let candidate = name;
    if (used.has(candidate.toLowerCase())) {
      const dot = name.lastIndexOf(".");
      const base = dot > 0 ? name.slice(0, dot) : name;
      const ext = dot > 0 ? name.slice(dot) : "";
      let n = 1;
      do {
        candidate = `${base} (${n++})${ext}`;
      } while (used.has(candidate.toLowerCase()));
    }
    used.add(candidate.toLowerCase());
    return candidate;
  });
}
