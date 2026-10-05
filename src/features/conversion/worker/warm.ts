import { LIGHT_ENGINES, loadEngine } from "./engines";

/**
 * Loads everything needed for offline image, document, data and PDF work.
 * ffmpeg is left out: its 30 MB core caches itself on first real use.
 */
export async function warmEngines(): Promise<void> {
  await Promise.allSettled(LIGHT_ENGINES.map(loadEngine));
  const [{ warmImageCodecs }, { warmPdfWorker }] = await Promise.all([
    import("@/engines/image/warm"),
    import("@/engines/pdf/warm"),
  ]);
  await Promise.allSettled([warmImageCodecs(), warmPdfWorker()]);
}
