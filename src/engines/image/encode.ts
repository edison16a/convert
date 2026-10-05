import type { FormatId } from "@/features/formats/types";
import { ConversionError } from "../errors";
import { encodeBmp } from "./bmp";
import { encodeGif } from "./gif";
import { fitForIco, wrapPngAsIco } from "./ico";

const MIME: Partial<Record<FormatId, string>> = {
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
  avif: "image/avif",
};

/** Formats with no alpha channel get a white backdrop so transparency does not turn black. */
const OPAQUE = new Set<FormatId>(["jpg", "bmp"]);

const nativeSupport = new Map<string, Promise<boolean>>();

/**
 * Asks the browser whether canvas can really produce a type. Browsers fall
 * back to PNG for types they cannot encode, so we check the blob's type.
 */
function canEncodeNatively(type: string): Promise<boolean> {
  if (!nativeSupport.has(type)) {
    // A canvas with no context yet refuses to export, so claim a 2d one first.
    const probe = new OffscreenCanvas(1, 1);
    probe.getContext("2d");
    nativeSupport.set(
      type,
      probe
        .convertToBlob({ type })
        .then((blob) => blob.type === type)
        .catch(() => false),
    );
  }
  return nativeSupport.get(type) as Promise<boolean>;
}

/** Draws a bitmap onto a fresh canvas, optionally scaled and over a white backdrop. */
function draw(bitmap: ImageBitmap, to: FormatId, size = { width: bitmap.width, height: bitmap.height }) {
  const canvas = new OffscreenCanvas(size.width, size.height);
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new ConversionError("Your browser could not prepare this image.", "unsupported");
  if (OPAQUE.has(to)) {
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, size.width, size.height);
  }
  ctx.drawImage(bitmap, 0, 0, size.width, size.height);
  return { canvas, ctx };
}

/** WASM encoders for browsers that cannot write WebP or AVIF from a canvas. */
async function encodeWithWasm(to: "webp" | "avif", image: ImageData): Promise<Blob> {
  const encode = to === "avif" ? (await import("@jsquash/avif/encode")).default : (await import("@jsquash/webp/encode")).default;
  return new Blob([await encode(image)], { type: MIME[to] });
}

/** Encodes a bitmap in any supported output format. */
export async function encodeImage(bitmap: ImageBitmap, to: FormatId): Promise<Blob> {
  if (to === "ico") {
    const size = fitForIco(bitmap.width, bitmap.height);
    const { canvas } = draw(bitmap, to, size);
    const png = new Uint8Array(await (await canvas.convertToBlob({ type: "image/png" })).arrayBuffer());
    return new Blob([wrapPngAsIco(png, size.width, size.height) as BlobPart], { type: "image/x-icon" });
  }

  const { canvas, ctx } = draw(bitmap, to);
  const type = MIME[to];
  if (type && (await canEncodeNatively(type))) {
    return canvas.convertToBlob({ type, quality: to === "jpg" ? 0.92 : 0.9 });
  }

  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
  switch (to) {
    case "webp":
    case "avif":
      return encodeWithWasm(to, pixels);
    case "bmp":
      return new Blob([encodeBmp(pixels.width, pixels.height, pixels.data) as BlobPart], { type: "image/bmp" });
    case "gif":
      return new Blob([encodeGif(pixels.width, pixels.height, pixels.data) as BlobPart], { type: "image/gif" });
    default:
      throw new ConversionError(`Your browser cannot write ${to.toUpperCase()} files.`, "unsupported");
  }
}
