import { useEffect } from "react";
import { warmEngines } from "@/features/conversion/controller";
import { clearOpfsResults } from "@/features/conversion/opfs";
import { useCapabilities } from "@/features/formats/capabilities";
import { registerServiceWorker, whenServiceWorkerControls } from "@/features/pwa/registerServiceWorker";

/** Respect people on metered or slow connections: no background downloads for them. */
function mayPrefetch(): boolean {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return navigator.onLine && !connection?.saveData && process.env.NODE_ENV === "production";
}

/**
 * Everything the page does once, right after it first renders: probe the
 * browser, clear files a crashed tab left on disk, register the offline
 * worker, and warm the offline engines when the browser has nothing better to do.
 */
export function useBoot(): void {
  useEffect(() => {
    useCapabilities.getState().detect();
    void clearOpfsResults();
    registerServiceWorker();

    const idle = window.requestIdleCallback ?? ((callback: () => void) => window.setTimeout(callback, 2000));
    const handle = idle(() => {
      if (!mayPrefetch()) return;
      // Warm only once the service worker controls the page, or nothing would be cached.
      void whenServiceWorkerControls().then(async (controlled) => {
        if (controlled) await warmEngines();
      });
    });
    return () => (window.cancelIdleCallback ?? window.clearTimeout)(handle as number);
  }, []);
}
