/** Largest side an ICO entry can describe. A stored value of 0 means 256. */
export const ICO_MAX_SIZE = 256;

/**
 * Wraps one PNG image in an ICO container. Modern Windows and every browser
 * accept PNG data inside an ICO, which saves us writing a bitmap encoder.
 */
export function wrapPngAsIco(png: Uint8Array, width: number, height: number): Uint8Array {
  const out = new Uint8Array(22 + png.length);
  const view = new DataView(out.buffer);
  view.setUint16(2, 1, true); // type 1 means icon
  view.setUint16(4, 1, true); // one image
  out[6] = width >= ICO_MAX_SIZE ? 0 : width;
  out[7] = height >= ICO_MAX_SIZE ? 0 : height;
  view.setUint16(10, 1, true); // color planes
  view.setUint16(12, 32, true); // bits per pixel
  view.setUint32(14, png.length, true);
  view.setUint32(18, 22, true); // image data starts right after the 22 byte header
  out.set(png, 22);
  return out;
}

/** Scales a size down so its longest side fits an ICO entry, keeping the aspect ratio. */
export function fitForIco(width: number, height: number): { width: number; height: number } {
  const scale = Math.min(1, ICO_MAX_SIZE / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}
