import { GIFEncoder, applyPalette, quantize } from "gifenc";

/**
 * Encodes one frame as a GIF. We quantize with a 1 bit alpha so transparent
 * areas of a PNG stay transparent instead of turning black. Animated input
 * is read as its first frame, which is what the browser decoder gives us.
 */
export function encodeGif(width: number, height: number, rgba: Uint8ClampedArray): Uint8Array {
  const data = new Uint8Array(rgba.buffer, rgba.byteOffset, rgba.byteLength);
  const palette = quantize(data, 256, { format: "rgba4444", oneBitAlpha: true });
  const index = applyPalette(data, palette, "rgba4444");
  const transparentIndex = palette.findIndex((color) => color[3] === 0);

  const gif = GIFEncoder();
  gif.writeFrame(index, width, height, {
    palette,
    transparent: transparentIndex >= 0,
    transparentIndex: Math.max(0, transparentIndex),
  });
  gif.finish();
  return gif.bytes();
}
