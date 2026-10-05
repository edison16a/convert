/**
 * pdf.js defaults to factories that call document.createElement, which does
 * not exist inside a worker. These two replacements use OffscreenCanvas and
 * skip DOM filters, so rendering works entirely off the main thread.
 */

interface CanvasAndContext {
  canvas: OffscreenCanvas | null;
  context: OffscreenCanvasRenderingContext2D | null;
}

/** Creates, resizes and frees canvases for pdf.js while it renders a page. */
export class WorkerCanvasFactory {
  create(width: number, height: number): CanvasAndContext {
    if (width <= 0 || height <= 0) throw new Error("Invalid canvas size");
    const canvas = new OffscreenCanvas(width, height);
    return { canvas, context: canvas.getContext("2d", { willReadFrequently: true }) };
  }

  reset({ canvas }: CanvasAndContext, width: number, height: number): void {
    if (!canvas) throw new Error("Canvas is not specified");
    canvas.width = width;
    canvas.height = height;
  }

  destroy(target: CanvasAndContext): void {
    if (target.canvas) target.canvas.width = target.canvas.height = 0;
    target.canvas = null;
    target.context = null;
  }
}

/**
 * pdf.js uses SVG filters to tint images in high contrast mode and to apply
 * transfer functions. Returning "none" means "draw it unfiltered", which is
 * correct for rasterizing a page to an image.
 */
export class NoFilterFactory {
  addFilter(): string {
    return "none";
  }
  addHCMFilter(): string {
    return "none";
  }
  addAlphaFilter(): string {
    return "none";
  }
  addLuminosityFilter(): string {
    return "none";
  }
  addHighlightHCMFilter(): string {
    return "none";
  }
  destroy(): void {}
}
