/**
 * Builds the output filename: same base name, new extension. "IMG_4021.HEIC"
 * becomes "IMG_4021.jpg". A leading dot (".env") is treated as part of the
 * name, not an extension.
 */
export function outputName(inputName: string, extension: string): string {
  const dot = inputName.lastIndexOf(".");
  const base = dot > 0 ? inputName.slice(0, dot) : inputName;
  return `${base}.${extension}`;
}
