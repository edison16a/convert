import type { PDFPageProxy } from "pdfjs-dist";

/** Longest side we will render, in pixels. Keeps huge posters from eating memory. */
const MAX_SIDE = 4096;
/** Two canvas pixels per PDF point is roughly 144 dpi, sharp on screens and in print previews. */
const TARGET_SCALE = 2;

/** Picks a render scale that is sharp but never exceeds MAX_SIDE. */
export function scaleFor(width: number, height: number): number {
  return Math.min(TARGET_SCALE, MAX_SIDE / Math.max(width, height));
}

/** Renders one page to a PNG or JPEG blob on a white background. */
export async function renderPage(page: PDFPageProxy, type: "image/png" | "image/jpeg"): Promise<Blob> {
  const natural = page.getViewport({ scale: 1 });
  const viewport = page.getViewport({ scale: scaleFor(natural.width, natural.height) });
  const canvas = new OffscreenCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas unavailable");
  await page
    .render({ canvasContext: ctx as unknown as CanvasRenderingContext2D, canvas: canvas as unknown as HTMLCanvasElement, viewport, background: "#ffffff" })
    .promise;
  return canvas.convertToBlob({ type, quality: 0.92 });
}
