import { LIGHT_ENGINES, loadEngine } from "./engines";

/**
 * Loads everything needed for offline image, document, data and PDF work.
 * ffmpeg is left out: its 30 MB core caches itself on first real use.
 */
export async function warmEngines(): Promise<string[]> {
  await Promise.allSettled(LIGHT_ENGINES.map(loadEngine));
  const [{ warmImageCodecs }, { warmPdfWorker }] = await Promise.all([
    import("@/engines/image/warm"),
    import("@/engines/pdf/warm"),
  ]);
  await Promise.allSettled([warmImageCodecs(), warmPdfWorker()]);
  return loadedUrls();
}

/** Every same-origin file this worker has fetched so far, from the resource timing log. */
function loadedUrls(): string[] {
  return performance
    .getEntriesByType("resource")
    .map((entry) => entry.name)
    .filter((url) => new URL(url).origin === self.location.origin);
}
