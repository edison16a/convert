import type { Converter } from "@/engines/types";
import type { EngineId } from "@/features/formats/types";

/**
 * Loads an engine the first time a job needs it. Dynamic imports keep every
 * engine out of the first page load and out of workers that never use it.
 */
export async function loadEngine(id: EngineId): Promise<Converter> {
  switch (id) {
    case "image":
      return (await import("@/engines/image")).convertImage;
    case "ffmpeg":
      return (await import("@/engines/ffmpeg")).convertMedia;
    case "document":
      return (await import("@/engines/document")).convertDocument;
    case "pdf":
      return (await import("@/engines/pdf")).convertPdf;
    case "data":
      return (await import("@/engines/data")).convertData;
  }
}
