import type { FormatId } from "@/features/formats/types";

/** Small SVGs (icons, logos) get scaled up to about this size so the PNG is useful. */
const MIN_SIDE = 1024;
const MAX_SIDE = 4096;

export interface PreparedInput {
  file: File;
  from: FormatId;
}

/**
 * Workers cannot render SVG, because that needs the browser's DOM image
 * pipeline. So SVG is drawn to a canvas here on the main thread, which takes
 * a few milliseconds, and the worker receives a PNG instead. Every other
 * format goes straight through.
 */
export async function prepareInput(file: File, from: FormatId): Promise<PreparedInput> {
  if (from !== "svg") return { file, from };

  const url = URL.createObjectURL(new Blob([await file.arrayBuffer()], { type: "image/svg+xml" }));
  try {
    const image = new Image();
    image.src = url;
    await image.decode();

    const natural = Math.max(image.naturalWidth, image.naturalHeight) || 512;
    const scale = Math.min(MAX_SIDE / natural, Math.max(1, MIN_SIDE / natural));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round((image.naturalWidth || 512) * scale));
    canvas.height = Math.max(1, Math.round((image.naturalHeight || 512) * scale));
    canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);

    const png = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!png) throw new Error("rasterize failed");
    return { file: new File([png], file.name.replace(/\.[^.]+$/, "") + ".png", { type: "image/png" }), from: "png" };
  } finally {
    URL.revokeObjectURL(url);
  }
}
