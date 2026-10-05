import { FFmpeg } from "@ffmpeg/ffmpeg";
import { ConversionError } from "../errors";

const CACHE_NAME = "convert-engine-v1";

/**
 * Fetches an engine file once and keeps it in the Cache API, so the 30 MB
 * core is only downloaded the first time and works offline after that. The
 * result is a blob URL because ffmpeg.wasm loads its core from a URL.
 */
async function cachedBlobUrl(path: string, type: string): Promise<string> {
  const url = new URL(path, self.location.href).href;
  let response: Response | undefined;
  try {
    const cache = await caches.open(CACHE_NAME);
    response = await cache.match(url);
    if (!response) {
      const fresh = await fetch(url);
      if (!fresh.ok) throw new Error(`${fresh.status}`);
      await cache.put(url, fresh.clone());
      response = fresh;
    }
  } catch {
    // The Cache API can be blocked (private windows), so fall back to a plain fetch.
    response = await fetch(url);
  }
  return URL.createObjectURL(new Blob([await response.arrayBuffer()], { type }));
}

let loading: Promise<FFmpeg> | null = null;

/**
 * Loads ffmpeg once per worker and reuses it. The multi-threaded core needs
 * cross-origin isolation (see next.config), so we pick it only when the page
 * is isolated and fall back to the single-threaded core otherwise.
 */
export function loadFfmpeg(): Promise<FFmpeg> {
  loading ??= (async () => {
    const threaded = self.crossOriginIsolated && typeof SharedArrayBuffer !== "undefined";
    const dir = threaded ? "/ffmpeg/mt" : "/ffmpeg/st";
    const ffmpeg = new FFmpeg();
    await ffmpeg.load({
      coreURL: await cachedBlobUrl(`${dir}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await cachedBlobUrl(`${dir}/ffmpeg-core.wasm`, "application/wasm"),
      ...(threaded && { workerURL: await cachedBlobUrl(`${dir}/ffmpeg-core.worker.js`, "text/javascript") }),
    });
    return ffmpeg;
  })().catch(() => {
    loading = null; // let the next attempt try again, for example once the network is back
    throw new ConversionError(
      "The converter could not be loaded. Check your connection and retry. It works offline after the first load.",
      "unknown",
    );
  });
  return loading;
}
