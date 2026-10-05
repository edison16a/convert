import type { FormatId } from "@/features/formats/types";
import { ConversionError } from "../errors";

/** Plain decoding with the browser, the fast path for everything it understands. */
async function decodeNative(file: File): Promise<ImageBitmap> {
  return createImageBitmap(file);
}

/**
 * Older browsers cannot decode every WebP or AVIF, so those two fall back to
 * WASM codecs. The imports are dynamic so the weight is only paid when needed.
 */
async function decodeWithWasm(file: File, from: FormatId): Promise<ImageBitmap> {
  const buffer = await file.arrayBuffer();
  const decode = from === "avif" ? (await import("@jsquash/avif/decode")).default : (await import("@jsquash/webp/decode")).default;
  const image = await decode(buffer);
  if (!image) throw new Error("decode failed");
  return createImageBitmap(image);
}

/**
 * Turns an image file into a bitmap. HEIC always goes through heic-to, since
 * no browser besides Safari reads it. SVG never arrives here: it is
 * rasterized on the main thread first because workers cannot render SVG.
 */
export async function decodeImage(file: File, from: FormatId): Promise<ImageBitmap> {
  try {
    if (from === "heic") {
      const { heicTo } = await import("heic-to/next");
      return await heicTo({ blob: file, type: "bitmap" });
    }
    try {
      return await decodeNative(file);
    } catch (error) {
      if (from === "avif" || from === "webp") return await decodeWithWasm(file, from);
      throw error;
    }
  } catch {
    throw new ConversionError("This image could not be read. It may be damaged.", "corrupt");
  }
}
