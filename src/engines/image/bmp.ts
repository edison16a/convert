/**
 * Writes an uncompressed 24 bit BMP. BMP is simple enough that a library
 * would be heavier than the format. Pixels must already be composited on an
 * opaque background, because 24 bit BMP has no alpha channel.
 */
export function encodeBmp(width: number, height: number, rgba: Uint8ClampedArray | Uint8Array): Uint8Array {
  const rowSize = Math.ceil((width * 3) / 4) * 4; // rows are padded to 4 bytes
  const pixelBytes = rowSize * height;
  const out = new Uint8Array(54 + pixelBytes);
  const view = new DataView(out.buffer);

  out[0] = 0x42; // "B"
  out[1] = 0x4d; // "M"
  view.setUint32(2, out.length, true);
  view.setUint32(10, 54, true); // where pixel data starts
  view.setUint32(14, 40, true); // info header size
  view.setInt32(18, width, true);
  view.setInt32(22, height, true); // positive height means rows run bottom to top
  view.setUint16(26, 1, true); // color planes
  view.setUint16(28, 24, true); // bits per pixel
  view.setUint32(34, pixelBytes, true);
  view.setInt32(38, 2835, true); // about 72 dpi
  view.setInt32(42, 2835, true);

  for (let y = 0; y < height; y++) {
    const source = (height - 1 - y) * width * 4;
    let target = 54 + y * rowSize;
    for (let x = 0; x < width; x++) {
      out[target++] = rgba[source + x * 4 + 2]; // BMP stores blue first
      out[target++] = rgba[source + x * 4 + 1];
      out[target++] = rgba[source + x * 4];
    }
  }
  return out;
}
